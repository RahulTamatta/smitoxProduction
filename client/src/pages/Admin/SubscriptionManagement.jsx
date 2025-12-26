import axios from "axios";
import { Check, CheckCircle, Clock, Edit2, Eye, Plus, Search, Trash2, X, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";
import AdminMenu from "../../components/Layout/AdminMenu";
import Layout from "../../components/Layout/Layout";
import { useAuth } from "../../context/auth";
import { getSubscriptionsAnalytics } from "../../services/analyticsApi";
import { hasCap } from "../../utils/rbacHelper";
import "./subscriptionManagement.css";

const SubscriptionManagement = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [auth] = useAuth();
  const activeTab = searchParams.get("tab") || "all";

  const [plans, setPlans] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);

  // Analytics tab local state
  const [analyticsTotals, setAnalyticsTotals] = useState(null);
  const [appliedList, setAppliedList] = useState([]);
  const [approvedList, setApprovedList] = useState([]);
  const [activeList, setActiveList] = useState([]);
  const [fromDate, setFromDate] = useState(() => new Date(Date.now() - 29 * 24 * 3600 * 1000).toISOString().slice(0, 10));
  const [toDate, setToDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [groupBy, setGroupBy] = useState("day");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    billingCycle: "monthly",
    includedCapabilities: [],
    excludedCapabilities: [],
    isActive: true,
    isFree: false,
  });

  const allCapabilities = [
    "products:read",
    "products:write",
    "products:delete",
    "orders:read",
    "orders:write",
    "orders:delete",
    "orders:status",
    "users:read",
    "users:write",
    "categories:read",
    "categories:write",
    "banners:read",
    "banners:write",
    "analytics:read",
    "settings:read",
    "settings:write",
    "subscriptions:read",
    "subscriptions:write",
    "subscriptions:delete",
    "subscriptions:toggle",
    "sellers:applications:read",
    "sellers:applications:approve",
    "sellers:applications:reject",
  ];

  // Fetch subscription plans
  const fetchPlans = async () => {
    try {
      setLoading(true);
      console.log("Fetching plans from:", `/api/v1/subscription-plans/admin/list`);
      const response = await axios.get(
        `/api/v1/subscription-plans/admin/list`,
        {
          headers: {
            Authorization: auth?.token,
          },
        }
      );
      console.log("Plans response:", response.data);
      if (response.data.success) {
        setPlans(response.data.plans || []);
      } else if (Array.isArray(response.data)) {
        setPlans(response.data);
      } else if (response.data.data && Array.isArray(response.data.data)) {
        setPlans(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
      console.error("Error response:", error.response?.data);
      toast.error("Failed to fetch plans");
    } finally {
      setLoading(false);
    }
  };

  // --- Analytics helpers ---
  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const data = await getSubscriptionsAnalytics({ from: fromDate, to: toDate, groupBy }, auth?.token);
      if (data?.success) setAnalyticsTotals(data.totals || null);
      else setAnalyticsTotals(null);
    } catch (err) {
      console.error("Analytics fetch error:", err.response?.data || err.message);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchAppliedList = async () => {
    try {
      const res = await axios.get(`/api/v1/sellers`, {
        params: { status: "submitted", limit: 20, sort: "-createdAt" },
        headers: { Authorization: auth?.token },
      });
      setAppliedList(res.data?.applications || []);
    } catch (err) {
      console.error("Applied list error:", err.response?.data || err.message);
      setAppliedList([]);
    }
  };

  const fetchApprovedList = async () => {
    try {
      // Fetch both approved and approved_pending_payment
      const [approved, pending] = await Promise.all([
        axios.get(`/api/v1/sellers`, { params: { status: "approved", limit: 20, sort: "-reviewedAt" }, headers: { Authorization: auth?.token } }),
        axios.get(`/api/v1/sellers`, { params: { status: "approved_pending_payment", limit: 20, sort: "-reviewedAt" }, headers: { Authorization: auth?.token } }),
      ]);
      setApprovedList([...(approved.data?.applications || []), ...(pending.data?.applications || [])]);
    } catch (err) {
      console.error("Approved list error:", err.response?.data || err.message);
      setApprovedList([]);
    }
  };

  const fetchActiveList = async () => {
    try {
      const res = await axios.get(`/api/v1/sellers`, {
        params: { status: "active", limit: 20, sort: "-planStartDate" },
        headers: { Authorization: auth?.token },
      });
      setActiveList(res.data?.applications || []);
    } catch (err) {
      console.error("Active list error:", err.response?.data || err.message);
      setActiveList([]);
    }
  };

  // Fetch seller applications
  const fetchApplications = async () => {
    try {
      setLoading(true);
      console.log("Auth token:", auth?.token);
      console.log("Fetching from:", `/api/v1/sellers`);

      const response = await axios.get(
        `/api/v1/sellers`,
        {
          headers: {
            Authorization: auth?.token,
          },
        }
      );

      console.log("Applications response status:", response.status);
      console.log("Applications response data:", response.data);
      console.log("Applications response full:", response);

      if (response.data.success) {
        console.log("Setting applications:", response.data.applications);
        setApplications(response.data.applications || []);
      } else {
        // If response doesn't have success flag, try accessing data directly
        if (Array.isArray(response.data)) {
          console.log("Response is array, setting:", response.data);
          setApplications(response.data);
        } else if (response.data.data && Array.isArray(response.data.data)) {
          console.log("Response.data.data is array, setting:", response.data.data);
          setApplications(response.data.data);
        } else {
          console.log("No valid applications data found in response");
        }
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
      console.error("Error status:", error.response?.status);
      console.error("Error data:", error.response?.data);
      console.error("Error message:", error.message);
      toast.error(`Failed to fetch seller applications: ${error.response?.status || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
    if (activeTab === "subscriptions") {
      fetchApplications();
    } else if (activeTab === "analytics") {
      fetchAnalytics();
      fetchAppliedList();
      fetchApprovedList();
      fetchActiveList();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle capability toggle
  const handleCapabilityToggle = (capability, type) => {
    setFormData((prev) => {
      const field = type === "included" ? "includedCapabilities" : "excludedCapabilities";
      const current = prev[field];
      const updated = current.includes(capability)
        ? current.filter((c) => c !== capability)
        : [...current, capability];
      return { ...prev, [field]: updated };
    });
  };

  // Create or update plan
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      if (!formData.name.trim()) {
        toast.error("Plan name is required");
        return;
      }

      const url = editingId
        ? `/api/v1/subscription-plans/${editingId}`
        : `/api/v1/subscription-plans`;

      const method = editingId ? "put" : "post";

      const response = await axios[method](url, formData, {
        headers: {
          Authorization: auth?.token,
        },
      });

      if (response.data.success) {
        toast.success(editingId ? "Plan updated successfully" : "Plan created successfully");
        setShowForm(false);
        setEditingId(null);
        setFormData({
          name: "",
          description: "",
          price: 0,
          billingCycle: "monthly",
          includedCapabilities: [],
          excludedCapabilities: [],
          isActive: true,
          isFree: false,
        });
        fetchPlans();
      }
    } catch (error) {
      console.error("Error saving plan:", error);
      toast.error(error.response?.data?.message || "Failed to save plan");
    } finally {
      setLoading(false);
    }
  };

  // Edit plan
  const handleEdit = (plan) => {
    setFormData({
      name: plan.name,
      description: plan.description,
      price: plan.price,
      billingCycle: plan.billingCycle,
      includedCapabilities: plan.includedCapabilities || [],
      excludedCapabilities: plan.excludedCapabilities || [],
      isActive: plan.isActive,
      isFree: plan.isFree,
    });
    setEditingId(plan._id);
    setShowForm(true);
  };

  // Delete plan
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this plan?")) return;

    try {
      setLoading(true);
      const response = await axios.delete(
        `/api/v1/subscription-plans/${id}`,
        {
          headers: {
            Authorization: auth?.token,
          },
        }
      );

      if (response.data.success) {
        toast.success("Plan deleted successfully");
        fetchPlans();
      }
    } catch (error) {
      console.error("Error deleting plan:", error);
      toast.error(error.response?.data?.message || "Failed to delete plan");
    } finally {
      setLoading(false);
    }
  };

  // Toggle plan status
  const handleToggleStatus = async (id, currentStatus) => {
    try {
      setLoading(true);
      const response = await axios.put(
        `/api/v1/subscription-plans/${id}/toggle`,
        {},
        {
          headers: {
            Authorization: auth?.token,
          },
        }
      );

      if (response.data.success) {
        toast.success(currentStatus ? "Plan deactivated" : "Plan activated");
        fetchPlans();
      }
    } catch (error) {
      console.error("Error toggling plan status:", error);
      toast.error(error.response?.data?.message || "Failed to toggle plan status");
    } finally {
      setLoading(false);
    }
  };

  // Admin: Approve selected seller application
  const approveSelectedApplication = async () => {
    if (!selectedApplication?._id) return;
    try {
      setLoading(true);
      const res = await axios.post(
        `/api/v1/sellers/${selectedApplication._id}/approve`,
        { reviewerNotes: "Approved" },
        { headers: { Authorization: auth?.token } }
      );
      toast.success(res.data?.message || "Application approved successfully");
      setShowApplicationModal(false);
      await fetchApplications();
    } catch (err) {
      console.error("Approve application error:", err.response?.data || err);
      toast.error(err.response?.data?.message || "Failed to approve application");
    } finally {
      setLoading(false);
    }
  };

  // Admin: Reject selected seller application
  const rejectSelectedApplication = async () => {
    if (!selectedApplication?._id) return;
    try {
      setLoading(true);
      const res = await axios.post(
        `/api/v1/sellers/${selectedApplication._id}/reject`,
        { reason: "Application rejected by admin" },
        { headers: { Authorization: auth?.token } }
      );
      toast.success(res.data?.message || "Application rejected successfully");
      setShowApplicationModal(false);
      await fetchApplications();
    } catch (err) {
      console.error("Reject application error:", err.response?.data || err);
      toast.error(err.response?.data?.message || "Failed to reject application");
    } finally {
      setLoading(false);
    }
  };

  // Filter plans based on tab
  const getFilteredPlans = () => {
    let filtered = plans;

    if (activeTab === "active") {
      filtered = filtered.filter((p) => p.isActive);
    } else if (activeTab === "inactive") {
      filtered = filtered.filter((p) => !p.isActive);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredPlans = getFilteredPlans();

  return (
    <Layout>
      <AdminMenu />
      <div className="container-fluid dashboard">
        <div className="row">
          <div className="col-md-12">
            {/* Header */}
            <div className="admin-page-header">
              <div>
                <h1 className="admin-page-title">Subscription Management</h1>
                <p className="admin-page-subtitle">
                  Create, manage, and monitor subscription plans
                </p>
              </div>
              {!showForm && activeTab !== "analytics" && (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setShowForm(true);
                    setEditingId(null);
                    setFormData({
                      name: "",
                      description: "",
                      price: 0,
                      billingCycle: "monthly",
                      includedCapabilities: [],
                      excludedCapabilities: [],
                      isActive: true,
                      isFree: false,
                    });
                  }}
                >
                  <Plus size={18} /> New Plan
                </button>
              )}
            </div>

            {/* Tabs */}
            <div className="subscription-tabs">
              <button
                className={`tab-button ${activeTab === "all" ? "active" : ""}`}
                onClick={() => setSearchParams({ tab: "all" })}
              >
                All Plans
              </button>
              <button
                className={`tab-button ${activeTab === "active" ? "active" : ""}`}
                onClick={() => setSearchParams({ tab: "active" })}
              >
                Active
              </button>
              <button
                className={`tab-button ${activeTab === "inactive" ? "active" : ""}`}
                onClick={() => setSearchParams({ tab: "inactive" })}
              >
                Inactive
              </button>
              <button
                className={`tab-button ${activeTab === "subscriptions" ? "active" : ""}`}
                onClick={() => setSearchParams({ tab: "subscriptions" })}
              >
                Subscriptions
              </button>
              <button
                className={`tab-button ${activeTab === "analytics" ? "active" : ""}`}
                onClick={() => setSearchParams({ tab: "analytics" })}
              >
                Analytics
              </button>
            </div>

            {/* Form */}
            {showForm && (
              <div className="subscription-form-container">
                <div className="subscription-form">
                  <h3>{editingId ? "Edit Plan" : "Create New Plan"}</h3>

                  <form onSubmit={handleSubmit}>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Plan Name *</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="e.g., Professional Plan"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Price (₹)</label>
                        <input
                          type="number"
                          name="price"
                          value={formData.price}
                          onChange={handleInputChange}
                          placeholder="0"
                          min="0"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Billing Cycle</label>
                        <select
                          name="billingCycle"
                          value={formData.billingCycle}
                          onChange={handleInputChange}
                        >
                          <option value="monthly">Monthly</option>
                          <option value="quarterly">Quarterly</option>
                          <option value="yearly">Yearly</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>
                          <input
                            type="checkbox"
                            name="isFree"
                            checked={formData.isFree}
                            onChange={handleInputChange}
                          />
                          Free Plan
                        </label>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Description</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Plan description"
                        rows="3"
                      />
                    </div>

                    <div className="capabilities-section">
                      <h4>Included Capabilities</h4>
                      <div className="capabilities-grid">
                        {allCapabilities.map((cap) => (
                          <label key={`inc-${cap}`} className="capability-checkbox">
                            <input
                              type="checkbox"
                              checked={formData.includedCapabilities.includes(cap)}
                              onChange={() => handleCapabilityToggle(cap, "included")}
                            />
                            {cap}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="capabilities-section">
                      <h4>Excluded Capabilities</h4>
                      <div className="capabilities-grid">
                        {allCapabilities.map((cap) => (
                          <label key={`exc-${cap}`} className="capability-checkbox">
                            <input
                              type="checkbox"
                              checked={formData.excludedCapabilities.includes(cap)}
                              onChange={() => handleCapabilityToggle(cap, "excluded")}
                            />
                            {cap}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="form-actions">
                      <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? "Saving..." : editingId ? "Update Plan" : "Create Plan"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          setShowForm(false);
                          setEditingId(null);
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Search and List */}
            {!showForm && (
              <>
                <div className="subscription-search">
                  <Search size={18} />
                  <input
                    type="text"
                    placeholder="Search plans..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {loading && <div className="loading">Loading plans...</div>}

                {!loading && filteredPlans.length === 0 ? (
                  <div className="empty-state">
                    <p>No plans found</p>
                  </div>
                ) : (
                  <div className="subscription-list">
                    {filteredPlans.map((plan) => (
                      <div key={plan._id} className="subscription-card">
                        <div className="card-header">
                          <div>
                            <h4>{plan.name}</h4>
                            <p className="card-meta">
                              {plan.isFree ? "Free Plan" : `₹${plan.price}/${plan.billingCycle}`}
                            </p>
                          </div>
                          <div className="card-status">
                            <span className={`badge ${plan.isActive ? "active" : "inactive"}`}>
                              {plan.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </div>

                        <div className="card-body">
                          <p className="description">{plan.description}</p>

                          <div className="capabilities-info">
                            <div className="capability-group">
                              <h5>Included ({plan.includedCapabilities?.length || 0})</h5>
                              <div className="capability-tags">
                                {plan.includedCapabilities?.slice(0, 3).map((cap) => (
                                  <span key={cap} className="tag included">
                                    <Check size={12} /> {cap}
                                  </span>
                                ))}
                                {plan.includedCapabilities?.length > 3 && (
                                  <span className="tag more">
                                    +{plan.includedCapabilities.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="capability-group">
                              <h5>Excluded ({plan.excludedCapabilities?.length || 0})</h5>
                              <div className="capability-tags">
                                {plan.excludedCapabilities?.slice(0, 3).map((cap) => (
                                  <span key={cap} className="tag excluded">
                                    <X size={12} /> {cap}
                                  </span>
                                ))}
                                {plan.excludedCapabilities?.length > 3 && (
                                  <span className="tag more">
                                    +{plan.excludedCapabilities.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="card-actions">
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={() => handleEdit(plan)}
                          >
                            <Edit2 size={16} /> Edit
                          </button>
                          <button
                            className={`btn btn-sm ${plan.isActive ? "btn-warning" : "btn-success"}`}
                            onClick={() => handleToggleStatus(plan._id, plan.isActive)}
                          >
                            {plan.isActive ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(plan._id)}
                          >
                            <Trash2 size={16} /> Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Subscriptions Tab - Seller Applications */}
            {activeTab === "subscriptions" && (
              <>
                <div className="subscription-search">
                  <Search size={18} />
                  <input
                    type="text"
                    placeholder="Search by seller name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {loading && <div className="loading">Loading seller applications...</div>}

                {!loading && applications.length === 0 ? (
                  <div className="empty-state">
                    <p>No seller applications found</p>
                  </div>
                ) : (
                  <div className="applications-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Seller Name</th>
                          <th>Email</th>
                          <th>Plan</th>
                          <th>Status</th>
                          <th>Applied Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {applications
                          .filter(
                            (app) =>
                              app.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              app.email?.toLowerCase().includes(searchTerm.toLowerCase())
                          )
                          .map((app) => (
                            <tr key={app._id}>
                              <td>
                                <strong>
                                  {app.firstName} {app.lastName}
                                </strong>
                                <div style={{ fontSize: "0.85em", color: "#888", marginTop: "2px" }}>
                                  User: {app.userId?.user_fullname || "N/A"}
                                </div>
                              </td>
                              <td>{app.email}</td>
                              <td>
                                <span className="plan-badge">
                                  {app.selectedPlanSnapshot
                                    ? app.selectedPlanSnapshot.name
                                    : (app.selectedPlanId
                                      ? (typeof app.selectedPlanId === 'object'
                                        ? app.selectedPlanId.name
                                        : app.selectedPlanId)
                                      : "No Plan")}
                                </span>
                              </td>
                              <td>
                                <span
                                  className={`status-badge status-${app.status}`}
                                >
                                  {app.status === "draft" && (
                                    <>
                                      <Clock size={14} /> Draft
                                    </>
                                  )}
                                  {app.status === "submitted" && (
                                    <>
                                      <Clock size={14} /> Pending Review
                                    </>
                                  )}
                                  {app.status === "under_review" && (
                                    <>
                                      <Clock size={14} /> Under Review
                                    </>
                                  )}
                                  {app.status === "approved_pending_payment" && (
                                    <>
                                      <Clock size={14} /> Approved (Pending Payment)
                                    </>
                                  )}
                                  {app.status === "active" && (
                                    <>
                                      <CheckCircle size={14} /> Active
                                    </>
                                  )}
                                  {app.status === "rejected" && (
                                    <>
                                      <XCircle size={14} /> Rejected
                                    </>
                                  )}
                                </span>
                              </td>
                              <td>
                                {new Date(app.createdAt).toLocaleDateString()}
                              </td>
                              <td className="actions-cell">
                                <button
                                  className="btn btn-sm btn-outline"
                                  onClick={() => {
                                    setSelectedApplication(app);
                                    setShowApplicationModal(true);
                                  }}
                                >
                                  <Eye size={16} /> View
                                </button>
                                {app.status === "submitted" && (
                                  <>
                                    <button
                                      className="btn btn-sm btn-success"
                                      onClick={() => {
                                        console.log("Row Approve clicked for:", app._id);
                                        setSelectedApplication(app);
                                        approveSelectedApplication();
                                      }}
                                      disabled={loading}
                                      style={{ marginLeft: 8 }}
                                    >
                                      Approve
                                    </button>
                                    <button
                                      className="btn btn-sm btn-danger"
                                      onClick={() => {
                                        console.log("Row Reject clicked for:", app._id);
                                        setSelectedApplication(app);
                                        rejectSelectedApplication();
                                      }}
                                      disabled={loading}
                                      style={{ marginLeft: 6 }}
                                    >
                                      Reject
                                    </button>
                                  </>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* Analytics Tab */}
            {activeTab === "analytics" && (
              <>
                {/* Capability notices */}
                {!hasCap(auth?.token, "analytics:read") && (
                  <div className="alert alert-warning" role="alert" style={{ marginBottom: 12 }}>
                    Your account lacks <strong>analytics:read</strong>. Totals may fail to load.
                  </div>
                )}
                {!hasCap(auth?.token, "sellers:applications:read") && (
                  <div className="alert alert-warning" role="alert" style={{ marginBottom: 12 }}>
                    Your account lacks <strong>sellers:applications:read</strong>. Lists may be empty.
                  </div>
                )}

                {/* Filters */}
                <div className="subscription-form-container">
                  <div className="subscription-form">
                    <h3>Analytics Filters</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                      <div className="form-group">
                        <label>From</label>
                        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>To</label>
                        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Group By</label>
                        <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
                          <option value="day">Day</option>
                          <option value="week">Week</option>
                          <option value="month">Month</option>
                        </select>
                      </div>
                      <div className="form-group" style={{ alignSelf: "flex-end" }}>
                        <button className="btn btn-primary" onClick={fetchAnalytics} disabled={analyticsLoading} style={{ width: "100%" }}>
                          {analyticsLoading ? "Loading..." : "Apply"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* KPI Cards */}
                <div className="subscription-list" style={{ marginTop: 24 }}>
                  <div className="subscription-card">
                    <div className="card-header"><h4>Applied (distinct)</h4></div>
                    <div className="card-body"><h2>{analyticsTotals?.appliedDistinctUsers ?? "-"}</h2></div>
                  </div>
                  <div className="subscription-card">
                    <div className="card-header"><h4>Accepted (distinct)</h4></div>
                    <div className="card-body"><h2>{analyticsTotals?.acceptedDistinctUsers ?? "-"}</h2></div>
                  </div>
                  <div className="subscription-card">
                    <div className="card-header"><h4>Rejected (deduped)</h4></div>
                    <div className="card-body"><h2>{analyticsTotals?.rejectedDistinctUsers ?? "-"}</h2></div>
                  </div>
                  <div className="subscription-card">
                    <div className="card-header"><h4>Active Subscriptions (now)</h4></div>
                    <div className="card-body"><h2>{analyticsTotals?.activeSubscriptionsNow ?? "-"}</h2></div>
                  </div>
                </div>

                {/* Lists */}
                <div className="subscription-form-container" style={{ marginTop: 24 }}>
                  <div className="subscription-form">
                    <h3>Recently Applied (Submitted)</h3>
                    <div className="applications-table">
                      <table>
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Plan</th>
                            <th>Submitted</th>
                          </tr>
                        </thead>
                        <tbody>
                          {appliedList.length === 0 ? (
                            <tr><td colSpan="4" style={{ textAlign: "center", padding: "20px" }}>No applications found</td></tr>
                          ) : (
                            appliedList.map((app) => (
                              <tr key={app._id}>
                                <td><strong>{app.firstName} {app.lastName}</strong></td>
                                <td>{app.email}</td>
                                <td>{app.selectedPlanSnapshot?.name || app.selectedPlanId?.name || "-"}</td>
                                <td>{new Date(app.submittedAt || app.createdAt).toLocaleString()}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="subscription-form-container" style={{ marginTop: 24 }}>
                  <div className="subscription-form">
                    <h3>Approved (including Pending Payment)</h3>
                    <div className="applications-table">
                      <table>
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Plan</th>
                            <th>Approved At</th>
                          </tr>
                        </thead>
                        <tbody>
                          {approvedList.length === 0 ? (
                            <tr><td colSpan="4" style={{ textAlign: "center", padding: "20px" }}>No approved applications found</td></tr>
                          ) : (
                            approvedList.map((app) => (
                              <tr key={app._id}>
                                <td><strong>{app.firstName} {app.lastName}</strong></td>
                                <td>{app.email}</td>
                                <td>{app.selectedPlanSnapshot?.name || app.selectedPlanId?.name || "-"}</td>
                                <td>{app.reviewedAt ? new Date(app.reviewedAt).toLocaleString() : "-"}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="subscription-form-container" style={{ marginTop: 24 }}>
                  <div className="subscription-form">
                    <h3>Active Subscriptions & History</h3>
                    <div className="applications-table">
                      <table>
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Plan</th>
                            <th>Plan Start</th>
                            <th>Plan Expiry</th>
                            <th>Renewals</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeList.length === 0 ? (
                            <tr><td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>No active subscriptions found</td></tr>
                          ) : (
                            activeList.map((app) => (
                              <tr key={app._id}>
                                <td><strong>{app.firstName} {app.lastName}</strong><div style={{ fontSize: 12, color: '#666' }}>{app.email}</div></td>
                                <td>{app.selectedPlanSnapshot?.name || app.selectedPlanId?.name || "-"}</td>
                                <td>{app.planStartDate ? new Date(app.planStartDate).toLocaleDateString() : "-"}</td>
                                <td>{app.planExpiryDate ? new Date(app.planExpiryDate).toLocaleDateString() : "-"}</td>
                                <td>{Array.isArray(app.renewalHistory) ? app.renewalHistory.length : 0}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Application Details Modal */}
            {showApplicationModal && selectedApplication && (
              <div className="modal-overlay" onClick={() => setShowApplicationModal(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h2>Seller Application Details</h2>
                    <button
                      className="modal-close"
                      onClick={() => setShowApplicationModal(false)}
                    >
                      ✕
                    </button>
                  </div>

                  <div className="modal-body">
                    {/* Personal Information */}
                    <div className="detail-section">
                      <h3>Personal Information</h3>
                      <div className="detail-grid">
                        <div className="detail-item">
                          <label>Full Name</label>
                          <p>{selectedApplication.firstName} {selectedApplication.lastName}</p>
                        </div>
                        <div className="detail-item">
                          <label>Email</label>
                          <p>{selectedApplication.email}</p>
                        </div>
                        <div className="detail-item">
                          <label>Phone</label>
                          <p>{selectedApplication.phone || "N/A"}</p>
                        </div>
                        <div className="detail-item">
                          <label>Country</label>
                          <p>{selectedApplication.country || "India"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Address Information */}
                    <div className="detail-section">
                      <h3>Address Information</h3>
                      <div className="detail-grid">
                        <div className="detail-item">
                          <label>Address Line 1</label>
                          <p>{selectedApplication.addressLine1 || "N/A"}</p>
                        </div>
                        <div className="detail-item">
                          <label>Address Line 2</label>
                          <p>{selectedApplication.addressLine2 || "N/A"}</p>
                        </div>
                        <div className="detail-item">
                          <label>City</label>
                          <p>{selectedApplication.city || "N/A"}</p>
                        </div>
                        <div className="detail-item">
                          <label>State</label>
                          <p>{selectedApplication.state || "N/A"}</p>
                        </div>
                        <div className="detail-item">
                          <label>Pincode</label>
                          <p>{selectedApplication.pincode || "N/A"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Business Information */}
                    <div className="detail-section">
                      <h3>Business Information</h3>
                      <div className="detail-grid">
                        <div className="detail-item">
                          <label>Business Name</label>
                          <p>{selectedApplication.businessName || "N/A"}</p>
                        </div>
                        <div className="detail-item">
                          <label>Business Type</label>
                          <p>{selectedApplication.businessType || "N/A"}</p>
                        </div>
                        <div className="detail-item">
                          <label>GST Number</label>
                          <p>{selectedApplication.gstNumber || "N/A"}</p>
                        </div>
                        <div className="detail-item">
                          <label>PAN Number</label>
                          <p>{selectedApplication.panNumber || "N/A"}</p>
                        </div>
                        <div className="detail-item full-width">
                          <label>Business Description</label>
                          <p>{selectedApplication.businessDescription || "N/A"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Banking Information */}
                    <div className="detail-section">
                      <h3>Banking Information</h3>
                      <div className="detail-grid">
                        <div className="detail-item">
                          <label>Account Holder Name</label>
                          <p>{selectedApplication.accountHolderName || "N/A"}</p>
                        </div>
                        <div className="detail-item">
                          <label>Account Number</label>
                          <p>{selectedApplication.accountNumber || "N/A"}</p>
                        </div>
                        <div className="detail-item">
                          <label>Account Type</label>
                          <p>{selectedApplication.accountType || "Savings"}</p>
                        </div>
                        <div className="detail-item">
                          <label>IFSC Code</label>
                          <p>{selectedApplication.ifscCode || "N/A"}</p>
                        </div>
                        <div className="detail-item">
                          <label>Bank Name</label>
                          <p>{selectedApplication.bankName || "N/A"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Subscription Information */}
                    <div className="detail-section">
                      <h3>Subscription Information</h3>
                      <div className="detail-grid">
                        <div className="detail-item">
                          <label>Selected Plan</label>
                          <p>
                            {typeof selectedApplication.selectedPlanId === 'object'
                              ? selectedApplication.selectedPlanId?.name
                              : "N/A"}
                          </p>
                        </div>
                        <div className="detail-item">
                          <label>Status</label>
                          <p>
                            <span className={`status-badge status-${selectedApplication.status}`}>
                              {selectedApplication.status === "submitted" ? "Pending Review" : selectedApplication.status}
                            </span>
                          </p>
                        </div>
                        <div className="detail-item">
                          <label>Applied Date</label>
                          <p>{new Date(selectedApplication.createdAt).toLocaleDateString()}</p>
                        </div>
                        {selectedApplication.reviewedAt && (
                          <div className="detail-item">
                            <label>Reviewed Date</label>
                            <p>{new Date(selectedApplication.reviewedAt).toLocaleDateString()}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Consents */}
                    <div className="detail-section">
                      <h3>Consents & Agreements</h3>
                      <div className="consent-list">
                        <div className="consent-item">
                          <span className={selectedApplication.termsAccepted ? "check" : "cross"}>
                            {selectedApplication.termsAccepted ? "✓" : "✕"}
                          </span>
                          <label>Terms & Conditions Accepted</label>
                        </div>
                        <div className="consent-item">
                          <span className={selectedApplication.privacyAccepted ? "check" : "cross"}>
                            {selectedApplication.privacyAccepted ? "✓" : "✕"}
                          </span>
                          <label>Privacy Policy Accepted</label>
                        </div>
                        <div className="consent-item">
                          <span className={selectedApplication.communicationConsent ? "check" : "cross"}>
                            {selectedApplication.communicationConsent ? "✓" : "✕"}
                          </span>
                          <label>Communication Consent</label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      className="btn btn-secondary"
                      onClick={() => setShowApplicationModal(false)}
                    >
                      Close
                    </button>
                    {selectedApplication.status === "submitted" && (
                      <>
                        <button
                          className="btn btn-success"
                          onClick={() => {
                            console.log("Approve clicked for:", selectedApplication._id);
                            approveSelectedApplication();
                          }}
                          disabled={loading}
                        >
                          {loading ? "Processing..." : "Approve"}
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => {
                            console.log("Reject clicked for:", selectedApplication._id);
                            rejectSelectedApplication();
                          }}
                          disabled={loading}
                        >
                          {loading ? "Processing..." : "Reject"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SubscriptionManagement;
