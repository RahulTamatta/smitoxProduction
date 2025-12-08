import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/auth";
import Layout from "../../components/Layout/Layout";
import {
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Zap,
  DollarSign,
  TrendingUp,
  Loader,
} from "lucide-react";
import { getMyApplication } from "../../services/sellerApi";
import "./sellerDashboard.css";

const SellerDashboard = () => {
  const navigate = useNavigate();
  const [auth] = useAuth();
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState(null);
  const [error, setError] = useState("");
  const [availablePlans, setAvailablePlans] = useState([]);
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Fetch available plans
  const fetchAvailablePlans = async () => {
    try {
      const response = await fetch(`/api/v1/sellers/available-plans`);
      const data = await response.json();
      if (data.success) {
        setAvailablePlans(data.plans);
      }
    } catch (err) {
      console.error("Error fetching plans:", err);
    }
  };

  // Fetch seller profile and application
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);

        const response = await getMyApplication(auth?.token);

        if (response.success) {
          setApplication(response.application);
        }

        // Fetch available plans
        await fetchAvailablePlans();

        setLoading(false);
      } catch (err) {
        setError(err.message || "Failed to load profile");
        setLoading(false);
      }
    };

    if (auth?.token) {
      fetchProfile();
    }
  }, [auth?.token]);

  // Handle renewal
  const handleRenewal = async () => {
    try {
      setProcessingPayment(true);
      const response = await fetch(`/api/v1/sellers/renew-plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: auth?.token,
        },
        body: JSON.stringify({
          planId: application.selectedPlanId._id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // If free plan, refresh application
        if (application.selectedPlanId.isFree) {
          const updatedApp = await getMyApplication(auth?.token);
          if (updatedApp.success) {
            setApplication(updatedApp.application);
          }
          setShowRenewalModal(false);
          alert("Plan renewed successfully!");
        } else {
          // For paid plans, redirect to payment
          if (data.checkoutInfo) {
            // Store checkout info and redirect to payment page
            sessionStorage.setItem("checkoutInfo", JSON.stringify(data.checkoutInfo));
            navigate("/checkout");
          }
        }
      } else {
        alert("Error renewing plan: " + data.message);
      }
    } catch (err) {
      console.error("Error renewing plan:", err);
      alert("Error renewing plan");
    } finally {
      setProcessingPayment(false);
    }
  };

  // Handle upgrade
  const handleUpgrade = async (planId) => {
    try {
      setProcessingPayment(true);
      const response = await fetch(`/api/v1/sellers/upgrade-plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: auth?.token,
        },
        body: JSON.stringify({ planId }),
      });

      const data = await response.json();

      if (data.success) {
        // If free plan, refresh application
        const selectedPlan = availablePlans.find((p) => p._id === planId);
        if (selectedPlan?.isFree) {
          const updatedApp = await getMyApplication(auth?.token);
          if (updatedApp.success) {
            setApplication(updatedApp.application);
          }
          setShowUpgradeModal(false);
          alert("Plan upgraded successfully!");
        } else {
          // For paid plans, redirect to payment
          if (data.checkoutInfo) {
            sessionStorage.setItem("checkoutInfo", JSON.stringify(data.checkoutInfo));
            navigate("/checkout");
          }
        }
      } else {
        alert("Error upgrading plan: " + data.message);
      }
    } catch (err) {
      console.error("Error upgrading plan:", err);
      alert("Error upgrading plan");
    } finally {
      setProcessingPayment(false);
    }
  };

  // Calculate days until expiry
  const getDaysUntilExpiry = () => {
    if (!application?.planExpiryDate) return null;

    const expiryDate = new Date(application.planExpiryDate);
    const today = new Date();
    const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

    return daysLeft;
  };

  // Get expiry status
  const getExpiryStatus = () => {
    const daysLeft = getDaysUntilExpiry();

    if (daysLeft === null) return null;
    if (daysLeft < 0) {
      // Check if in grace period
      if (application?.gracePeriodEndDate) {
        const gracePeriodEnd = new Date(application.gracePeriodEndDate);
        const today = new Date();
        if (today < gracePeriodEnd) {
          return { status: "grace_period", label: "Grace Period", color: "warning" };
        }
      }
      return { status: "expired", label: "Expired", color: "danger" };
    }
    if (daysLeft <= 7) return { status: "expiring", label: "Expiring Soon", color: "warning" };
    return { status: "active", label: "Active", color: "success" };
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mt-5">
          <div className="text-center">
            <Loader className="spinner" />
            <p>Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!application || application.status !== "active") {
    return (
      <Layout>
        <div className="container mt-5">
          <div className="alert alert-warning">
            <AlertCircle size={20} />
            <span>Your seller account is not active yet.</span>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/seller/status")}
          >
            Check Application Status
          </button>
        </div>
      </Layout>
    );
  }

  const daysLeft = getDaysUntilExpiry();
  const expiryStatus = getExpiryStatus();

  return (
    <Layout>
      <div className="container-fluid mt-4 mb-5">
        <div className="page-header mb-4">
          <h1>Seller Dashboard</h1>
          <p>Manage your seller account and subscription</p>
        </div>

        {error && (
          <div className="alert alert-danger mb-4">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Plan Status Card */}
        <div className="row mb-4">
          <div className="col-md-8">
            <div className="card plan-status-card">
              <div className="card-header">
                <h3>Current Plan</h3>
                {expiryStatus && (
                  <span className={`badge badge-${expiryStatus.color}`}>
                    {expiryStatus.label}
                  </span>
                )}
              </div>

              <div className="card-body">
                <div className="plan-info">
                  <div className="plan-name">
                    <h2>
                      {application.selectedPlanSnapshot?.name || 
                       application.selectedPlan?.name || 
                       "Unknown Plan"}
                    </h2>
                    {(application.selectedPlanSnapshot?.isFree || application.selectedPlan?.isFree) ? (
                      <span className="badge badge-free">Free Plan</span>
                    ) : (
                      <div className="plan-price">
                        <span className="currency">₹</span>
                        <span className="amount">
                          {application.selectedPlanSnapshot?.price || 
                           application.selectedPlan?.price}
                        </span>
                        <span className="period">
                          /{application.selectedPlanSnapshot?.billingCycle || 
                            application.selectedPlan?.billingCycle}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="plan-details">
                    {application.planStartDate && (
                      <div className="detail-item">
                        <Calendar size={18} />
                        <div>
                          <label>Activated On</label>
                          <p>
                            {new Date(
                              application.planStartDate
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                    )}

                    {application.planExpiryDate && (
                      <div className="detail-item">
                        <Clock size={18} />
                        <div>
                          <label>Expires On</label>
                          <p>
                            {new Date(
                              application.planExpiryDate
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                          {daysLeft !== null && (
                            <small>
                              {daysLeft > 0
                                ? `${daysLeft} days remaining`
                                : "Expired"}
                            </small>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Expiry Warning */}
                {expiryStatus?.status === "expiring" && (
                  <div className="alert alert-warning mt-4">
                    <AlertCircle size={20} />
                    <div>
                      <strong>Plan Expiring Soon</strong>
                      <p>
                        Your subscription will expire in {daysLeft} days. Renew
                        now to avoid service interruption.
                      </p>
                    </div>
                  </div>
                )}

                {expiryStatus?.status === "grace_period" && (
                  <div className="alert alert-warning mt-4">
                    <AlertCircle size={20} />
                    <div>
                      <strong>Grace Period Active</strong>
                      <p>
                        Your subscription has expired but you're in a 30-day grace period. 
                        Renew now to restore full features and avoid losing access.
                      </p>
                    </div>
                  </div>
                )}

                {expiryStatus?.status === "expired" && (
                  <div className="alert alert-danger mt-4">
                    <AlertCircle size={20} />
                    <div>
                      <strong>Plan Expired - Fallback to Free</strong>
                      <p>
                        Your subscription has expired and grace period has ended. 
                        You are now on the Free plan. Upgrade to restore full features.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="card-footer">
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowRenewalModal(true)}
                  disabled={processingPayment}
                >
                  <RefreshCw size={18} />
                  {processingPayment ? "Processing..." : "Renew Subscription"}
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowUpgradeModal(true)}
                  disabled={processingPayment}
                >
                  <TrendingUp size={18} />
                  {processingPayment ? "Processing..." : "Upgrade Plan"}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="col-md-4">
            <div className="card stat-card">
              <div className="stat-icon">
                <Zap size={32} />
              </div>
              <div className="stat-content">
                <label>Current Capabilities</label>
                <p className="stat-value">
                  {application.selectedPlan?.includedCapabilities?.length || 0}
                </p>
              </div>
            </div>

            <div className="card stat-card">
              <div className="stat-icon">
                <DollarSign size={32} />
              </div>
              <div className="stat-content">
                <label>Plan Price</label>
                <p className="stat-value">
                  {application.selectedPlan?.isFree
                    ? "Free"
                    : `₹${application.selectedPlan?.price}`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Capabilities */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h3>Your Capabilities</h3>
              </div>

              <div className="card-body">
                {application.selectedPlan?.includedCapabilities &&
                application.selectedPlan.includedCapabilities.length > 0 ? (
                  <div className="capabilities-grid">
                    {application.selectedPlan.includedCapabilities.map(
                      (cap, idx) => (
                        <div key={idx} className="capability-item">
                          <CheckCircle size={20} />
                          <span>{cap}</span>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <p className="text-muted">
                    No capabilities available for this plan.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Plan Features */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h3>Plan Features</h3>
              </div>

              <div className="card-body">
                <div className="features-list">
                  <div className="feature-item">
                    <h4>Billing Cycle</h4>
                    <p>{application.selectedPlan?.billingCycle}</p>
                  </div>

                  <div className="feature-item">
                    <h4>Plan Type</h4>
                    <p>
                      {application.selectedPlan?.isFree ? "Free" : "Paid"}
                    </p>
                  </div>

                  <div className="feature-item">
                    <h4>Plan Description</h4>
                    <p>
                      {application.selectedPlan?.description ||
                        "No description available"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h3>Quick Actions</h3>
              </div>

              <div className="card-body">
                <div className="actions-grid">
                  <button className="action-btn">
                    <TrendingUp size={24} />
                    <span>View Products</span>
                  </button>

                  <button className="action-btn">
                    <DollarSign size={24} />
                    <span>View Orders</span>
                  </button>

                  <button className="action-btn">
                    <Calendar size={24} />
                    <span>View Invoices</span>
                  </button>

                  <button className="action-btn">
                    <AlertCircle size={24} />
                    <span>Support</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Renewal Modal */}
        {showRenewalModal && (
          <div className="modal-overlay" onClick={() => setShowRenewalModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Renew Your Plan</h2>
                <button 
                  className="modal-close"
                  onClick={() => setShowRenewalModal(false)}
                >
                  ✕
                </button>
              </div>
              <div className="modal-body">
                <p>Renew your current plan to continue enjoying all features.</p>
                <div className="plan-details-renewal">
                  <h4>{application?.selectedPlanId?.name}</h4>
                  {application?.selectedPlanId?.isFree ? (
                    <p className="free-plan">FREE</p>
                  ) : (
                    <p className="price">₹{application?.selectedPlanId?.price}/{application?.selectedPlanId?.billingCycle}</p>
                  )}
                  <p className="description">{application?.selectedPlanId?.description}</p>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowRenewalModal(false)}
                  disabled={processingPayment}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={handleRenewal}
                  disabled={processingPayment}
                >
                  {processingPayment ? "Processing..." : "Renew Now"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upgrade Modal */}
        {showUpgradeModal && (
          <div className="modal-overlay" onClick={() => setShowUpgradeModal(false)}>
            <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Upgrade Your Plan</h2>
                <button 
                  className="modal-close"
                  onClick={() => setShowUpgradeModal(false)}
                >
                  ✕
                </button>
              </div>
              <div className="modal-body">
                <p>Choose a plan to upgrade to:</p>
                <div className="plans-grid">
                  {availablePlans.map((plan) => (
                    <div 
                      key={plan._id} 
                      className={`plan-card ${plan._id === application?.selectedPlanId?._id ? 'current' : ''}`}
                    >
                      <h4>{plan.name}</h4>
                      {plan.isFree ? (
                        <p className="price">FREE</p>
                      ) : (
                        <p className="price">₹{plan.price}/{plan.billingCycle}</p>
                      )}
                      <p className="description">{plan.description}</p>
                      <ul className="features">
                        {plan.features?.slice(0, 3).map((feature, idx) => (
                          <li key={idx}>✓ {feature.name}</li>
                        ))}
                      </ul>
                      <button 
                        className={`btn ${plan._id === application?.selectedPlanId?._id ? 'btn-secondary' : 'btn-primary'}`}
                        onClick={() => handleUpgrade(plan._id)}
                        disabled={processingPayment || plan._id === application?.selectedPlanId?._id}
                      >
                        {plan._id === application?.selectedPlanId?._id ? 'Current Plan' : 'Upgrade'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowUpgradeModal(false)}
                  disabled={processingPayment}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SellerDashboard;
