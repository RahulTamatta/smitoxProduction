import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/auth";
import Layout from "../../components/Layout/Layout";
import { AlertCircle, Loader, CheckCircle, DollarSign } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import "./checkout.css";

const CheckoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [auth] = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkoutType, setCheckoutType] = useState("cart"); // "cart" or "subscription"
  const [checkoutInfo, setCheckoutInfo] = useState(null);
  const [applicationId, setApplicationId] = useState(null);

  // Initialize checkout type and info from location state
  useEffect(() => {
    if (location.state?.type === "subscription") {
      setCheckoutType("subscription");
      setCheckoutInfo(location.state.checkoutInfo);
      setApplicationId(location.state.applicationId);
    } else {
      setCheckoutType("cart");
    }
  }, [location.state]);

  // Handle Razorpay payment for subscription
  const handleSubscriptionPayment = async () => {
    try {
      if (!checkoutInfo || !checkoutInfo.orderId) {
        setError("Invalid checkout information");
        return;
      }

      setLoading(true);
      setError("");

      // Load Razorpay script
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => {
        const options = {
          key: process.env.REACT_APP_RAZORPAY_KEY_ID,
          order_id: checkoutInfo.orderId,
          amount: checkoutInfo.amount * 100, // Convert to paise
          currency: checkoutInfo.currency || "INR",
          name: "Smitox B2B",
          description: `${checkoutInfo.planName} Plan Subscription`,
          handler: async (response) => {
            try {
              // Verify payment on backend
              const verifyRes = await axios.post(
                "/api/v1/webhooks/payments/razorpay/success",
                {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  applicationId: applicationId,
                },
                {
                  headers: {
                    Authorization: auth?.token,
                  },
                }
              );

              if (verifyRes.data.success) {
                toast.success("Payment successful! Your subscription is now active.");
                // Redirect to seller dashboard
                setTimeout(() => {
                  navigate("/seller/dashboard");
                }, 2000);
              }
            } catch (err) {
              setError(
                err.response?.data?.message ||
                  "Payment verification failed. Please contact support."
              );
              toast.error("Payment verification failed");
            }
            setLoading(false);
          },
          prefill: {
            name: auth?.user?.name || "",
            email: auth?.user?.email || "",
            contact: auth?.user?.phone || "",
          },
          theme: {
            color: "#1976d2",
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", (response) => {
          setError(`Payment failed: ${response.error.description}`);
          toast.error("Payment failed");
          setLoading(false);
        });
        rzp.open();
      };
      document.body.appendChild(script);
    } catch (err) {
      setError(err.message || "Failed to initiate payment");
      setLoading(false);
    }
  };

  // Render subscription checkout
  const renderSubscriptionCheckout = () => (
    <div className="checkout-container">
      <div className="checkout-card">
        <div className="checkout-header">
          <h1>Complete Your Subscription Payment</h1>
          <p>Finalize your seller plan subscription</p>
        </div>

        {error && (
          <div className="alert alert-danger mb-4">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <div className="subscription-summary">
          <div className="summary-item">
            <label>Plan Name</label>
            <p className="summary-value">{checkoutInfo?.planName}</p>
          </div>

          <div className="summary-item">
            <label>Amount</label>
            <p className="summary-value">
              <DollarSign size={18} />
              ₹{checkoutInfo?.amount}
            </p>
          </div>

          <div className="summary-item">
            <label>Order ID</label>
            <p className="summary-value">{checkoutInfo?.orderId}</p>
          </div>

          <div className="summary-item">
            <label>Currency</label>
            <p className="summary-value">{checkoutInfo?.currency || "INR"}</p>
          </div>
        </div>

        <div className="alert alert-info">
          <AlertCircle size={20} />
          <div>
            <strong>Secure Payment</strong>
            <p>Your payment is processed securely via Razorpay.</p>
          </div>
        </div>

        <button
          className="btn btn-primary btn-lg w-100"
          onClick={handleSubscriptionPayment}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader size={20} className="spinner-small" />
              Processing...
            </>
          ) : (
            <>
              <DollarSign size={20} />
              Pay ₹{checkoutInfo?.amount}
            </>
          )}
        </button>

        <p className="checkout-footer">
          By clicking "Pay", you agree to our terms and conditions.
        </p>
      </div>
    </div>
  );

  // Render cart checkout (redirect to existing cart page)
  const renderCartCheckout = () => (
    <div className="checkout-container">
      <div className="checkout-card">
        <div className="alert alert-info">
          <AlertCircle size={20} />
          <span>Redirecting to cart checkout...</span>
        </div>
      </div>
    </div>
  );

  if (!auth?.token) {
    return (
      <Layout>
        <div className="checkout-container">
          <div className="checkout-card">
            <div className="alert alert-warning">
              <AlertCircle size={20} />
              <span>Please login to proceed with checkout.</span>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => navigate("/login")}
            >
              Go to Login
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {checkoutType === "subscription"
        ? renderSubscriptionCheckout()
        : renderCartCheckout()}
    </Layout>
  );
};

export default CheckoutPage;
