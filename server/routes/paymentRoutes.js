import express from "express";
import {
  createPaymentOrder,
  getPaymentDetails,
  getSubscriptionStatus,
  getUserPayments,
  verifyPayment
} from "../controllers/paymentController.js";
import { auditLog, requireSignIn } from "../middlewares/rbacMiddleware.js";

const router = express.Router();

// Create payment order for subscription plan
router.post(
  "/create-order",
  requireSignIn,
  auditLog("create_payment_order", "payment", "medium"),
  createPaymentOrder
);

// Verify payment signature
router.post(
  "/verify-payment",
  requireSignIn,
  auditLog("verify_payment", "payment", "high"),
  verifyPayment
);

// Get payment details
router.get(
  "/:paymentId",
  requireSignIn,
  getPaymentDetails
);

// Get user's payment history
router.get(
  "/",
  requireSignIn,
  getUserPayments
);

// Get subscription status (Polling endpoint)
router.get(
  "/status/current",
  requireSignIn,
  getSubscriptionStatus
);

export default router;
