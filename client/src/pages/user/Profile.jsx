import React, { useState, useEffect } from "react";
import UserMenu from "../../components/Layout/UserMenu";
import Layout from "./../../components/Layout/Layout";
import { useAuth } from "../../context/auth";
import toast from "react-hot-toast";
import axios from "axios";


const Profile = () => {
  // Context
  const [auth, setAuth] = useAuth();

  // State
  const [user_fullname, setName] = useState("");
  const [email_id, setEmail] = useState("");
  const [mobile_no, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [pincode, setPincode] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [landmark, setLandmark] = useState("");
  const [locationDetails, setLocationDetails] = useState(null);
  const [pincodeError, setPincodeError] = useState("");
  const [relatedLocations, setRelatedLocations] = useState([]);

  // Get user data - initialize all fields
  useEffect(() => {
    const { 
      email_id, 
      user_fullname, 
      mobile_no, 
      address, 
      pincode,
      city,
      state,
      landmark
    } = auth?.user || {};
    
    setName(user_fullname || "");
    setPhone(mobile_no || "");
    setEmail(email_id || "");
    setAddress(address || "");
    setPincode(pincode || "");
    setCity(city || "");
    setState(state || "");
    setLandmark(landmark || "");
  }, [auth?.user]);

  // Form submission - include new fields
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const { data } = await axios.put("/api/v1/auth/profile", {
        user_fullname,
        email_id,
        mobile_no,
        address,
        pincode,
        city,
        state,
        landmark
      });
      
      if (data?.error) {
        //toast.error(data.error);
      } else {
        setAuth({ ...auth, user: data?.updatedUser });
        let ls = localStorage.getItem("auth");
        ls = JSON.parse(ls);
        ls.user = data.updatedUser;
        localStorage.setItem("auth", JSON.stringify(ls));
        //toast.success("Profile Updated Successfully");
      }
    } catch (error) {
      console.log(error);
      //toast.error("Something went wrong");
    }
  };

  return (
    <Layout title={"Your Profile"}>
      <div className="container-fluid m-3 p-3 dashboard">
        <div className="row">
          <div className="col-md-3">
            <UserMenu />
          </div>
          <div className="col-md-8">
            <div className="form-container" style={{ marginTop: "-40px" }}>
              <form onSubmit={handleSubmit}>
                <h4 className="title">USER PROFILE</h4>
                
                <div className="mb-3">
                  <input
                    type="text"
                    value={user_fullname}
                    onChange={(e) => setName(e.target.value)}
                    className="form-control"
                    placeholder={user_fullname ? "Your Name" : "Enter your name..."}
                    autoFocus
                  />
                </div>
                <div className="mb-3">
                  <input
                    type="email"
                    value={email_id}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-control"
                    placeholder={email_id ? "Your Email" : "Enter your email..."}
                    disabled
                  />
                </div>
                <div className="mb-3">
                  <input
                    type="text"
                    value={mobile_no}
                    onChange={(e) => setPhone(e.target.value)}
                    className="form-control"
                    placeholder={mobile_no ? "Your Phone" : "Enter your phone number..."}
                  />
                </div>
                <div className="mb-3">
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="form-control"
                    placeholder={address ? "Your Address" : "Enter your address..."}
                  />
                </div>

                <div className="mb-3">
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="form-control"
                    placeholder={city ? "Your City" : "Enter your city..."}
                  />
                </div>
                <div className="mb-3">
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="form-control"
                    placeholder={state ? "Your State" : "Enter your state..."}
                  />
                </div>
                <div className="mb-3">
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    className="form-control"
                    placeholder={landmark ? "Your Landmark" : "Enter nearby landmark..."}
                  />
                </div>

                <div className="mb-3">
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="form-control"
                    placeholder={pincode ? "Your Pincode" : "Enter your pincode..."}
                  />
                  {pincodeError && (
                    <div className="text-danger mt-2">{pincodeError}</div>
                  )}
                  {locationDetails && (
                    <div className="mt-2">
                      <strong>Location:</strong> {locationDetails.full_address}
                    </div>
                  )}
                </div>

                <button type="submit" className="btn btn-primary">
                  UPDATE
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
