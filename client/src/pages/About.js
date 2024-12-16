import React from "react";
import Layout from "./../components/Layout/Layout";
const About = () => {
  return (
    <Layout title={"About us - Ecommer app"}>
      {/* Banner Section */}
      <div className="banner-section" style={{ position: "relative", width: "100%" }}>
        <img
          src="/images/banner.jpg" // Ensure the correct path for the uploaded banner
          alt="B2B Platform Banner"
          style={{
            width: "100%",
            height: "300px",
            objectFit: "cover",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: "#000",
            backgroundColor: "rgba(255, 255, 255, 0.85)",
            padding: "15px 25px",
            borderRadius: "8px",
            textAlign: "center",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.8rem" }}>
            India's largest <span style={{ color: "red" }}>B2B</span> Platform
          </h2>
          <p style={{ margin: "8px 0 0", fontSize: "1rem" }}>
            for businesses & shop-owners
          </p>
        </div>
      </div>

      {/* About Section */}
      <div className="row contactus mt-4" style={{ margin: "0 15px" }}>
        <div className="col-md-6">
          <img
             src="https://smitox.com/img/99.jpg" 
            alt="About Us"
            style={{
              width: "100%",
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
            }}
          />
        </div>
        <div className="col-md-6">
          <p className="text-justify mt-2" style={{ fontSize: "1rem", lineHeight: "1.8" }}>
            Get <strong>Smitox</strong> Now! It is <strong>free</strong> and you
            will love it.<br />
            Smitox is solving core trade problems faced by small and medium
            businesses, that are unique to India, through its unique India-fit
            low-cost business model by leveraging technology and bringing the
            benefits of eCommerce to them. It is a one-stop shop for all
            business requirements in the B2B space.
            <br />
            Smitox has built inclusive tech tools for Bharat, specially catering
            to the needs of brands, retailers, and manufacturers, providing them
            a level playing field to scale, trade, and grow business. We only
            generate leads and orders; rest is decided between the customer and
            seller as per their conditions.
          </p>
        </div>
      </div>
    </Layout>
  );
};





export default About;
