import { ChevronDown, ChevronRight, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import logo from "../../../src/assets/images/logo.png";
import { useAuth } from "../../context/auth";
import { getUserCapabilities } from "../../utils/rbacHelper";

const AdminMenu = () => {
  // Treat widths below 1024px as "compact" where the sidebar should default to collapsed
  const [isCollapsed, setIsCollapsed] = useState(() => window.innerWidth < 1024);
  const [auth] = useAuth();
  const caps = getUserCapabilities(auth?.token);
  const location = useLocation();

  // State to track which menu is expanded
  const [expandedMenu, setExpandedMenu] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      const isCompact = window.innerWidth < 1024;
      if (isCompact) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleMenu = (menuId) => {
    if (expandedMenu === menuId) {
      setExpandedMenu(null);
    } else {
      setExpandedMenu(menuId);
      if (isCollapsed) setIsCollapsed(false);
    }
  };

  // Tree Item Component
  const TreeItem = ({ to, label, icon, id, children, isLeaf = true }) => {
    const isExpanded = expandedMenu === id;
    const isActive = isLeaf ? location.pathname === to : false;

    // Base style for all items
    const itemStyle = {
      display: "flex",
      alignItems: "center",
      padding: "8px 12px",
      cursor: "pointer",
      color: isActive ? "#fff" : "#e5e7eb", // Active white, otherwise light gray
      backgroundColor: isActive ? "rgba(19, 127, 236, 0.2)" : "transparent",
      borderLeft: isActive ? "3px solid #137fec" : "3px solid transparent",
      transition: "all 0.15s ease",
      fontSize: "14px",
      textDecoration: "none",
      width: "100%",
    };

    const hoverStyle = (e) => {
      if (!isActive) {
        e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
        e.currentTarget.style.color = "#fff";
      }
    };

    const leaveStyle = (e) => {
      if (!isActive) {
        e.currentTarget.style.backgroundColor = "transparent";
        e.currentTarget.style.color = "#e5e7eb";
      }
    };

    if (isLeaf) {
      return (
        <NavLink
          to={to}
          style={itemStyle}
          className="tree-item"
          onMouseEnter={hoverStyle}
          onMouseLeave={leaveStyle}
          title={label}
        >
          {icon && <span style={{ marginRight: "10px", display: "flex", alignItems: "center" }}>{icon}</span>}
          {!isCollapsed && <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>}
        </NavLink>
      );
    }

    // Branch (Folder) Logic
    return (
      <div className="tree-branch">
        <div
          style={{ ...itemStyle, backgroundColor: isExpanded ? "rgba(255, 255, 255, 0.03)" : "transparent" }}
          onClick={() => toggleMenu(id)}
          onMouseEnter={hoverStyle}
          onMouseLeave={(e) => {
            if (expandedMenu !== id) leaveStyle(e);
            else e.currentTarget.style.color = "#e5e7eb"; // Reset hover color but keep slight bg if expanded
          }}
          title={label}
        >
          {icon && <span style={{ marginRight: "10px", display: "flex", alignItems: "center" }}>{icon}</span>}
          {!isCollapsed && (
            <>
              <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </>
          )}
        </div>

        {/* Children Container */}
        {isExpanded && !isCollapsed && (
          <div style={{ marginLeft: "11px", borderLeft: "1px solid #333" }}>
            {children}
          </div>
        )}
      </div>
    );
  };

  // SubTree Item (Indented Child)
  const SubTreeItem = ({ to, label }) => (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        display: "flex",
        alignItems: "center",
        padding: "6px 12px 6px 16px", // Indented
        color: isActive ? "#137fec" : "#9ca3af", // Blue if active, muted gray otherwise
        textDecoration: "none",
        fontSize: "13px",
        transition: "color 0.15s ease",
      })}
      className="subtree-item"
    >
      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
    </NavLink>
  );

  return (
    <>
      <div
        className={`admin-sidebar border-end h-100 d-flex flex-column ${isCollapsed ? "collapsed" : "expanded"}`}
        style={{
          width: isCollapsed ? "60px" : "250px", // Slightly narrower collapsed width
          transition: "width 0.2s ease",
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 1000,
          overflowY: "auto",
          overflowX: "hidden",
          backgroundColor: "#101922", // Dark Theme Background
          color: "#e5e7eb", // Base Text Color
          borderRight: "1px solid #1e293b", // Dark border
        }}
      >
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between p-3 mb-2" style={{ height: "60px", borderBottom: "1px solid #1e293b" }}>
          {!isCollapsed && (
            <NavLink to="/" className="d-flex align-items-center gap-2 overflow-hidden" style={{ textDecoration: 'none' }}>
              <img
                src={logo}
                alt="Logo"
                style={{ height: 28, width: 28, borderRadius: 6, objectFit: "contain" }}
              />
              <span style={{ fontSize: "16px", fontWeight: "600", color: "#fff" }}>Admin</span>
            </NavLink>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              background: "transparent",
              border: "none",
              color: "#9ca3af",
              cursor: "pointer",
              marginLeft: isCollapsed ? "auto" : "0",
              marginRight: isCollapsed ? "auto" : "0",
              padding: "4px"
            }}
          >
            {isCollapsed ? <Menu size={20} /> : <X size={20} />}
          </button>
        </div>

        {/* Menu Items */}
        <div style={{ paddingBottom: "20px" }}>
          <TreeItem to="/dashboard/admin" icon="📊" label="Dashboard" />

          {(caps.includes("categories:read") || caps.includes("banners:read") || caps.includes("settings:read")) && (
            <TreeItem id="master" icon="⚙️" label="Master" isLeaf={false}>
              {caps.includes("categories:read") && <SubTreeItem to="/dashboard/admin/create-category" label="Category" />}
              {caps.includes("categories:read") && <SubTreeItem to="/dashboard/admin/create-subcategory" label="Sub Category" />}
              {caps.includes("categories:read") && <SubTreeItem to="/dashboard/admin/brand" label="Brand" />}
              {caps.includes("banners:read") && <SubTreeItem to="/dashboard/admin/create-banner" label="Banner" />}
              {caps.includes("settings:read") && <SubTreeItem to="/dashboard/admin/pincodes" label="Pincode" />}
              {caps.includes("settings:read") && <SubTreeItem to="/dashboard/admin/offer" label="Offers" />}
              {caps.includes("settings:read") && <SubTreeItem to="/dashboard/admin/units" label="Units" />}
              {caps.includes("settings:read") && <SubTreeItem to="/dashboard/admin/minimumOrder" label="Minimum order" />}
              {caps.includes("productforyou:read") && <SubTreeItem to="/dashboard/admin/productforyou" label="App Home" />}
            </TreeItem>
          )}

          {caps.includes("products:write") && <TreeItem to="/dashboard/admin/create-product" icon="➕" label="Create Product" />}
          {caps.includes("products:read") && <TreeItem to="/dashboard/admin/products" icon="📦" label="Products" />}

          <TreeItem to="/dashboard/admin/seller-products" icon="🏪" label="Sellers Products" />
          <TreeItem to="/dashboard/admin/delivery-charges" icon="🚚" label="Delivery Charge" />

          {caps.includes("users:read") && (
            <TreeItem id="users" icon="👥" label="Users Details" isLeaf={false}>
              <SubTreeItem to="/dashboard/admin/users/all" label="All Users & Sellers" />
              <SubTreeItem to="/dashboard/admin/users/seller-commission" label="Commission" />
              <SubTreeItem to="/dashboard/admin/usersLists" label="Users Cartlist" />
            </TreeItem>
          )}

          {caps.includes("orders:read") && (
            <TreeItem id="orders" icon="📋" label="Orders" isLeaf={false}>
              <SubTreeItem to="/dashboard/admin/orders" label="Your Orders" />
              <SubTreeItem to="/dashboard/admin/orders/return" label="Return Orders" />
              <SubTreeItem to="/dashboard/admin/orders/sellers" label="Sellers Orders" />
            </TreeItem>
          )}

          {caps.includes("analytics:read") && <TreeItem to="/dashboard/admin/analytics" icon="📈" label="Analytics" />}

          {caps.includes("subscriptions:read") && (
            <TreeItem id="subscriptions" icon="💳" label="Sub Management" isLeaf={false}>
              <SubTreeItem to="/dashboard/admin/subscription-management" label="View All" />
              <SubTreeItem to="/dashboard/admin/subscription-management?tab=create" label="Create Plan" />
              <SubTreeItem to="/dashboard/admin/subscription-management?tab=subscriptions" label="Subscriptions" />
              <SubTreeItem to="/dashboard/admin/subscription-management?tab=active" label="Active Plans" />
              <SubTreeItem to="/dashboard/admin/subscription-management?tab=inactive" label="Inactive Plans" />
              <SubTreeItem to="/dashboard/admin/subscription-management?tab=analytics" label="Analytics" />
            </TreeItem>
          )}

          {caps.includes("settings:read") && (
            <TreeItem id="settings" icon="⚡" label="Setting" isLeaf={false}>
              <SubTreeItem to="/dashboard/admin/staff" label="Staff" />
              <SubTreeItem to="/dashboard/admin/post-requirement" label="POST Requirement" />
              <SubTreeItem to="/dashboard/admin/app-content" label="App Content" />
              <SubTreeItem to="/dashboard/admin/app-notification" label="App Notification" />
            </TreeItem>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminMenu;