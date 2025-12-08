import sellerApplicationModel from "../models/sellerApplicationModel.js";
import sellerProfileModel from "../models/sellerProfileModel.js";
import subscriptionPlanModel from "../models/subscriptionPlanModel.js";
import userModel from "../models/userModel.js";
import { logAuditEvent } from "../middlewares/rbacMiddleware.js";
import { generateToken } from "../helpers/tokenHelper.js";
import { ROLES } from "../config/rbac-policy.js";

/**
 * Submit seller application
 */
export const submitSellerApplication = async (req, res) => {
  try {
    const { selectedPlanId, ...applicationData } = req.body;

    // Validate plan exists
    const plan = await subscriptionPlanModel.findById(selectedPlanId);
    if (!plan) {
      return res.status(404).send({
        success: false,
        message: "Subscription plan not found",
      });
    }

    // Check if user already has a pending/approved application
    const existingApp = await sellerApplicationModel.findOne({
      userId: req.user._id,
      status: { $in: ["submitted", "under_review", "approved"] },
    });

    if (existingApp) {
      return res.status(400).send({
        success: false,
        message: "You already have an active seller application",
      });
    }

    // Create application
    const application = new sellerApplicationModel({
      userId: req.user._id,
      selectedPlanId,
      ...applicationData,
    });

    await application.save();

    // Log audit event
    await logAuditEvent({
      actor: req.user._id,
      actorRole: ROLES.USER,
      action: "submit",
      resourceType: "seller_application",
      resourceId: application._id,
      severity: "medium",
      description: `Seller application submitted for plan: ${plan.name}`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(201).send({
      success: true,
      message: "Seller application submitted successfully",
      application,
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
