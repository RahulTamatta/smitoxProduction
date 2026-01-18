/**
 * Simplified Seller Application Routes
 * Direct submit flow - no draft saving
 */

import express from "express";
import {
    approveApplication,
    getApplicationById,
    getAvailablePlans,
    getMyApplication,
    getSellerApplications,
    rejectApplication,
    submitSellerApplication,
    verifyPayment,
} from "../controllers/sellerApplicationControllerSimplified.js";
import { upload } from "../middlewares/multer.js";
import {
    auditLog,
    requireCapability,
    requireSignIn,
} from "../middlewares/rbacMiddleware.js";

const router = express.Router();

// ========================================
// PUBLIC ENDPOINTS
// ========================================

// Get available subscription plans
router.get("/plans", getAvailablePlans);

// ========================================
// USER ENDPOINTS (authenticated)
// ========================================

// Submit application directly (single step - no draft)
router.post(
    "/submit",
    requireSignIn,
    upload.fields([
        { name: "identityProofImage", maxCount: 1 },
        { name: "addressProofImage", maxCount: 1 },
        { name: "gstImage", maxCount: 1 },
        { name: "panImage", maxCount: 1 },
        { name: "cancelledCheckImage", maxCount: 1 },
    ]),
    auditLog("submit_seller_application", "seller_application", "medium"),
    submitSellerApplication
);

// Get my application status
router.get("/my-application", requireSignIn, getMyApplication);

// Verify payment after Razorpay checkout
router.post(
    "/verify-payment",
    requireSignIn,
    auditLog("verify_payment", "seller_application", "high"),
    verifyPayment
);

// ========================================
// ADMIN ENDPOINTS
// ========================================

// Get all applications (with filters)
router.get(
    "/",
    requireSignIn,
    requireCapability("sellers:applications:read"),
    getSellerApplications
);

// Get single application details
router.get(
    "/:id",
    requireSignIn,
    requireCapability("sellers:applications:read"),
    getApplicationById
);

// Approve application
router.post(
    "/:id/approve",
    requireSignIn,
    requireCapability("sellers:applications:approve"),
    auditLog("approve_application", "seller_application", "high"),
    approveApplication
);

// Reject application
router.post(
    "/:id/reject",
    requireSignIn,
    requireCapability("sellers:applications:reject"),
    auditLog("reject_application", "seller_application", "high"),
    rejectApplication
);

export default router;
