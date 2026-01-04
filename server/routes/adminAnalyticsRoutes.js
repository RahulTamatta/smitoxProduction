import express from "express";
import { requireSignIn, requireCapability } from "../middlewares/rbacMiddleware.js";
import { getSubscriptionsAnalytics, getSubscriptionsLeaderboard } from "../controllers/adminAnalyticsController.js";

const router = express.Router();

// GET /api/v1/admin/analytics/subscriptions
router.get(
  "/subscriptions",
  requireSignIn,
  requireCapability("analytics:read"),
  getSubscriptionsAnalytics
);

// GET /api/v1/admin/analytics/subscriptions/leaderboard
router.get(
  "/subscriptions/leaderboard",
  requireSignIn,
  requireCapability("analytics:read"),
  getSubscriptionsLeaderboard
);

export default router;
