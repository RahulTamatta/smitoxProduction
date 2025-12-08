import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/auth";
import toast from "react-hot-toast";

const SubscriptionPlans = () => {
  const [auth] = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
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
      const res = await axios.get("/api/v1/subscription-plans/admin/list", {
        headers: { Authorization: auth?.token },
      });
      if (res.data.success) {
        setPlans(res.data.plans);
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
      toast.error("Failed to fetch subscription plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth?.token]);

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle capability selection
  const handleCapabilityChange = (cap, type) => {
    setFormData((prev) => {
      const list = prev[type];
      if (list.includes(cap)) {
        return {
          ...prev,
          [type]: list.filter((c) => c !== cap),
        };
      } else {
        return {
          ...prev,
          [type]: [...list, cap],
        };
      }
    });
  };

  // Create or update plan
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        // Update plan
        const res = await axios.put(
          `/api/v1/subscription-plans/${editingId}`,
          formData,
          { headers: { Authorization: auth?.token } }
        );
        if (res.data.success) {
          toast.success("Plan updated successfully");
          setPlans(plans.map((p) => (p._id === editingId ? res.data.plan : p)));
          setEditingId(null);
        }
      } else {
        // Create plan
        const res = await axios.post("/api/v1/subscription-plans", formData, {
          headers: { Authorization: auth?.token },
        });
        if (res.data.success) {
          toast.success("Plan created successfully");
          setPlans([...plans, res.data.plan]);
        }
      }
      resetForm();
    } catch (error) {
      console.error("Error saving plan:", error);
      toast.error(error.response?.data?.message || "Failed to save plan");
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
      isFree: plan.isFree || false,
    });
    setEditingId(plan._id);
    setShowForm(true);
  };

  // Toggle plan status
  const handleToggleStatus = async (planId, currentStatus) => {
    try {
      const res = await axios.patch(
        `/api/v1/subscription-plans/${planId}/toggle`,
        { isActive: !currentStatus },
        { headers: { Authorization: auth?.token } }
      );
      if (res.data.success) {
        toast.success("Plan status updated");
        setPlans(plans.map((p) => (p._id === planId ? res.data.plan : p)));
      }
    } catch (error) {
      console.error("Error toggling plan:", error);
      toast.error("Failed to update plan status");
    }
  };

  // Delete plan
  const handleDelete = async (planId) => {
    if (window.confirm("Are you sure you want to delete this plan?")) {
      try {
        const res = await axios.delete(`/api/v1/subscription-plans/${planId}`, {
          headers: { Authorization: auth?.token },
        });
        if (res.data.success) {
          toast.success("Plan deleted successfully");
          setPlans(plans.filter((p) => p._id !== planId));
        }
      } catch (error) {
        console.error("Error deleting plan:", error);
        toast.error("Failed to delete plan");
      }
    }
  };

  // Reset form
  const resetForm = () => {
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
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="container-fluid mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Subscription Plans</h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          + Create Plan
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card mb-4">
          <div className="card-header">
            <h5>{editingId ? "Edit Plan" : "Create New Plan"}</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Plan Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Price (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Billing Cycle</label>
                  <select
                    className="form-control"
                    name="billingCycle"
                    value={formData.billingCycle}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                    />
                    {" "}Active
                  </label>
                  <label className="form-label ms-3">
                    <input
                      type="checkbox"
                      name="isFree"
                      checked={formData.isFree}
                      onChange={handleInputChange}
                    />
                    {" "}Free Plan
                  </label>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                />
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Included Capabilities</label>
                  <div className="border p-2" style={{ maxHeight: "200px", overflowY: "auto" }}>
                    {allCapabilities.map((cap) => (
                      <div key={cap} className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id={`included-${cap}`}
                          checked={formData.includedCapabilities.includes(cap)}
                          onChange={() => handleCapabilityChange(cap, "includedCapabilities")}
                        />
                        <label className="form-check-label" htmlFor={`included-${cap}`}>
                          {cap}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">Excluded Capabilities</label>
                  <div className="border p-2" style={{ maxHeight: "200px", overflowY: "auto" }}>
                    {allCapabilities.map((cap) => (
                      <div key={cap} className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id={`excluded-${cap}`}
                          checked={formData.excludedCapabilities.includes(cap)}
                          onChange={() => handleCapabilityChange(cap, "excludedCapabilities")}
                        />
                        <label className="form-check-label" htmlFor={`excluded-${cap}`}>
                          {cap}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-success">
                  {editingId ? "Update Plan" : "Create Plan"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Plans List */}
      <div className="card">
        <div className="card-header">
          <h5>All Plans</h5>
        </div>
        <div className="card-body">
          {loading ? (
            <p>Loading plans...</p>
          ) : plans.length === 0 ? (
            <p>No subscription plans found</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Duration</th>
                    <th>Status</th>
                    <th>Capabilities</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((plan) => (
                    <tr key={plan._id}>
                      <td>{plan.name}</td>
                      <td>₹{plan.price} {plan.isFree && <span className="badge bg-info">Free</span>}</td>
                      <td>{plan.billingCycle}</td>
                      <td>
                        <span
                          className={`badge ${
                            plan.isActive ? "bg-success" : "bg-danger"
                          }`}
                        >
                          {plan.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <small>
                          <strong>Included:</strong> {plan.includedCapabilities?.length || 0}
                          <br />
                          <strong>Excluded:</strong> {plan.excludedCapabilities?.length || 0}
                        </small>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-info me-2"
                          onClick={() => handleEdit(plan)}
                        >
                          Edit
                        </button>
                        <button
                          className={`btn btn-sm me-2 ${
                            plan.isActive ? "btn-warning" : "btn-success"
                          }`}
                          onClick={() => handleToggleStatus(plan._id, plan.isActive)}
                        >
                          {plan.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(plan._id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlans;
