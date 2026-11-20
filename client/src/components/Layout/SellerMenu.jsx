import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import logo from "../../../src/assets/images/logo.png";

const SellerMenu = () => {
  // Same behaviour as AdminMenu: collapsed on compact screens, and the page content
  // is offset via the --admin-sidebar-width variable read by Layout/Footer.
  const [isCollapsed, setIsCollapsed] = useState(() => window.innerWidth < 1024);

  useEffect(() => {
    const onResize = () => setIsCollapsed(window.innerWidth < 1024);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--admin-sidebar-width", isCollapsed ? "60px" : "250px");
  }, [isCollapsed]);

  return (
    <>
      <div
        className={`admin-sidebar border-end h-100 d-flex flex-column ${isCollapsed ? "collapsed" : "expanded"}`}
        style={{ width: isCollapsed ? "60px" : "250px", transition: "width 0.2s ease", position: "fixed", top: 0, left: 0, zIndex: 1000, overflowY: "auto", overflowX: "hidden", backgroundColor: "#101922", color: "#e5e7eb", borderRight: "1px solid #1e293b" }}
      >
        <div className="d-flex align-items-center justify-content-between p-3 mb-2" style={{ height: "60px", borderBottom: "1px solid #1e293b" }}>
          {!isCollapsed && (
            <div className="d-flex align-items-center gap-2 overflow-hidden">
              <NavLink to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                <img
                  src={logo}
                  alt="Logo"
                  style={{ height: 28, width: 28, borderRadius: 6, objectFit: "contain", marginRight: "8px" }}
                />
                <span style={{ fontSize: "16px", fontWeight: "600", color: "#fff" }}>Seller</span>
              </NavLink>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{ background: "transparent", border: "none", color: "#9ca3af", cursor: "pointer", marginLeft: isCollapsed ? "auto" : "0", marginRight: isCollapsed ? "auto" : "0", padding: "4px" }}
          >
            {isCollapsed ? <Menu size={20} /> : <X size={20} />}
          </button>
        </div>

        <div style={{ paddingBottom: "20px" }}>
          <NavLink
            to="/seller/dashboard"
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              padding: "12px 16px",
              backgroundColor: isActive ? "rgba(19, 127, 236, 0.2)" : "transparent",
              borderLeft: isActive ? "3px solid #137fec" : "3px solid transparent",
              color: isActive ? "#fff" : "#e5e7eb",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: isActive ? "500" : "400"
            })}
          >
            <span style={{ marginRight: "10px", display: "flex", alignItems: "center" }}>📊</span>
            {!isCollapsed && (
              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Dashboard</span>
            )}
          </NavLink>

          <NavLink
            to="/seller/listings"
            end
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              padding: "12px 16px",
              backgroundColor: isActive ? "rgba(19, 127, 236, 0.2)" : "transparent",
              borderLeft: isActive ? "3px solid #137fec" : "3px solid transparent",
              color: isActive ? "#fff" : "#e5e7eb",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: isActive ? "500" : "400"
            })}
          >
            <span style={{ marginRight: "10px", display: "flex", alignItems: "center" }}>📦</span>
            {!isCollapsed && (
              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>My Listings</span>
            )}
          </NavLink>

          <NavLink
            to="/seller/listings/new"
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              padding: "12px 16px",
              backgroundColor: isActive ? "rgba(19, 127, 236, 0.2)" : "transparent",
              borderLeft: isActive ? "3px solid #137fec" : "3px solid transparent",
              color: isActive ? "#fff" : "#e5e7eb",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: isActive ? "500" : "400"
            })}
          >
            <span style={{ marginRight: "10px", display: "flex", alignItems: "center" }}>➕</span>
            {!isCollapsed && (
              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Add Listing</span>
            )}
          </NavLink>

          <NavLink
            to="/seller/orders"
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              padding: "12px 16px",
              backgroundColor: isActive ? "rgba(19, 127, 236, 0.2)" : "transparent",
              borderLeft: isActive ? "3px solid #137fec" : "3px solid transparent",
              color: isActive ? "#fff" : "#e5e7eb",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: isActive ? "500" : "400"
            })}
          >
            <span style={{ marginRight: "10px", display: "flex", alignItems: "center" }}>📋</span>
            {!isCollapsed && (
              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Orders</span>
            )}
          </NavLink>

          <NavLink
            to="/seller/store"
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              padding: "12px 16px",
              backgroundColor: isActive ? "rgba(19, 127, 236, 0.2)" : "transparent",
              borderLeft: isActive ? "3px solid #137fec" : "3px solid transparent",
              color: isActive ? "#fff" : "#e5e7eb",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: isActive ? "500" : "400"
            })}
          >
            <span style={{ marginRight: "10px", display: "flex", alignItems: "center" }}>🏪</span>
            {!isCollapsed && (
              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Store Profile</span>
            )}
          </NavLink>

          <NavLink
            to="/"
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              padding: "12px 16px",
              backgroundColor: isActive ? "rgba(19, 127, 236, 0.2)" : "transparent",
              borderLeft: isActive ? "3px solid #137fec" : "3px solid transparent",
              color: isActive ? "#fff" : "#e5e7eb",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: isActive ? "500" : "400"
            })}
          >
            <span style={{ marginRight: "10px", display: "flex", alignItems: "center" }}>↩️</span>
            {!isCollapsed && (
              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Back to Store</span>
            )}
          </NavLink>
        </div>
      </div>
    </>
  );
};

export default SellerMenu;