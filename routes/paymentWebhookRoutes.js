import express from "express";
import {
  handleRazorpayWebhook,
  handlePaymentFailure,
  getCheckoutData,
} from "../controllers/paymentWebhookController.js";
import { requireSignIn } from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * Payment Webhook Routes
 */

// Razorpay webhook (public - no auth required, signature verified instead)
router.post("/razorpay/success", handleRazorpayWebhook);

// Payment failure webhook
router.post("/razorpay/failure", handlePaymentFailure);

// Get checkout data for pending applications (authenticated)
router.get("/checkout-data/:applicationId", requireSignIn, getCheckoutData);

export default router;
