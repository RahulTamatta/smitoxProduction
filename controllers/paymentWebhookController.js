import crypto from "crypto";
import sellerApplicationModel from "../models/sellerApplicationModel.js";
import sellerProfileModel from "../models/sellerProfileModel.js";
import subscriptionPlanModel from "../models/subscriptionPlanModel.js";
import userModel from "../models/userModel.js";
import paymentModel from "../models/paymentModel.js";
import { logAuditEvent } from "../middlewares/rbacMiddleware.js";
import { generateToken } from "../helpers/tokenHelper.js";
import { ROLES } from "../config/rbac-policy.js";

/**
 * Handle Razorpay payment webhook
 * Verifies signature and activates seller on successful payment
 */
export const handleRazorpayWebhook = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.error("Invalid Razorpay signature");
      return res.status(400).send({
        success: false,
        message: "Invalid signature",
      });
    }

    // Find seller application by order ID
    const application = await sellerApplicationModel
      .findOne({ "payment.orderId": razorpay_order_id })
      .populate("selectedPlanId")
      .populate("userId");

    if (!application) {
      console.error("Application not found for order:", razorpay_order_id);
      return res.status(404).send({
        success: false,
        message: "Application not found",
      });
    }

    const plan = application.selectedPlanId;
    const user = application.userId;

    // Update payment status
    application.payment.status = "paid";
    application.status = "active";
    
    // Update SellerApplication plan dates (if not already set)
    if (!application.planStartDate) {
      application.planStartDate = new Date();
    }
    if (!application.planExpiryDate) {
      const planExpiryDate = calculatePlanExpiry(plan.billingCycle);
      application.planExpiryDate = planExpiryDate;
      const gracePeriodEndDate = new Date(planExpiryDate);
      gracePeriodEndDate.setDate(gracePeriodEndDate.getDate() + 30);
      application.gracePeriodEndDate = gracePeriodEndDate;
    }
    application.planStatus = "active";
    
    await application.save();

    // Calculate plan expiry date based on billing cycle
    const planExpiryDate = calculatePlanExpiry(plan.billingCycle);

    // Update SellerProfile
    const sellerProfile = await sellerProfileModel.findOne({
      applicationId: application._id,
    });

    if (sellerProfile) {
      sellerProfile.isActive = true;
      sellerProfile.planActivatedAt = new Date();
      sellerProfile.planExpiresAt = planExpiryDate;
      sellerProfile.permissions = {
        grantedCapabilities: plan.includedCapabilities || [],
        deniedCapabilities: plan.excludedCapabilities || [],
      };
      await sellerProfile.save();
    }

    // Update user role and permissions
    user.roleString = "seller";
    user.permissions = {
      grantedCapabilities: plan.includedCapabilities || [],
      deniedCapabilities: plan.excludedCapabilities || [],
    };
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    // Log audit event
    await logAuditEvent({
      actor: user._id,
      actorRole: ROLES.USER,
      action: "payment_successful",
      resourceType: "seller_application",
      resourceId: application._id,
      severity: "high",
      description: `Payment successful for seller application. Plan: ${plan.name}, Amount: ₹${plan.price}`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    // Generate new token
    const token = generateToken(user);

    res.status(200).send({
      success: true,
      message: "Payment verified and seller activated",
      token,
      seller: sellerProfile,
      planExpiresAt: planExpiryDate,
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).send({
      success: false,
      message: "Error processing webhook",
      error: error.message,
    });
  }
};

/**
 * Handle payment failure webhook
 */
export const handlePaymentFailure = async (req, res) => {
  try {
    const { razorpay_order_id, error_code, error_description } = req.body;

    // Find application
    const application = await sellerApplicationModel.findOne({
      "payment.orderId": razorpay_order_id,
    });

    if (!application) {
      return res.status(404).send({
        success: false,
        message: "Application not found",
      });
    }

    // Update payment status
    application.payment.status = "failed";
    application.status = "approved_payment_failed";
    await application.save();

    // Log audit event
    await logAuditEvent({
      actor: application.userId,
      actorRole: ROLES.USER,
      action: "payment_failed",
      resourceType: "seller_application",
      resourceId: application._id,
      severity: "medium",
      description: `Payment failed: ${error_code} - ${error_description}`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).send({
      success: true,
      message: "Payment failure recorded",
    });
  } catch (error) {
    console.error("Error handling payment failure:", error);
    res.status(500).send({
      success: false,
      message: "Error handling payment failure",
      error: error.message,
    });
  }
};

/**
 * Get checkout data for approved_pending_payment application
 */
export const getCheckoutData = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const userId = req.user._id;

    // Find application
    const application = await sellerApplicationModel
      .findById(applicationId)
      .populate("selectedPlanId");

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

    // Check status
    if (application.status !== "approved_pending_payment") {
      return res.status(400).send({
        success: false,
        message: "Application not in pending payment status",
      });
    }

    const plan = application.selectedPlanId;

    res.status(200).send({
      success: true,
      checkoutInfo: {
        orderId: application.payment.orderId,
        amount: plan.price,
        currency: "INR",
        planName: plan.name,
        planDescription: plan.description,
        billingCycle: plan.billingCycle,
        applicationId: application._id,
      },
    });
  } catch (error) {
    console.error("Error fetching checkout data:", error);
    res.status(500).send({
      success: false,
      message: "Error fetching checkout data",
      error: error.message,
    });
  }
};

/**
 * Calculate plan expiry date based on billing cycle
 */
function calculatePlanExpiry(billingCycle) {
  const now = new Date();
  let expiryDate = new Date(now);

  switch (billingCycle) {
    case "monthly":
      expiryDate.setMonth(expiryDate.getMonth() + 1);
      break;
    case "quarterly":
      expiryDate.setMonth(expiryDate.getMonth() + 3);
      break;
    case "yearly":
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      break;
    default:
      expiryDate.setMonth(expiryDate.getMonth() + 1); // Default to monthly
  }

  return expiryDate;
}

export default {
  handleRazorpayWebhook,
  handlePaymentFailure,
  getCheckoutData,
};
