import React from "react";
import AdminLayout from "./AdminLayout";

const AdminPageTemplate = ({ 
  title = "Admin Page", 
  children, 
  breadcrumbs = [], 
  actions = null,
  loading = false 
}) => {
  return (
    <AdminLayout title={title}>
      {/* Page Header */}
      <div className="admin-page-header">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <h1 className="admin-page-title">{title}</h1>
            {breadcrumbs.length > 0 && (
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb admin-breadcrumb">
                  {breadcrumbs.map((crumb, index) => (
                    <li 
                      key={index} 
                      className={`breadcrumb-item ${index === breadcrumbs.length - 1 ? 'active' : ''}`}
                    >
                      {index === breadcrumbs.length - 1 ? (
                        crumb.label
                      ) : (
                        <a href={crumb.href} className="text-decoration-none">{crumb.label}</a>
                      )}
                    </li>
                  ))}
                </ol>
              </nav>
            )}
          </div>
          {actions && (
            <div className="admin-page-actions">
              {actions}
            </div>
          )}
        </div>
      </div>

      {/* Page Content */}
      <div className="admin-page-content">
        {loading ? (
          <div className="admin-card">
            <div className="admin-card-body text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3 text-muted">Loading...</p>
            </div>
          </div>
        ) : (
          children
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminPageTemplate;
