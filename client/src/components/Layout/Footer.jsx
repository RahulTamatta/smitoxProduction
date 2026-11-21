import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { FaFacebook, FaInstagram, FaLinkedin, FaYoutube } from "react-icons/fa";
import api from "../../services/api";
import { isPortalPath } from "../../utils/portalRoutes";
import "./Footer.css";

const Footer = () => {
  const [content, setContent] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const location = useLocation();
  const isAdminRoute = isPortalPath(location.pathname);
  const adminContentOffset = isAdminRoute && !isMobile
    ? "var(--admin-sidebar-width, 250px)"
    : "0";

  useEffect(() => {
    api.get("/app-content/get-content")
      .then((response) => setContent(response.data.content))
      .catch((error) => console.error("Unable to load footer content:", error));
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <footer className="sx-footer" style={{ width: isAdminRoute ? `calc(100% - ${adminContentOffset})` : "100%", marginLeft: adminContentOffset }}>
      {/* Links Grid */}
      <div className="sx-footer-main">
        <div className="sx-container">
          <div className="sx-footer-grid">
            {/* Column 1: Brand */}
            <div className="sx-footer-col sx-footer-brand">
              <div className="sx-footer-logo">
                <img src="/logo.png" alt="Smitox B2B" />
              </div>
              <p className="sx-footer-tagline">
                India's Leading B2B Wholesale Marketplace. Connect with verified manufacturers, distributors, and suppliers for bulk buying at factory prices.
              </p>
              <div className="sx-footer-social">
                <a href="https://www.facebook.com/Smitox-b2b-100585319028985/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="sx-footer-social-link sx-footer-social--facebook">
                  <FaFacebook />
                </a>
                <a href="https://www.instagram.com/smitoxb2b?r=nametag" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="sx-footer-social-link sx-footer-social--instagram">
                  <FaInstagram />
                </a>
                <a href="https://www.linkedin.com/in/smitox-b2b-2a9475220" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="sx-footer-social-link sx-footer-social--linkedin">
                  <FaLinkedin />
                </a>
                <a href="https://youtube.com/@smitoxb2b" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="sx-footer-social-link sx-footer-social--youtube">
                  <FaYoutube />
                </a>
              </div>
            </div>

            {/* Column 2: Shop Links */}
            <div className="sx-footer-col">
              <h4 className="sx-footer-heading">Shop</h4>
              <ul className="sx-footer-links">
                <li><NavLink to="/categories" className="sx-footer-link">Categories</NavLink></li>
                <li><NavLink to="/seller-wizard" className="sx-footer-link">Sell on Smitox</NavLink></li>
                <li><NavLink to="/wishlist" className="sx-footer-link">Wishlist</NavLink></li>
                <li><NavLink to="/cart" className="sx-footer-link">Cart</NavLink></li>
              </ul>
            </div>

            {/* Column 3: Company */}
            <div className="sx-footer-col">
              <h4 className="sx-footer-heading">Company</h4>
              <ul className="sx-footer-links">
                <li><NavLink to="/about" className="sx-footer-link">About Us</NavLink></li>
                <li><NavLink to="/contact" className="sx-footer-link">Contact</NavLink></li>
                <li><NavLink to="/seller-wizard" className="sx-footer-link">Become a Seller</NavLink></li>
              </ul>
            </div>

            {/* Column 4: Help & Policies */}
            <div className="sx-footer-col">
              <h4 className="sx-footer-heading">Help & Policies</h4>
              <ul className="sx-footer-links">
                <li><NavLink to="/policy" className="sx-footer-link">Privacy Policy</NavLink></li>
                <li><NavLink to="/terms" className="sx-footer-link">Terms of Service</NavLink></li>
                <li><NavLink to="/returnPolicy" className="sx-footer-link">Return Policy</NavLink></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Business Details & Contact */}
      {content && (
        <div className="sx-footer-business">
          <div className="sx-container">
            <div className="sx-footer-business-grid">
              <div className="sx-footer-business-info">
                <strong>{content.tradeName || content.legalName}</strong>
                <span>{content.registeredAddress}</span>
                <span>GST: {content.gstNumber || "Not provided"}</span>
                <a href={`mailto:${content.businessEmail}`} className="sx-footer-business-link">{content.businessEmail}</a>
                <a href={`https://wa.me/${(content.whatsAppNumber || content.whatsappNumber || "").replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="sx-footer-business-link">
                  WhatsApp: {content.whatsAppNumber || content.whatsappNumber}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Bar */}
      <div className="sx-footer-bottom">
        <div className="sx-container">
          <p className="sx-footer-copyright">
            All Rights Reserved &copy; {new Date().getFullYear()} Smitox B2B
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;