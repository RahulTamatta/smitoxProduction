import React, { useState, useEffect } from "react";
import Layout from "../../../components/Layout/Layout";
import axios from "axios";
import { useAuth } from "../../../context/authContext";
import { useNavigate, useLocation, Link } from "react-router-dom";
import toast from "react-hot-toast";
import "../../../assets/styles/AuthStyles.css";
const Login = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [auth, setAuth] = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    const storedAuth = localStorage.getItem("auth");
    if (storedAuth) {
      const parsedAuth = JSON.parse(storedAuth);
      setAuth(parsedAuth);
    }
  }, []);

  const verifyOTPAndLogin = async () => {
    try {
      const res = await axios.post("/api/v1/auth/verify-otp", {
        sessionId,
        phoneNumber,
        otp,
      });
  
      if (res.data.success) {
        const authData = {
          user: res.data.user,
          token: res.data.token,
          refreshToken: res.data.refreshToken,
          sessionId: res.data.sessionId || sessionId
        };
        setAuth(authData);
        localStorage.setItem("auth", JSON.stringify(authData));

        // JWT expiry logging for access token
        if (authData.token) {
          try {
            const payload = JSON.parse(atob(authData.token.split('.')[1]));
            const exp = payload.exp * 1000;
            const now = Date.now();
            const secondsLeft = Math.round((exp - now) / 1000);
            console.log('[Auth] Access token expires at:', new Date(exp).toLocaleTimeString(), '| Seconds remaining:', secondsLeft);
          } catch (e) {
            console.log('[Auth] Could not decode access token:', e);
          }
        }

        if (res.data.isNewUser) {
          navigate("/register", { state: { phoneNumber } });
        } else if (res.data.user && res.data.user.verified === false) {
          navigate("/verification");
        } else {
          navigate(location.state || "/");
        }
      } else {
        //toast.error(res.data.message);
      }
    } catch (error) {
      console.log(error);
      ////toast.error("Something went wrong");
    }
  }
  const sendOTP = async () => {
    try {
      const response = await axios.post("/api/v1/auth/send-otp", { phoneNumber });
      if (response.data.success) {
        setSessionId(response.data.sessionId);
        setShowOtpInput(true);
        //toast.success("OTP sent successfully");
      } else {
        //toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      ////toast.error("Error sending OTP");
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
    <Layout title="Login - Smitox">
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
