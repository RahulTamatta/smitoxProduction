import { useState, useEffect } from "react";
import { useAuth } from "../../context/auth";
import { Outlet } from "react-router-dom";
import axios from "axios";
import Spinner from "../Spinner";

export default function PrivateRoute() {
  const [ok, setOk] = useState(false);
  const [auth] = useAuth();

  useEffect(() => {
    const authCheck = async () => {
      try {
        // If no token yet, see if auth is still initializing from localStorage
        if (!auth?.token) {
          const stored = localStorage.getItem("auth");
          if (!stored) {
            // Truly not logged in
            window.location.href = "/login";
          }
          // If stored auth exists, wait for AuthProvider to hydrate
          return;
        }

        const res = await axios.get("/api/v1/auth/user-auth", {
          headers: {
            Authorization: auth.token,
          },
        });
        if (res.data.ok) {
          setOk(true);
        } else {
          setOk(false);
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

    authCheck();
  }, [auth?.token]);

  return ok ? <Outlet /> : <Spinner />;
}
