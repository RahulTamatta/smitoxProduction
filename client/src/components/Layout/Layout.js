import React from "react";
import Footer from "./Footer";
import Header from "./Header";
import { Helmet } from "react-helmet";
import { Toaster } from "react-hot-toast";

const Layout = ({ children, title, description, keywords, author }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Helmet>
        <meta charSet="utf-8" />
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords} />
        <meta name="author" content={author} />
        <title>{title}</title>
      </Helmet>
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main style={{ flex: 1, padding: "1rem", display: "flex", flexDirection: "column" }}>
        <Toaster position="top-right" />
        {children}
      </main>

      {/* Footer */}
      <Footer />
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
