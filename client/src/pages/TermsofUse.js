import React, { useState } from "react";
import Layout from "./../components/Layout/Layout";

const Terms = () => {
  // State to manage the expanded/collapsed state of policy content
  const [expanded, setExpanded] = useState(false);

  // Privacy policy content
  const privacyPolicyContent = [
    "Smitox is a trademark of PMK E-commerce. Smitox is a company incorporated under the Companies Act, with its registered and corporate office at Mumbai 400072, in the course of its business. The domain name Smitox is owned by the Company.",
    "The Company respects your privacy and values the trust you place in it. Set out below is the Company’s ‘Privacy Policy’ which details how information relating to you is collected, used, and disclosed.",
    "Customers are advised to read and understand our Privacy Policy carefully, as by accessing the website/app you agree to be bound by the terms and conditions of the Privacy Policy and consent to the collection, storage, and use of information relating to you as provided herein.",
    "If you do not agree with the terms and conditions of our Privacy Policy, including the manner of collection or use of your information, please do not use or access the website/app.",
    "Our Privacy Policy is incorporated into the Terms and Conditions of Use of the website/app and is subject to change from time to time without notice. It is strongly recommended that you periodically review our Privacy Policy as posted on the App/Web.",
    "Should you have any clarifications regarding this Privacy Policy, please do not hesitate to contact us at support@Smitox.",
    "The Collection, Storage, And Use Of Information Related To You:",
    "We may automatically track certain information about you based upon your behavior on the website. We use this information to do internal research on our users’ demographics, interests, and behavior to better understand, protect and serve our users. This information is compiled and analyzed on an aggregated basis.",
    "This information may include the URL that you just came from (whether this URL is on the website or not), which URL you next go to (whether this URL is on the website or not), your computer browser information, your IP address, and other information associated with your interaction with the website.",
    "We may also share your Mobile IP/Device IP with a third party(ies) and to the best of our knowledge, belief, and representations given to us by these third party(ies) this information is not stored by them.",
    "We also collect and store personal information provided by you from time to time on the website/app. We only collect and use such information from you that we consider necessary for achieving a seamless, efficient, and safe experience, customized to your needs including:",
    "- To enable the provision of services opted for by you;",
    "- To communicate necessary account and product/service related information from time to time;",
    "- To allow you to receive quality customer care services;",
    "- To undertake necessary fraud and money laundering prevention checks, and comply with the highest security standards;",
    "- To comply with applicable laws, rules, and regulations; and",
    "- To provide you with information and offers on products and services, on updates, on promotions, on related, affiliated, or associated service providers and partners, that we believe would be of interest to you.",
    "Where any service requested by you involves a third party, such information as is reasonably necessary by the Company to carry out your service request may be shared with such a third party.",
    "We also do use your contact information to send you offers based on your interests and prior activity. The Company may also use contact information internally to direct its efforts for product improvement, to contact you as a survey respondent, to notify you if you win any contest; and to send you promotional materials from its contest sponsors or advertisers.",
    "Contacts Permissions: If you allow Smitox to access your contacts (including contact number, email id, etc.), it enables Smitox to subscribe you and your contacts to Smitox promotional emails, messages, ongoing offers, etc., and through this permission, you and your contacts will be able to access a variety of social features such as inviting your friends to try our app, send across referral links to your friends, etc. We may also use this information to make recommendations for the grocery items you placed. This information will be synced from your phone and stored on our servers.",
    "Further, you may from time to time choose to provide payment-related financial information (credit card, debit card, bank account details, billing address, etc.) on the website. We are committed to keeping all such sensitive data/information safe at all times and ensure that such data/information is only transacted over a secure website [of approved payment gateways which are digitally encrypted], and provide the highest possible degree of care available under the technology presently in use.",
    "The Company will not use your financial information for any purpose other than to complete a transaction with you. To the extent possible, we provide you the option of not divulging any specific information that you wish for us not to collect, store or use. You may also choose not to use a particular service or feature on the website/application, and opt-out of any non-essential communications from the Company.",
    "Further, transacting over the internet has inherent risks which can only be avoided by you following security practices yourself, such as not revealing account/login-related information to any other person and informing our customer care team about any suspicious activity or where your account has/may have been compromised.",
    "The company uses data collection devices such as “cookies” on certain pages of the website to help analyze our web page flow, measure promotional effectiveness, and promote trust and safety. “Cookies” are small files placed on your hard drive that assist us in providing our services. The company offers certain features that are only available through the use of a “cookie”.",
    "The Company also uses cookies to allow you to enter your password less frequently during a session. Cookies can also help the Company provide information that is targeted to your interests. Most cookies are “session cookies,” meaning that they are automatically deleted from your hard drive at the end of a session.",
    "You are always free to decline our cookies if your browser permits, although in that case, you may not be able to use certain features on the website and you may be required to re-enter your password more frequently during a session.",
    "Additionally, you may encounter “cookies” or other similar devices on certain pages of the website that are placed by third parties. The Company does not control the use of cookies by third parties.",
    "If you send the Company personal correspondence, such as emails or letters, or if other users or third parties send us correspondence about your activities on the website, the Company may collect such information into a file specific to you.",
    "The Company does not retain any information collected for any longer than is reasonably considered necessary by us, or such period as may be required by applicable laws. The Company may be required to disclose any information that is lawfully sought from it by a judicial or other competent body under applicable laws.",
    "The website may contain links to other websites. We are not responsible for the privacy practices of such websites which we do not manage and control.",
    "COLLECTION OF FINANCIAL SMS INFORMATION:",
    "We don’t collect, read or store your personal SMS from your inbox. We collect and monitor only financial SMS sent by 6-digit alphanumeric senders from your inbox which helps us in identifying the various bank accounts that you may be holding, cash flow patterns, description, and amount of the transactions undertaken by you as a user to help us perform a credit risk assessment which enables us to determine your risk profile and to provide you with the appropriate credit analysis. This process will enable you to take financial facilities from the regulated financial entities available on the Platform. This Financial SMS data also includes your historical data.",
    "COLLECTION OF DEVICE LOCATION AND DEVICE INFORMATION:",
    "We collect and monitor the information about the location of your device to provide serviceability of your loan application, to reduce the risk associated with your loan application, and provide pre-approved customized loan offers. This also helps us to verify the address, make a better credit risk decision and expedite the know your customer (KYC) process. Information the App collects, and its usage depends on how you manage your privacy controls on your device. When you install the App, we store the information we collect with unique identifiers tied to the device you are using. We collect information from the device when you download and install the App and explicitly seek permissions from You to get the required information from the device. The information we collect from your device includes the hardware model, build model, RAM, storage; unique device identifiers like IMEI, serial number, SSAID; SIM information that includes network operator, roaming state, MNC and MCC codes, WIFI information that includes MAC address and mobile network information to uniquely identify the devices and ensure that no unauthorized device acts on your behalf to prevent frauds.",
    "COLLECTION OF INSTALLED APPLICATIONS:",
    "We collect a list of the installed applications’ metadata information which includes the application name, package name, installed time, updated time, version name, and version code of each installed application on your device to assess your creditworthiness and enrich your profile with pre-approved customized loan offers.",
    "STORAGE:",
    "We require storage permission so that your KYC and other relevant documents can be securely downloaded and saved on your phone. You can then easily upload the correct KYC-related documents for faster loan application details filling and disbursal process. This ensures that you are provided with a seamless experience while using the application.",
    "CAMERA:",
    "We require the camera information permission to provide you an easy/smooth experience and to enable you to click photos of your KYC documents along with other requisite documents and upload the same on the App during your loan application journey.",
    "COLLECTION OF OTHER NON-PERSONAL INFORMATION:",
    "We automatically track certain information about you based upon your behavior on our Platform. We use this information to do internal research on our users’ demographics, interests, and behavior to better understand, protect and serve our users and improve our services. This information is compiled and analyzed on an aggregated basis. We also collect your Internet Protocol (IP) address and the URL used by you to connect your computer to the internet, etc. This information may include the URL that you just came from (whether this URL is on our Website or not), which URL you next go to (whether this URL is on our Website or not), your computer browser information, and your IP address.",
    "Cookies are small data files that a Website stores on Your computer. We will use cookies on our Website similar to other lending websites/apps and online marketplace websites/apps. Use of this information helps Us identify You in order to make our Website more user-friendly. Most browsers will permit You to decline cookies but if You choose to do this it might affect service on some parts of Our Website.",
    "If you choose to make a purchase through the Platform, we collect information about your buying behavior. We retain this information as necessary to resolve disputes, provide customer support and troubleshoot problems as permitted by law. If you send us personal correspondence, such as emails or letters, or if other users or third parties send us correspondence about your activities or postings on the Website, we collect such information into a file specific to you.",
    "LINK TO THIRD-PARTY SDK:",
    "The App has a link to a registered third-party SDK that collects data on our behalf and data is stored on a secured server to perform a credit risk assessment. We ensure that our third-party service provider takes extensive security measures in order to protect your personal information against loss, misuse or alteration of the data. Our third-party service provider employs separation of environments and segregation of duties and has strict role-based access control on a documented, authorized, need-to-use basis. The stored data is protected and stored by application-level encryption. They enforce key management services to limit access to data. Furthermore, our registered third-party service provider provides hosting security – they use industry-leading anti-virus, anti-malware, intrusion prevention systems, intrusion detection systems, file integrity monitoring, and application control solutions.",
  ];

  // Function to toggle expanded state
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <Layout title={"Privacy Policy"}>
      <div
        className="row contactus"
        style={{ position: "relative", width: "100%", padding: "100px 25px" }}
      >
        <div
          className="col-md-4"
          style={{
            maxHeight: "400px",
            overflowY: "auto",
            padding: "40px",
            width: "100%",
          }}
        >
          <h1 className="bg-dark p-2 text-white text-center">
            Terms & Conditions
          </h1>
          {privacyPolicyContent.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Terms;