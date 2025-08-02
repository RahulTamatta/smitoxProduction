import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { Toaster } from "react-hot-toast";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";
import "../../styles/AdminLayout.css";

const AdminLayout = ({ children, title, description, keywords, author }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    if (isMobile) {
      setIsSidebarOpen(!isSidebarOpen);
    } else {
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="admin-layout">
      <Helmet>
        <meta charSet="utf-8" />
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords} />
        <meta name="author" content={author} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
      </Helmet>

      {/* Desktop Header with Hamburger Menu */}
      {!isMobile && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: isSidebarCollapsed ? '70px' : '270px',
          zIndex: 1000,
          transition: 'left 0.3s ease-in-out'
        }}>
          <button 
            className="btn btn-light"
            onClick={toggleSidebar}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              background: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            <i className="fas fa-bars"></i>
          </button>
        </div>
      )}

      {/* Mobile Header with Hamburger Menu */}
      {isMobile && (
        <AdminHeader onToggleSidebar={toggleSidebar} />
      )}

      {/* Sidebar */}
      <AdminSidebar 
        isOpen={isSidebarOpen} 
        onClose={closeSidebar}
        isMobile={isMobile}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebar}
      />

      {/* Main Content */}
      <div className="admin-content">
        <div className="admin-page-content">
          {children}
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobile && isSidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={closeSidebar}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999
          }}
        />
      )}

      {/* Toaster */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
            fontSize: '14px',
            padding: '12px 16px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
          },
          success: {
            style: {
              background: '#22c55e'
            }
          },
          error: {
            style: {
              background: '#ef4444'
            }
          }
        }}
      />
    </div>
  );
};

AdminLayout.defaultProps = {
  title: "Admin Dashboard - Smitox",
  description: "Admin dashboard for managing Smitox B2B marketplace",
  keywords: "admin, dashboard, management, smitox",
  author: "rahultamatta"
};

export default AdminLayout;
