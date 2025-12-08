import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/auth";
import Layout from "../../components/Layout/Layout";
import {
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  RefreshCw,
  Edit,
  Loader,
  Calendar,
  DollarSign,
} from "lucide-react";
import {
  getMyApplication,
  getCheckoutData,
  retryPayment,
} from "../../services/sellerApi";
import "./applicationStatus.css";

const ApplicationStatus = () => {
  const navigate = useNavigate();
  const [auth, setAuth] = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [application, setApplication] = useState(null);
  const [checkoutInfo, setCheckoutInfo] = useState(null);
  const [polling, setPolling] = useState(false);

  // Fetch application status
  useEffect(() => {
    const fetchApplication = async () => {
      try {
        setLoading(true);
        const response = await getMyApplication(auth?.token);

        if (response.success) {
          setApplication(response.application);

          // If approved_pending_payment, fetch checkout data
          if (response.application.status === "approved_pending_payment") {
            const checkoutRes = await getCheckoutData(
              response.application._id,
              auth?.token
            );
            if (checkoutRes.success) {
              setCheckoutInfo(checkoutRes.checkoutInfo);
            }
          }
        }

        setLoading(false);
      } catch (err) {
        setError(err.message || "Failed to load application");
        setLoading(false);
      }
    };

    if (auth?.token) {
      fetchApplication();
    }
  }, [auth?.token]);

  // Poll for status changes (when pending payment)
  useEffect(() => {
    if (application?.status === "approved_pending_payment") {
      const interval = setInterval(async () => {
        try {
          const response = await getMyApplication(auth?.token);
          if (response.success && response.application.status === "active") {
            setApplication(response.application);
            setPolling(false);
            // Refresh auth to get new token
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
      }, 3000); // Poll every 3 seconds

      return () => clearInterval(interval);
    }
  }, [application?.status, auth?.token]);

  // Handle retry payment
  const handleRetryPayment = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await retryPayment(application._id, auth?.token);

      if (response.success) {
        setCheckoutInfo(response.checkoutInfo);
        setApplication((prev) => ({
          ...prev,
          status: "approved_pending_payment",
        }));
      }

      setLoading(false);
    } catch (err) {
      setError(err.message || "Failed to retry payment");
      setLoading(false);
    }
  };

  // Handle proceed to payment
  const handleProceedToPayment = () => {
    if (checkoutInfo) {
      navigate("/checkout", {
        state: {
          type: "subscription",
          checkoutInfo,
          applicationId: application._id,
        },
      });
    }
  };

  // Handle edit and reapply
  const handleEditAndReapply = () => {
    navigate("/seller/apply");
  };

  // Handle go to dashboard
  const handleGoDashboard = () => {
    navigate("/seller/dashboard");
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const badges = {
      draft: { icon: Clock, color: "gray", label: "Draft" },
      submitted: { icon: Clock, color: "blue", label: "Submitted" },
      under_review: { icon: Clock, color: "blue", label: "Under Review" },
      approved_pending_payment: {
        icon: AlertCircle,
        color: "warning",
        label: "Pending Payment",
      },
      approved_payment_failed: {
        icon: XCircle,
        color: "danger",
        label: "Payment Failed",
      },
      approved: { icon: CheckCircle, color: "success", label: "Approved" },
      rejected: { icon: XCircle, color: "danger", label: "Rejected" },
      active: { icon: CheckCircle, color: "success", label: "Active" },
    };

    const badge = badges[status] || badges.draft;
    const Icon = badge.icon;

    return (
      <div className={`status-badge status-${badge.color}`}>
        <Icon size={20} />
        <span>{badge.label}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mt-5">
          <div className="text-center">
            <Loader className="spinner" />
            <p>Loading application status...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!application) {
    return (
      <Layout>
        <div className="container mt-5">
          <div className="alert alert-info">
            <AlertCircle size={20} />
            <span>No application found. Start by creating one.</span>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/seller/apply")}
          >
            Create Application
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mt-5 mb-5">
        <div className="status-container">
          <div className="status-header">
            <h1>Application Status</h1>
            {getStatusBadge(application.status)}
          </div>

          {error && (
            <div className="alert alert-danger mb-4">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {/* Plan Information */}
          <div className="card mb-4">
            <div className="card-header">
              <h3>Plan Information</h3>
            </div>
            <div className="card-body">
              <div className="info-grid">
                <div className="info-item">
                  <label>Selected Plan</label>
                  <p className="info-value">{application.selectedPlan?.name}</p>
                </div>
                <div className="info-item">
                  <label>Price</label>
                  <p className="info-value">
                    {application.selectedPlan?.isFree ? (
                      <span className="badge badge-free">Free</span>
                    ) : (
                      <>
                        <DollarSign size={16} />
                        ₹{application.selectedPlan?.price}
                      </>
                    )}
                  </p>
                </div>
                <div className="info-item">
                  <label>Billing Cycle</label>
                  <p className="info-value">
                    {application.selectedPlan?.billingCycle}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Status-Specific Content */}

          {/* Submitted / Under Review */}
          {["submitted", "under_review"].includes(application.status) && (
            <div className="card mb-4">
              <div className="card-body">
                <div className="alert alert-info">
                  <Clock size={20} />
                  <div>
                    <strong>Application Under Review</strong>
                    <p>
                      Your application is being reviewed by our team. This
                      typically takes 1-2 business days. You cannot change your
                      plan during this time.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Approved Pending Payment */}
          {application.status === "approved_pending_payment" && (
            <div className="card mb-4">
              <div className="card-header">
                <h3>Payment Required</h3>
              </div>
              <div className="card-body">
                <div className="alert alert-warning mb-4">
                  <AlertCircle size={20} />
                  <div>
                    <strong>Your application has been approved!</strong>
                    <p>
                      Please complete the payment to activate your seller
                      account.
                    </p>
                  </div>
                </div>

                {checkoutInfo && (
                  <div className="payment-info">
                    <div className="info-item">
                      <label>Amount Due</label>
                      <p className="info-value">₹{checkoutInfo.amount}</p>
                    </div>
                    <div className="info-item">
                      <label>Order ID</label>
                      <p className="info-value">{checkoutInfo.orderId}</p>
                    </div>
                  </div>
                )}

                <button
                  className="btn btn-success btn-lg w-100"
                  onClick={handleProceedToPayment}
                  disabled={loading}
                >
                  <DollarSign size={20} />
                  Proceed to Payment
                </button>

                {polling && (
                  <div className="alert alert-info mt-3">
                    <Loader size={16} className="spinner-small" />
                    <span>Checking payment status...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payment Failed */}
          {application.status === "approved_payment_failed" && (
            <div className="card mb-4">
              <div className="card-header">
                <h3>Payment Failed</h3>
              </div>
              <div className="card-body">
                <div className="alert alert-danger mb-4">
                  <XCircle size={20} />
                  <div>
                    <strong>Payment could not be processed</strong>
                    <p>
                      Your payment failed. Please try again or contact support
                      if the issue persists.
                    </p>
                  </div>
                </div>

                <button
                  className="btn btn-primary btn-lg w-100"
                  onClick={handleRetryPayment}
                  disabled={loading}
                >
                  <RefreshCw size={20} />
                  Retry Payment
                </button>
              </div>
            </div>
          )}

          {/* Rejected */}
          {application.status === "rejected" && (
            <div className="card mb-4">
              <div className="card-header">
                <h3>Application Rejected</h3>
              </div>
              <div className="card-body">
                <div className="alert alert-danger mb-4">
                  <XCircle size={20} />
                  <div>
                    <strong>Your application was not approved</strong>
                    <p>
                      {application.reviewNotes ||
                        "Please review the feedback and reapply."}
                    </p>
                  </div>
                </div>

                <button
                  className="btn btn-primary btn-lg w-100"
                  onClick={handleEditAndReapply}
                >
                  <Edit size={20} />
                  Edit & Reapply
                </button>
              </div>
            </div>
          )}

          {/* Approved (Free Plan) */}
          {application.status === "approved" && (
            <div className="card mb-4">
              <div className="card-header">
                <h3>Application Approved</h3>
              </div>
              <div className="card-body">
                <div className="alert alert-success mb-4">
                  <CheckCircle size={20} />
                  <div>
                    <strong>Your application has been approved!</strong>
                    <p>Your seller account is now active.</p>
                  </div>
                </div>

                <button
                  className="btn btn-success btn-lg w-100"
                  onClick={handleGoDashboard}
                >
                  <CheckCircle size={20} />
                  Go to Dashboard
                </button>
              </div>
            </div>
          )}

          {/* Active */}
          {application.status === "active" && (
            <div className="card mb-4">
              <div className="card-header">
                <h3>Account Active</h3>
              </div>
              <div className="card-body">
                <div className="alert alert-success mb-4">
                  <CheckCircle size={20} />
                  <div>
                    <strong>Your seller account is active!</strong>
                    <p>You can now start selling on our platform.</p>
                  </div>
                </div>

                {application.planActivatedAt && (
                  <div className="info-grid mb-4">
                    <div className="info-item">
                      <label>Activated On</label>
                      <p className="info-value">
                        <Calendar size={16} />
                        {new Date(
                          application.planActivatedAt
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    {application.planExpiresAt && (
                      <div className="info-item">
                        <label>Expires On</label>
                        <p className="info-value">
                          <Calendar size={16} />
                          {new Date(
                            application.planExpiresAt
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <button
                  className="btn btn-success btn-lg w-100"
                  onClick={handleGoDashboard}
                >
                  <CheckCircle size={20} />
                  Go to Dashboard
                </button>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="card">
            <div className="card-header">
              <h3>Timeline</h3>
            </div>
            <div className="card-body">
              <div className="timeline">
                <div className="timeline-item completed">
                  <div className="timeline-marker">
                    <CheckCircle size={24} />
                  </div>
                  <div className="timeline-content">
                    <h4>Application Submitted</h4>
                    <p>
                      {application.submittedAt
                        ? new Date(application.submittedAt).toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
                </div>

                <div
                  className={`timeline-item ${
                    application.reviewedAt ? "completed" : ""
                  }`}
                >
                  <div className="timeline-marker">
                    {application.reviewedAt ? (
                      <CheckCircle size={24} />
                    ) : (
                      <Clock size={24} />
                    )}
                  </div>
                  <div className="timeline-content">
                    <h4>Under Review</h4>
                    <p>
                      {application.reviewedAt
                        ? new Date(application.reviewedAt).toLocaleString()
                        : "Pending..."}
                    </p>
                  </div>
                </div>

                {["approved_pending_payment", "active"].includes(
                  application.status
                ) && (
                  <div className="timeline-item completed">
                    <div className="timeline-marker">
                      <CheckCircle size={24} />
                    </div>
                    <div className="timeline-content">
                      <h4>Approved</h4>
                      <p>
                        {application.reviewedAt
                          ? new Date(application.reviewedAt).toLocaleString()
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                )}

                {application.status === "active" && (
                  <div className="timeline-item completed">
                    <div className="timeline-marker">
                      <CheckCircle size={24} />
                    </div>
                    <div className="timeline-content">
                      <h4>Payment Completed</h4>
                      <p>
                        {application.planActivatedAt
                          ? new Date(
                              application.planActivatedAt
                            ).toLocaleString()
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ApplicationStatus;
