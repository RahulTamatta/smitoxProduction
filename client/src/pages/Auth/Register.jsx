import React, { useState, useEffect } from "react";
import Layout from "./../../components/Layout/Layout";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import "../../styles/AuthStyles.css";
import { useAuth } from "../../context/auth";

const Register = () => {
  const [user_fullname, setFullName] = useState("");
  const [email_id, setEmail] = useState("");
  const [mobile_no, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [pincode, setPincode] = useState("");
  const [sessionId, setSessionId] = useState(""); // State to store sessionId
// In Register.jsx, add these state variables at the top with other useState declarations:
const [city, setCity] = useState("");
const [landmark, setLandmark] = useState("");
const [state, setState] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const [auth, setAuth] = useAuth(); // Import useAuth for session handling

  useEffect(() => {
    // Pre-fill the phone number if it's available in the location state
    if (location.state && location.state.phoneNumber) {
      setPhone(location.state.phoneNumber);
    }
  }, [location.state]);

  useEffect(() => {
    // Pre-fill the phone number if it's available in the location state
    if (location.state && location.state.phoneNumber) {
      setPhone(location.state.phoneNumber);
    }
  }, [location.state]);

// Update the handleSubmit function to include these new fields:
const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const res = await axios.post("/api/v1/auth/register", {
      user_fullname,
      email_id,
      mobile_no,
      address,
      pincode,
      city,     // Add these
      landmark,  // new
      state,     // fields
    });
      if (res && res.data.success) {
        // Create a consistent auth object
        const authData = {
          user: res.data.user,
          token: res.data.token,
          refreshToken: res.data.refreshToken, // Store refreshToken
          sessionId: res.data.sessionId
        };

        // Set auth in state
        setAuth(authData);

        // Store full auth data in localStorage
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

        //toast.success(res.data.message);
        navigate("/"); // Redirect to home
      } else {
        //toast.error(res.data.message);
      }
    } catch (error) {
      console.log(error);
      ////toast.error("Something went wrong");
    }
  };


  return (
    <Layout title="Register - Smitox">
      <div className="form-container" style={{ minHeight: "90vh" }}>
        <form onSubmit={handleSubmit}>
          <h4 className="title">REGISTER FORM</h4>
          <div className="mb-3">
            <input
              type="text"
              value={user_fullname}
              onChange={(e) => setFullName(e.target.value)}
              className="form-control"
              placeholder="Enter Your Full Name"
              required
              autoFocus
            />
          </div>
          <div className="mb-3">
            <input
              type="email"
              value={email_id}
              onChange={(e) => setEmail(e.target.value)}
              className="form-control"
              placeholder="Enter Your Email"
              required
            />
          </div>
          <div className="mb-3">
            <input
              type="text"
              value={mobile_no}
              onChange={(e) => setPhone(e.target.value)}
              className="form-control"
              placeholder="Enter Your Phone Number"
              required
            />
          </div>
          <div className="mb-3">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="form-control"
              placeholder="Enter Your Address"
              required
            />
          </div>
          <div className="mb-3">
            <input
              type="text"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              className="form-control"
              placeholder="Enter Your PIN Code"
              required
            />
          </div>
          <div className="mb-3">
  <input
    type="text"
    value={city}
    onChange={(e) => setCity(e.target.value)}
    className="form-control"
    placeholder="Enter Your City"
    required
  />
</div>
<div className="mb-3">
  <input
    type="text"
    value={landmark}
    onChange={(e) => setLandmark(e.target.value)}
    className="form-control"
    placeholder="Enter Your Landmark"
  />
</div>
<div className="mb-3">
  <input
    type="text"
    value={state}
    onChange={(e) => setState(e.target.value)}
    className="form-control"
    placeholder="Enter Your State"
    required
  />
</div>
          <button type="submit" className="btn btn-primary">
            REGISTER
          </button>
        </form>
      </div>
    </Layout>
  );
};



export default Register;
