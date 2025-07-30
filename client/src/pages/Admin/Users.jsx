import React from "react";
import AdminLayout from "../../features/admin/components/layout/AdminLayout";

const Users = () => {
  return (
    <AdminLayout title={"Dashboard - All Users"}>
      <div className="container-fluid m-3 p-3">
        <div className="row">
          <div className="col-md-12">
            <h1>All Users</h1>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Users;
