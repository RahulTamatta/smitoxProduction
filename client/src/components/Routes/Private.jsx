import { useState, useEffect } from "react";
import { useAuth } from "../../context/auth";
import { Outlet } from "react-router-dom";
import axios from "axios";
import Spinner from "../Spinner";

export default function PrivateRoute() {
  const [ok, setOk] = useState(false);
  const [auth, setAuth] = useAuth();

  useEffect(() => {
    const authCheck = async () => {
      try {
        const res = await axios.get("/api/v1/auth/user-auth", {
          headers: {
            Authorization: auth?.token
          }
        });
        if (res.data.ok) {
          setOk(true);
        } else {
          setOk(false);
          // If unauthorized, clear auth and redirect to login
          localStorage.removeItem("auth");
          window.location.href = "/login";
        }
      } catch (error) {
        console.error("User auth check failed:", error);
        setOk(false);
        localStorage.removeItem("auth");
        window.location.href = "/login";
      }
    };
    
    if (auth?.token) {
      authCheck();
    } else {
      // If no token, redirect to login
      window.location.href = "/login";
    }
  }, [auth?.token]);

  return ok ? <Outlet /> : <Spinner />;
}
