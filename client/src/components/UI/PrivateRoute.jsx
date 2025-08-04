import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/auth";

// PrivateRoute for protecting routes based on authentication and verification status
const PrivateRoute = ({ children, ...rest }) => {
  const [auth] = useAuth();

  // Not logged in
  if (!auth?.token) {
    return <Navigate to="/login" replace />;
  }

  // Not verified
  if (auth.user && auth.user.verified === false) {
    return <Navigate to="/verification" replace />;
  }

  // Authenticated and verified
  return children ? children : <Outlet />;
};

export default PrivateRoute;
