import React, { useState } from "react";
import { useAuth } from "../../context/auth";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const Verification = () => {
  const [auth, setAuth] = useAuth();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleVerify = async () => {
    setLoading(true);
    try {
      const res = await axios.post("/api/v1/auth/verify-otp", {
        sessionId: auth.sessionId,
        phoneNumber: auth.user?.mobile_no || auth.user?.phoneNumber,
        otp,
      });
      if (res.data.success && res.data.user.verified) {
        // Update auth context and localStorage
        const updatedAuth = { ...auth, user: res.data.user };
        setAuth(updatedAuth);
        localStorage.setItem("auth", JSON.stringify(updatedAuth));
        toast.success("Verification successful!");
        navigate("/");
      } else {
        toast.error(res.data.message || "Verification failed");
      }
    } catch (err) {
      toast.error("Verification failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      const res = await axios.post("/api/v1/auth/send-otp", {
        phoneNumber: auth.user?.mobile_no || auth.user?.phoneNumber,
      });
      if (res.data.success) {
        toast.success("OTP resent!");
      } else {
        toast.error(res.data.message || "Failed to resend OTP");
      }
    } catch (err) {
      toast.error("Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verification-container">
      <h2>Account Verification</h2>
      <p>Please enter the OTP sent to your phone to verify your account.</p>
      <input
        type="text"
        placeholder="Enter OTP"
        value={otp}
        onChange={e => setOtp(e.target.value)}
        disabled={loading}
      />
      <button onClick={handleVerify} disabled={loading || !otp}>
        {loading ? "Verifying..." : "Verify"}
      </button>
      <button onClick={handleResend} disabled={loading} style={{marginLeft: 8}}>
        Resend OTP
      </button>
    </div>
  );
};

export default Verification;
