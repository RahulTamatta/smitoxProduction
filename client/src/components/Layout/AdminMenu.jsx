import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { Dropdown } from "react-bootstrap";
import logo from "../../../src/assets/images/logo.png";
import { Menu, X } from "lucide-react";
import { useAuth } from "../../context/auth";
import { getUserCapabilities } from "../../utils/rbacHelper";
// import 'bootstrap/dist/css/bootstrap.min.css';

const AdminMenu = () => {
  // Treat widths below 1024px as "compact" where the sidebar should default to collapsed
  const [isCollapsed, setIsCollapsed] = useState(() => window.innerWidth < 1024);
  const [auth] = useAuth();
  const caps = getUserCapabilities(auth?.token);

  useEffect(() => {
    const handleResize = () => {
      const isCompact = window.innerWidth < 1024;

      // Auto-collapse when entering compact viewports, expand on desktop
      if (isCompact) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      <div className={`admin-sidebar ${isCollapsed ? "collapsed" : "expanded"}`}>
        <div className="admin-sidebar-header">
          {!isCollapsed && (
            <div className="d-flex align-items-center" style={{ gap: "8px", flex: 1 }}>
              <img
                src={logo}
                alt="Smitox Logo"
                style={{ height: 32, width: 32, borderRadius: 8, objectFit: "contain" }}
              />
              <h4 className="mb-0">Admin Panel</h4>
            </div>
          )}
          <button
            className="admin-sidebar-toggle"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <Menu size={20} /> : <X size={20} />}
          </button>
        </div>

        <div className="list-group dashboard-menu">
          <NavLink to="/dashboard/admin" className="list-group-item list-group-item-action" title="Dashboard">
            <span className="menu-icon">📊</span>
            {!isCollapsed && <span className="menu-label">Dashboard</span>}
          </NavLink>
          
          {caps.includes("categories:read") || caps.includes("banners:read") || caps.includes("settings:read") ? (
          <Dropdown className="w-100">
            <Dropdown.Toggle variant="secondary" id="masterDropdown" className="list-group-item list-group-item-action w-100 menu-item-dropdown" title="Master">
              <span className="menu-icon">⚙️</span>
              {!isCollapsed && <span className="menu-label">Master</span>}
            </Dropdown.Toggle>
            <Dropdown.Menu className="admin-submenu">
              {caps.includes("categories:read") && (
                <Dropdown.Item as={NavLink} to="/dashboard/admin/create-category">Category</Dropdown.Item>
              )}
              {caps.includes("categories:read") && (
                <Dropdown.Item as={NavLink} to="/dashboard/admin/create-subcategory">Sub Category</Dropdown.Item>
              )}
              {caps.includes("categories:read") && (
                <Dropdown.Item as={NavLink} to="/dashboard/admin/brand">Brand</Dropdown.Item>
              )}
              {caps.includes("banners:read") && (
                <Dropdown.Item as={NavLink} to="/dashboard/admin/create-banner">Banner</Dropdown.Item>
              )}
              {caps.includes("settings:read") && (
                <Dropdown.Item as={NavLink} to="/dashboard/admin/pincodes">Pincode</Dropdown.Item>
              )}
              {caps.includes("settings:read") && (
                <Dropdown.Item as={NavLink} to="/dashboard/admin/offer">Offers</Dropdown.Item>
              )}
              {caps.includes("settings:read") && (
                <Dropdown.Item as={NavLink} to="/dashboard/admin/units">Units</Dropdown.Item>
              )}
              {caps.includes("settings:read") && (
                <Dropdown.Item as={NavLink} to="/dashboard/admin/minimumOrder">Minimum order</Dropdown.Item>
              )}
              {caps.includes("productforyou:read") && (
                <Dropdown.Item as={NavLink} to="/dashboard/admin/productforyou">App Home</Dropdown.Item>
              )}
            </Dropdown.Menu>
          </Dropdown>
          ) : null}

          {caps.includes("products:write") && (
          <NavLink to="/dashboard/admin/create-product" className="list-group-item list-group-item-action" title="Create Product">
            <span className="menu-icon">➕</span>
            {!isCollapsed && <span className="menu-label">Create Product</span>}
          </NavLink>
          )}
          {caps.includes("products:read") && (
          <NavLink to="/dashboard/admin/products" className="list-group-item list-group-item-action" title="Products">
            <span className="menu-icon">📦</span>
            {!isCollapsed && <span className="menu-label">Products</span>}
          </NavLink>
          )}
          <NavLink to="/dashboard/admin/seller-products" className="list-group-item list-group-item-action" title="Sellers Products">
            <span className="menu-icon">🏪</span>
            {!isCollapsed && <span className="menu-label">Sellers Products</span>}
          </NavLink>
          <NavLink to="/dashboard/admin/delivery-charges" className="list-group-item list-group-item-action" title="Product Delivery Charge">
            <span className="menu-icon">🚚</span>
            {!isCollapsed && <span className="menu-label">Delivery Charge</span>}
          </NavLink>

          {caps.includes("users:read") && (
          <Dropdown className="w-100">
            <Dropdown.Toggle variant="secondary" id="usersDropdown" className="list-group-item list-group-item-action w-100 menu-item-dropdown" title="Users Details">
              <span className="menu-icon">👥</span>
              {!isCollapsed && <span className="menu-label">Users Details</span>}
            </Dropdown.Toggle>
            <Dropdown.Menu className="admin-submenu">
              <Dropdown.Item as={NavLink} to="/dashboard/admin/users/all">All Users & Sellers</Dropdown.Item>
              <Dropdown.Item as={NavLink} to="/dashboard/admin/users/seller-commission">Commission</Dropdown.Item>
              <Dropdown.Item as={NavLink} to="/dashboard/admin/usersLists">Users Cartlist</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
          )}

          {caps.includes("orders:read") && (
          <Dropdown className="w-100">
            <Dropdown.Toggle variant="secondary" id="ordersDropdown" className="list-group-item list-group-item-action w-100 menu-item-dropdown" title="Orders">
              <span className="menu-icon">📋</span>
              {!isCollapsed && <span className="menu-label">Orders</span>}
            </Dropdown.Toggle>
            <Dropdown.Menu className="admin-submenu">
              <Dropdown.Item as={NavLink} to="/dashboard/admin/orders">Your Orders</Dropdown.Item>
              <Dropdown.Item as={NavLink} to="/dashboard/admin/orders/return">Return Orders</Dropdown.Item>
              <Dropdown.Item as={NavLink} to="/dashboard/admin/orders/sellers">Sellers Orders</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
          )}

          {caps.includes("analytics:read") && (
          <NavLink to="/dashboard/admin/analytics" className="list-group-item list-group-item-action" title="Analytics">
            <span className="menu-icon">📈</span>
            {!isCollapsed && <span className="menu-label">Analytics</span>}
          </NavLink>
          )}

          {caps.includes("subscriptions:read") && (
          <Dropdown className="w-100">
            <Dropdown.Toggle variant="secondary" id="subscriptionsDropdown" className="list-group-item list-group-item-action w-100 menu-item-dropdown" title="Subscription Management">
              <span className="menu-icon">💳</span>
              {!isCollapsed && <span className="menu-label">Subscription Management</span>}
            </Dropdown.Toggle>
            <Dropdown.Menu className="admin-submenu">
              <Dropdown.Item as={NavLink} to="/dashboard/admin/subscription-management">View All</Dropdown.Item>
              <Dropdown.Item as={NavLink} to="/dashboard/admin/subscription-management?tab=create">Create Plan</Dropdown.Item>
              <Dropdown.Item as={NavLink} to="/dashboard/admin/subscription-management?tab=subscriptions">Subscriptions</Dropdown.Item>
              <Dropdown.Item as={NavLink} to="/dashboard/admin/subscription-management?tab=active">Active Plans</Dropdown.Item>
              <Dropdown.Item as={NavLink} to="/dashboard/admin/subscription-management?tab=inactive">Inactive Plans</Dropdown.Item>
              <Dropdown.Item as={NavLink} to="/dashboard/admin/subscription-management?tab=analytics">Analytics</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
          )}

          {caps.includes("settings:read") && (
          <Dropdown className="w-100">
            <Dropdown.Toggle variant="secondary" id="settingsDropdown" className="list-group-item list-group-item-action w-100 menu-item-dropdown" title="Setting">
              <span className="menu-icon">⚡</span>
              {!isCollapsed && <span className="menu-label">Setting</span>}
            </Dropdown.Toggle>
            <Dropdown.Menu className="admin-submenu">
              <Dropdown.Item as={NavLink} to="/dashboard/admin/staff">Staff</Dropdown.Item>
              <Dropdown.Item as={NavLink} to="/dashboard/admin/post-requirement">POST Requirement</Dropdown.Item>
              <Dropdown.Item as={NavLink} to="/dashboard/admin/app-content">App Content</Dropdown.Item>
              <Dropdown.Item as={NavLink} to="/dashboard/admin/app-notification">App Notification</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminMenu;