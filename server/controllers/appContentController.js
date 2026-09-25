import AppContent from "../models/appContentModel.js";

const DEFAULT_PRIVACY_POLICY = `Important - Please read these statements before listing any products on Smitox. If the same is not done, Smitox wouldn't take responsibility for de-listing of products or banning memberships (after one or more warnings).

This product listing policy mentioned the types of products and services you cannot list on Smitox, a leading B2B eCommerce portal. As a seller on Smitox, remember that any product or service you are offering must not violate any laws (international, national, state, or city laws) in the areas where Smitox has its presence.

Also, the products or services you list must comply with import or export laws of any nation we have a reach-in. If you are not sure about any of the laws, feel free to reach out, and we'll guide you. If you "assume" that a product or service is legal in a city, locality, state, nation, or an international level and you prove to be wrong, Smitox will not be liable in any manner. A seller would be responsible and answerable for all such actions.

The product listing has to be done sincerely to avoid Smitox seller account deactivation.
The listing must have:
1. Accurate category selection (proper category mapping)
2. Proper or actual or real image of the product
3. Appropriate details of the product
4. Along with the proper pricing

If any seller's product listing is found incomplete or improper then the seller account will be deactivated or the seller's product will not display on the Smitox platform.

Standard Forbidden Items: Though Smitox is an entity in India, the B2B marketplace has reached many countries and continents. Hence, you are responsible, as a seller to not list any products/services that are outlawed in any part of these nations or continents.

In addition to legally prohibited items, we have also banned the items that encourage illegal activities like lock pick tools, racially, religiously, and ethically depredatory items, items that are sexual in nature, items that are not classified as a physical product or service like digital currencies, any types of financial securities, giveaways, and any such items offered to collect user information.`;

const DEFAULT_TERMS_AND_CONDITIONS = `Smitox is a trademark of PMK E-commerce. Smitox is a company incorporated under the Companies Act, with its registered and corporate office at Mumbai 400072, in the course of its business. The domain name Smitox is owned by the Company.

The Company respects your privacy and values the trust you place in it. Set out below are the Terms and Conditions which govern your use of the Smitox platform.

Customers and Sellers are advised to read and understand our Terms and Conditions carefully, as by accessing the website/app you agree to be bound by the terms and conditions and consent to the policies provided herein.

If you do not agree with the terms and conditions, please do not use or access the website/app.

1. Platform Services:
Smitox provides an online marketplace platform connecting buyers and sellers for B2B wholesale transactions across India.

2. Registration & Account:
Users and sellers must register with accurate details, including valid GST registration details where applicable.

3. Seller Terms:
Smitox connects vendor to customer. Smitox is not responsible for any loss or fraud between buyer and seller. All product pricing, warranties, and dispatch are managed according to the platform agreements.

4. Intellectual Property:
All trademarks, logos, and content appearing on the platform are the property of their respective owners.

Should you have any questions regarding these Terms & Conditions, please contact us at support@smitox.com.`;

const DEFAULT_ABOUT_US = `Smitox helps Indian SMEs solve core trade challenges through a low-cost B2B marketplace. Our technology gives brands, retailers, and manufacturers a level playing field to scale, trade, and grow while keeping control over their transactions.`;
const DEFAULT_RETURN_POLICY = `Applicability
This policy applies to registered Smitox users who receive return requests for products sold through the Smitox platform.

Key conditions
- Check the bill carefully before making payment.
- Once payment is received, it is not refundable unless the order qualifies for an approved return.
- Once an order is dispatched, cancellation or return may not be allowed.
- Buyers must provide a complete unboxing video for return requests.
- Return claims are coordinated directly between the buyer and seller.

Disclaimer
Smitox acts as a platform connector and is not responsible for disputes between buyers and sellers.`;

// Get App Content (Public)
export const getAppContentController = async (req, res) => {
  try {
    let content = await AppContent.findOne();
    if (!content) {
      content = await AppContent.create({
        whatsappNumber: "+91 9876543210",
        businessEmail: "support@smitox.com",
        gstNumber: "27AAACP0123M1Z5",
        legalName: "PMK E-COMMERCE PRIVATE LIMITED",
        tradeName: "SMITOX B2B",
        registeredAddress: "Mumbai, Maharashtra 400072, India",
        privacyPolicy: DEFAULT_PRIVACY_POLICY,
        termsAndConditions: DEFAULT_TERMS_AND_CONDITIONS,
        aboutUs: DEFAULT_ABOUT_US,
        returnPolicy: DEFAULT_RETURN_POLICY,
      });
    } else {
      // Ensure defaults if empty
      let needsSave = false;
      if (!content.privacyPolicy) {
        content.privacyPolicy = DEFAULT_PRIVACY_POLICY;
        needsSave = true;
      }
      if (!content.termsAndConditions) {
        content.termsAndConditions = DEFAULT_TERMS_AND_CONDITIONS;
        needsSave = true;
      }
      if (!content.aboutUs) {
        content.aboutUs = DEFAULT_ABOUT_US;
        needsSave = true;
      }
      if (!content.returnPolicy) {
        content.returnPolicy = DEFAULT_RETURN_POLICY;
        needsSave = true;
      }
      if (needsSave) {
        await content.save();
      }
    }

    res.status(200).send({
      success: true,
      message: "App content retrieved successfully",
      content,
    });
  } catch (error) {
    console.error("Error fetching app content:", error);
    res.status(500).send({
      success: false,
      message: "Error fetching app content",
      error: error.message,
    });
  }
};

// Update App Content (Admin only)
export const updateAppContentController = async (req, res) => {
  try {
    const {
      whatsappNumber,
      businessEmail,
      gstNumber,
      legalName,
      tradeName,
      registeredAddress,
      privacyPolicy,
      termsAndConditions,
      aboutUs,
      returnPolicy,
    } = req.body;

    let content = await AppContent.findOne();
    if (!content) {
      content = new AppContent();
    }

    if (whatsappNumber !== undefined) content.whatsappNumber = whatsappNumber;
    if (businessEmail !== undefined) content.businessEmail = businessEmail;
    if (gstNumber !== undefined) content.gstNumber = gstNumber;
    if (legalName !== undefined) content.legalName = legalName;
    if (tradeName !== undefined) content.tradeName = tradeName;
    if (registeredAddress !== undefined) content.registeredAddress = registeredAddress;
    if (privacyPolicy !== undefined) content.privacyPolicy = privacyPolicy;
    if (termsAndConditions !== undefined) content.termsAndConditions = termsAndConditions;
    if (aboutUs !== undefined) content.aboutUs = aboutUs;
    if (returnPolicy !== undefined) content.returnPolicy = returnPolicy;

    await content.save();

    res.status(200).send({
      success: true,
      message: "App content and footer information updated successfully",
      content,
    });
  } catch (error) {
    console.error("Error updating app content:", error);
    res.status(500).send({
      success: false,
      message: "Error updating app content",
      error: error.message,
    });
  }
};
