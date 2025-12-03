import React from "react";
import AdminMenu from "../../components/Layout/AdminMenu";
import Layout from "./../../components/Layout/Layout";
import { useAuth } from "../../context/auth";
const AdminDashboard = () => {
  const [auth] = useAuth();
  return (
    <Layout>
      <AdminMenu />
      <div className="container-fluid dashboard">
        <div className="row">
          <div className="col-md-12">
            <div className="admin-page-header">
              <div>
                <h1 className="admin-page-title">Dashboard Overview</h1>
                <p className="admin-page-subtitle">
                  Admin panel for managing products, users and orders.
                </p>
              </div>
            </div>

            <div className="admin-kpi-grid">
              <div className="admin-card">
                <div className="admin-kpi-title">Admin Name</div>
                <div className="admin-kpi-value">
                  {auth?.user?.user_fullname || "-"}
                </div>
              </div>
              <div className="admin-card">
                <div className="admin-kpi-title">Admin Email</div>
                <div className="admin-kpi-value">
                  {auth?.user?.email_id || "-"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
