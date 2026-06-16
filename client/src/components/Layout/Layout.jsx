import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet";
import { Toaster } from "react-hot-toast";
import { useLocation } from "react-router-dom";
import Footer from "./Footer";
import Header from "./Header";
import "./Layout.css";

const Layout = ({ children, title, description, keywords, author }) => {
  const [headerHeight, setHeaderHeight] = useState(80);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const location = useLocation();
  const isAdminRoute = location.pathname.toLowerCase().startsWith("/dashboard/admin");
  const headerRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    // Initial call
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isAdminRoute) return;
    
    // Dynamically measure header height
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight);
      }
    };

    // Initial measurement
    updateHeaderHeight();

    // Use ResizeObserver to detect changes in header size
    const resizeObserver = new ResizeObserver(() => {
      updateHeaderHeight();
    });

    const currentHeaderRef = headerRef.current;
    if (currentHeaderRef) {
      resizeObserver.observe(currentHeaderRef);
    }

    return () => {
      if (currentHeaderRef) {
        resizeObserver.unobserve(currentHeaderRef);
      }
      resizeObserver.disconnect();
    };
  }, [isAdminRoute, isMobile]);

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
    zIndex: 1000, // Lowered from 1050 to prevent modal overlap (Modals are usually 1050+)
    backgroundColor: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)", // More prominent shadow
    borderBottom: "1px solid #e9ecef"
  };

  const effectiveHeaderHeight = isAdminRoute ? 0 : headerHeight;

  const mainContentStyles = {
    flex: 1,
    marginTop: `${effectiveHeaderHeight}px`, // Dynamic margin based on header height (0 on admin routes)
    padding: isAdminRoute ? "0" : (isMobile ? "0" : "0.5rem 1rem"), // Reduced top padding so product starts near header
    display: "flex",
    flexDirection: "column",
    width: "100%",
    maxWidth: "100%",
    minHeight: `calc(100vh - ${effectiveHeaderHeight}px)`, // Ensure content fills remaining space
    backgroundColor: isMobile ? "#f8f9fa" : "#ffffff", // Use lighter background on mobile
    boxSizing: "border-box",
    position: "relative",
    // NO overflow:auto here — let the window be the scroll container so ScrollToTop works
  };

  const toasterContainerStyles = {
    position: "fixed",
    top: `${effectiveHeaderHeight + 10}px`, // Position below header (or top of screen on admin routes)
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

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:site_name" content="Smitox B2B" />
        <meta property="og:image" content="https://www.smitox.com/logo512.png" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content="https://www.smitox.com/logo512.png" />
      </Helmet>

      {/* Header - Fixed position (hidden on admin routes) */}
      {!isAdminRoute && (
        <div ref={headerRef} style={headerContainerStyles}>
          <Header />
        </div>
      )}

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
  title: "Smitox - India's Leading B2B Wholesale Marketplace",
  description: "Shop bulk products at factory prices on India's premier B2B platform. Connect with verified manufacturers, distributors, and suppliers.",
  keywords: "b2b wholesale, bulk buying, factory price, smitox, marketplace india, SME supplier, verified manufacturers",
  author: "Smitox B2B"
};
export default Layout;