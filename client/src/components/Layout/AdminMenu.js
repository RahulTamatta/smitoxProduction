import React from "react";
import { NavLink } from "react-router-dom";
import { Dropdown } from "react-bootstrap";
// import 'bootstrap/dist/css/bootstrap.min.css';

const AdminMenu = () => {
  return (
    <>
      <div className="text-center">
        <div className="list-group dashboard-menu">
          <h4>Admin Panel</h4>
          <NavLink to="/dashboard/admin" className="list-group-item list-group-item-action">
            Dashboard
          </NavLink>
          
          <Dropdown>
            <Dropdown.Toggle variant="secondary" id="masterDropdown" className="list-group-item list-group-item-action w-100 text-left">
              Master
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item as={NavLink} to="/dashboard/admin/create-category">Category</Dropdown.Item>
              <Dropdown.Item as={NavLink} to="/dashboard/admin/create-subcategory">Sub Category</Dropdown.Item>
              <Dropdown.Item as={NavLink} to="/dashboard/admin/brand">Brand</Dropdown.Item>
              <Dropdown.Item as={NavLink} to="/dashboard/admin/create-banner">Banner</Dropdown.Item>
              <Dropdown.Item as={NavLink} to="/dashboard/admin/pincodes">Pincode</Dropdown.Item>
              <Dropdown.Item as={NavLink} to="/dashboard/admin/offer">Offers</Dropdown.Item>
              <Dropdown.Item as={NavLink} to="/dashboard/admin/units">Units</Dropdown.Item>
              <Dropdown.Item as={NavLink} to="/dashboard/admin/minimumOrder">Minimum order</Dropdown.Item>
              <Dropdown.Item as={NavLink} to="/dashboard/admin/productforyou">App Home</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>

          <NavLink to="/dashboard/admin/create-product" className="list-group-item list-group-item-action">
            Create Product
          </NavLink>
          <NavLink to="/dashboard/admin/products" className="list-group-item list-group-item-action">
            Products
          </NavLink>
          <NavLink to="/dashboard/admin/seller-products" className="list-group-item list-group-item-action">
            Sellers Products
          </NavLink>
          <NavLink to="/dashboard/admin/delivery-charges" className="list-group-item list-group-item-action">
            Product Delivery Charge
          </NavLink>

          <Dropdown>
            <Dropdown.Toggle variant="secondary" id="usersDropdown" className="list-group-item list-group-item-action w-100 text-left">
              Users Details
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item as={NavLink} to="/dashboard/admin/users/all">All Users & Sellers</Dropdown.Item>
              <Dropdown.Item as={NavLink} to="/dashboard/admin/users/seller-commission">Commission</Dropdown.Item>
              <Dropdown.Item as={NavLink} to="/dashboard/admin/usersLists">Users Cartlist</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>

          <Dropdown>
            <Dropdown.Toggle variant="secondary" id="ordersDropdown" className="list-group-item list-group-item-action w-100 text-left">
              Orders
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item as={NavLink} to="/dashboard/admin/orders">Your Orders</Dropdown.Item>
              <Dropdown.Item as={NavLink} to="/dashboard/admin/orders/return">Return Orders</Dropdown.Item>
              <Dropdown.Item as={NavLink} to="/dashboard/admin/orders/sellers">Sellers Orders</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>

          <NavLink to="/dashboard/admin/sales" className="list-group-item list-group-item-action">
            Sales Team
          </NavLink>

          <Dropdown>
            <Dropdown.Toggle variant="secondary" id="settingsDropdown" className="list-group-item list-group-item-action w-100 text-left">
              Setting
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item as={NavLink} to="/dashboard/admin/staff">Staff</Dropdown.Item>
              <Dropdown.Item as={NavLink} to="/dashboard/admin/post-requirement">POST Requirement</Dropdown.Item>
              <Dropdown.Item as={NavLink} to="/dashboard/admin/app-content">App Content</Dropdown.Item>
              <Dropdown.Item as={NavLink} to="/dashboard/admin/app-notification">App Notification</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>
    </>
  );
};

export default AdminMenu;