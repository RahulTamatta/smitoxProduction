import Razorpay from "razorpay";
import crypto from "crypto";
import paymentModel from "../models/paymentModel.js";
import subscriptionPlanModel from "../models/subscriptionPlanModel.js";
import { logAuditEvent } from "../middlewares/rbacMiddleware.js";
import { ROLES } from "../config/rbac-policy.js";

// Initialize Razorpay lazily to ensure env vars are loaded
let razorpay = null;

const getRazorpayInstance = () => {
  if (!razorpay) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.warn("⚠️  Razorpay credentials not configured. Payment features will be disabled.");
      return null;
    }
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpay;
};

/**
 * Create payment order for subscription plan
 */
export const createPaymentOrder = async (req, res) => {
  try {
    const { amount, planId, planName } = req.body;
    const userId = req.user._id;

    // Get Razorpay instance
    const razorpayInstance = getRazorpayInstance();
    if (!razorpayInstance) {
      return res.status(503).send({
        success: false,
        message: "Payment service not configured. Please contact support.",
      });
    }

    // Validate plan exists
    const plan = await subscriptionPlanModel.findById(planId);
    if (!plan) {
      return res.status(404).send({
        success: false,
        message: "Subscription plan not found",
      });
    }

    // Create Razorpay order
    const options = {
      amount: amount, // Amount in paise
      currency: "INR",
      receipt: `receipt_${userId}_${Date.now()}`,
      notes: {
        userId: userId.toString(),
        planId: planId,
        planName: planName,
      },
    };

    const razorpayOrder = await razorpayInstance.orders.create(options);

    // Save payment record in database
    const payment = new paymentModel({
      userId,
      planId,
      razorpayOrderId: razorpayOrder.id,
      amount: amount / 100, // Convert back to rupees
      currency: "INR",
      status: "pending",
      paymentMethod: "razorpay",
    });

    await payment.save();

    // Log audit event
    await logAuditEvent({
      actor: userId,
      actorRole: ROLES.USER,
      action: "create_payment_order",
      resourceType: "payment",
      resourceId: payment._id,
      severity: "medium",
      description: `Payment order created for plan: ${planName}`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(201).send({
      success: true,
      message: "Payment order created successfully",
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      paymentId: payment._id,
    });
  } catch (error) {
    console.error("Error creating payment order:", error);
    res.status(500).send({
      success: false,
      message: "Error creating payment order",
      error: error.message,
    });
  }
};

/**
 * Verify payment signature and update payment status
 */
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = req.body;
    const userId = req.user._id;

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).send({
        success: false,
        message: "Payment verification failed - Invalid signature",
      });
    }

    // Update payment record
    const payment = await paymentModel.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        status: "completed",
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        completedAt: new Date(),
      },
      { new: true }
    );

    if (!payment) {
      return res.status(404).send({
        success: false,
        message: "Payment record not found",
      });
    }

    // Fetch plan details
    const plan = await subscriptionPlanModel.findById(planId);

    // Log audit event
    await logAuditEvent({
      actor: userId,
      actorRole: ROLES.USER,
      action: "payment_verified",
      resourceType: "payment",
      resourceId: payment._id,
      severity: "high",
      description: `Payment verified for plan: ${plan?.name}, Amount: ₹${payment.amount}`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).send({
      success: true,
      message: "Payment verified successfully",
      payment,
      planId,
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).send({
      success: false,
      message: "Error verifying payment",
      error: error.message,
    });
  }
};

/**
 * Get payment details
 */
export const getPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await paymentModel
      .findById(paymentId)
      .populate("userId", "email_id user_fullname")
      .populate("planId", "name price billingCycle");

    if (!payment) {
      return res.status(404).send({
        success: false,
        message: "Payment not found",
      });
    }

    res.status(200).send({
      success: true,
      payment,
    });
  } catch (error) {
    console.error("Error fetching payment details:", error);
    res.status(500).send({
      success: false,
      message: "Error fetching payment details",
      error: error.message,
    });
  }
};

/**
 * Get user's payment history
 */
export const getUserPayments = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, status } = req.query;

    const query = { userId };
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * parseInt(limit);
    const pageLimit = parseInt(limit);

    const payments = await paymentModel
      .find(query)
      .populate("planId", "name price billingCycle")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageLimit);

    const total = await paymentModel.countDocuments(query);

    res.status(200).send({
      success: true,
      payments,
      pagination: {
        page: parseInt(page),
        limit: pageLimit,
        total,
        pages: Math.ceil(total / pageLimit),
      },
    });
  } catch (error) {
    console.error("Error fetching user payments:", error);
    res.status(500).send({
      success: false,
      message: "Error fetching payments",
      error: error.message,
    });
  }
};

export default {
  createPaymentOrder,
  verifyPayment,
  getPaymentDetails,
  getUserPayments,
};
