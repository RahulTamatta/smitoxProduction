import React from "react";
import AdminLayout from "../../features/admin/components/layout/AdminLayout";
import AdminDashboardComponent from "../../features/admin/components/dashboard/AdminDashboardComponent";
import { useAuth } from "../../context/auth";

const AdminDashboard = () => {
  const [auth] = useAuth();

  return (
    <AdminLayout>
      <AdminDashboardComponent auth={auth} />
    </AdminLayout>
  );
};

export default AdminDashboard;
