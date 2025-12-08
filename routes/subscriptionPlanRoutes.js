import express from "express";
import {
  createSubscriptionPlan,
  getSubscriptionPlans,
  getSubscriptionPlan,
  updateSubscriptionPlan,
  togglePlanStatus,
  deleteSubscriptionPlan,
  getActivePlans,
} from "../controllers/subscriptionPlanController.js";
import { requireSignIn, requireCapability, requireSuperAdmin, auditLog } from "../middlewares/rbacMiddleware.js";

const router = express.Router();

// PROTECTED routes - Super Admin only (must come before public routes)
router.post("/", 
  requireSignIn, 
  requireCapability("subscriptions:write"),
  auditLog("create", "subscription_plan", "high"),
  createSubscriptionPlan
);

router.get("/admin/list", 
  requireSignIn, 
  requireCapability("subscriptions:read"),
  getSubscriptionPlans
);

// PUBLIC routes - accessible to everyone (for seller wizard)
router.get("/active", getActivePlans);
router.get("/:id", getSubscriptionPlan);

router.put("/:id", 
  requireSignIn, 
  requireCapability("subscriptions:write"),
  auditLog("update", "subscription_plan", "high"),
  updateSubscriptionPlan
);

router.put("/:id/toggle", 
  requireSignIn, 
  requireCapability("subscriptions:toggle"),
  auditLog("toggle_status", "subscription_plan", "high"),
  togglePlanStatus
);

router.delete("/:id", 
  requireSignIn, 
  requireCapability("subscriptions:delete"),
  auditLog("delete", "subscription_plan", "critical"),
  deleteSubscriptionPlan
);

export default router;
