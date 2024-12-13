import React from "react";
import Layout from "./../components/Layout/Layout";

const About = () => {
  return (
    <Layout title={"About us - Ecommer app"}>
      <div className="row contactus ">
        <div className="col-md-6 ">
          <img
            src="/images/about.jpeg"
            alt="contactus"
            style={{ width: "100%" }}
          />
        </div>
        <div className="col-md-4">
          <p className="text-justify mt-2">
          Get Smitox Now!It is free and you will love it.<br/>
        Smitox is solving core trade problems faced by small and medium businesses, that are unique to India, through its unique India-fit low-cost business model by leveraging technology and bringing the benefits of eCommerce to them. It is a one stop shop for all business requirements in the b2b space. Smitox has built inclusive tech tools for Bharat, specially catering to the needs of brands, retailers and manufacturers, providing them a level playing field to scale, trade and grow Business .We only Genrate leads and order  rest Customer and seller will deceide has their condtion .
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default About;
