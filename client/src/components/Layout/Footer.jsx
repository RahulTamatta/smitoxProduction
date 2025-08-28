import React from "react";
import { FaFacebook, FaInstagram, FaLinkedin, FaYoutube } from "react-icons/fa";
import { NavLink } from "react-router-dom";
import styles from "./Footer.module.css";

const Footer = () => {
  return (
    <div className={styles.footer}>
      <h1 className={styles.textCenter}>All Right Reserved &copy; Smitox</h1>
      <p className={`${styles.textCenter} ${styles.mt3}`}>
        <NavLink to="/about" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink}>
          About
        </NavLink>
        <NavLink to="/contact" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink}>
          Contact
        </NavLink>
        <NavLink to="/policy" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink}>
          Privacy Policy
        </NavLink>
        <NavLink to="/terms" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink}>
          Terms
        </NavLink>
        <NavLink to="/returnPolicy" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink}>
          Return Policy
        </NavLink>
      </p>
      <div className={`${styles.textCenter} ${styles.mt3}`}>
        <a
          href="https://www.facebook.com/Smitox-b2b-100585319028985/"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.socialLink}
        >
          <FaFacebook />
        </a>
        <a
          href="https://www.instagram.com/smitoxb2b?r=nametag"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.socialLink}
        >
          <FaInstagram />
        </a>
        <a
          href="https://www.linkedin.com/in/smitox-b2b-2a9475220"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.socialLink}
        >
          <FaLinkedin />
        </a>
        <a
          href="https://youtube.com/@smitoxb2b"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.socialLink}
        >
          <FaYoutube />
        </a>
      </div>
    </div>
  );
};

export default Footer;
