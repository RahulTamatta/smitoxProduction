import path from "path";
import { ROLES } from "../config/rbac-policy.js";
import { generateToken } from "../helpers/tokenHelper.js";
import { logAuditEvent } from "../middlewares/rbacMiddleware.js";
import sellerApplicationModel from "../models/sellerApplicationModel.js";
import sellerProfileModel from "../models/sellerProfileModel.js";
import subscriptionPlanModel from "../models/subscriptionPlanModel.js";
import userModel from "../models/userModel.js";

/**
 * Helper to get relative path from multer file
 */
const getLocalPath = (file) => {
  if (!file) return null;
  return `uploads/users/${path.basename(file.path)}`;
};

/**
 * Submit seller application (Direct - no draft)
 * Handles file uploads and creates application in 'submitted' status
 */
export const submitSellerApplication = async (req, res) => {
  try {
    const { selectedPlanId, ...applicationData } = req.body;
    const userId = req.user._id;

    // Handle file uploads from multer
    const files = req.files || {};

    // Validate plan exists and is active
    const plan = await subscriptionPlanModel.findById(selectedPlanId);
    if (!plan || !plan.isActive) {
      return res.status(404).send({
        success: false,
        message: "Subscription plan not found or inactive",
      });
    }

    // Check if user already has an active or pending application
    const existingApp = await sellerApplicationModel.findOne({
      userId,
      status: { $in: ["submitted", "under_review", "approved_pending_payment", "approved", "active"] },
    });

    if (existingApp) {
      return res.status(400).send({
        success: false,
        message: "You already have an active or pending application",
        existingStatus: existingApp.status,
        applicationId: existingApp._id,
      });
    }

    // Delete any old rejected/draft applications for this user
    await sellerApplicationModel.deleteMany({
      userId,
      status: { $in: ["draft", "rejected", "cancelled"] },
    });

    // Create plan snapshot (price protection)
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

    // Create application directly in 'submitted' status
    const application = new sellerApplicationModel({
      userId,
      status: "submitted",
      submittedAt: new Date(),
      lockPlan: true,
      selectedPlanId,
      selectedPlanSnapshot: planSnapshot,

      // Personal Info
      firstName: applicationData.firstName,
      lastName: applicationData.lastName,
      email: req.user.email_id,
      phone: req.user.mobile_no,

      // Address
      addressLine1: applicationData.addressLine1,
      addressLine2: applicationData.addressLine2 || "",
      city: applicationData.city,
      state: applicationData.state,
      pincode: applicationData.pincode,
      country: applicationData.country || "India",

      // KYC Documents
      identityProofType: applicationData.identityProofType || "aadhar",
      identityProofNumber: applicationData.identityProofNumber,
      identityProofImage: getLocalPath(files.identityProofImage?.[0]),
      addressProofType: applicationData.addressProofType || "aadhar",
      addressProofImage: getLocalPath(files.addressProofImage?.[0]),

      // Business Info
      businessName: applicationData.businessName,
      businessType: applicationData.businessType || "sole_proprietor",
      gstNumber: applicationData.gstNumber || "",
      gstImage: getLocalPath(files.gstImage?.[0]),
      panNumber: applicationData.panNumber || "",
      panImage: getLocalPath(files.panImage?.[0]),
      businessDescription: applicationData.businessDescription || "",

      // Banking
      accountHolderName: applicationData.accountHolderName,
      accountNumber: applicationData.accountNumber,
      accountType: applicationData.accountType || "savings",
      ifscCode: applicationData.ifscCode,
      bankName: applicationData.bankName,
      cancelledCheckImage: getLocalPath(files.cancelledCheckImage?.[0]),

      // Consents
      termsAccepted: applicationData.termsAccepted === "true" || applicationData.termsAccepted === true,
      privacyAccepted: applicationData.privacyAccepted === "true" || applicationData.privacyAccepted === true,
      communicationConsent: applicationData.communicationConsent === "true" || applicationData.communicationConsent === true,
    });

    await application.save();

    // Log audit event
    await logAuditEvent({
      actor: userId,
      actorRole: ROLES.USER,
      action: "submit_seller_application",
      resourceType: "seller_application",
      resourceId: application._id,
      severity: "medium",
      description: `Seller application submitted for ${plan.name} plan`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(201).send({
      success: true,
      message: "Application submitted successfully! You will be notified once reviewed.",
      applicationId: application._id,
      status: "submitted",
      planName: plan.name,
      isFree: plan.isFree,
    });
  } catch (error) {
    console.error("Error submitting seller application:", error);
    res.status(500).send({
      success: false,
      message: "Error submitting application",
      error: error.message,
    });
  }
};

/**
 * Get seller applications (Super Admin only)
 * Supports pagination, filtering by status, and search
 */
export const getSellerApplications = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, search, sort = "-createdAt" } = req.query;

    const query = {};

    // Filter by status
    if (status) {
      if (status === "all") {
        // No status filter
      } else {
        query.status = status;
      }
    }

    // Search by name, email, or business name
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

    // Build sort object
    const sortObj = {};
    const sortField = sort.startsWith("-") ? sort.substring(1) : sort;
    const sortOrder = sort.startsWith("-") ? -1 : 1;
    sortObj[sortField] = sortOrder;

    const applications = await sellerApplicationModel
      .find(query)
      .populate("userId", "email_id user_fullname")
      .populate("selectedPlanId", "name price isFree")
      .sort(sortObj)
      .skip(skip)
      .limit(pageLimit);

    const total = await sellerApplicationModel.countDocuments(query);

    res.status(200).send({
      success: true,
      // New shape
      items: applications,
      page: parseInt(page),
      limit: pageLimit,
      total,
      // Backward-compatible fields
      applications,
      pagination: {
        total,
        pages: Math.ceil(total / pageLimit),
        currentPage: parseInt(page),
        limit: pageLimit,
      },
    });
  } catch (error) {
    console.error("Error fetching seller applications:", error);
    res.status(500).send({
      success: false,
      message: "Error fetching applications",
      error: error.message,
    });
  }
};

/**
 * Get single seller application
 */
export const getSellerApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await sellerApplicationModel
      .findById(id)
      .populate("userId", "email_id user_fullname")
      .populate("selectedPlanId");

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
    console.error("Error fetching seller application:", error);
    res.status(500).send({
      success: false,
      message: "Error fetching application",
      error: error.message,
    });
  }
};

/**
 * Approve seller application
 * Merges subscription plan capabilities into seller permissions
 */
export const approveSellerApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewNotes } = req.body;

    const application = await sellerApplicationModel.findById(id);
    if (!application) {
      return res.status(404).send({
        success: false,
        message: "Application not found",
      });
    }

    // Fetch subscription plan to get included/excluded capabilities
    const plan = await subscriptionPlanModel.findById(application.selectedPlanId);
    if (!plan) {
      return res.status(400).send({
        success: false,
        message: "Selected subscription plan not found",
      });
    }

    // Update application status
    application.status = "approved";
    application.reviewedBy = req.user._id;
    application.reviewedAt = new Date();
    application.reviewNotes = reviewNotes || null;
    await application.save();

    // Create seller profile
    const sellerProfile = new sellerProfileModel({
      userId: application.userId,
      applicationId: application._id,
      subscriptionPlanId: application.selectedPlanId,
      businessName: application.businessName,
      businessType: application.businessType,
      gstNumber: application.gstNumber,
      panNumber: application.panNumber,
      businessDescription: application.businessDescription,
      primaryContactName: `${application.firstName} ${application.lastName}`,
      primaryContactEmail: application.email,
      primaryContactPhone: application.phone,
      accountHolderName: application.accountHolderName,
      accountNumber: application.accountNumber,
      ifscCode: application.ifscCode,
      bankName: application.bankName,
      subscriptionStartDate: new Date(),
      // Merge plan capabilities into permissions
      permissions: {
        grantedCapabilities: plan.includedCapabilities || [],
        deniedCapabilities: plan.excludedCapabilities || [],
      },
    });

    await sellerProfile.save();

    // Update user role to seller with merged permissions
    const user = await userModel.findById(application.userId);
    user.roleString = ROLES.SELLER;
    user.role = 2; // Backward compatibility
    user.sellerProfileId = sellerProfile._id;
    user.permissions = {
      grantedCapabilities: plan.includedCapabilities || [],
      deniedCapabilities: plan.excludedCapabilities || [],
    };
    await user.save();

    // Log audit event
    await logAuditEvent({
      actor: req.user._id,
      actorRole: ROLES.SUPER_ADMIN,
      action: "approve",
      resourceType: "seller_application",
      resourceId: application._id,
      severity: "high",
      description: `Seller application approved for user: ${user.email_id}, Plan: ${plan.name}`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    // Generate new token with updated role and permissions
    const newToken = generateToken(user);

    res.status(200).send({
      success: true,
      message: "Seller application approved successfully",
      application,
      sellerProfile,
      // Return new token so user can refresh on next login
      token: newToken,
      user: {
        _id: user._id,
        email: user.email_id,
        role: user.roleString,
      },
    });
  } catch (error) {
    console.error("Error approving seller application:", error);
    res.status(500).send({
      success: false,
      message: "Error approving application",
      error: error.message,
    });
  }
};

/**
 * Reject seller application
 */
export const rejectSellerApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).send({
        success: false,
        message: "Rejection reason is required",
      });
    }

    const application = await sellerApplicationModel.findById(id);
    if (!application) {
      return res.status(404).send({
        success: false,
        message: "Application not found",
      });
    }

    // Update application status
    application.status = "rejected";
    application.rejectionReason = rejectionReason;
    application.reviewedBy = req.user._id;
    application.reviewedAt = new Date();
    await application.save();

    // Log audit event
    await logAuditEvent({
      actor: req.user._id,
      actorRole: ROLES.SUPER_ADMIN,
      action: "reject",
      resourceType: "seller_application",
      resourceId: application._id,
      severity: "high",
      description: `Seller application rejected: ${rejectionReason}`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).send({
      success: true,
      message: "Seller application rejected successfully",
      application,
    });
  } catch (error) {
    console.error("Error rejecting seller application:", error);
    res.status(500).send({
      success: false,
      message: "Error rejecting application",
      error: error.message,
    });
  }
};

/**
 * Get user's own application
 */
export const getMyApplication = async (req, res) => {
  try {
    const application = await sellerApplicationModel
      .findOne({ userId: req.user._id })
      .populate("selectedPlanId");

    if (!application) {
      return res.status(404).send({
        success: false,
        message: "No application found",
      });
    }

    res.status(200).send({
      success: true,
      application,
    });
  } catch (error) {
    console.error("Error fetching user application:", error);
    res.status(500).send({
      success: false,
      message: "Error fetching application",
      error: error.message,
    });
  }
};

export default {
  submitSellerApplication,
  getSellerApplications,
  getSellerApplication,
  approveSellerApplication,
  rejectSellerApplication,
  getMyApplication,
};
