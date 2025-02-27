import React from "react";
import Layout from "./../components/Layout/Layout";
const About = () => {
  return (
    <Layout title={"About us - Smitox"}>
      {/* Image Background Banner */}
      <div style={{ 
        position: "relative", 
        width: "100%", 
        height: "60vh",
        minHeight: "400px",
        backgroundImage: "url(https://smitox.com/img/99.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        marginBottom: "40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
     
      </div>

      {/* Content Section */}
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "0 20px 60px"
      }}>
        <div style={{
          padding: "40px 20px",
          borderRadius: "12px",
          background: "#f8f9fa"
        }}>
          <h2 style={{
            fontSize: "2.2rem",
            color: "#00416a",
            marginBottom: "30px",
            fontWeight: "600",
            textAlign: "center"
          }}>
            Transform Your Business with Smitox
          </h2>
          
          <div style={{
            fontSize: "1.1rem",
            lineHeight: "1.8",
            color: "#555",
            maxWidth: "800px",
            margin: "0 auto"
          }}>
            <p style={{ marginBottom: "20px" }}>
              Get <strong style={{ color: "red" }}>Smitox</strong> Now! It's{" "}
              <strong style={{ color: "red" }}>FREE</strong> and you'll love it.
            </p>
            
            <p style={{ marginBottom: "20px" }}>
              Smitox solves core trade challenges faced by Indian SMEs through our 
              unique India-fit, low-cost business model. We leverage technology to 
              bring eCommerce benefits to traditional businesses, creating a 
              one-stop B2B solution.
            </p>

            <p style={{ marginBottom: "20px" }}>
              Our inclusive tech tools empower Bharat's brands, retailers, and 
              manufacturers with a level playing field to scale, trade, and grow. 
              We focus on generating quality leads and orders while letting 
              businesses maintain control over their transactions.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};



export default About;
