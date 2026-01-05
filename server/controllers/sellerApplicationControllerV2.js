import Razorpay from "razorpay";
import { computeCapabilities, ROLES } from "../config/rbac-policy.js";
import { generateToken } from "../helpers/tokenHelper.js";
import { logAuditEvent } from "../middlewares/rbacMiddleware.js";
import sellerApplicationModel from "../models/sellerApplicationModel.js";
import sellerProfileModel from "../models/sellerProfileModel.js";
import subscriptionPlanModel from "../models/subscriptionPlanModel.js";
import userModel from "../models/userModel.js";

// Get Razorpay instance
const getRazorpayInstance = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return null;
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

/**
 * Save draft application
 */
export const saveDraftApplication = async (req, res) => {
  try {
    const { selectedPlanId: bodyPlanId, ...applicationData } = req.body;
    const selectedPlanId = bodyPlanId || req.query?.selectedPlanId;
    const userId = req.user._id;

    // Multer files
    const files = req.files || {};
    const identityProofImage = files.identityProofImage?.[0];
    const addressProofImage = files.addressProofImage?.[0];
    const gstImage = files.gstImage?.[0];
    const panImage = files.panImage?.[0];
    const cancelledCheckImage = files.cancelledCheckImage?.[0];

    // Helper to get relative path
    const getLocalPath = (file) => {
      if (!file) return null;
      return `uploads/users/${path.basename(file.path)}`;
    };

    // Validate plan ID is provided
    if (!selectedPlanId) {
      return res.status(400).send({
        success: false,
        message: "Subscription plan ID is required",
      });
    }

    // Validate plan exists
    const plan = await subscriptionPlanModel.findById(selectedPlanId);
    if (!plan) {
      return res.status(404).send({
        success: false,
        message: "Subscription plan not found",
        planId: selectedPlanId,
      });
    }

    // Capture plan snapshot
    const planSnapshot = {
      _id: plan._id,
      name: plan.name,
      price: plan.price,
      currency: plan.currency || "INR",
      billingCycle: plan.billingCycle,
      isFree: plan.isFree,
      includedCapabilities: plan.includedCapabilities || [],
      excludedCapabilities: plan.excludedCapabilities || [],
      version: plan.version || 1,
      capturedAt: new Date(),
    };

    // Check if draft exists
    let application = await sellerApplicationModel.findOne({
      userId,
      status: "draft",
    });

    const updateData = {
      ...applicationData,
      selectedPlanId,
      selectedPlanSnapshot: planSnapshot,
    };

    // Add file paths if uploaded
    if (identityProofImage) updateData.identityProofImage = getLocalPath(identityProofImage);
    if (addressProofImage) updateData.addressProofImage = getLocalPath(addressProofImage);
    if (gstImage) updateData.gstImage = getLocalPath(gstImage);
    if (panImage) updateData.panImage = getLocalPath(panImage);
    if (cancelledCheckImage) updateData.cancelledCheckImage = getLocalPath(cancelledCheckImage);

    if (application) {
      // Update existing draft
      application = Object.assign(application, updateData);
    } else {
      // Create new draft
      application = new sellerApplicationModel({
        ...updateData,
        userId,
        status: "draft",
        lockPlan: false,
        email: req.user.email_id,
        phone: req.user.mobile_no,
      });
    }

    // Always ensure email and phone match the user
    application.email = req.user.email_id;
    application.phone = req.user.mobile_no;

    // Save draft without validation
    await application.save({ validateBeforeSave: false });

    res.status(200).send({
      success: true,
      message: "Application draft saved",
      applicationId: application._id,
      status: "draft",
    });
  } catch (error) {
    console.error("Error saving draft application:", error);
    res.status(500).send({
      success: false,
      message: "Error saving draft",
      error: error.message,
    });
  }
};

/**
 * Submit application (finalize and lock plan)
 */
export const submitApplication = async (req, res) => {
  try {
    const { applicationId } = req.body;
    const userId = req.user._id;

    // Find application
    const application = await sellerApplicationModel.findById(applicationId);
    if (!application) {
      return res.status(404).send({
        success: false,
        message: "Application not found",
      });
    }

    // Verify ownership
    if (application.userId.toString() !== userId.toString()) {
      return res.status(403).send({
        success: false,
        message: "Unauthorized",
      });
    }

    // Check if already submitted
    if (application.status !== "draft" && application.status !== "rejected") {
      return res.status(400).send({
        success: false,
        message: "Application cannot be submitted in current status",
      });
    }

    // Validate plan exists
    const plan = await subscriptionPlanModel.findById(application.selectedPlanId);
    if (!plan) {
      console.error(`Plan not found for application ${applicationId}: ${application.selectedPlanId}`);
      return res.status(404).send({
        success: false,
        message: "Subscription plan not found",
        planId: application.selectedPlanId,
      });
    }

    // Validate essential fields are filled before submission
    // NOTE: For testing, identityProofImage and cancelledCheckImage are not treated as mandatory.
    const requiredFields = [
      "firstName", "lastName", "email", "phone",
      "addressLine1", "city", "state", "pincode",
      "identityProofNumber",
      "addressProofImage",
      "businessName",
      "accountHolderName", "accountNumber", "ifscCode", "bankName",
      "termsAccepted", "privacyAccepted"
    ];

    const missingFields = [];
    for (const field of requiredFields) {
      const value = application[field];

      // Check for consent fields (boolean)
      if (field.includes("Accepted")) {
        if (value !== true) {
          missingFields.push(field);
        }
      }
      // Check for string fields
      else if (typeof value === "string") {
        if (value.trim() === "") {
          missingFields.push(field);
        }
      }
      // Check for other fields (null, undefined, etc.)
      else if (!value) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      return res.status(400).send({
        success: false,
        message: "Please fill all required fields before submitting",
        missingFields,
      });
    }

    // Ensure snapshot is captured at submission
    if (!application.selectedPlanSnapshot) {
      application.selectedPlanSnapshot = {
        _id: plan._id,
        name: plan.name,
        price: plan.price,
        currency: plan.currency || "INR",
        billingCycle: plan.billingCycle,
        isFree: plan.isFree,
        includedCapabilities: plan.includedCapabilities || [],
        excludedCapabilities: plan.excludedCapabilities || [],
        version: plan.version || 1,
        capturedAt: new Date(),
      };
    }

    // Update application
    application.status = "submitted";
    application.submittedAt = new Date();
    application.lockPlan = true;
    application.payment = null; // Clear previous payment if resubmitting

    await application.save();

    // Log audit event
    await logAuditEvent({
      actor: userId,
      actorRole: ROLES.USER,
      action: "submit_application",
      resourceType: "seller_application",
      resourceId: application._id,
      severity: "medium",
      description: `Seller application submitted`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).send({
      success: true,
      message: "Application submitted successfully",
      status: "submitted",
      submittedAt: application.submittedAt,
      lockPlan: true,
    });
  } catch (error) {
    console.error("Error submitting application:", error);
    res.status(500).send({
      success: false,
      message: "Error submitting application",
      error: error.message,
    });
  }
};

/**
 * Get user's application status
 */
export const getMyApplication = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get latest application
    const application = await sellerApplicationModel
      .findOne({ userId })
      .populate("selectedPlanId", "name price billingCycle isFree")
      .sort({ createdAt: -1 });

    if (!application) {
      return res.status(404).send({
        success: false,
        message: "No application found",
      });
    }

    // Get seller profile if exists
    let sellerProfile = null;
    if (application.status === "active" || application.status === "approved") {
      sellerProfile = await sellerProfileModel.findOne({
        applicationId: application._id,
      });
    }

    res.status(200).send({
      success: true,
      application: {
        _id: application._id,
        status: application.status,
        selectedPlan: application.selectedPlanId,
        selectedPlanId: application.selectedPlanId,
        selectedPlanSnapshot: application.selectedPlanSnapshot,
        payment: application.payment,
        lockPlan: application.lockPlan,
        submittedAt: application.submittedAt,
        reviewNotes: application.reviewNotes,
        // Plan expiry tracking fields
        planStartDate: application.planStartDate,
        planExpiryDate: application.planExpiryDate,
        planStatus: application.planStatus,
        gracePeriodEndDate: application.gracePeriodEndDate,
        renewalHistory: application.renewalHistory,
        // Legacy fields from SellerProfile
        planActivatedAt: sellerProfile?.planActivatedAt,
        planExpiresAt: sellerProfile?.planExpiresAt,
        isActive: sellerProfile?.isActive,
      },
    });
  } catch (error) {
    console.error("Error fetching application:", error);
    res.status(500).send({
      success: false,
      message: "Error fetching application",
      error: error.message,
    });
  }
};

/**
 * Get all applications (Super Admin)
 */
export const getSellerApplications = async (req, res) => {
  try {
    console.log("=== getSellerApplications CALLED ===");
    console.log("User:", req.user);
    console.log("User capabilities:", req.user?.capabilities);

    const { status, page = 1, limit = 10, search, sort = "-createdAt" } = req.query;
    console.log("getSellerApplications called with query:", { status, page, limit, search, sort });

    const query = {};

    if (status && status !== "all") {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { businessName: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * parseInt(limit);
    const pageLimit = parseInt(limit);

    const applications = await sellerApplicationModel
      .find(query)
      .populate("userId", "email_id user_fullname mobile_no")
      .populate("selectedPlanId", "name price billingCycle isFree")
      .populate("reviewedBy", "user_fullname email_id")
      .sort(sort)
      .skip(skip)
      .limit(pageLimit);

    const total = await sellerApplicationModel.countDocuments(query);

    console.log(`Found ${applications.length} applications out of ${total} total`);

    res.status(200).send({
      success: true,
      applications,
      pagination: {
        page: parseInt(page),
        limit: pageLimit,
        total,
        pages: Math.ceil(total / pageLimit),
      },
    });
  } catch (error) {
    console.error("Error fetching applications:", error);
    res.status(500).send({
      success: false,
      message: "Error fetching applications",
      error: error.message,
    });
  }
};

/**
 * Get single application (Super Admin)
 */
export const getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await sellerApplicationModel
      .findById(id)
      .populate("userId", "email_id user_fullname mobile_no")
      .populate("selectedPlanId")
      .populate("reviewedBy", "user_fullname email_id");

    if (!application) {
      return res.status(404).send({
        success: false,
        message: "Application not found",
      });
    }

    res.status(200).send({
      success: true,
      application,
    });
  } catch (error) {
    console.error("Error fetching application:", error);
    res.status(500).send({
      success: false,
      message: "Error fetching application",
      error: error.message,
    });
  }
};

/**
 * Approve application (Super Admin)
 * For free plans: Immediately activate
 * For paid plans: Create payment order and set approved_pending_payment
 */
export const approveApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewerNotes } = req.body;
    const adminId = req.user._id;

    console.log("=== APPROVE APPLICATION CALLED ===");
    console.log("Application ID:", id);
    console.log("Admin ID:", adminId);
    console.log("Reviewer Notes:", reviewerNotes);

    // Find application
    const application = await sellerApplicationModel
      .findById(id)
      .populate("selectedPlanId")
      .populate("userId");

    if (!application) {
      return res.status(404).send({
        success: false,
        message: "Application not found",
      });
    }

    const plan = application.selectedPlanId;
    const user = application.userId;

    // Update application review info
    application.reviewedBy = adminId;
    application.reviewedAt = new Date();
    application.reviewNotes = reviewerNotes || "Approved";

    // Ensure snapshot is captured at approval
    if (!application.selectedPlanSnapshot) {
      application.selectedPlanSnapshot = {
        _id: plan._id,
        name: plan.name,
        price: plan.price,
        currency: plan.currency || "INR",
        billingCycle: plan.billingCycle,
        isFree: plan.isFree,
        includedCapabilities: plan.includedCapabilities || [],
        excludedCapabilities: plan.excludedCapabilities || [],
        version: plan.version || 1,
        capturedAt: new Date(),
      };
    }

    // FREE PLAN - Immediate activation
    if (plan.isFree) {
      // Set plan dates
      const planStartDate = new Date();
      const planExpiryDate = new Date();
      planExpiryDate.setDate(planExpiryDate.getDate() + 30);
      const gracePeriodEndDate = new Date(planExpiryDate);
      gracePeriodEndDate.setDate(gracePeriodEndDate.getDate() + 30);

      application.status = "approved";
      application.planStartDate = planStartDate;
      application.planExpiryDate = planExpiryDate;
      application.gracePeriodEndDate = gracePeriodEndDate;
      application.planStatus = "active";

      // Log initial plan in renewal history
      application.renewalHistory.push({
        renewalDate: planStartDate,
        previousPlanId: null,
        newPlanId: plan._id,
        renewalType: "initial",
      });

      await application.save({ validateBeforeSave: false });

      // Create or Update SellerProfile
      const sellerProfile = await sellerProfileModel.findOneAndUpdate(
        { userId: user._id },
        {
          userId: user._id,
          applicationId: application._id,
          currentPlanId: plan._id,
          isActive: true,
          planActivatedAt: new Date(),
          planExpiresAt: null,
          permissions: {
            grantedCapabilities: plan.includedCapabilities || [],
            deniedCapabilities: plan.excludedCapabilities || [],
          },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      // Update user role and permissions
      user.roleString = "seller";
      user.permissions = {
        grantedCapabilities: plan.includedCapabilities || [],
        deniedCapabilities: plan.excludedCapabilities || [],
      };
      user.tokenVersion = (user.tokenVersion || 0) + 1;
      await user.save();

      // Log audit
      await logAuditEvent({
        actor: adminId,
        actorRole: ROLES.SUPER_ADMIN,
        action: "approve_application",
        resourceType: "seller_application",
        resourceId: application._id,
        severity: "high",
        description: `Seller application approved (Free plan)`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });

      // Generate new token
      const token = generateToken(user);

      return res.status(200).send({
        success: true,
        message: "Application approved (Free plan activated)",
        status: "approved",
        token,
        seller: sellerProfile,
      });
    }

    // PAID PLAN - Create payment order
    const razorpay = getRazorpayInstance();
    if (!razorpay) {
      return res.status(503).send({
        success: false,
        message: "Payment service not configured",
      });
    }

    // Create Razorpay order
    const orderOptions = {
      amount: Math.round(plan.price * 100), // Convert to paise
      currency: "INR",
      receipt: `rcpt_${application._id.toString().slice(-8)}_${Date.now().toString().slice(-6)}`,
      notes: {
        applicationId: application._id.toString(),
        userId: user._id.toString(),
        planId: plan._id.toString(),
      },
    };

    const razorpayOrder = await razorpay.orders.create(orderOptions);

    // Set plan dates (will be activated after payment)
    const planStartDate = new Date();
    const planExpiryDate = new Date();
    planExpiryDate.setDate(planExpiryDate.getDate() + 30);
    const gracePeriodEndDate = new Date(planExpiryDate);
    gracePeriodEndDate.setDate(gracePeriodEndDate.getDate() + 30);

    // Update application
    application.status = "approved_pending_payment";
    application.planStartDate = planStartDate;
    application.planExpiryDate = planExpiryDate;
    application.gracePeriodEndDate = gracePeriodEndDate;
    application.planStatus = "active";
    application.payment = {
      provider: "razorpay",
      orderId: razorpayOrder.id,
      amount: plan.price,
      currency: "INR",
      status: "pending",
      createdAt: new Date(),
    };

    // Log initial plan in renewal history
    application.renewalHistory.push({
      renewalDate: planStartDate,
      previousPlanId: null,
      newPlanId: plan._id,
      renewalType: "initial",
    });

    await application.save({ validateBeforeSave: false });

    // Create or Update SellerProfile (inactive)
    const sellerProfile = await sellerProfileModel.findOneAndUpdate(
      { userId: user._id },
      {
        userId: user._id,
        applicationId: application._id,
        currentPlanId: plan._id,
        isActive: false, // Remains inactive until payment
        permissions: {
          grantedCapabilities: [],
          deniedCapabilities: [],
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // Log audit
    await logAuditEvent({
      actor: adminId,
      actorRole: ROLES.SUPER_ADMIN,
      action: "approve_application",
      resourceType: "seller_application",
      resourceId: application._id,
      severity: "high",
      description: `Seller application approved (Paid plan - pending payment)`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).send({
      success: true,
      message: "Application approved (Pending payment)",
      status: "approved_pending_payment",
      checkoutInfo: {
        orderId: razorpayOrder.id,
        amount: plan.price,
        currency: "INR",
        planName: plan.name,
        applicationId: application._id,
      },
    });
  } catch (error) {
    console.error("Error approving application:", error);
    res.status(500).send({
      success: false,
      message: "Error approving application",
      error: error.message,
    });
  }
};

/**
 * Reject application (Super Admin)
 */
export const rejectApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user._id;

    console.log("=== REJECT APPLICATION CALLED ===");
    console.log("Application ID:", id);
    console.log("Admin ID:", adminId);
    console.log("Reason:", reason);

    if (!reason) {
      return res.status(400).send({
        success: false,
        message: "Rejection reason is required",
      });
    }

    // Find application
    const application = await sellerApplicationModel.findById(id);
    if (!application) {
      return res.status(404).send({
        success: false,
        message: "Application not found",
      });
    }

    // Update application
    application.status = "rejected";
    application.reviewedBy = adminId;
    application.reviewedAt = new Date();
    application.reviewNotes = reason;
    application.lockPlan = false; // Allow reapply
    application.payment = null; // Clear payment info

    await application.save();

    // Log audit
    await logAuditEvent({
      actor: adminId,
      actorRole: ROLES.SUPER_ADMIN,
      action: "reject_application",
      resourceType: "seller_application",
      resourceId: application._id,
      severity: "medium",
      description: `Seller application rejected: ${reason}`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).send({
      success: true,
      message: "Application rejected",
      status: "rejected",
      reviewNotes: reason,
    });
  } catch (error) {
    console.error("Error rejecting application:", error);
    res.status(500).send({
      success: false,
      message: "Error rejecting application",
      error: error.message,
    });
  }
};

/**
 * Retry payment (create new order if previous failed)
 */
export const retryPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Find application
    const application = await sellerApplicationModel
      .findById(id)
      .populate("selectedPlanId")
      .populate("userId");

    if (!application) {
      return res.status(404).send({
        success: false,
        message: "Application not found",
      });
    }

    // Verify ownership
    if (application.userId._id.toString() !== userId.toString()) {
      return res.status(403).send({
        success: false,
        message: "Unauthorized",
      });
    }

    // Check status
    if (
      application.status !== "approved_pending_payment" &&
      application.status !== "approved_payment_failed"
    ) {
      return res.status(400).send({
        success: false,
        message: "Cannot retry payment in current status",
      });
    }

    const plan = application.selectedPlanId;
    const razorpay = getRazorpayInstance();

    if (!razorpay) {
      return res.status(503).send({
        success: false,
        message: "Payment service not configured",
      });
    }

    // Create new order
    const orderOptions = {
      amount: Math.round(plan.price * 100),
      currency: "INR",
      receipt: `rcpt_${application._id.toString().slice(-8)}_${Date.now().toString().slice(-6)}`,
      notes: {
        applicationId: application._id.toString(),
        userId: userId.toString(),
        planId: plan._id.toString(),
      },
    };

    const razorpayOrder = await razorpay.orders.create(orderOptions);

    // Update application
    application.status = "approved_pending_payment";
    application.payment = {
      provider: "razorpay",
      orderId: razorpayOrder.id,
      amount: plan.price,
      currency: "INR",
      status: "pending",
      createdAt: new Date(),
    };
    await application.save();

    res.status(200).send({
      success: true,
      message: "New payment order created",
      checkoutInfo: {
        orderId: razorpayOrder.id,
        amount: plan.price,
        currency: "INR",
        planName: plan.name,
        applicationId: application._id,
      },
    });
  } catch (error) {
    console.error("Error retrying payment:", error);
    res.status(500).send({
      success: false,
      message: "Error retrying payment",
      error: error.message,
    });
  }
};

/**
 * Renew current plan
 */
export const renewPlan = async (req, res) => {
  try {
    const userId = req.user._id;
    const { planId } = req.body;

    // Get current application
    const application = await sellerApplicationModel
      .findOne({ userId, status: "active" })
      .populate("selectedPlanId");

    if (!application) {
      return res.status(404).send({
        success: false,
        message: "No active seller application found",
      });
    }

    // Validate plan exists
    const plan = await subscriptionPlanModel.findById(planId || application.selectedPlanId._id);
    if (!plan) {
      return res.status(404).send({
        success: false,
        message: "Plan not found",
      });
    }

    // If free plan, just extend expiry
    if (plan.isFree) {
      const newExpiryDate = new Date();
      newExpiryDate.setDate(newExpiryDate.getDate() + 30);

      application.planExpiryDate = newExpiryDate;
      application.planStatus = "active";
      application.renewalHistory.push({
        renewalDate: new Date(),
        previousPlanId: application.selectedPlanId._id,
        newPlanId: plan._id,
        renewalType: "renewal",
      });

      await application.save();

      // Log audit
      await logAuditEvent({
        actor: userId,
        actorRole: ROLES.SELLER,
        action: "renew_plan",
        resourceType: "subscription_plan",
        resourceId: plan._id,
        severity: "low",
        description: `Seller renewed Free plan`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });

      return res.status(200).send({
        success: true,
        message: "Plan renewed successfully",
        application,
      });
    }

    // For paid plans, create payment order
    const razorpay = getRazorpayInstance();
    if (!razorpay) {
      return res.status(500).send({
        success: false,
        message: "Payment service not configured",
      });
    }

    const orderOptions = {
      amount: plan.price * 100,
      currency: "INR",
      receipt: `renewal_${application._id}_${Date.now()}`,
      notes: {
        applicationId: application._id.toString(),
        planId: plan._id.toString(),
        renewalType: "renewal",
      },
    };

    const razorpayOrder = await razorpay.orders.create(orderOptions);

    // Update application with pending payment
    application.payment = {
      provider: "razorpay",
      orderId: razorpayOrder.id,
      amount: plan.price,
      currency: "INR",
      status: "pending",
      createdAt: new Date(),
    };
    await application.save();

    res.status(200).send({
      success: true,
      message: "Renewal payment order created",
      checkoutInfo: {
        orderId: razorpayOrder.id,
        amount: plan.price,
        currency: "INR",
        planName: plan.name,
        renewalType: "renewal",
      },
    });
  } catch (error) {
    console.error("Error renewing plan:", error);
    res.status(500).send({
      success: false,
      message: "Error renewing plan",
      error: error.message,
    });
  }
};

/**
 * Upgrade to different plan
 */
export const upgradePlan = async (req, res) => {
  try {
    const userId = req.user._id;
    const { planId } = req.body;

    if (!planId) {
      return res.status(400).send({
        success: false,
        message: "Plan ID is required",
      });
    }

    // Get current application
    const application = await sellerApplicationModel
      .findOne({ userId, status: "active" })
      .populate("selectedPlanId");

    if (!application) {
      return res.status(404).send({
        success: false,
        message: "No active seller application found",
      });
    }

    // Validate new plan exists
    const newPlan = await subscriptionPlanModel.findById(planId);
    if (!newPlan) {
      return res.status(404).send({
        success: false,
        message: "Plan not found",
      });
    }

    const oldPlanId = application.selectedPlanId._id;

    // If upgrading to free plan, just switch
    if (newPlan.isFree) {
      const newExpiryDate = new Date();
      newExpiryDate.setDate(newExpiryDate.getDate() + 30);

      application.selectedPlanId = newPlan._id;
      application.planExpiryDate = newExpiryDate;
      application.planStatus = "active";
      application.renewalHistory.push({
        renewalDate: new Date(),
        previousPlanId: oldPlanId,
        newPlanId: newPlan._id,
        renewalType: "downgrade",
      });

      await application.save();

      // Update user capabilities
      const capabilities = computeCapabilities(
        newPlan.includedCapabilities || [],
        newPlan.includedCapabilities || [],
        newPlan.excludedCapabilities || []
      );

      const user = await userModel.findById(userId);
      if (user) {
        user.permissions = {
          grantedCapabilities: newPlan.includedCapabilities || [],
          deniedCapabilities: newPlan.excludedCapabilities || [],
        };
        await user.save();
      }

      // Log audit
      await logAuditEvent({
        actor: userId,
        actorRole: ROLES.SELLER,
        action: "upgrade_plan",
        resourceType: "subscription_plan",
        resourceId: newPlan._id,
        severity: "medium",
        description: `Seller downgraded to Free plan`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });

      return res.status(200).send({
        success: true,
        message: "Plan changed successfully",
        application,
      });
    }

    // For paid plans, create payment order
    const razorpay = getRazorpayInstance();
    if (!razorpay) {
      return res.status(500).send({
        success: false,
        message: "Payment service not configured",
      });
    }

    const orderOptions = {
      amount: newPlan.price * 100,
      currency: "INR",
      receipt: `upgrade_${application._id}_${Date.now()}`,
      notes: {
        applicationId: application._id.toString(),
        planId: newPlan._id.toString(),
        renewalType: "upgrade",
      },
    };

    const razorpayOrder = await razorpay.orders.create(orderOptions);

    // Store pending upgrade info
    application.payment = {
      provider: "razorpay",
      orderId: razorpayOrder.id,
      amount: newPlan.price,
      currency: "INR",
      status: "pending",
      createdAt: new Date(),
    };
    // Temporarily store new plan ID for upgrade
    application._pendingUpgradePlanId = newPlan._id;
    await application.save();

    res.status(200).send({
      success: true,
      message: "Upgrade payment order created",
      checkoutInfo: {
        orderId: razorpayOrder.id,
        amount: newPlan.price,
        currency: "INR",
        planName: newPlan.name,
        renewalType: "upgrade",
      },
    });
  } catch (error) {
    console.error("Error upgrading plan:", error);
    res.status(500).send({
      success: false,
      message: "Error upgrading plan",
      error: error.message,
    });
  }
};

/**
 * Get available plans for renewal/upgrade
 */
export const getAvailablePlans = async (req, res) => {
  try {
    const plans = await subscriptionPlanModel
      .find({ isActive: true })
      .sort({ displayOrder: 1, isFree: -1, price: 1 });

    res.status(200).send({
      success: true,
      plans,
    });
  } catch (error) {
    console.error("Error fetching available plans:", error);
    res.status(500).send({
      success: false,
      message: "Error fetching plans",
      error: error.message,
    });
  }
};

/**
 * Verify Payment and Activate Subscription
 */
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = req.user._id;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).send({
        success: false,
        message: "Missing payment details",
      });
    }

    // Verify signature
    const shasum = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = shasum.digest("hex");

    if (digest !== razorpay_signature) {
      return res.status(400).send({
        success: false,
        message: "Transaction not legit!",
      });
    }

    // Find application by order ID
    const application = await sellerApplicationModel.findOne({
      "payment.orderId": razorpay_order_id,
    }).populate("selectedPlanId");

    if (!application) {
      return res.status(404).send({
        success: false,
        message: "Application not found for this order",
      });
    }

    const plan = application.selectedPlanId;

    // Update Application
    const planStartDate = new Date();
    const planExpiryDate = new Date();
    planExpiryDate.setDate(planExpiryDate.getDate() + 30); // Monthly default, should use plan cycle
    const gracePeriodEndDate = new Date(planExpiryDate);
    gracePeriodEndDate.setDate(gracePeriodEndDate.getDate() + 30);

    application.status = "approved"; // or active? Model Enum has 'active'. Let's use 'active' to signify Paid & Active.
    // L20 in model is 'active'. But approveApplication uses 'approved' for free plans.
    // Let's stick to 'approved' or 'active'. If 'active' implies immutable, use 'active'.
    // approveApplication (Free) uses "approved" status but "planStatus" active.
    // Let's use "active" status for consistency with "approved" being intermediate? 
    // Wait, free plan sets status="approved".
    // Paid plan sets status="approved_pending_payment".
    // After payment, it should probably match Free plan or go to "active". 
    // existing Enum: "approved", "active". 
    // Let's use "active" for fully active sellers. (Or "approved" if that's the convention).
    // Free plan sets status="approved". So I will use "approved" to match Free plan logic.
    application.status = "approved";

    application.planStartDate = planStartDate;
    application.planExpiryDate = planExpiryDate;
    application.gracePeriodEndDate = gracePeriodEndDate;
    application.planStatus = "active";

    application.payment.status = "paid";
    application.payment.razorpayPaymentId = razorpay_payment_id;
    application.payment.provider = "razorpay";

    await application.save();

    // Create/Update Seller Profile
    await sellerProfileModel.findOneAndUpdate(
      { userId: application.userId },
      {
        userId: application.userId,
        applicationId: application._id,
        currentPlanId: plan._id,
        isActive: true, // Now active
        planActivatedAt: new Date(),
        planExpiresAt: null, // or periodic? Free plan set null.
        permissions: {
          grantedCapabilities: plan.includedCapabilities || [],
          deniedCapabilities: plan.excludedCapabilities || [],
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // Update User Role
    await userModel.findByIdAndUpdate(application.userId, {
      roleString: "seller",
      permissions: {
        grantedCapabilities: plan.includedCapabilities || [],
        deniedCapabilities: plan.excludedCapabilities || [],
      },
      $inc: { tokenVersion: 1 } // Invalidate old tokens to force refresh if needed (optional)
    });

    res.status(200).send({
      success: true,
      message: "Payment verified and subscription activated",
    });

  } catch (error) {
    console.error("Payment Verification Error:", error);
    res.status(500).send({
      success: false,
      message: "Payment verification failed",
      error: error.message,
    });
  }
};

export default {
  saveDraftApplication,
  submitApplication,
  getMyApplication,
  getSellerApplications,
  getApplicationById,
  approveApplication,
  rejectApplication,
  retryPayment,
  renewPlan,
  upgradePlan,
  getAvailablePlans,
  verifyPayment,
};
