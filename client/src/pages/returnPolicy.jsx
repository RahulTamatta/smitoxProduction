import React from "react";
import Layout from "./../components/Layout/Layout";

const ReturnPolicy = () => {
  return (
    <Layout title={"Return Policy - Smitox"}>
      <div className="container mt-4 mb-4" style={{ maxWidth: "800px", margin: "0 auto", padding: "0 15px" }}>
        <h2 className="text-center mb-4" style={{ color: "#00416a" }}>Return Policy</h2>
        
        <div style={{ 
          background: "#f8f9fa", 
          borderRadius: "8px", 
          padding: "30px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}>
          <h4 style={{ color: "#007ab7", marginBottom: "15px" }}>Applicability</h4>
          <p style={{ lineHeight: "1.6", marginBottom: "20px" }}>
            This policy applies exclusively to <strong>registered Smitox users</strong> who have received return request(s) for products sold through the Smitox platform.
          </p>

          <h4 style={{ color: "#007ab7", marginBottom: "15px" }}>Key Conditions</h4>
          <div style={{ marginBottom: "20px" }}>
            <ul style={{ listStyleType: "square", paddingLeft: "20px" }}>
              <li style={{ marginBottom: "10px" }}>
                <strong>Check Bill 2-3 Times Before Making Payment.</strong>
              </li>
              <li style={{ marginBottom: "10px" }}>
                <strong>Once Payment Is Received, It Will Not Be Refundable.</strong>
              </li>
              <li style={{ marginBottom: "10px" }}>
                If Your Order Is Returned To The Courier, No Amount Will Be Refunded From Your Advance Payment.
              </li>
              <li style={{ marginBottom: "10px" }}>
                Once The Order Is Dispatched, You Are Not Allowed To Return Or Cancel The Order. If You Do, Your Payment Will Not Be Refundable.
              </li>
              <li style={{ marginBottom: "10px" }}>
                <strong>All Products Are Chinese Products.</strong>
              </li>
              <li style={{ marginBottom: "10px" }}>
                There Is No Warranty Or Guarantee On Any Products. Do Not Ask For Replacement Or Warranty.
              </li>
              <li style={{ marginBottom: "10px" }}>
                If Your Order Is Prepaid, You Will Be Charged Less Courier Charge (No Free Delivery).
              </li>
              <li style={{ marginBottom: "10px" }}>
                Return eligibility is <strong>solely determined by the user</strong>
              </li>
              <li style={{ marginBottom: "10px" }}>
                Buyers must provide a <strong>complete unboxing video</strong> for return requests
              </li>
              <li style={{ marginBottom: "10px" }}>
                Returns are permitted only if explicitly allowed by the user
              </li>
              <li style={{ marginBottom: "10px" }}>
                Special cases apply for:
                <ul style={{ listStyleType: "circle", marginTop: "5px", paddingLeft: "20px" }}>
                  <li>Different products than ordered</li>
                  <li>Products under warranty</li>
                  <li>China-sourced products (no warranty/guarantee)</li>
                </ul>
              </li>
            </ul>
          </div>

          <h4 style={{ color: "#007ab7", marginBottom: "15px" }}>Important Notes</h4>
          <div style={{ marginBottom: "20px" }}>
            <ul style={{ listStyleType: "square", paddingLeft: "20px" }}>
              <li style={{ marginBottom: "10px" }}>
                Smitox reserves the right to <strong>take legal action</strong> against fraudulent reviews
              </li>
              <li style={{ marginBottom: "10px" }}>
                All return processes are <strong>directly between buyer and user</strong>
              </li>
            </ul>
          </div>

          <div style={{ 
            backgroundColor: "#fff3cd", 
            borderLeft: "4px solid #ffc107",
            padding: "15px",
            marginTop: "20px",
            borderRadius: "4px"
          }}>
            <strong>Disclaimer:</strong> Smitox acts solely as a platform connector between buyers and users. 
            We assume <strong>no responsibility</strong> for return claims, product conditions, 
            or any disputes arising from return processes.
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ReturnPolicy;