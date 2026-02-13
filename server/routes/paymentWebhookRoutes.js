import express from "express";
import {
  getFailedPaymentLogs,
  handleCustomerOrderWebhook,
} from "../controllers/customerOrderWebhookController.js";
import {
  getCheckoutData,
  handlePaymentFailure,
  handleRazorpayWebhook,
} from "../controllers/paymentWebhookController.js";
import { requireSignIn } from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * Payment Webhook Routes
 */

// Razorpay webhook for SELLER subscriptions (public - no auth required, signature verified instead)
router.post("/razorpay/success", handleRazorpayWebhook);

// Razorpay webhook for CUSTOMER orders (public - signature verified)
router.post("/razorpay/customer-order", handleCustomerOrderWebhook);

// Payment failure webhook
router.post("/razorpay/failure", handlePaymentFailure);

// Get checkout data for pending applications (authenticated)
router.get("/checkout-data/:applicationId", requireSignIn, getCheckoutData);

// Get failed payment logs for reconciliation (admin only - add auth middleware if needed)
router.get("/failed-payments", getFailedPaymentLogs);

export default router;
