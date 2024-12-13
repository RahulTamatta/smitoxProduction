import React, { useState, useEffect } from "react";
import Layout from "./../../components/Layout/Layout";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import "../../styles/AuthStyles.css";

const Register = () => {
  const [user_fullname, setFullName] = useState("");
  const [email_id, setEmail] = useState("");
  const [mobile_no, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [pincode, setPincode] = useState("");
  const [answer, setAnswer] = useState("");
  const [live_product, setLiveProduct] = useState(false);
  const [credit, setCredit] = useState(0);
  const [b_form_status, setBFormStatus] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Pre-fill the phone number if it's available in the location state
    if (location.state && location.state.phoneNumber) {
      setPhone(location.state.phoneNumber);
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("/api/v1/auth/register", {
        user_fullname,
        email_id,
        mobile_no,
        address,
        pincode,
        answer,
        live_product,
        credit,
        b_form_status,
      });
      if (res && res.data.success) {
        toast.success(res.data.message);
        navigate("/");
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    }
  };

  return (
    <Layout title="Register - Ecommerce App">
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
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="form-control"
              placeholder="What is Your Favorite Sport?"
              required
            />
          </div>
          <div className="mb-3">
            <label>Live Product: </label>
            <input
              type="checkbox"
              checked={live_product}
              onChange={(e) => setLiveProduct(e.target.checked)}
            />
          </div>
          <div className="mb-3">
            <label>Credit: </label>
            <input
              type="number"
              value={credit}
              onChange={(e) => setCredit(e.target.value)}
              className="form-control"
              placeholder="Enter Your Credit"
              required
            />
          </div>
          <div className="mb-3">
            <label>B-Form Status: </label>
            <input
              type="number"
              value={b_form_status}
              onChange={(e) => setBFormStatus(e.target.value)}
              className="form-control"
              placeholder="Enter B-Form Status"
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
