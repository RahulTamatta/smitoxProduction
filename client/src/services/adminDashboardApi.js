import axios from "axios";

const API_BASE = "/api/v1/admin/dashboard";

/**
 * Get auth token from localStorage
 */
const getToken = () => {
    const auth = localStorage.getItem("auth");
    if (auth) {
        try {
            const authData = JSON.parse(auth);
            return authData?.token || "";
        } catch {
            return "";
        }
    }
    return "";
};

/**
 * Create axios config with auth header
 */
const getConfig = (token) => ({
    headers: { Authorization: token || getToken() },
});

/**
 * GET /api/v1/admin/dashboard/overview
 * Fetch KPI summary (users, orders, products, revenue)
 * @param {Object} params - { from, to }
 * @param {string} token - Auth token (optional, will use stored token)
 */
export const getOverviewStats = async (params = {}, token = null) => {
    try {
        const res = await axios.get(`${API_BASE}/overview`, {
            params,
            ...getConfig(token),
        });
        return res.data;
    } catch (error) {
        console.error("Error fetching overview stats:", error);
        throw error.response?.data || { success: false, message: error.message };
    }
};

/**
 * GET /api/v1/admin/dashboard/orders
 * Fetch order analytics (status breakdown, trends)
 * @param {Object} params - { from, to, groupBy }
 * @param {string} token - Auth token
 */
export const getOrdersAnalytics = async (params = {}, token = null) => {
    try {
        const res = await axios.get(`${API_BASE}/orders`, {
            params,
            ...getConfig(token),
        });
        return res.data;
    } catch (error) {
        console.error("Error fetching orders analytics:", error);
        throw error.response?.data || { success: false, message: error.message };
    }
};

/**
 * GET /api/v1/admin/dashboard/users
 * Fetch user analytics (registrations, roles, activity)
 * @param {Object} params - { from, to, groupBy }
 * @param {string} token - Auth token
 */
export const getUsersAnalytics = async (params = {}, token = null) => {
    try {
        const res = await axios.get(`${API_BASE}/users`, {
            params,
            ...getConfig(token),
        });
        return res.data;
    } catch (error) {
        console.error("Error fetching users analytics:", error);
        throw error.response?.data || { success: false, message: error.message };
    }
};

/**
 * GET /api/v1/admin/dashboard/products
 * Fetch product analytics (inventory, categories, stock)
 * @param {Object} params - { from, to }
 * @param {string} token - Auth token
 */
export const getProductsAnalytics = async (params = {}, token = null) => {
    try {
        const res = await axios.get(`${API_BASE}/products`, {
            params,
            ...getConfig(token),
        });
        return res.data;
    } catch (error) {
        console.error("Error fetching products analytics:", error);
        throw error.response?.data || { success: false, message: error.message };
    }
};

/**
 * GET /api/v1/admin/dashboard/sellers
 * Fetch seller analytics (applications, active sellers)
 * @param {Object} params - { from, to, groupBy }
 * @param {string} token - Auth token
 */
export const getSellersAnalytics = async (params = {}, token = null) => {
    try {
        const res = await axios.get(`${API_BASE}/sellers`, {
            params,
            ...getConfig(token),
        });
        return res.data;
    } catch (error) {
        console.error("Error fetching sellers analytics:", error);
        throw error.response?.data || { success: false, message: error.message };
    }
};

// ============================================================================
// SUPER ADMIN ONLY ENDPOINTS
// ============================================================================

/**
 * GET /api/v1/admin/dashboard/revenue
 * Fetch revenue analytics (payments, subscriptions) - SUPER ADMIN ONLY
 * @param {Object} params - { from, to, groupBy }
 * @param {string} token - Auth token
 */
export const getRevenueAnalytics = async (params = {}, token = null) => {
    try {
        const res = await axios.get(`${API_BASE}/revenue`, {
            params,
            ...getConfig(token),
        });
        return res.data;
    } catch (error) {
        console.error("Error fetching revenue analytics:", error);
        throw error.response?.data || { success: false, message: error.message };
    }
};

/**
 * GET /api/v1/admin/dashboard/audit-logs
 * Fetch audit logs (admin activities) - SUPER ADMIN ONLY
 * @param {Object} params - { from, to, action, severity, page, limit }
 * @param {string} token - Auth token
 */
export const getAuditLogs = async (params = {}, token = null) => {
    try {
        const res = await axios.get(`${API_BASE}/audit-logs`, {
            params,
            ...getConfig(token),
        });
        return res.data;
    } catch (error) {
        console.error("Error fetching audit logs:", error);
        throw error.response?.data || { success: false, message: error.message };
    }
};

/**
 * GET /api/v1/admin/dashboard/system-health
 * Fetch system health metrics - SUPER ADMIN ONLY
 * @param {string} token - Auth token
 */
export const getSystemHealth = async (token = null) => {
    try {
        const res = await axios.get(`${API_BASE}/system-health`, getConfig(token));
        return res.data;
    } catch (error) {
        console.error("Error fetching system health:", error);
        throw error.response?.data || { success: false, message: error.message };
    }
};

/**
 * Fetch all dashboard data at once (for initial load)
 * @param {Object} params - { from, to, groupBy }
 * @param {string} token - Auth token
 * @param {boolean} isSuperAdmin - Whether to fetch super admin exclusive data
 */
export const fetchAllDashboardData = async (params = {}, token = null, isSuperAdmin = false) => {
    const promises = [
        getOverviewStats(params, token),
        getOrdersAnalytics(params, token),
        getUsersAnalytics(params, token),
        getProductsAnalytics(params, token),
        getSellersAnalytics(params, token),
    ];

    if (isSuperAdmin) {
        promises.push(
            getRevenueAnalytics(params, token),
            getAuditLogs({ ...params, limit: 10 }, token),
            getSystemHealth(token)
        );
    }

    const results = await Promise.allSettled(promises);

    return {
        overview: results[0].status === "fulfilled" ? results[0].value : null,
        orders: results[1].status === "fulfilled" ? results[1].value : null,
        users: results[2].status === "fulfilled" ? results[2].value : null,
        products: results[3].status === "fulfilled" ? results[3].value : null,
        sellers: results[4].status === "fulfilled" ? results[4].value : null,
        revenue: isSuperAdmin && results[5]?.status === "fulfilled" ? results[5].value : null,
        auditLogs: isSuperAdmin && results[6]?.status === "fulfilled" ? results[6].value : null,
        systemHealth: isSuperAdmin && results[7]?.status === "fulfilled" ? results[7].value : null,
    };
};

export default {
    getOverviewStats,
    getOrdersAnalytics,
    getUsersAnalytics,
    getProductsAnalytics,
    getSellersAnalytics,
    getRevenueAnalytics,
    getAuditLogs,
    getSystemHealth,
    fetchAllDashboardData,
};
