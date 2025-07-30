import React from "react";
import { Link } from "react-router-dom";
import { MenuOutlined, LogoutOutlined } from "@ant-design/icons";
import { useAuth } from "../../../../context/auth";
import logo from "../../../../assets/images/logo.png";

const AdminHeader = ({ onToggleSidebar }) => {
  const [auth, setAuth] = useAuth();

  const handleLogout = () => {
    setAuth({
      ...auth,
      user: null,
      token: "",
    });
    localStorage.removeItem("auth");
  };

  return (
    <div className="admin-header">
      <div className="admin-header-left">
        <button 
          className="hamburger-menu btn btn-link p-0"
          onClick={onToggleSidebar}
          style={{ 
            border: 'none', 
            background: 'transparent',
            fontSize: '18px',
            color: '#333',
            marginRight: '15px'
          }}
        >
          <MenuOutlined />
        </button>
        <Link to="/" className="admin-header-logo">
          <img 
            src={logo} 
            alt="Smitox Logo" 
            style={{ 
              height: '35px', 
              objectFit: 'contain' 
            }} 
          />
        </Link>
      </div>
      
      <div className="admin-header-right">
        <span className="admin-user-name" style={{ marginRight: '10px', fontSize: '14px' }}>
          {auth?.user?.user_fullname}
        </span>
        <Link 
          to="/login" 
          onClick={handleLogout}
          className="btn btn-link p-0"
          style={{ 
            color: '#d32f2f', 
            textDecoration: 'none',
            fontSize: '16px'
          }}
        >
          <LogoutOutlined />
        </Link>
      </div>
    </div>
  );
};

export default AdminHeader;
