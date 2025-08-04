import { useState, useEffect } from "react";
import { useAuth } from "../../context/authContext";
import { Outlet, Navigate } from "react-router-dom";
import axios from "axios";
import Spinner from "../UI/Spinner";

export default function AdminRoute() {
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useAuth();

  useEffect(() => {
    const authCheck = async () => {
      try {
        // First check if we have auth data
        if (!auth?.token) {
          // Try to get auth data from localStorage
          const storedAuth = localStorage.getItem("auth");
          if (storedAuth) {
            const parsedAuth = JSON.parse(storedAuth);
            if (parsedAuth?.token) {
              // Update auth context and continue with validation
              setAuth(parsedAuth);
              // Validate with server
              const res = await axios.get("/api/v1/auth/admin-auth", {
                headers: {
                  Authorization: parsedAuth.token
                }
              });
              if (res.data.ok) {
                setOk(true);
              } else {
                localStorage.removeItem("auth");
                setAuth({ user: null, token: "" });
                setOk(false);
              }
            } else {
              setOk(false);
            }
          } else {
            setOk(false);
          }
        } else {
          // We have auth data, validate with server
          const res = await axios.get("/api/v1/auth/admin-auth", {
            headers: {
              Authorization: auth.token
            }
          });
          if (res.data.ok) {
            setOk(true);
          } else {
            localStorage.removeItem("auth");
            setAuth({ user: null, token: "" });
            setOk(false);
          }
        }
      } catch (error) {
        console.error("Admin auth check failed:", error);
        localStorage.removeItem("auth");
        setAuth({ user: null, token: "" });
        setOk(false);
      } finally {
        setLoading(false);
      }
    };
    
    authCheck();
  }, [auth?.token, setAuth]);

  if (loading) {
    return <Spinner path="" />;
  }

  return ok ? <Outlet /> : <Navigate to="/adminlogin" replace />;
}
