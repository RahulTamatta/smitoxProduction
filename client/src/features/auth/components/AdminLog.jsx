import React, { useState } from "react";
import Layout from "../../../components/Layout/Layout";
import axios from "axios";
import { useAuth } from "../../../context/authContext";
import { useNavigate, useLocation, Link } from "react-router-dom";
import toast from "react-hot-toast";
import "../../../assets/styles/AuthStyles.css";
// Updated AdminLogin Component
const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [auth, setAuth] = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("/api/v1/auth/login", {
        email_id: email,
        password
      });

      if (res.data.success) {
        //toast.success(res.data.message);
        setAuth({
          ...auth,
          user: res.data.user,
          token: res.data.token,
          refreshToken: res.data.refreshToken,
        });
        localStorage.setItem("auth", JSON.stringify({
          ...res.data,
          refreshToken: res.data.refreshToken
        }));

        // JWT expiry logging for access token
        if (res.data.token) {
          try {
            const payload = JSON.parse(atob(res.data.token.split('.')[1]));
            const exp = payload.exp * 1000;
            const now = Date.now();
            const secondsLeft = Math.round((exp - now) / 1000);
            console.log('[Auth] Access token expires at:', new Date(exp).toLocaleTimeString(), '| Seconds remaining:', secondsLeft);
          } catch (e) {
            console.log('[Auth] Could not decode access token:', e);
          }
        }
        navigate(`/dashboard/admin`);
      } else {
        //toast.error(res.data.message);
      }
    } catch (error) {
      console.log(error);
      ////toast.error("Login failed");
    }
  };

  return (
    <Layout title="Login - Smitox">
      <div className="form-container" style={{ minHeight: "90vh" }}>
        <form onSubmit={handleSubmit}>
          <h4 className="title">LOGIN FORM</h4>
          <div className="mb-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-control"
              placeholder="Enter Your Email"
              required
            />
          </div>
          <div className="mb-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-control"
              placeholder="Enter Your Password"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">
            LOGIN
          </button>
          <p className="mt-3">
            Don't have an account? 
            <span 
              onClick={() => navigate("/register")} 
              style={{ color: 'blue', cursor: 'pointer', marginLeft: '5px' }}
            >
              Register
            </span>
          </p>
        </form>
      </div>
    </Layout>
  );
};


export default AdminLogin;
