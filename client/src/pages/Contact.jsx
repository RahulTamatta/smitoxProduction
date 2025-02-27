import React from "react";
import Layout from "./../components/Layout/Layout";
 // Import WhatsApp icon
import WhatsAppButton from './whatsapp'; // Adjust the import path as needed
import { BiLogoWhatsapp, BiMailSend, BiPhoneCall } from "react-icons/bi";

const Contact = () => {
  const handleWhatsAppClick = () => {
    window.open("https://wa.me/+918850832942", "_blank"); // Open WhatsApp in new tab
  };

  return (
    <Layout title={"Contact us"}>
      {/* Banner Section */}
      <div className="banner-section" style={{ position: "relative", width: "100%",   padding: "50px 25px", }}>
        {/* <img
          src="/images/contactus.jpeg" // Replace with your banner image path
          alt="Contact Us Banner"
          style={{
            width: "100%",
            height: "300px",
            objectFit: "cover",
          }}
        /> */}

     
  
      </div>

      {/* Contact Section */}
      <div className="row contactus mt-4" style={{ margin: "0 15px" }}>
        <div className="col-md-6">
        <img
            src="/images/contactus.jpeg"
            alt="contactus"
            style={{ width: "100%" }}
          />
        </div>
        <div className="col-md-6" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <h1 className="bg-dark p-2 text-white text-center">CONTACT US</h1>
          <p className="text-justify mt-2" style={{ fontSize: "1rem", lineHeight: "1.8" }}>
            For any query or info about our products, feel free to reach out to us anytime. 
            We are available <strong>24x7</strong> to assist you.
          </p>
          <p className="mt-3" style={{ fontSize: "1rem" }}>
            <BiMailSend /> <strong>Email:</strong> helpsmitox@gmail.com
          </p>
        
          <p
            className="mt-3"
            style={{
              cursor: "pointer",
              fontSize: "1rem",
              color: "green",
            }}
            onClick={handleWhatsAppClick}
          >
            <BiLogoWhatsapp /> <strong>WhatsApp:</strong> 8850832942
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Contact;
