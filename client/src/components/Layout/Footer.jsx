import React from "react";
import { Link } from "react-router-dom";
import { FaFacebook, FaInstagram, FaLinkedin, FaYoutube } from "react-icons/fa";


import { NavLink } from "react-router-dom"; // Changed from Link to NavLink



const Footer = () => {
  // Style for active links
  const activeStyle = {
    color: "#ff4444",
    fontWeight: "bold"
  };

  return (
    <div className="footer">
      <h1 className="text-center">All Right Reserved &copy; Smitox</h1>
      <p className="text-center mt-3">
        <NavLink 
          to="/about" 
          style={({ isActive }) => isActive ? activeStyle : { color: "white" }}
        >
          About
        </NavLink>|
        <NavLink 
          to="/contact"
          style={({ isActive }) => isActive ? activeStyle : { color: "white" }}
        >
          Contact
        </NavLink>|
        <NavLink 
          to="/policy"
          style={({ isActive }) => isActive ? activeStyle : { color: "white" }}
        >
          Privacy Policy
        </NavLink>|
        <NavLink 
          to="/terms"
          style={({ isActive }) => isActive ? activeStyle : { color: "white" }}
        >
          Terms
        </NavLink>|
        <NavLink 
          to="/returnPolicy"
          style={({ isActive }) => isActive ? activeStyle : { color: "white" }}
        >
          Return Policy
        </NavLink>
      </p>
      <div className="text-center mt-3">
        {/* Social Media Links with Icons */}
        <a
          href="https://www.facebook.com/Smitox-b2b-100585319028985/"
          target="_blank"
          rel="noopener noreferrer"
          className="social-link"
        >
          <FaFacebook style={{ color: "white", fontSize: "24px", margin: "0 10px" }} />
        </a>
        <a
          href="https://www.instagram.com/smitoxb2b?r=nametag"
          target="_blank"
          rel="noopener noreferrer"
          className="social-link"
        >
          <FaInstagram style={{ color: "white", fontSize: "24px", margin: "0 10px" }} />
        </a>
        <a
          href="https://www.linkedin.com/in/smitox-b2b-2a9475220"
          target="_blank"
          rel="noopener noreferrer"
          className="social-link"
        >
          <FaLinkedin style={{ color: "white", fontSize: "24px", margin: "0 10px" }} />
        </a>
        <a
          href="https://youtube.com/@smitoxb2b"
          target="_blank"
          rel="noopener noreferrer"
          className="social-link"
        >
          <FaYoutube style={{ color: "white", fontSize: "24px", margin: "0 10px" }} />
        </a>
      </div>
    </div>
  );
};

export default Footer;