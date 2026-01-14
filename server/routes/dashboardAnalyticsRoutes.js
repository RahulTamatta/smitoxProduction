import express from "express";
import {
    getAuditLogs,
    getOrdersAnalytics,
    getOverviewStats,
    getProductsAnalytics,
    getRevenueAnalytics,
    getSellersAnalytics,
    getSystemHealth,
    getUsersAnalytics,
} from "../controllers/dashboardAnalyticsController.js";
import {
    requireCapability,
    requireSignIn,
    requireSuperAdmin,
} from "../middlewares/rbacMiddleware.js";

const router = express.Router();

// ============================================================================
// ADMIN + SUPER ADMIN ROUTES (analytics:read capability required)
// ============================================================================

/**
 * GET /api/v1/admin/dashboard/overview
 * Summary KPIs for dashboard header
 */
router.get(
    "/overview",
    requireSignIn,
    requireCapability("analytics:read"),
    getOverviewStats
);

/**
 * GET /api/v1/admin/dashboard/orders
 * Order analytics with status breakdown and trends
 */
router.get(
    "/orders",
    requireSignIn,
    requireCapability("analytics:read"),
    getOrdersAnalytics
);

/**
 * GET /api/v1/admin/dashboard/users
 * User registration and activity analytics
 */
router.get(
    "/users",
    requireSignIn,
    requireCapability("analytics:read"),
    getUsersAnalytics
);

/**
 * GET /api/v1/admin/dashboard/products
 * Product inventory and category analytics
 */
router.get(
    "/products",
    requireSignIn,
    requireCapability("analytics:read"),
    getProductsAnalytics
);

/**
 * GET /api/v1/admin/dashboard/sellers
 * Seller applications and subscription analytics
 */
router.get(
    "/sellers",
    requireSignIn,
    requireCapability("analytics:read"),
    getSellersAnalytics
);

// ============================================================================
// SUPER ADMIN ONLY ROUTES
// ============================================================================

/**
 * GET /api/v1/admin/dashboard/revenue
 * Detailed revenue and payment analytics
 * Super Admin only - contains sensitive financial data
 */
router.get(
    "/revenue",
    requireSignIn,
    requireSuperAdmin,
    getRevenueAnalytics
);

/**
 * GET /api/v1/admin/dashboard/audit-logs
 * Admin activity audit logs
 * Super Admin only - contains sensitive security data
 */
router.get(
    "/audit-logs",
    requireSignIn,
    requireSuperAdmin,
    getAuditLogs
);

/**
 * GET /api/v1/admin/dashboard/system-health
 * System health and database metrics
 * Super Admin only - contains sensitive infrastructure data
 */
router.get(
    "/system-health",
    requireSignIn,
    requireSuperAdmin,
    getSystemHealth
);

export default router;
