import express from "express";
import formidable from "express-formidable";
import {
  saveDraftApplication,
  submitApplication,
  getMyApplication,
  getSellerApplications,
  getApplicationById,
  approveApplication,
  rejectApplication,
  retryPayment,
  renewPlan,
  upgradePlan,
  getAvailablePlans,
} from "../controllers/sellerApplicationControllerV2.js";
import {
  requireSignIn,
  requireCapability,
  auditLog,
} from "../middlewares/rbacMiddleware.js";

const router = express.Router();

// USER ENDPOINTS (authenticated)
router.post(
  "/apply",
  requireSignIn,
  formidable(),
  auditLog("save_draft_application", "seller_application", "low"),
  saveDraftApplication
);

router.post(
  "/submit",
  requireSignIn,
  auditLog("submit_application", "seller_application", "medium"),
  submitApplication
);

router.get("/my-application", requireSignIn, getMyApplication);

router.post(
  "/:id/retry-payment",
  requireSignIn,
  auditLog("retry_payment", "seller_application", "medium"),
  retryPayment
);

// RENEWAL & UPGRADE ENDPOINTS
router.post(
  "/renew-plan",
  requireSignIn,
  auditLog("renew_plan", "seller_application", "medium"),
  renewPlan
);

router.post(
  "/upgrade-plan",
  requireSignIn,
  auditLog("upgrade_plan", "seller_application", "medium"),
  upgradePlan
);

router.get("/available-plans", getAvailablePlans);

// SUPER ADMIN ENDPOINTS
router.get(
  "/",
  requireSignIn,
  requireCapability("sellers:applications:read"),
  getSellerApplications
);

router.get(
  "/:id",
  requireSignIn,
  requireCapability("sellers:applications:read"),
  getApplicationById
);

router.post(
  "/:id/approve",
  requireSignIn,
  requireCapability("sellers:applications:approve"),
  auditLog("approve_application", "seller_application", "high"),
  approveApplication
);

router.post(
  "/:id/reject",
  requireSignIn,
  requireCapability("sellers:applications:reject"),
  auditLog("reject_application", "seller_application", "high"),
  rejectApplication
);

export default router;
