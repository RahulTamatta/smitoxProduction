import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { Toaster } from "react-hot-toast";
import Footer from "./Footer";
import Header from "./Header";
import "./Layout.css";

const Layout = ({ children, title, description, keywords, author }) => {
  const [headerHeight, setHeaderHeight] = useState(80);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      // Adjust header height to exactly match Header component heights
      setHeaderHeight(window.innerWidth <= 768 ? 60 : 70);
    };

    window.addEventListener('resize', handleResize);
    // Initial call
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const layoutStyles = {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh", // Full viewport height for proper layout
    position: "relative",
    backgroundColor: "#f8f9fa", // Lighter, more professional background
    width: "100%",
    overflow: "hidden"
  };

  const headerContainerStyles = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1050, // Higher z-index for better layering
    backgroundColor: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)", // More prominent shadow
    borderBottom: "1px solid #e9ecef"
  };

  const mainContentStyles = {
    flex: 1,
    marginTop: `${headerHeight}px`, // Dynamic margin based on header height
    padding: isMobile ? "0" : "2rem 1rem", // Remove padding on mobile to eliminate white space
    display: "flex",
    flexDirection: "column",
    width: "100%",
    maxWidth: "100%",
    minHeight: `calc(100vh - ${headerHeight}px)`, // Ensure content fills remaining space
    backgroundColor: isMobile ? "#f8f9fa" : "#ffffff", // Use lighter background on mobile
    boxSizing: "border-box",
    position: "relative",
    overflow: "auto" // Allow scrolling for content
  };

  const toasterContainerStyles = {
    position: "fixed",
    top: `${headerHeight + 10}px`, // Position below header with some spacing
    right: "10px",
    zIndex: 1060 // Above header
  };

  return (
    <div className="layout-container" style={layoutStyles}>
      <Helmet>
        <meta charSet="utf-8" />
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords} />
        <meta name="author" content={author} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <title>{title}</title>
      </Helmet>

      {/* Header - Fixed position */}
      <div style={headerContainerStyles}>
        <Header />
      </div>

      {/* Toaster Container */}
      <div style={toasterContainerStyles}>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
              fontSize: '14px',
              padding: '12px 16px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            },
            success: {
              style: {
                background: '#22c55e'
              }
            },
            error: {
              style: {
                background: '#ef4444'
              }
            }
          }} 
        />
      </div>

      {/* Main Content */}
      <main style={mainContentStyles}>
        <div className="content-wrapper" style={{
          width: "100%",
          maxWidth: "100%",
          margin: "0",
          flex: 1,
          display: "flex",
          flexDirection: "column"
        }}>
          {children}
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

Layout.defaultProps = {
  title: "Smitox - B2B Wholesale Marketplace",
  description: "Premier B2B marketplace for wholesale buyers and sellers. Connect with verified manufacturers, distributors, and bulk suppliers.",
  keywords: "b2b marketplace, wholesale, bulk orders, business suppliers, manufacturers, distributors, procurement, smitox",
  author: "rahultamatta"
};
export default Layout;