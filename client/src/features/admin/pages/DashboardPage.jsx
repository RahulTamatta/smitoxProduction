import React from "react";
import AdminLayout from "../components/layout/AdminLayout";
import AdminDashboardComponent from "../components/dashboard/AdminDashboardComponent";
import { useAuth } from "../../../context/authContext";

const AdminDashboard = () => {
  const [auth] = useAuth();

  return (
    <AdminLayout>
      <AdminDashboardComponent auth={auth} />
    </AdminLayout>
  );
};

export default AdminDashboard;
