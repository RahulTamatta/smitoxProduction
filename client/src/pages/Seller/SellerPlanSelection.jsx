import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/auth";
import toast from "react-hot-toast";
import "./sellerPlanSelection.css";

const SellerPlanSelection = () => {
  const navigate = useNavigate();
  const [auth] = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Fetch active subscription plans
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const res = await axios.get("/api/v1/subscription-plans/active");
        if (res.data.success) {
          setPlans(res.data.plans);
        }
      } catch (error) {
        console.error("Error fetching plans:", error);
        toast.error("Failed to load subscription plans");
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  // Handle plan selection
  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
  };

  // Handle payment processing (Razorpay integration)
  const handlePayment = async () => {
    if (!selectedPlan) {
      toast.error("Please select a plan first");
      return;
    }

    try {
      setProcessingPayment(true);

      // Create order on backend
      const orderRes = await axios.post(
        "/api/v1/payments/create-order",
        {
          amount: selectedPlan.price * 100, // Convert to paise
          planId: selectedPlan._id,
          planName: selectedPlan.name,
        },
        { headers: { Authorization: auth?.token } }
      );

      if (!orderRes.data.success) {
        toast.error("Failed to create payment order");
        return;
      }

      const { orderId, amount, currency } = orderRes.data;

      // Initialize Razorpay
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: amount,
        currency: currency,
        name: "Smitox B2B",
        description: `Subscription Plan: ${selectedPlan.name}`,
        order_id: orderId,
        handler: async (response) => {
          try {
            // Verify payment on backend
            const verifyRes = await axios.post(
              "/api/v1/payments/verify-payment",
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planId: selectedPlan._id,
              },
              { headers: { Authorization: auth?.token } }
            );

            if (verifyRes.data.success) {
              toast.success("Payment successful! Proceeding to seller application...");
              
              // Redirect to seller wizard with selected plan
              navigate("/become-seller", {
                state: { selectedPlanId: selectedPlan._id, paymentId: response.razorpay_payment_id },
              });
            } else {
              toast.error("Payment verification failed");
            }
          } catch (error) {
            console.error("Payment verification error:", error);
            toast.error("Payment verification failed");
          }
        },
        prefill: {
          email: auth?.user?.email_id,
          contact: auth?.user?.mobile_no,
        },
        theme: {
          color: "#3399cc",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Failed to process payment");
    } finally {
      setProcessingPayment(false);
    }
  };

  // Handle free plan selection (skip payment)
  const handleFreePlan = async () => {
    if (!selectedPlan || !selectedPlan.isFree) {
      toast.error("This is not a free plan");
      return;
    }

    try {
      setProcessingPayment(true);

      // For free plans, directly proceed to seller application
      navigate("/become-seller", {
        state: { selectedPlanId: selectedPlan._id, isFree: true },
      });
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to proceed");
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading plans...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="seller-plan-selection">
      <div className="container mt-5 mb-5">
        <div className="row mb-4">
          <div className="col-12">
            <h1 className="text-center mb-2">Choose Your Seller Plan</h1>
            <p className="text-center text-muted">
              Select a subscription plan to get started as a seller on Smitox B2B
            </p>
          </div>
        </div>

        {plans.length === 0 ? (
          <div className="alert alert-info text-center">
            No subscription plans available at the moment
          </div>
        ) : (
          <div className="row g-4">
            {plans.map((plan) => (
              <div key={plan._id} className="col-md-6 col-lg-4">
                <div
                  className={`plan-card ${selectedPlan?._id === plan._id ? "selected" : ""}`}
                  onClick={() => handleSelectPlan(plan)}
                >
                  <div className="plan-header">
                    <h3 className="plan-name">{plan.name}</h3>
                    {plan.isFree && (
                      <span className="badge bg-success">Free</span>
                    )}
                    {plan.isRecommended && (
                      <span className="badge bg-warning">Recommended</span>
                    )}
                  </div>

                  <div className="plan-price">
                    <span className="currency">₹</span>
                    <span className="amount">{plan.price}</span>
                    <span className="period">/{plan.billingCycle}</span>
                  </div>

                  <p className="plan-description">{plan.description}</p>

                  <div className="plan-features">
                    <h5>Features:</h5>
                    {plan.features && plan.features.length > 0 ? (
                      <ul className="features-list">
                        {plan.features.map((feature, idx) => (
                          <li key={idx}>
                            <span className="feature-icon">✓</span>
                            {feature.name}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted small">No features listed</p>
                    )}
                  </div>

                  <div className="plan-limits">
                    {plan.maxProducts && (
                      <div className="limit-item">
                        <strong>Max Products:</strong> {plan.maxProducts}
                      </div>
                    )}
                    {plan.maxOrders && (
                      <div className="limit-item">
                        <strong>Max Orders:</strong> {plan.maxOrders}
                      </div>
                    )}
                    {plan.trialDays > 0 && (
                      <div className="limit-item">
                        <strong>Trial Period:</strong> {plan.trialDays} days
                      </div>
                    )}
                  </div>

                  <div className="plan-selection-indicator">
                    <input
                      type="radio"
                      name="plan"
                      value={plan._id}
                      checked={selectedPlan?._id === plan._id}
                      onChange={() => handleSelectPlan(plan)}
                    />
                    <span>Select this plan</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedPlan && (
          <div className="row mt-5">
            <div className="col-12">
              <div className="selected-plan-summary">
                <h4>Selected Plan: {selectedPlan.name}</h4>
                <p>
                  Price: <strong>₹{selectedPlan.price}</strong> per{" "}
                  {selectedPlan.billingCycle}
                </p>

                <div className="action-buttons">
                  {selectedPlan.isFree ? (
                    <button
                      className="btn btn-primary btn-lg"
                      onClick={handleFreePlan}
                      disabled={processingPayment}
                    >
                      {processingPayment ? "Processing..." : "Continue with Free Plan"}
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary btn-lg"
                      onClick={handlePayment}
                      disabled={processingPayment}
                    >
                      {processingPayment ? "Processing..." : `Pay ₹${selectedPlan.price}`}
                    </button>
                  )}

                  <button
                    className="btn btn-secondary btn-lg"
                    onClick={() => setSelectedPlan(null)}
                    disabled={processingPayment}
                  >
                    Change Plan
                  </button>
                </div>

                <p className="text-muted small mt-3">
                  After payment, you'll be asked to provide your business details
                  to complete your seller application.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerPlanSelection;
