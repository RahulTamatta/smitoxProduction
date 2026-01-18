/**
 * Simplified Seller Application Controller
 * Direct submit flow - no draft saving, just submit with KYC
 */

import crypto from "crypto";
import path from "path";
import Razorpay from "razorpay";
import { ROLES } from "../config/rbac-policy.js";
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
 * Helper to get relative path from multer file
 */
const getLocalPath = (file) => {
    if (!file) return null;
    return `uploads/users/${path.basename(file.path)}`;
};

/**
 * =============================================
 * SUBMIT APPLICATION (Direct - No Draft)
 * =============================================
 * User fills form and submits directly in one step
 * Replaces the old saveDraft + submit two-step process
 */
export const submitSellerApplication = async (req, res) => {
    try {
        const userId = req.user._id;
        const { selectedPlanId, ...applicationData } = req.body;

        // Check if user already has an active or pending application
        const existingApplication = await sellerApplicationModel.findOne({
            userId,
            status: { $in: ["submitted", "under_review", "approved_pending_payment", "approved", "active"] },
        });

        if (existingApplication) {
            return res.status(400).send({
                success: false,
                message: "You already have an active or pending application",
                existingStatus: existingApplication.status,
                applicationId: existingApplication._id,
            });
        }

        // Validate plan ID is provided
        if (!selectedPlanId) {
            return res.status(400).send({
                success: false,
                message: "Subscription plan ID is required",
            });
        }

        // Validate plan exists
        const plan = await subscriptionPlanModel.findById(selectedPlanId);
        if (!plan || !plan.isActive) {
            return res.status(404).send({
                success: false,
                message: "Subscription plan not found or inactive",
            });
        }

        // Handle file uploads
        const files = req.files || {};

        // Required KYC fields validation
        const requiredFields = [
            "firstName",
            "lastName",
            "addressLine1",
            "city",
            "state",
            "pincode",
            "identityProofNumber",
            "businessName",
            "accountHolderName",
            "accountNumber",
            "ifscCode",
            "bankName",
        ];

        const missingFields = [];
        for (const field of requiredFields) {
            const value = applicationData[field];
            if (!value || (typeof value === "string" && value.trim() === "")) {
                missingFields.push(field);
            }
        }

        // Check consent checkboxes
        if (applicationData.termsAccepted !== true && applicationData.termsAccepted !== "true") {
            missingFields.push("termsAccepted");
        }
        if (applicationData.privacyAccepted !== true && applicationData.privacyAccepted !== "true") {
            missingFields.push("privacyAccepted");
        }

        // Check required file uploads
        if (!files.addressProofImage?.[0]) {
            missingFields.push("addressProofImage");
        }

        if (missingFields.length > 0) {
            return res.status(400).send({
                success: false,
                message: "Please fill all required fields",
                missingFields,
            });
        }

        // Capture plan snapshot (price protection)
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

        // Delete any existing rejected/draft applications for this user
        await sellerApplicationModel.deleteMany({
            userId,
            status: { $in: ["draft", "rejected", "cancelled"] },
        });

        // Create new application (directly submitted)
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
            termsAccepted: true,
            privacyAccepted: true,
            communicationConsent: applicationData.communicationConsent === true || applicationData.communicationConsent === "true",
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
        console.error("Error submitting application:", error);
        res.status(500).send({
            success: false,
            message: "Error submitting application",
            error: error.message,
        });
    }
};

/**
 * =============================================
 * GET MY APPLICATION STATUS
 * =============================================
 */
export const getMyApplication = async (req, res) => {
    try {
        const userId = req.user._id;

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
        if (["active", "approved"].includes(application.status)) {
            sellerProfile = await sellerProfileModel.findOne({ userId });
        }

        res.status(200).send({
            success: true,
            application: {
                _id: application._id,
                status: application.status,
                selectedPlan: application.selectedPlanId,
                selectedPlanSnapshot: application.selectedPlanSnapshot,
                payment: application.payment,
                submittedAt: application.submittedAt,
                reviewNotes: application.reviewNotes,
                planStartDate: application.planStartDate,
                planExpiryDate: application.planExpiryDate,
                planStatus: application.planStatus,
                isActive: sellerProfile?.isActive || false,
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
 * =============================================
 * ADMIN: GET ALL APPLICATIONS
 * =============================================
 */
export const getSellerApplications = async (req, res) => {
    try {
        const { status, page = 1, limit = 10, search } = req.query;

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

        const [applications, total] = await Promise.all([
            sellerApplicationModel
                .find(query)
                .populate("userId", "email_id user_fullname mobile_no")
                .populate("selectedPlanId", "name price billingCycle isFree")
                .populate("reviewedBy", "user_fullname")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            sellerApplicationModel.countDocuments(query),
        ]);

        res.status(200).send({
            success: true,
            applications,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit)),
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
 * =============================================
 * ADMIN: GET SINGLE APPLICATION
 * =============================================
 */
export const getApplicationById = async (req, res) => {
    try {
        const { id } = req.params;

        const application = await sellerApplicationModel
            .findById(id)
            .populate("userId", "email_id user_fullname mobile_no")
            .populate("selectedPlanId")
            .populate("reviewedBy", "user_fullname");

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
 * =============================================
 * ADMIN: APPROVE APPLICATION
 * =============================================
 * Free plans: Immediately activate
 * Paid plans: Create payment order
 */
export const approveApplication = async (req, res) => {
    try {
        const { id } = req.params;
        const { reviewerNotes } = req.body;
        const adminId = req.user._id;

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

        if (application.status !== "submitted") {
            return res.status(400).send({
                success: false,
                message: `Cannot approve application in '${application.status}' status`,
            });
        }

        const plan = application.selectedPlanId;
        const user = application.userId;

        // Update review info
        application.reviewedBy = adminId;
        application.reviewedAt = new Date();
        application.reviewNotes = reviewerNotes || "Approved";

        // ========== FREE PLAN: Immediate Activation ==========
        if (plan.isFree) {
            const now = new Date();
            const expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
            const gracePeriodEnd = new Date(expiryDate.getTime() + 30 * 24 * 60 * 60 * 1000);

            application.status = "approved";
            application.planStartDate = now;
            application.planExpiryDate = expiryDate;
            application.gracePeriodEndDate = gracePeriodEnd;
            application.planStatus = "active";
            application.isImmutable = true;
            application.activatedAt = now;

            await application.save();

            // Create/Update Seller Profile
            await sellerProfileModel.findOneAndUpdate(
                { userId: user._id },
                {
                    userId: user._id,
                    applicationId: application._id,
                    currentPlanId: plan._id,
                    isActive: true,
                    planActivatedAt: now,
                    planExpiresAt: expiryDate,
                    permissions: {
                        grantedCapabilities: plan.includedCapabilities || [],
                        deniedCapabilities: plan.excludedCapabilities || [],
                    },
                },
                { new: true, upsert: true }
            );

            // Update User role
            user.roleString = "seller";
            user.permissions = {
                grantedCapabilities: plan.includedCapabilities || [],
                deniedCapabilities: plan.excludedCapabilities || [],
            };
            user.tokenVersion = (user.tokenVersion || 0) + 1;
            await user.save();

            const token = generateToken(user);

            return res.status(200).send({
                success: true,
                message: "Application approved! Seller account activated.",
                status: "approved",
                token,
            });
        }

        // ========== PAID PLAN: Create Payment Order ==========
        const razorpay = getRazorpayInstance();
        if (!razorpay) {
            return res.status(503).send({
                success: false,
                message: "Payment service not configured",
            });
        }

        const orderOptions = {
            amount: Math.round(plan.price * 100), // Convert to paise
            currency: "INR",
            receipt: `app_${application._id.toString().slice(-8)}_${Date.now().toString().slice(-6)}`,
            notes: {
                applicationId: application._id.toString(),
                userId: user._id.toString(),
                planId: plan._id.toString(),
            },
        };

        const razorpayOrder = await razorpay.orders.create(orderOptions);

        // Calculate dates (will be activated after payment)
        const now = new Date();
        const expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const gracePeriodEnd = new Date(expiryDate.getTime() + 30 * 24 * 60 * 60 * 1000);

        application.status = "approved_pending_payment";
        application.planStartDate = now;
        application.planExpiryDate = expiryDate;
        application.gracePeriodEndDate = gracePeriodEnd;
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
            message: "Application approved! User needs to complete payment.",
            status: "approved_pending_payment",
            checkoutInfo: {
                orderId: razorpayOrder.id,
                amount: plan.price,
                currency: "INR",
                planName: plan.name,
                applicationId: application._id,
                keyId: process.env.RAZORPAY_KEY_ID,
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
 * =============================================
 * ADMIN: REJECT APPLICATION  
 * =============================================
 */
export const rejectApplication = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const adminId = req.user._id;

        if (!reason) {
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

        application.status = "rejected";
        application.reviewedBy = adminId;
        application.reviewedAt = new Date();
        application.reviewNotes = reason;

        await application.save();

        res.status(200).send({
            success: true,
            message: "Application rejected",
            status: "rejected",
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
 * =============================================
 * VERIFY PAYMENT & ACTIVATE
 * =============================================
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
        const body = `${razorpay_order_id}|${razorpay_payment_id}`;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).send({
                success: false,
                message: "Invalid payment signature",
            });
        }

        // Find application
        const application = await sellerApplicationModel
            .findOne({ "payment.orderId": razorpay_order_id })
            .populate("selectedPlanId")
            .populate("userId");

        if (!application) {
            return res.status(404).send({
                success: false,
                message: "Application not found",
            });
        }

        // Already activated (idempotent)
        if (["approved", "active"].includes(application.status)) {
            return res.status(200).send({
                success: true,
                message: "Subscription already active",
                alreadyActive: true,
            });
        }

        const plan = application.selectedPlanId;
        const user = application.userId;
        const now = new Date();

        // Update application
        application.status = "approved";
        application.planStatus = "active";
        application.isImmutable = true;
        application.activatedAt = now;
        application.payment.status = "paid";
        application.payment.razorpayPaymentId = razorpay_payment_id;
        application.payment.paidAt = now;

        await application.save();

        // Create/Update Seller Profile
        await sellerProfileModel.findOneAndUpdate(
            { userId: user._id },
            {
                userId: user._id,
                applicationId: application._id,
                currentPlanId: plan._id,
                isActive: true,
                planActivatedAt: now,
                planExpiresAt: application.planExpiryDate,
                permissions: {
                    grantedCapabilities: plan.includedCapabilities || [],
                    deniedCapabilities: plan.excludedCapabilities || [],
                },
            },
            { new: true, upsert: true }
        );

        // Update User role
        await userModel.findByIdAndUpdate(user._id, {
            roleString: "seller",
            permissions: {
                grantedCapabilities: plan.includedCapabilities || [],
                deniedCapabilities: plan.excludedCapabilities || [],
            },
            $inc: { tokenVersion: 1 },
        });

        res.status(200).send({
            success: true,
            message: "Payment verified! Seller account activated.",
            status: "approved",
        });

    } catch (error) {
        console.error("Payment verification error:", error);
        res.status(500).send({
            success: false,
            message: "Payment verification failed",
            error: error.message,
        });
    }
};

/**
 * =============================================
 * GET AVAILABLE PLANS
 * =============================================
 */
export const getAvailablePlans = async (req, res) => {
    try {
        const plans = await subscriptionPlanModel
            .find({ isActive: true })
            .sort({ displayOrder: 1, price: 1 });

        res.status(200).send({
            success: true,
            plans,
        });
    } catch (error) {
        console.error("Error fetching plans:", error);
        res.status(500).send({
            success: false,
            message: "Error fetching plans",
            error: error.message,
        });
    }
};

export default {
    submitSellerApplication,
    getMyApplication,
    getSellerApplications,
    getApplicationById,
    approveApplication,
    rejectApplication,
    verifyPayment,
    getAvailablePlans,
};
