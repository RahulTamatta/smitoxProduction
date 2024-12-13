import React, { useState } from "react";
import Layout from "./../../components/Layout/Layout";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import "../../styles/AuthStyles.css";
import { useAuth } from "../../context/auth";

const Login = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [auth, setAuth] = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const sendOTP = async () => {
    try {
      const response = await axios.post("/api/v1/auth/send-otp", { phoneNumber });
      if (response.data.success) {
        setSessionId(response.data.sessionId);
        setShowOtpInput(true);
        toast.success("OTP sent successfully");
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error("Error sending OTP");
    }
  };

  const verifyOTPAndLogin = async () => {
    try {
      const res = await axios.post("/api/v1/auth/verify-otp", {
        sessionId,
        phoneNumber,
        otp,
      });

      if (res && res.data.success) {
        toast.success(res.data.message);
        setAuth({
          ...auth,
          user: res.data.user,
          token: res.data.token,
        });
        console.log("user id",res);
        localStorage.setItem("auth", JSON.stringify(res.data));
        navigate(location.state || "/");
      } else {
        // If user does not exist, navigate to registration
        if (res.data.message.includes("please register")) {
          navigate("/register", { state: { phoneNumber } });
        } else {
          toast.error(res.data.message);
        }
      }
    } catch (error) {
      console.log(error);
      if (error.response && error.response.status === 404) {
        // User not found, navigate to registration
        navigate("/register", { state: { phoneNumber } });
      } else {
        toast.error("Something went wrong");
      }
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!showOtpInput) {
      sendOTP();
    } else {
      verifyOTPAndLogin();
    }
  };

  return (
    <Layout title="Login - Ecommerce App">
      <div className="form-container" style={{ minHeight: "90vh" }}>
        <form onSubmit={handleSubmit}>
          <h4 className="title">LOGIN FORM</h4>
          <div className="mb-3">
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="form-control"
              placeholder="Enter Your Phone Number"
              required
            />
          </div>
          {showOtpInput && (
            <div className="mb-3">
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="form-control"
                placeholder="Enter OTP"
                required
              />
            </div>
          )}
          {/* Removed Forgot Password button */}
          <button type="submit" className="btn btn-primary">
            {showOtpInput ? "VERIFY OTP & LOGIN" : "SEND OTP"}
          </button>
        </form>
      </div>
    </Layout>
  );
};

export default Login;
