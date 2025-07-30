import React from "react";
import AdminLayout from "../../features/admin/components/layout/AdminLayout";
import { useAuth } from "../../context/auth";

const AdminDashboard = () => {
  const [auth] = useAuth();

  return (
    <AdminLayout>
      <div className="container-fluid m-3 p-3 dashboard">
        <div className="row">
          <div className="col-md-12">
            <div className="card w-100 p-3">
              <h3>Admin Name: {auth?.user?.user_fullname}</h3>
              <h3>Admin Email: {auth?.user?.email_id}</h3>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
