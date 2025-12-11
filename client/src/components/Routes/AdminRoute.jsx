import { useState, useEffect } from "react";
import { useAuth } from "../../context/auth";
import { Outlet } from "react-router-dom";
import axios from "axios";
import Spinner from "../Spinner";

// Guard for admin area; relies on backend /admin-auth check
export default function AdminRoute() {
  const [ok, setOk] = useState(false);
  const contextValue = useAuth();
  const auth = contextValue[0];
  const authLoading = contextValue[5]; // Get authLoading from context

  useEffect(() => {
    const authCheck = async () => {
      try {
        // Wait for auth to load from localStorage
        if (authLoading) {
          return;
        }

        if (!auth?.token) {
          window.location.href = "/adminlogin";
          return;
        }

        const res = await axios.get("/api/v1/auth/admin-auth", {
          headers: {
            Authorization: auth.token,
          },
        });

        if (res.data.ok) {
          setOk(true);
        } else {
          setOk(false);
          localStorage.removeItem("auth");
          window.location.href = "/adminlogin";
        }
      } catch (error) {
        console.error("Admin auth check failed:", error);
        setOk(false);
        localStorage.removeItem("auth");
        window.location.href = "/adminlogin";
      }
    };

    authCheck();
  }, [auth?.token, authLoading]);

  // Show spinner while auth is loading
  if (authLoading) {
    return <Spinner path="" />;
  }

  return ok ? <Outlet /> : <Spinner path="" />;
}
