import React from "react";
import { NavLink } from "react-router-dom";
import { Dropdown } from "react-bootstrap";
import { 
  DashboardOutlined, 
  AppstoreOutlined, 
  ShoppingOutlined, 
  UserOutlined, 
  ShoppingCartOutlined, 
  TeamOutlined, 
  SettingOutlined,
  CloseOutlined 
} from "@ant-design/icons";

const AdminSidebar = ({ isOpen, onClose, isMobile, isCollapsed, onToggleCollapse }) => {
  const sidebarClass = `admin-sidebar ${isOpen ? 'open' : ''} ${!isMobile && isCollapsed ? 'collapsed' : ''}`;

  return (
    <div className={sidebarClass}>
      {/* Close button for mobile */}
      {isMobile && (
        <div className="sidebar-header d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">Admin Panel</h5>
          <button 
            className="btn btn-link p-0"
            onClick={onClose}
            style={{ fontSize: '18px', color: '#666' }}
          >
            <CloseOutlined />
          </button>
        </div>
      )}

      {!isMobile && (
        <div className="text-center mb-4">
          <h4>Admin Panel</h4>
        </div>
      )}

      <div className="list-group dashboard-menu">
        <NavLink 
          to="/dashboard/admin" 
          className="list-group-item list-group-item-action d-flex align-items-center"
          onClick={isMobile ? onClose : undefined}
        >
          <DashboardOutlined style={{ marginRight: '10px' }} />
          Dashboard
        </NavLink>
        
        <Dropdown>
          <Dropdown.Toggle 
            variant="light" 
            id="masterDropdown" 
            className="list-group-item list-group-item-action w-100 text-left d-flex align-items-center justify-content-between"
          >
            <span>
              <AppstoreOutlined style={{ marginRight: '10px' }} />
              Master
            </span>
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item 
              as={NavLink} 
              to="/dashboard/admin/create-category"
              onClick={isMobile ? onClose : undefined}
            >
              Category
            </Dropdown.Item>
            <Dropdown.Item 
              as={NavLink} 
              to="/dashboard/admin/create-subcategory"
              onClick={isMobile ? onClose : undefined}
            >
              Sub Category
            </Dropdown.Item>
            <Dropdown.Item 
              as={NavLink} 
              to="/dashboard/admin/brand"
              onClick={isMobile ? onClose : undefined}
            >
              Brand
            </Dropdown.Item>
            <Dropdown.Item 
              as={NavLink} 
              to="/dashboard/admin/create-banner"
              onClick={isMobile ? onClose : undefined}
            >
              Banner
            </Dropdown.Item>
            <Dropdown.Item 
              as={NavLink} 
              to="/dashboard/admin/pincodes"
              onClick={isMobile ? onClose : undefined}
            >
              Pincode
            </Dropdown.Item>
            <Dropdown.Item 
              as={NavLink} 
              to="/dashboard/admin/offer"
              onClick={isMobile ? onClose : undefined}
            >
              Offers
            </Dropdown.Item>
            <Dropdown.Item 
              as={NavLink} 
              to="/dashboard/admin/units"
              onClick={isMobile ? onClose : undefined}
            >
              Units
            </Dropdown.Item>
            <Dropdown.Item 
              as={NavLink} 
              to="/dashboard/admin/minimumOrder"
              onClick={isMobile ? onClose : undefined}
            >
              Minimum order
            </Dropdown.Item>
            <Dropdown.Item 
              as={NavLink} 
              to="/dashboard/admin/productforyou"
              onClick={isMobile ? onClose : undefined}
            >
              App Home
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>

        <NavLink 
          to="/dashboard/admin/create-product" 
          className="list-group-item list-group-item-action d-flex align-items-center"
          onClick={isMobile ? onClose : undefined}
        >
          <ShoppingOutlined style={{ marginRight: '10px' }} />
          Create Product
        </NavLink>

        <NavLink 
          to="/dashboard/admin/products" 
          className="list-group-item list-group-item-action d-flex align-items-center"
          onClick={isMobile ? onClose : undefined}
        >
          <ShoppingOutlined style={{ marginRight: '10px' }} />
          Products
        </NavLink>

        <NavLink 
          to="/dashboard/admin/seller-products" 
          className="list-group-item list-group-item-action d-flex align-items-center"
          onClick={isMobile ? onClose : undefined}
        >
          <ShoppingOutlined style={{ marginRight: '10px' }} />
          Sellers Products
        </NavLink>

        <NavLink 
          to="/dashboard/admin/delivery-charges" 
          className="list-group-item list-group-item-action d-flex align-items-center"
          onClick={isMobile ? onClose : undefined}
        >
          <ShoppingOutlined style={{ marginRight: '10px' }} />
          Product Delivery Charge
        </NavLink>

        <Dropdown>
          <Dropdown.Toggle 
            variant="light" 
            id="usersDropdown" 
            className="list-group-item list-group-item-action w-100 text-left d-flex align-items-center justify-content-between"
          >
            <span>
              <UserOutlined style={{ marginRight: '10px' }} />
              Users Details
            </span>
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item 
              as={NavLink} 
              to="/dashboard/admin/users/all"
              onClick={isMobile ? onClose : undefined}
            >
              All Users & Sellers
            </Dropdown.Item>
            <Dropdown.Item 
              as={NavLink} 
              to="/dashboard/admin/users/seller-commission"
              onClick={isMobile ? onClose : undefined}
            >
              Commission
            </Dropdown.Item>
            <Dropdown.Item 
              as={NavLink} 
              to="/dashboard/admin/usersLists"
              onClick={isMobile ? onClose : undefined}
            >
              Users Cartlist
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>

        <Dropdown>
          <Dropdown.Toggle 
            variant="light" 
            id="ordersDropdown" 
            className="list-group-item list-group-item-action w-100 text-left d-flex align-items-center justify-content-between"
          >
            <span>
              <ShoppingCartOutlined style={{ marginRight: '10px' }} />
              Orders
            </span>
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item 
              as={NavLink} 
              to="/dashboard/admin/orders"
              onClick={isMobile ? onClose : undefined}
            >
              Your Orders
            </Dropdown.Item>
            <Dropdown.Item 
              as={NavLink} 
              to="/dashboard/admin/orders/return"
              onClick={isMobile ? onClose : undefined}
            >
              Return Orders
            </Dropdown.Item>
            <Dropdown.Item 
              as={NavLink} 
              to="/dashboard/admin/orders/sellers"
              onClick={isMobile ? onClose : undefined}
            >
              Sellers Orders
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>

        <NavLink 
          to="/dashboard/admin/sales" 
          className="list-group-item list-group-item-action d-flex align-items-center"
          onClick={isMobile ? onClose : undefined}
        >
          <TeamOutlined style={{ marginRight: '10px' }} />
          Sales Team
        </NavLink>

        <Dropdown>
          <Dropdown.Toggle 
            variant="light" 
            id="settingsDropdown" 
            className="list-group-item list-group-item-action w-100 text-left d-flex align-items-center justify-content-between"
          >
            <span>
              <SettingOutlined style={{ marginRight: '10px' }} />
              Setting
            </span>
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item 
              as={NavLink} 
              to="/dashboard/admin/staff"
              onClick={isMobile ? onClose : undefined}
            >
              Staff
            </Dropdown.Item>
            <Dropdown.Item 
              as={NavLink} 
              to="/dashboard/admin/post-requirement"
              onClick={isMobile ? onClose : undefined}
            >
              POST Requirement
            </Dropdown.Item>
            <Dropdown.Item 
              as={NavLink} 
              to="/dashboard/admin/app-content"
              onClick={isMobile ? onClose : undefined}
            >
              App Content
            </Dropdown.Item>
            <Dropdown.Item 
              as={NavLink} 
              to="/dashboard/admin/app-notification"
              onClick={isMobile ? onClose : undefined}
            >
              App Notification
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
    </div>
  );
};

export default AdminSidebar;
