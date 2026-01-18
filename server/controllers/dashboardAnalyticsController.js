import mongoose from "mongoose";
import AuditLog from "../models/auditLogModel.js";
import Order from "../models/orderModel.js";
import Payment from "../models/paymentModel.js";
import Product from "../models/productModel.js";
import SellerApplication from "../models/sellerApplicationModel.js";
import User from "../models/userModel.js";

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Parse date range from query parameters with sensible defaults
 * @param {string} from - Start date (ISO string)
 * @param {string} to - End date (ISO string)
 * @returns {Object} { start: Date, end: Date }
 */
const parseDateRange = (from, to) => {
    const end = to ? new Date(to) : new Date();
    // Default to last 30 days if no start date provided
    const start = from ? new Date(from) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Set time to start/end of day for accurate queries
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return { start, end };
};

/**
 * Calculate percentage change between two values
 * @param {number} current - Current value
 * @param {number} previous - Previous value
 * @returns {number} Percentage change (rounded to 1 decimal)
 */
const calculateTrend = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 1000) / 10;
};

/**
 * Get date range for previous period (for trend comparison)
 * @param {Date} start - Current period start
 * @param {Date} end - Current period end
 * @returns {Object} { prevStart: Date, prevEnd: Date }
 */
const getPreviousPeriod = (start, end) => {
    const duration = end.getTime() - start.getTime();
    const prevEnd = new Date(start.getTime() - 1); // Day before current start
    const prevStart = new Date(prevEnd.getTime() - duration);
    return { prevStart, prevEnd };
};

// ============================================================================
// OVERVIEW STATS ENDPOINT
// ============================================================================

/**
 * GET /api/v1/admin/dashboard/overview
 * Returns summary KPIs for the dashboard header
 * Access: admin, super_admin
 */
export const getOverviewStats = async (req, res) => {
    try {
        const { from, to } = req.query;
        const { start, end } = parseDateRange(from, to);
        const { prevStart, prevEnd } = getPreviousPeriod(start, end);

        // Define valid revenue statuses (exclude cancelled/rejected)
        const REVENUE_STATUSES = ["Pending", "Confirmed", "Accepted", "Dispatched", "Delivered", "Completed", "Cash on Delivery"];
        const COMPLETED_STATUSES = ["Delivered", "Completed"];

        // Parallel queries for performance
        const [
            // Current period stats
            totalUsers,
            newUsers,
            totalOrders,
            pendingOrders,
            totalProducts,
            activeProducts,
            lowStockProducts,
            periodRevenue,
            allTimeRevenue,
            todayRevenue,
            todayOrders,
            activeSellers,
            pendingApplications,
            // Previous period stats for trends
            prevNewUsers,
            prevOrders,
            prevRevenue,
        ] = await Promise.all([
            // Current period
            User.countDocuments(),
            User.countDocuments({ createdAt: { $gte: start, $lte: end } }),
            Order.countDocuments(),
            Order.countDocuments({ status: "Pending" }),
            Product.countDocuments(),
            Product.countDocuments({ isActive: "1" }),
            Product.countDocuments({ stock: { $lt: 10, $gte: 0 } }),
            // Period revenue (within selected date range, excluding cancelled)
            Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: start, $lte: end },
                        status: { $in: REVENUE_STATUSES }
                    }
                },
                { $group: { _id: null, total: { $sum: "$amount" } } },
            ]),
            // All-time revenue (completed orders only)
            Order.aggregate([
                { $match: { status: { $in: COMPLETED_STATUSES } } },
                { $group: { _id: null, total: { $sum: "$amount" } } },
            ]),
            // Today's revenue
            Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
                        status: { $in: REVENUE_STATUSES },
                    },
                },
                { $group: { _id: null, total: { $sum: "$amount" } } },
            ]),
            // Today's orders
            Order.countDocuments({
                createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
            }),
            SellerApplication.countDocuments({ status: "active" }),
            SellerApplication.countDocuments({ status: { $in: ["submitted", "under_review"] } }),
            // Previous period
            User.countDocuments({ createdAt: { $gte: prevStart, $lte: prevEnd } }),
            Order.countDocuments({ createdAt: { $gte: prevStart, $lte: prevEnd } }),
            Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: prevStart, $lte: prevEnd },
                        status: { $in: REVENUE_STATUSES },
                    },
                },
                { $group: { _id: null, total: { $sum: "$amount" } } },
            ]),
        ]);

        // Extract aggregation results
        const currentRevenue = periodRevenue[0]?.total || 0;
        const previousRevenue = prevRevenue[0]?.total || 0;
        const currentOrders = await Order.countDocuments({ createdAt: { $gte: start, $lte: end } });
        const allTimeRevenueTotal = allTimeRevenue[0]?.total || 0;

        res.status(200).json({
            success: true,
            data: {
                users: {
                    total: totalUsers,
                    new: newUsers,
                    today: await User.countDocuments({ createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } }),
                    trend: calculateTrend(newUsers, prevNewUsers),
                },
                orders: {
                    total: totalOrders,
                    pending: pendingOrders,
                    today: todayOrders,
                    periodCount: currentOrders,
                    trend: calculateTrend(currentOrders, prevOrders),
                },
                products: {
                    total: totalProducts,
                    active: activeProducts,
                    lowStock: lowStockProducts,
                },
                revenue: {
                    total: currentRevenue,  // Revenue for selected period
                    allTime: allTimeRevenueTotal,  // All-time completed revenue
                    today: todayRevenue[0]?.total || 0,
                    trend: calculateTrend(currentRevenue, previousRevenue),
                },
                sellers: {
                    active: activeSellers,
                    pending: pendingApplications,
                },
            },
            period: { from: start, to: end },
        });
    } catch (error) {
        console.error("Error fetching overview stats:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch overview statistics",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};

// ============================================================================
// ORDERS ANALYTICS ENDPOINT
// ============================================================================

/**
 * GET /api/v1/admin/dashboard/orders
 * Returns detailed order analytics
 * Access: admin, super_admin
 */
export const getOrdersAnalytics = async (req, res) => {
    try {
        const { from, to, groupBy = "day" } = req.query;
        const { start, end } = parseDateRange(from, to);

        // Determine time unit for aggregation
        const timeUnit = groupBy === "month" ? "month" : groupBy === "week" ? "week" : "day";

        // Parallel queries
        const [statusBreakdown, orderTrends, avgOrderValue, recentOrders, paymentMethodBreakdown] =
            await Promise.all([
                // Status breakdown
                Order.aggregate([
                    { $group: { _id: "$status", count: { $sum: 1 } } },
                    { $project: { _id: 0, status: "$_id", count: 1 } },
                    { $sort: { count: -1 } },
                ]),

                // Order trends over time
                Order.aggregate([
                    { $match: { createdAt: { $gte: start, $lte: end } } },
                    {
                        $group: {
                            _id: { $dateTrunc: { date: "$createdAt", unit: timeUnit } },
                            count: { $sum: 1 },
                            // Only sum revenue for non-cancelled orders
                            revenue: {
                                $sum: {
                                    $cond: [
                                        { $in: ["$status", ["Cancelled", "Rejected"]] },
                                        0,
                                        "$amount"
                                    ]
                                }
                            },
                        },
                    },
                    { $project: { _id: 0, date: "$_id", count: 1, revenue: 1 } },
                    { $sort: { date: 1 } },
                ]),

                // Average order value
                Order.aggregate([
                    { $match: { status: { $nin: ["Cancelled", "Rejected"] } } },
                    { $group: { _id: null, avg: { $avg: "$amount" } } },
                ]),

                // Recent orders (last 10)
                Order.find()
                    .sort({ createdAt: -1 })
                    .limit(10)
                    .populate("buyer", "user_fullname email_id mobile_no")
                    .select("amount status createdAt payment"),

                // Payment method breakdown
                Order.aggregate([
                    { $match: { "payment.paymentMethod": { $exists: true } } },
                    {
                        $group: {
                            _id: "$payment.paymentMethod",
                            count: { $sum: 1 },
                            // Only sum revenue for non-cancelled orders
                            revenue: {
                                $sum: {
                                    $cond: [
                                        { $in: ["$status", ["Cancelled", "Rejected"]] },
                                        0,
                                        "$amount"
                                    ]
                                }
                            }
                        }
                    },
                    { $project: { _id: 0, method: "$_id", count: 1, revenue: 1 } },
                ]),
            ]);

        // Calculate percentages for status breakdown
        const totalOrders = statusBreakdown.reduce((sum, s) => sum + s.count, 0);
        const statusWithPercentage = statusBreakdown.map((s) => ({
            ...s,
            percentage: totalOrders > 0 ? Math.round((s.count / totalOrders) * 100) : 0,
        }));

        res.status(200).json({
            success: true,
            data: {
                statusBreakdown: statusWithPercentage,
                trends: orderTrends,
                averageOrderValue: Math.round(avgOrderValue[0]?.avg || 0),
                recentOrders,
                paymentMethodBreakdown,
            },
            period: { from: start, to: end, groupBy: timeUnit },
        });
    } catch (error) {
        console.error("Error fetching orders analytics:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch order analytics",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};

// ============================================================================
// USERS ANALYTICS ENDPOINT
// ============================================================================

/**
 * GET /api/v1/admin/dashboard/users
 * Returns user registration and activity analytics
 * Access: admin, super_admin
 */
export const getUsersAnalytics = async (req, res) => {
    try {
        const { from, to, groupBy = "day" } = req.query;
        const { start, end } = parseDateRange(from, to);
        const timeUnit = groupBy === "month" ? "month" : groupBy === "week" ? "week" : "day";

        // Time windows for active users
        const now = new Date();
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const [roleDistribution, registrationTrends, activeUsers24h, activeUsers7d, activeUsers30d, recentUsers] =
            await Promise.all([
                // Role distribution
                User.aggregate([
                    { $group: { _id: "$roleString", count: { $sum: 1 } } },
                    { $project: { _id: 0, role: { $ifNull: ["$_id", "user"] }, count: 1 } },
                    { $sort: { count: -1 } },
                ]),

                // Registration trends
                User.aggregate([
                    { $match: { createdAt: { $gte: start, $lte: end } } },
                    {
                        $group: {
                            _id: { $dateTrunc: { date: "$createdAt", unit: timeUnit } },
                            count: { $sum: 1 },
                        },
                    },
                    { $project: { _id: 0, date: "$_id", count: 1 } },
                    { $sort: { date: 1 } },
                ]),

                // Active users (by lastLogin)
                User.countDocuments({ lastLogin: { $gte: last24h } }),
                User.countDocuments({ lastLogin: { $gte: last7d } }),
                User.countDocuments({ lastLogin: { $gte: last30d } }),

                // Recent registrations
                User.find()
                    .sort({ createdAt: -1 })
                    .limit(10)
                    .select("user_fullname email_id mobile_no roleString createdAt"),
            ]);

        // Calculate total users for percentages
        const totalUsers = roleDistribution.reduce((sum, r) => sum + r.count, 0);
        const roleWithPercentage = roleDistribution.map((r) => ({
            ...r,
            percentage: totalUsers > 0 ? Math.round((r.count / totalUsers) * 100) : 0,
        }));

        res.status(200).json({
            success: true,
            data: {
                roleDistribution: roleWithPercentage,
                registrationTrends,
                activeUsers: {
                    last24h: activeUsers24h,
                    last7d: activeUsers7d,
                    last30d: activeUsers30d,
                },
                recentUsers,
                totalUsers,
            },
            period: { from: start, to: end, groupBy: timeUnit },
        });
    } catch (error) {
        console.error("Error fetching users analytics:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch user analytics",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};

// ============================================================================
// PRODUCTS ANALYTICS ENDPOINT
// ============================================================================

/**
 * GET /api/v1/admin/dashboard/products
 * Returns product inventory and category analytics
 * Access: admin, super_admin
 */
export const getProductsAnalytics = async (req, res) => {
    try {
        const [categoryDistribution, stockAlerts, topProducts, productStats] = await Promise.all([
            // Category distribution
            Product.aggregate([
                {
                    $lookup: {
                        from: "categories",
                        localField: "category",
                        foreignField: "_id",
                        as: "categoryInfo",
                    },
                },
                { $unwind: { path: "$categoryInfo", preserveNullAndEmptyArrays: true } },
                {
                    $group: {
                        _id: "$category",
                        categoryName: { $first: "$categoryInfo.name" },
                        count: { $sum: 1 },
                        totalStock: { $sum: "$stock" },
                    },
                },
                { $project: { _id: 0, categoryId: "$_id", categoryName: { $ifNull: ["$categoryName", "Uncategorized"] }, count: 1, totalStock: 1 } },
                { $sort: { count: -1 } },
                { $limit: 10 },
            ]),

            // Low stock alerts (< 10 items)
            Product.find({ stock: { $lt: 10, $gte: 0 }, isActive: "1" })
                .sort({ stock: 1 })
                .limit(15)
                .select("name stock price photos category")
                .populate("category", "name"),

            // Top selling products (based on order frequency - simplified)
            Order.aggregate([
                { $unwind: "$products" },
                { $group: { _id: "$products.product", orderCount: { $sum: 1 }, totalQuantity: { $sum: "$products.quantity" } } },
                { $sort: { totalQuantity: -1 } },
                { $limit: 10 },
                {
                    $lookup: {
                        from: "products",
                        localField: "_id",
                        foreignField: "_id",
                        as: "productInfo",
                    },
                },
                { $unwind: { path: "$productInfo", preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        _id: 0,
                        productId: "$_id",
                        name: "$productInfo.name",
                        price: "$productInfo.price",
                        photo: "$productInfo.photos",
                        orderCount: 1,
                        totalQuantity: 1,
                    },
                },
            ]),

            // General product stats
            Product.aggregate([
                {
                    $group: {
                        _id: null,
                        totalProducts: { $sum: 1 },
                        activeProducts: { $sum: { $cond: [{ $eq: ["$isActive", "1"] }, 1, 0] } },
                        inactiveProducts: { $sum: { $cond: [{ $eq: ["$isActive", "0"] }, 1, 0] } },
                        totalStock: { $sum: "$stock" },
                        avgPrice: { $avg: "$price" },
                    },
                },
            ]),
        ]);

        res.status(200).json({
            success: true,
            data: {
                categoryDistribution,
                stockAlerts,
                topProducts,
                stats: productStats[0] || {
                    totalProducts: 0,
                    activeProducts: 0,
                    inactiveProducts: 0,
                    totalStock: 0,
                    avgPrice: 0,
                },
            },
        });
    } catch (error) {
        console.error("Error fetching products analytics:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch product analytics",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};

// ============================================================================
// REVENUE ANALYTICS ENDPOINT (SUPER ADMIN ONLY)
// ============================================================================

/**
 * GET /api/v1/admin/dashboard/revenue
 * Returns detailed revenue and payment analytics
 * Access: super_admin ONLY
 */
export const getRevenueAnalytics = async (req, res) => {
    try {
        const { from, to, groupBy = "day" } = req.query;
        const { start, end } = parseDateRange(from, to);
        const { prevStart, prevEnd } = getPreviousPeriod(start, end);
        const timeUnit = groupBy === "month" ? "month" : groupBy === "week" ? "week" : "day";

        const [
            revenueTrends,
            paymentStats,
            subscriptionRevenue,
            currentPeriodRevenue,
            previousPeriodRevenue,
            refundStats,
        ] = await Promise.all([
            // Revenue trends
            Order.aggregate([
                { $match: { createdAt: { $gte: start, $lte: end }, status: { $in: ["Completed", "Delivered"] } } },
                {
                    $group: {
                        _id: { $dateTrunc: { date: "$createdAt", unit: timeUnit } },
                        revenue: { $sum: "$amount" },
                        orders: { $sum: 1 },
                    },
                },
                { $project: { _id: 0, date: "$_id", revenue: 1, orders: 1 } },
                { $sort: { date: 1 } },
            ]),

            // Payment statistics
            Payment.aggregate([
                { $match: { createdAt: { $gte: start, $lte: end } } },
                {
                    $group: {
                        _id: "$status",
                        count: { $sum: 1 },
                        amount: { $sum: "$amount" },
                    },
                },
                { $project: { _id: 0, status: "$_id", count: 1, amount: 1 } },
            ]),

            // Subscription revenue
            Payment.aggregate([
                { $match: { status: "completed", createdAt: { $gte: start, $lte: end } } },
                { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
            ]),

            // Current period total
            Order.aggregate([
                { $match: { createdAt: { $gte: start, $lte: end }, status: { $in: ["Completed", "Delivered"] } } },
                { $group: { _id: null, total: { $sum: "$amount" } } },
            ]),

            // Previous period total
            Order.aggregate([
                { $match: { createdAt: { $gte: prevStart, $lte: prevEnd }, status: { $in: ["Completed", "Delivered"] } } },
                { $group: { _id: null, total: { $sum: "$amount" } } },
            ]),

            // Refund stats
            Payment.aggregate([
                { $match: { status: "refunded" } },
                { $group: { _id: null, totalRefunded: { $sum: "$refundAmount" }, count: { $sum: 1 } } },
            ]),
        ]);

        const currentTotal = currentPeriodRevenue[0]?.total || 0;
        const previousTotal = previousPeriodRevenue[0]?.total || 0;

        res.status(200).json({
            success: true,
            data: {
                trends: revenueTrends,
                paymentStats,
                subscriptionRevenue: {
                    total: subscriptionRevenue[0]?.total || 0,
                    count: subscriptionRevenue[0]?.count || 0,
                },
                summary: {
                    currentPeriod: currentTotal,
                    previousPeriod: previousTotal,
                    trend: calculateTrend(currentTotal, previousTotal),
                },
                refunds: refundStats[0] || { totalRefunded: 0, count: 0 },
            },
            period: { from: start, to: end, groupBy: timeUnit },
        });
    } catch (error) {
        console.error("Error fetching revenue analytics:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch revenue analytics",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};

// ============================================================================
// SELLERS ANALYTICS ENDPOINT
// ============================================================================

/**
 * GET /api/v1/admin/dashboard/sellers
 * Returns seller application and activity analytics
 * Access: admin, super_admin
 */
export const getSellersAnalytics = async (req, res) => {
    try {
        const { from, to, groupBy = "day" } = req.query;
        const { start, end } = parseDateRange(from, to);
        const timeUnit = groupBy === "month" ? "month" : groupBy === "week" ? "week" : "day";

        const [statusBreakdown, applicationTrends, planDistribution, pendingApplications, expiringSubscriptions] =
            await Promise.all([
                // Application status breakdown
                SellerApplication.aggregate([
                    { $group: { _id: "$status", count: { $sum: 1 } } },
                    { $project: { _id: 0, status: "$_id", count: 1 } },
                    { $sort: { count: -1 } },
                ]),

                // Application trends over time
                SellerApplication.aggregate([
                    { $match: { createdAt: { $gte: start, $lte: end } } },
                    {
                        $group: {
                            _id: { $dateTrunc: { date: "$createdAt", unit: timeUnit } },
                            count: { $sum: 1 },
                        },
                    },
                    { $project: { _id: 0, date: "$_id", count: 1 } },
                    { $sort: { date: 1 } },
                ]),

                // Plan distribution among active sellers
                SellerApplication.aggregate([
                    { $match: { status: "active" } },
                    {
                        $lookup: {
                            from: "subscriptionplans",
                            localField: "selectedPlanId",
                            foreignField: "_id",
                            as: "planInfo",
                        },
                    },
                    { $unwind: { path: "$planInfo", preserveNullAndEmptyArrays: true } },
                    {
                        $group: {
                            _id: "$selectedPlanId",
                            planName: { $first: { $ifNull: ["$planInfo.name", "Unknown Plan"] } },
                            count: { $sum: 1 },
                        },
                    },
                    { $project: { _id: 0, planId: "$_id", planName: 1, count: 1 } },
                    { $sort: { count: -1 } },
                ]),

                // Pending applications requiring action
                SellerApplication.find({ status: { $in: ["submitted", "under_review"] } })
                    .sort({ createdAt: 1 })
                    .limit(10)
                    .populate("userId", "user_fullname email_id mobile_no")
                    .select("firstName lastName businessName status createdAt"),

                // Expiring subscriptions (next 7 days)
                SellerApplication.find({
                    status: "active",
                    planExpiryDate: {
                        $gte: new Date(),
                        $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    },
                })
                    .populate("userId", "user_fullname email_id")
                    .select("businessName planExpiryDate selectedPlanSnapshot")
                    .limit(10),
            ]);

        // Calculate totals
        const totalApplications = statusBreakdown.reduce((sum, s) => sum + s.count, 0);
        const statusWithPercentage = statusBreakdown.map((s) => ({
            ...s,
            percentage: totalApplications > 0 ? Math.round((s.count / totalApplications) * 100) : 0,
        }));

        res.status(200).json({
            success: true,
            data: {
                statusBreakdown: statusWithPercentage,
                applicationTrends,
                planDistribution,
                pendingApplications,
                expiringSubscriptions,
                summary: {
                    total: totalApplications,
                    active: statusBreakdown.find((s) => s.status === "active")?.count || 0,
                    pending: statusBreakdown.filter((s) => ["submitted", "under_review"].includes(s.status)).reduce((sum, s) => sum + s.count, 0),
                },
            },
            period: { from: start, to: end, groupBy: timeUnit },
        });
    } catch (error) {
        console.error("Error fetching sellers analytics:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch seller analytics",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};

// ============================================================================
// AUDIT LOGS ENDPOINT (SUPER ADMIN ONLY)
// ============================================================================

/**
 * GET /api/v1/admin/dashboard/audit-logs
 * Returns recent admin activities from audit log
 * Access: super_admin ONLY
 */
export const getAuditLogs = async (req, res) => {
    try {
        const { from, to, action, severity, page = 1, limit = 20 } = req.query;
        const { start, end } = parseDateRange(from, to);

        // Build query filters
        const query = { createdAt: { $gte: start, $lte: end } };
        if (action) query.action = action;
        if (severity) query.severity = severity;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [logs, totalCount, actionBreakdown, severityBreakdown] = await Promise.all([
            // Paginated logs
            AuditLog.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .populate("actor", "user_fullname email_id roleString"),

            // Total count for pagination
            AuditLog.countDocuments(query),

            // Action breakdown
            AuditLog.aggregate([
                { $match: { createdAt: { $gte: start, $lte: end } } },
                { $group: { _id: "$action", count: { $sum: 1 } } },
                { $project: { _id: 0, action: "$_id", count: 1 } },
                { $sort: { count: -1 } },
                { $limit: 10 },
            ]),

            // Severity breakdown
            AuditLog.aggregate([
                { $match: { createdAt: { $gte: start, $lte: end } } },
                { $group: { _id: "$severity", count: { $sum: 1 } } },
                { $project: { _id: 0, severity: "$_id", count: 1 } },
            ]),
        ]);

        res.status(200).json({
            success: true,
            data: {
                logs,
                actionBreakdown,
                severityBreakdown,
            },
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalCount,
                pages: Math.ceil(totalCount / parseInt(limit)),
            },
            period: { from: start, to: end },
        });
    } catch (error) {
        console.error("Error fetching audit logs:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch audit logs",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};

// ============================================================================
// SYSTEM HEALTH ENDPOINT (SUPER ADMIN ONLY)
// ============================================================================

/**
 * GET /api/v1/admin/dashboard/system-health
 * Returns system health metrics
 * Access: super_admin ONLY
 */
export const getSystemHealth = async (req, res) => {
    try {
        // Check MongoDB connection state
        const dbState = mongoose.connection.readyState;
        const dbStateMap = {
            0: "disconnected",
            1: "connected",
            2: "connecting",
            3: "disconnecting",
        };

        // Get collection stats
        const collections = await mongoose.connection.db.listCollections().toArray();
        const collectionStats = await Promise.all(
            collections.slice(0, 10).map(async (col) => {
                try {
                    const stats = await mongoose.connection.db.collection(col.name).stats();
                    return {
                        name: col.name,
                        documents: stats.count,
                        size: stats.size,
                        avgDocSize: stats.avgObjSize || 0,
                    };
                } catch {
                    return { name: col.name, documents: 0, size: 0, avgDocSize: 0 };
                }
            })
        );

        // Server uptime and memory
        const uptimeSeconds = process.uptime();
        const memoryUsage = process.memoryUsage();

        res.status(200).json({
            success: true,
            data: {
                database: {
                    status: dbStateMap[dbState] || "unknown",
                    host: mongoose.connection.host,
                    name: mongoose.connection.name,
                },
                collections: collectionStats,
                server: {
                    uptime: {
                        seconds: Math.floor(uptimeSeconds),
                        formatted: `${Math.floor(uptimeSeconds / 3600)}h ${Math.floor((uptimeSeconds % 3600) / 60)}m`,
                    },
                    memory: {
                        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
                        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
                        rss: Math.round(memoryUsage.rss / 1024 / 1024),
                        unit: "MB",
                    },
                    nodeVersion: process.version,
                    environment: process.env.NODE_ENV || "development",
                },
                timestamp: new Date(),
            },
        });
    } catch (error) {
        console.error("Error fetching system health:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch system health",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};

export default {
    getOverviewStats,
    getOrdersAnalytics,
    getUsersAnalytics,
    getProductsAnalytics,
    getRevenueAnalytics,
    getSellersAnalytics,
    getAuditLogs,
    getSystemHealth,
};
