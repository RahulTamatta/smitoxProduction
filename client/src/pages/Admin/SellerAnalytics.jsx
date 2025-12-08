import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const fmtDate = (d) => new Date(d).toLocaleDateString();

export default function SellerAnalytics() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/dashboard/admin/subscription-management?tab=analytics", { replace: true });
  }, [navigate]);
  return null;
}
