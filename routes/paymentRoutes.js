import express from "express";
import {
  createPaymentOrder,
  verifyPayment,
  getPaymentDetails,
  getUserPayments,
} from "../controllers/paymentController.js";
import { requireSignIn, auditLog } from "../middlewares/rbacMiddleware.js";

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

export default router;
