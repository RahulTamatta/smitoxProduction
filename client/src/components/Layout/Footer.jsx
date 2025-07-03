import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { FaFacebook, FaInstagram, FaLinkedin, FaYoutube } from "react-icons/fa";

const Footer = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Style for active links
  const activeStyle = {
    color: "#ffffff",
    fontWeight: "bold",
    textDecoration: "none"
  };

  const linkStyle = {
    color: "white",
    textDecoration: "none",
    padding: "0 8px",
    fontSize: isMobile ? "0.85rem" : "0.95rem",
    transition: "color 0.3s ease"
  };
  
  // Footer container style with red background
  const footerStyle = {
    backgroundColor: "#d32f2f", // Matching header color
    color: "white",
    marginTop: "auto", // Push footer to bottom
    width: "100%",
    borderTop: "1px solid #b71c1c"
  };

  const containerStyle = {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: isMobile ? "2rem 1rem" : "2.5rem 1rem"
  };

  const copyrightStyle = {
    fontSize: isMobile ? "1rem" : "1.1rem",
    fontWeight: "600",
    marginBottom: "1.5rem",
    textAlign: "center"
  };

  const linksContainerStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    gap: isMobile ? "0.5rem" : "1rem",
    marginBottom: "2rem",
    padding: "0 1rem"
  };

  const socialContainerStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "1rem",
    marginTop: "1rem"
  };

  const socialIconStyle = {
    color: "white",
    fontSize: isMobile ? "20px" : "24px",
    transition: "transform 0.3s ease, color 0.3s ease",
    padding: "8px",
    borderRadius: "50%",
    backgroundColor: "rgba(255,255,255,0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "40px",
    height: "40px"
  };

  const dividerStyle = {
    color: "rgba(255,255,255,0.6)",
    margin: "0 4px",
    display: isMobile ? "none" : "inline"
  };

  return (
    <footer className="footer" style={footerStyle}>
      <div style={containerStyle}>
        {/* Copyright */}
        <div style={copyrightStyle}>
          All Rights Reserved &copy; {new Date().getFullYear()} Smitox B2B
        </div>

        {/* Navigation Links */}
        <div style={linksContainerStyle}>
          <NavLink 
            to="/about" 
            style={({ isActive }) => ({ ...linkStyle, ...(isActive ? activeStyle : {}) })}
          >
            About Us
          </NavLink>
          <span style={dividerStyle}>|</span>
          
          <NavLink 
            to="/contact"
            style={({ isActive }) => ({ ...linkStyle, ...(isActive ? activeStyle : {}) })}
          >
            Contact
          </NavLink>
          <span style={dividerStyle}>|</span>
          
          <NavLink 
            to="/policy"
            style={({ isActive }) => ({ ...linkStyle, ...(isActive ? activeStyle : {}) })}
          >
            Privacy Policy
          </NavLink>
          <span style={dividerStyle}>|</span>
          
          <NavLink 
            to="/terms"
            style={({ isActive }) => ({ ...linkStyle, ...(isActive ? activeStyle : {}) })}
          >
            Terms of Service
          </NavLink>
          <span style={dividerStyle}>|</span>
          
          <NavLink 
            to="/returnPolicy"
            style={({ isActive }) => ({ ...linkStyle, ...(isActive ? activeStyle : {}) })}
          >
            Return Policy
          </NavLink>
        </div>

        {/* Social Media Links */}
        <div style={socialContainerStyle}>
          <a
            href="https://www.facebook.com/Smitox-b2b-100585319028985/"
            target="_blank"
            rel="noopener noreferrer"
            style={socialIconStyle}
            onMouseEnter={(e) => {
              e.target.style.transform = "scale(1.1)";
              e.target.style.backgroundColor = "rgba(255,255,255,0.2)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "scale(1)";
              e.target.style.backgroundColor = "rgba(255,255,255,0.1)";
            }}
          >
            <FaFacebook />
          </a>
          
          <a
            href="https://www.instagram.com/smitoxb2b?r=nametag"
            target="_blank"
            rel="noopener noreferrer"
            style={socialIconStyle}
            onMouseEnter={(e) => {
              e.target.style.transform = "scale(1.1)";
              e.target.style.backgroundColor = "rgba(255,255,255,0.2)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "scale(1)";
              e.target.style.backgroundColor = "rgba(255,255,255,0.1)";
            }}
          >
            <FaInstagram />
          </a>
          
          <a
            href="https://www.linkedin.com/in/smitox-b2b-2a9475220"
            target="_blank"
            rel="noopener noreferrer"
            style={socialIconStyle}
            onMouseEnter={(e) => {
              e.target.style.transform = "scale(1.1)";
              e.target.style.backgroundColor = "rgba(255,255,255,0.2)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "scale(1)";
              e.target.style.backgroundColor = "rgba(255,255,255,0.1)";
            }}
          >
            <FaLinkedin />
          </a>
          
          <a
            href="https://youtube.com/@smitoxb2b"
            target="_blank"
            rel="noopener noreferrer"
            style={socialIconStyle}
            onMouseEnter={(e) => {
              e.target.style.transform = "scale(1.1)";
              e.target.style.backgroundColor = "rgba(255,255,255,0.2)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "scale(1)";
              e.target.style.backgroundColor = "rgba(255,255,255,0.1)";
            }}
          >
            <FaYoutube />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
