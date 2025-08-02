// ===================================
// ADMIN DASHBOARD COMPONENT
// ===================================

import React from 'react';

const AdminDashboardComponent = ({ auth }) => {
  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          {/* Page Header */}
          <div className="d-flex justify-between align-center mb-lg">
            <h1 className="heading-1 mb-0">Admin Dashboard</h1>
            <div className="text-right">
              <p className="text-secondary mb-0">Welcome back!</p>
            </div>
          </div>

          {/* Admin Info Card */}
          <div className="card mb-xl">
            <div className="card-body p-lg">
              <h2 className="heading-3 text-primary mb-base">Administrator Information</h2>
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-base">
                    <label className="font-semibold text-secondary">Full Name:</label>
                    <p className="text-large mb-0">{auth?.user?.user_fullname || 'N/A'}</p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-base">
                    <label className="font-semibold text-secondary">Email Address:</label>
                    <p className="text-large mb-0">{auth?.user?.email_id || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Row */}
          <div className="row g-lg mb-xl">
            <div className="col-md-3 col-sm-6">
              <div className="card text-center">
                <div className="card-body p-lg">
                  <div className="text-primary mb-sm">
                    <i className="fas fa-box fa-2x"></i>
                  </div>
                  <h3 className="heading-4 mb-xs">Products</h3>
                  <p className="text-muted text-small">Manage inventory</p>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-sm-6">
              <div className="card text-center">
                <div className="card-body p-lg">
                  <div className="text-primary mb-sm">
                    <i className="fas fa-shopping-cart fa-2x"></i>
                  </div>
                  <h3 className="heading-4 mb-xs">Orders</h3>
                  <p className="text-muted text-small">Track orders</p>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-sm-6">
              <div className="card text-center">
                <div className="card-body p-lg">
                  <div className="text-primary mb-sm">
                    <i className="fas fa-users fa-2x"></i>
                  </div>
                  <h3 className="heading-4 mb-xs">Users</h3>
                  <p className="text-muted text-small">User management</p>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-sm-6">
              <div className="card text-center">
                <div className="card-body p-lg">
                  <div className="text-primary mb-sm">
                    <i className="fas fa-chart-line fa-2x"></i>
                  </div>
                  <h3 className="heading-4 mb-xs">Analytics</h3>
                  <p className="text-muted text-small">View reports</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div className="card-body p-lg">
              <h3 className="heading-3 mb-lg">Quick Actions</h3>
              <div className="row g-base">
                <div className="col-md-4">
                  <a href="/dashboard/admin/create-product" className="btn btn-primary w-full d-flex align-center justify-center">
                    <i className="fas fa-plus mr-sm"></i>
                    Add New Product
                  </a>
                </div>
                <div className="col-md-4">
                  <a href="/dashboard/admin/products" className="btn btn-secondary w-full d-flex align-center justify-center">
                    <i className="fas fa-list mr-sm"></i>
                    View All Products
                  </a>
                </div>
                <div className="col-md-4">
                  <a href="/dashboard/admin/orders" className="btn btn-primary w-full d-flex align-center justify-center">
                    <i className="fas fa-eye mr-sm"></i>
                    View Orders
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardComponent;
