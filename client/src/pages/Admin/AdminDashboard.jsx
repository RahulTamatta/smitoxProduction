import { useCallback, useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AdminMenu from "../../components/Layout/AdminMenu";
import Layout from "../../components/Layout/Layout";
import { useAuth } from "../../context/auth";
import {
  fetchAllDashboardData
} from "../../services/adminDashboardApi";
import "./AdminDashboard.css";

// ============================================================================
// CONSTANTS
// ============================================================================

const STATUS_COLORS = {
  Pending: "#f59e0b",
  Confirmed: "#3b82f6",
  Dispatched: "#8b5cf6",
  Delivered: "#10b981",
  Completed: "#059669",
  Cancelled: "#ef4444",
  Rejected: "#dc2626",
  Accepted: "#06b6d4",
  "Cash on Delivery": "#f97316",
  Returned: "#ec4899",
};

const ROLE_COLORS = {
  user: "#3b82f6",
  admin: "#8b5cf6",
  seller: "#10b981",
  super_admin: "#ec4899",
};

const CHART_COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#ec4899"];

// Quick date presets
const DATE_PRESETS = [
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "Last 7 Days", value: "7d" },
  { label: "Last 30 Days", value: "30d" },
  { label: "This Month", value: "thisMonth" },
  { label: "Last Month", value: "lastMonth" },
  { label: "This Year", value: "thisYear" },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const formatCurrency = (value) => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${value?.toLocaleString("en-IN") || 0}`;
};

const formatNumber = (value) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value?.toLocaleString("en-IN") || "0";
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
};

const getDateRange = (preset) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case "today":
      return {
        from: today.toISOString().split("T")[0],
        to: today.toISOString().split("T")[0],
      };
    case "yesterday":
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        from: yesterday.toISOString().split("T")[0],
        to: yesterday.toISOString().split("T")[0],
      };
    case "7d":
      const last7 = new Date(today);
      last7.setDate(last7.getDate() - 6);
      return {
        from: last7.toISOString().split("T")[0],
        to: today.toISOString().split("T")[0],
      };
    case "30d":
      const last30 = new Date(today);
      last30.setDate(last30.getDate() - 29);
      return {
        from: last30.toISOString().split("T")[0],
        to: today.toISOString().split("T")[0],
      };
    case "thisMonth":
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        from: monthStart.toISOString().split("T")[0],
        to: today.toISOString().split("T")[0],
      };
    case "lastMonth":
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return {
        from: lastMonthStart.toISOString().split("T")[0],
        to: lastMonthEnd.toISOString().split("T")[0],
      };
    case "thisYear":
      const yearStart = new Date(now.getFullYear(), 0, 1);
      return {
        from: yearStart.toISOString().split("T")[0],
        to: today.toISOString().split("T")[0],
      };
    default:
      return {
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        to: today.toISOString().split("T")[0],
      };
  }
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const KPICard = ({ icon, iconClass, value, label, sublabel, trend, onClick }) => (
  <div className="kpi-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
    <div className="kpi-card-header">
      <div className={`kpi-card-icon ${iconClass}`}>{icon}</div>
      {trend !== undefined && trend !== null && (
        <div className={`kpi-card-trend ${trend > 0 ? "up" : trend < 0 ? "down" : "neutral"}`}>
          {trend > 0 ? "↑" : trend < 0 ? "↓" : "→"} {Math.abs(trend)}%
        </div>
      )}
    </div>
    <div className="kpi-card-value">{value}</div>
    <div className="kpi-card-label">{label}</div>
    {sublabel && <div className="kpi-card-sublabel">{sublabel}</div>}
  </div>
);

const DashboardCard = ({ title, subtitle, tooltip, children, className = "", actions, superAdminOnly = false }) => (
  <div className={`dashboard-card ${className} ${superAdminOnly ? "super-admin-section" : ""}`}>
    {superAdminOnly && <div className="super-admin-badge">Super Admin</div>}
    <div className="dashboard-card-header">
      <div>
        <div className="dashboard-card-title-wrapper">
          <h3 className="dashboard-card-title">{title}</h3>
          {tooltip && <span className="info-btn" data-tooltip={tooltip}>?</span>}
        </div>
        {subtitle && <p className="dashboard-card-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="dashboard-card-actions">{actions}</div>}
    </div>
    {children}
  </div>
);

const StatusBreakdown = ({ data = [] }) => {
  const total = data.reduce((sum, item) => sum + (item.count || 0), 0);

  return (
    <div className="status-breakdown">
      {data.map((item, index) => (
        <div key={item.status || index}>
          <div className="status-item">
            <div
              className="status-item-dot"
              style={{ background: STATUS_COLORS[item.status] || CHART_COLORS[index % CHART_COLORS.length] }}
            />
            <span className="status-item-label">{item.status}</span>
            <span className="status-item-value">{formatNumber(item.count)}</span>
          </div>
          <div className="status-item-bar">
            <div
              className="status-item-bar-fill"
              style={{
                width: `${total > 0 ? (item.count / total) * 100 : 0}%`,
                background: STATUS_COLORS[item.status] || CHART_COLORS[index % CHART_COLORS.length],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const DataTable = ({ columns, data = [], emptyMessage = "No data available" }) => (
  <div style={{ overflowX: "auto" }}>
    <table className="dashboard-table">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key}>{col.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr>
            <td colSpan={columns.length} style={{ textAlign: "center", color: "#94a3b8" }}>
              {emptyMessage}
            </td>
          </tr>
        ) : (
          data.map((row, index) => (
            <tr key={row._id || index}>
              {columns.map((col) => (
                <td key={col.key}>{col.render ? col.render(row[col.key], row) : row[col.key]}</td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

const QuickStats = ({ data }) => (
  <div className="quick-stats-row">
    <div className="quick-stat">
      <span className="quick-stat-icon">📅</span>
      <div>
        <div className="quick-stat-value">{formatNumber(data?.todayOrders || 0)}</div>
        <div className="quick-stat-label">Today's Orders</div>
      </div>
    </div>
    <div className="quick-stat">
      <span className="quick-stat-icon">💰</span>
      <div>
        <div className="quick-stat-value">{formatCurrency(data?.todayRevenue || 0)}</div>
        <div className="quick-stat-label">Today's Revenue</div>
      </div>
    </div>
    <div className="quick-stat">
      <span className="quick-stat-icon">👤</span>
      <div>
        <div className="quick-stat-value">{formatNumber(data?.newUsersToday || 0)}</div>
        <div className="quick-stat-label">New Users Today</div>
      </div>
    </div>
    <div className="quick-stat">
      <span className="quick-stat-icon">⏳</span>
      <div>
        <div className="quick-stat-value">{formatNumber(data?.pendingOrders || 0)}</div>
        <div className="quick-stat-label">Pending Orders</div>
      </div>
    </div>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const AdminDashboard = () => {
  const [auth] = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({});
  const [activePreset, setActivePreset] = useState("30d");
  const [dateRange, setDateRange] = useState(getDateRange("30d"));
  const [groupBy, setGroupBy] = useState("day");
  const [lastUpdated, setLastUpdated] = useState(null);

  // Check if user is super_admin
  const isSuperAdmin = auth?.user?.roleString === "super_admin" || auth?.user?.role === 3;

  // Handle preset selection
  const handlePresetClick = (preset) => {
    setActivePreset(preset);
    setDateRange(getDateRange(preset));
  };

  // Handle custom date change
  const handleDateChange = (field, value) => {
    setActivePreset("custom");
    setDateRange({ ...dateRange, [field]: value });
  };

  // Fetch dashboard data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = { from: dateRange.from, to: dateRange.to, groupBy };
      const result = await fetchAllDashboardData(params, auth?.token, isSuperAdmin);
      setData(result);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [auth?.token, dateRange, groupBy, isSuperAdmin]);

  useEffect(() => {
    if (auth?.token) {
      fetchData();
    }
  }, [auth?.token, fetchData]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (!auth?.token) return;
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [auth?.token, fetchData]);

  // Render loading state
  if (loading && !data.overview) {
    return (
      <Layout>
        <AdminMenu />
        <div className="admin-dashboard">
          <div className="dashboard-loading">
            <div className="dashboard-spinner" />
            <p>Loading dashboard analytics...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Render error state
  if (error && !data.overview) {
    return (
      <Layout>
        <AdminMenu />
        <div className="admin-dashboard">
          <div className="dashboard-error">
            <h3>⚠️ Error Loading Dashboard</h3>
            <p>{error}</p>
            <button onClick={fetchData}>Try Again</button>
          </div>
        </div>
      </Layout>
    );
  }

  // Extract data
  const overview = data.overview?.data || {};
  const ordersData = data.orders?.data || {};
  const usersData = data.users?.data || {};
  const productsData = data.products?.data || {};
  const sellersData = data.sellers?.data || {};
  const revenueData = data.revenue?.data || {};
  const auditData = data.auditLogs?.data || {};
  const healthData = data.systemHealth?.data || {};

  // Quick stats for today
  const quickStats = {
    todayOrders: overview.orders?.today || 0,
    todayRevenue: overview.revenue?.today || 0,
    newUsersToday: overview.users?.today || 0,
    pendingOrders: overview.orders?.pending || 0,
  };

  return (
    <Layout>
      <AdminMenu />
      <div className="admin-dashboard">
        <div className="admin-dashboard-container">
          {/* Header */}
          <div className="dashboard-header">
            <div className="dashboard-header-content">
              <h1>📊 Analytics Dashboard</h1>
              <p>
                Welcome back, {auth?.user?.user_fullname || "Admin"} •{" "}
                {isSuperAdmin ? "Super Admin Access" : "Admin Access"}
                {lastUpdated && (
                  <span className="last-updated">
                    {" "}• Last updated: {lastUpdated.toLocaleTimeString("en-IN")}
                  </span>
                )}
              </p>
            </div>
            <div className="dashboard-header-actions">
              <button className="dashboard-refresh-btn" onClick={fetchData} disabled={loading}>
                {loading ? "⏳ Loading..." : "🔄 Refresh"}
              </button>
            </div>
          </div>

          {/* Quick Date Presets */}
          <div className="date-presets-container">
            <div className="date-presets">
              {DATE_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  className={`date-preset-btn ${activePreset === preset.value ? "active" : ""}`}
                  onClick={() => handlePresetClick(preset.value)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <div className="custom-date-range">
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => handleDateChange("from", e.target.value)}
              />
              <span>to</span>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => handleDateChange("to", e.target.value)}
              />
            </div>
          </div>

          {/* Quick Stats Row */}
          <QuickStats data={quickStats} />

          {/* KPI Cards */}
          <div className="kpi-grid">
            <KPICard
              icon="👥"
              iconClass="users"
              value={formatNumber(overview.users?.total || 0)}
              label="Total Users"
              sublabel={`${overview.users?.new || 0} new this period`}
              trend={overview.users?.trend}
            />
            <KPICard
              icon="📦"
              iconClass="orders"
              value={formatNumber(overview.orders?.total || 0)}
              label="Total Orders"
              sublabel={`${overview.orders?.pending || 0} pending`}
              trend={overview.orders?.trend}
            />
            <KPICard
              icon="🏷️"
              iconClass="products"
              value={formatNumber(overview.products?.total || 0)}
              label="Total Products"
              sublabel={`${overview.products?.lowStock || 0} low stock`}
            />
            <KPICard
              icon="💰"
              iconClass="revenue"
              value={formatCurrency(overview.revenue?.total || 0)}
              label="Period Revenue"
              sublabel={`All-time: ${formatCurrency(overview.revenue?.allTime || 0)}`}
              trend={overview.revenue?.trend}
            />
            <KPICard
              icon="🏪"
              iconClass="sellers"
              value={formatNumber(overview.sellers?.active || 0)}
              label="Active Sellers"
              sublabel={`${overview.sellers?.pending || 0} pending review`}
            />
          </div>

          {/* ============ ORDERS SECTION ============ */}
          <div className="dashboard-section">
            <h2 className="dashboard-section-title"><span>📦</span> Orders Analytics</h2>
            <div className="dashboard-grid-2col">
              {/* Order Trends Chart */}
              <DashboardCard
                title="Order Trends"
                subtitle="Orders and revenue over time"
                tooltip="Track daily/weekly/monthly order volume and revenue trends"
                className="span-2"
                actions={
                  <>
                    <button className={groupBy === "day" ? "active" : ""} onClick={() => setGroupBy("day")}>
                      Day
                    </button>
                    <button className={groupBy === "week" ? "active" : ""} onClick={() => setGroupBy("week")}>
                      Week
                    </button>
                    <button className={groupBy === "month" ? "active" : ""} onClick={() => setGroupBy("month")}>
                      Month
                    </button>
                  </>
                }
              >
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={ordersData.trends || []}>
                      <defs>
                        <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 12 }} />
                      <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                      <YAxis yAxisId="right" orientation="right" tickFormatter={formatCurrency} tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(value, name) =>
                          name === "Revenue" ? formatCurrency(value) : formatNumber(value)
                        }
                        labelFormatter={formatDate}
                      />
                      <Legend />
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="count"
                        name="Orders"
                        stroke="#4f46e5"
                        fill="url(#colorOrders)"
                      />
                      <Area
                        yAxisId="right"
                        type="monotone"
                        dataKey="revenue"
                        name="Revenue"
                        stroke="#10b981"
                        fill="url(#colorRevenue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </DashboardCard>

              {/* Order Status Breakdown */}
              <DashboardCard title="Order Status" subtitle="Current order distribution" tooltip="Breakdown of orders by their current fulfillment status">
                <StatusBreakdown data={ordersData.statusBreakdown || []} />
              </DashboardCard>

              {/* Recent Orders Summary */}
              <DashboardCard title="Recent Activity" subtitle="Quick order stats">
                <div className="recent-stats-grid">
                  <div className="recent-stat">
                    <div className="recent-stat-value text-warning">{formatNumber(ordersData.statusBreakdown?.find(s => s.status === "Pending")?.count || 0)}</div>
                    <div className="recent-stat-label">Pending</div>
                  </div>
                  <div className="recent-stat">
                    <div className="recent-stat-value text-info">{formatNumber(ordersData.statusBreakdown?.find(s => s.status === "Confirmed")?.count || 0)}</div>
                    <div className="recent-stat-label">Confirmed</div>
                  </div>
                  <div className="recent-stat">
                    <div className="recent-stat-value text-purple">{formatNumber(ordersData.statusBreakdown?.find(s => s.status === "Dispatched")?.count || 0)}</div>
                    <div className="recent-stat-label">Dispatched</div>
                  </div>
                  <div className="recent-stat">
                    <div className="recent-stat-value text-success">{formatNumber(ordersData.statusBreakdown?.find(s => s.status === "Delivered")?.count || 0)}</div>
                    <div className="recent-stat-label">Delivered</div>
                  </div>
                </div>
              </DashboardCard>
            </div>
          </div>

          {/* ============ USERS SECTION ============ */}
          <div className="dashboard-section">
            <h2 className="dashboard-section-title"><span>👥</span> User Analytics</h2>
            <div className="dashboard-grid-2col">
              {/* User Registrations */}
              <DashboardCard title="User Registrations" subtitle="New users over time" tooltip="New user signups during the selected date range">
                <div className="chart-container small">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={usersData.registrationTrends || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip labelFormatter={formatDate} />
                      <Bar dataKey="count" name="Registrations" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </DashboardCard>

              {/* Role Distribution */}
              <DashboardCard title="User Roles" subtitle="Distribution by role" tooltip="Percentage breakdown of users by account type">
                <div className="chart-container small">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={usersData.roleDistribution || []}
                        dataKey="count"
                        nameKey="role"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ role, percentage }) => `${role} (${percentage}%)`}
                      >
                        {(usersData.roleDistribution || []).map((entry, index) => (
                          <Cell key={entry.role} fill={ROLE_COLORS[entry.role] || CHART_COLORS[index]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatNumber(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </DashboardCard>

              {/* Active Users */}
              <DashboardCard title="Active Users" subtitle="User activity metrics" tooltip="Users who logged in within the specified time periods" className="span-2">
                <div className="active-users-grid">
                  <div className="active-user-stat">
                    <div className="active-user-count">{formatNumber(usersData.activeUsers?.last24h || 0)}</div>
                    <div className="active-user-label">Last 24 Hours</div>
                  </div>
                  <div className="active-user-stat">
                    <div className="active-user-count">{formatNumber(usersData.activeUsers?.last7d || 0)}</div>
                    <div className="active-user-label">Last 7 Days</div>
                  </div>
                  <div className="active-user-stat">
                    <div className="active-user-count">{formatNumber(usersData.activeUsers?.last30d || 0)}</div>
                    <div className="active-user-label">Last 30 Days</div>
                  </div>
                </div>
              </DashboardCard>
            </div>
          </div>

          {/* ============ PRODUCTS SECTION ============ */}
          <div className="dashboard-section">
            <h2 className="dashboard-section-title"><span>🏷️</span> Product Analytics</h2>
            <div className="dashboard-grid-2col">
              {/* Top Products */}
              <DashboardCard title="Top Selling Products" subtitle="By order quantity" tooltip="Most ordered products ranked by total units sold">
                <DataTable
                  columns={[
                    { key: "name", label: "Product", render: (v) => (v?.substring(0, 30) || "-") + (v?.length > 30 ? "..." : "") },
                    { key: "totalQuantity", label: "Qty", render: (v) => formatNumber(v) },
                  ]}
                  data={(productsData.topProducts || []).slice(0, 5)}
                  emptyMessage="No product data"
                />
              </DashboardCard>

              {/* Low Stock Alerts */}
              <DashboardCard title="⚠️ Low Stock Alerts" subtitle="Products running low" tooltip="Products with inventory below 10 units that need restocking">
                <div className="stock-alert-list">
                  {(productsData.stockAlerts || []).slice(0, 5).map((product, index) => (
                    <div key={product._id || index} className="stock-alert-item">
                      <img
                        src={product.photos || "/placeholder-product.png"}
                        alt={product.name}
                        className="stock-alert-image"
                        onError={(e) => {
                          if (e.target.src !== window.location.origin + "/placeholder-product.png" && e.target.src !== "/placeholder-product.png") {
                            e.target.src = "/placeholder-product.png";
                          }
                        }}
                      />
                      <div className="stock-alert-info">
                        <div className="stock-alert-name">{product.name?.substring(0, 25)}...</div>
                        <div className="stock-alert-stock">Only {product.stock} left</div>
                      </div>
                    </div>
                  ))}
                  {(!productsData.stockAlerts || productsData.stockAlerts.length === 0) && (
                    <p style={{ color: "#94a3b8", textAlign: "center", padding: "20px" }}>
                      No low stock items 🎉
                    </p>
                  )}
                </div>
              </DashboardCard>
            </div>
          </div>

          {/* ============ SELLERS SECTION ============ */}
          <div className="dashboard-section">
            <h2 className="dashboard-section-title"><span>🏪</span> Seller Analytics</h2>
            <div className="dashboard-grid-2col">
              {/* Seller Applications */}
              <DashboardCard title="Seller Applications" subtitle="Application status breakdown" tooltip="Overview of seller onboarding applications by status">
                <StatusBreakdown data={sellersData.statusBreakdown || []} />
              </DashboardCard>

              {/* Pending Applications */}
              <DashboardCard title="Pending Review" subtitle="Applications requiring action" tooltip="Seller applications awaiting admin approval or action">
                <DataTable
                  columns={[
                    { key: "businessName", label: "Business", render: (v) => v || "-" },
                    { key: "firstName", label: "Contact", render: (v, row) => `${v || ""} ${row.lastName || ""}`.trim() || "-" },
                    {
                      key: "status",
                      label: "Status",
                      render: (v) => <span className={`status-badge ${v}`}>{v?.replace("_", " ")}</span>,
                    },
                  ]}
                  data={(sellersData.pendingApplications || []).slice(0, 5)}
                  emptyMessage="No pending applications"
                />
              </DashboardCard>
            </div>
          </div>

          {/* ============ SUPER ADMIN ONLY SECTIONS ============ */}
          {isSuperAdmin && (
            <div className="dashboard-section">
              <h2 className="dashboard-section-title"><span>👑</span> Super Admin Only</h2>
              <div className="dashboard-grid-2col">
                {/* Revenue Analytics */}
                <DashboardCard
                  title="💰 Revenue Analytics"
                  subtitle="Detailed financial overview"
                  tooltip="Complete payment and revenue trends over time"
                  superAdminOnly
                  className="span-2"
                >
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueData.trends || []}>
                        <defs>
                          <linearGradient id="colorRevenueMain" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 12 }} />
                        <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(value) => formatCurrency(value)} labelFormatter={formatDate} />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          name="Revenue"
                          stroke="#f59e0b"
                          fill="url(#colorRevenueMain)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </DashboardCard>

                {/* Revenue Summary */}
                <DashboardCard title="Revenue Summary" subtitle="Period comparison" tooltip="Compare revenue between current and previous periods" superAdminOnly>
                  <div className="system-health-grid">
                    <div className="health-stat">
                      <div className="health-stat-label">This Period</div>
                      <div className="health-stat-value">{formatCurrency(revenueData.summary?.currentPeriod || 0)}</div>
                    </div>
                    <div className="health-stat">
                      <div className="health-stat-label">Previous Period</div>
                      <div className="health-stat-value">{formatCurrency(revenueData.summary?.previousPeriod || 0)}</div>
                    </div>
                    <div className="health-stat">
                      <div className="health-stat-label">Subscription Revenue</div>
                      <div className="health-stat-value">{formatCurrency(revenueData.subscriptionRevenue?.total || 0)}</div>
                    </div>
                    <div className="health-stat">
                      <div className="health-stat-label">Total Refunds</div>
                      <div className="health-stat-value">{formatCurrency(revenueData.refunds?.totalRefunded || 0)}</div>
                    </div>
                  </div>
                </DashboardCard>

                {/* System Health */}
                <DashboardCard title="🖥️ System Health" subtitle="Server status" tooltip="Real-time server metrics and database status" superAdminOnly>
                  <div className="system-health-grid">
                    <div className="health-stat">
                      <div className="health-stat-label">Database</div>
                      <div className={`health-stat-value ${healthData.database?.status === "connected" ? "connected" : ""}`}>
                        {healthData.database?.status || "-"}
                      </div>
                    </div>
                    <div className="health-stat">
                      <div className="health-stat-label">Uptime</div>
                      <div className="health-stat-value">{healthData.server?.uptime?.formatted || "-"}</div>
                    </div>
                    <div className="health-stat">
                      <div className="health-stat-label">Memory (Heap)</div>
                      <div className="health-stat-value">
                        {healthData.server?.memory?.heapUsed || 0}/{healthData.server?.memory?.heapTotal || 0} MB
                      </div>
                    </div>
                    <div className="health-stat">
                      <div className="health-stat-label">Node Version</div>
                      <div className="health-stat-value">{healthData.server?.nodeVersion || "-"}</div>
                    </div>
                  </div>
                </DashboardCard>

                {/* Audit Logs */}
                <DashboardCard title="🔒 Audit Logs" subtitle="Recent admin activities" tooltip="Security log of admin actions and system events" superAdminOnly>
                  <DataTable
                    columns={[
                      { key: "action", label: "Action" },
                      { key: "resourceType", label: "Resource" },
                      { key: "actor", label: "Actor", render: (v) => v?.user_fullname || v?.email_id || "-" },
                      {
                        key: "severity",
                        label: "Severity",
                        render: (v) => <span className={`status-badge ${v}`}>{v}</span>,
                      },
                    ]}
                    data={(auditData.logs || []).slice(0, 8)}
                    emptyMessage="No audit logs found"
                  />
                </DashboardCard>
              </div>
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
