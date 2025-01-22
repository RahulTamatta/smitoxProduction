import React from "react";
import Footer from "./Footer";
import Header from "./Header";
import { Helmet } from "react-helmet";
import { Toaster } from "react-hot-toast";


const Layout = ({ children, title, description, keywords, author }) => {
  return (
    <div className="layout-container" style={{ 
      display: "flex", 
      flexDirection: "column", 
      minHeight: "80vh",
      position: "relative",
      backgroundColor: "#f1f3f6"
    }}>
      <Helmet>
        <meta charSet="utf-8" />
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords} />
        <meta name="author" content={author} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <title>{title}</title>
      </Helmet>

      {/* Header - Fixed position */}
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: "#fff",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
      }}>
        <Header />
      </div>

      {/* Main Content */}
      <main style={{
        flex: 1,
        marginTop:window.innerWidth <= 768 ? "5rem 0 0 0" : "2rem",
        padding: window.innerWidth <= 768 ? "5rem 0 0 0" : "5rem 1rem 1rem 1rem",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        maxWidth: "100%",
        overflow: "hidden",
        boxSizing: "border-box"
      }}>
        <div style={{ position: "fixed", zIndex: 0 }}>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                marginTop: "60px" // Ensures toasts appear below fixed header
              }
            }} 
          />
        </div>
        {children}
      </main>

      {/* Footer */}
      <Footer />

      {/* Add responsive styles */}

    </div>
  );
};

Layout.defaultProps = {
  title: "Smitox app - shop now",
  description: "mern stack project",
  keywords: "mern,react,node,mongodb",
  author: "rahultamatta",
};

export default Layout;