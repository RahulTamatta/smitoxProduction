import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/auth";
import Spinner from "../Spinner";

// Guard for the vendor portal. The server decides: /seller-portal/me only
// answers for an active seller account.
//   200 -> render the portal
//   401 -> session expired, go to login
//   403 -> signed in but not an active seller, show the application status page
export default function SellerRoute() {
  const contextValue = useAuth();
  const auth = contextValue[0];
  const authLoading = contextValue[5];
  const [state, setState] = useState("checking"); // checking | ok | notSeller | error

  const check = useCallback(async () => {
    setState("checking");
    try {
      await axios.get("/api/v1/seller-portal/me", {
        headers: { Authorization: auth.token },
      });
      setState("ok");
    } catch (error) {
      const status = error.response?.status;
      if (status === 401) {
        localStorage.removeItem("auth");
        window.location.href = "/login";
      } else if (status === 403) {
        setState("notSeller");
      } else {
        setState("error");
      }
    }
  }, [auth?.token]);

  useEffect(() => {
    if (authLoading || !auth?.token) return;
    check();
  }, [authLoading, auth?.token, check]);

  if (authLoading) return <Spinner path="" />;
  if (!auth?.token) return <Navigate to="/login" replace />;
  if (state === "ok") return <Outlet />;
  if (state === "notSeller") return <Navigate to="/seller/status" replace />;
  if (state === "error") {
    return (
      <div className="container text-center" style={{ padding: "64px 16px" }}>
        <p>We couldn&apos;t load your seller account. Please check your connection.</p>
        <button type="button" className="btn btn-primary" onClick={check}>
          Retry
        </button>
      </div>
    );
  }
  return <Spinner path="" />;
}
