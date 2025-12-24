import axios from "axios";
import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "../../context/auth";
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
            "Cache-Control": "no-cache",
            "Pragma": "no-cache"
          },
        });

        console.log("Admin auth check response:", res);

        if (res.data.ok) {
          setOk(true);
        } else {
          console.warn("Admin auth failed: res.data.ok is false", res.data);
          setOk(false);
          // Only redirect if explicitly failed, but maybe avoid aggressive redirect
          localStorage.removeItem("auth");
          window.location.href = "/adminlogin";
        }
      } catch (error) {
        console.error("Admin auth check failed:", error);
        // If network error, maybe don't redirect immediately?
        // But for now, we follow existing logic but log it.
        setOk(false);
        // Only clear auth if 401 (Unauthorized)
        if (error.response && error.response.status === 401) {
          localStorage.removeItem("auth");
          window.location.href = "/adminlogin";
        }
        // For other errors (500, network), maybe just show error or redirect?
        // Current behavior: redirect. 
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
