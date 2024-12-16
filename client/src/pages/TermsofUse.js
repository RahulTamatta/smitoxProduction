import React, { useState } from "react";
import Layout from "./../components/Layout/Layout";

const Terms = () => {
  // State to manage the expanded/collapsed state of policy content
  const [expanded, setExpanded] = useState(false);

  // Dummy privacy policy content (you should replace this with your actual content)
  const privacyPolicyContent = [
    "Important- Please read these statements before listing any products on Smitox. If the same is not done, Smitox wouldn’t take responsibility for de-listing of products or banning memberships (after one or more warnings).",
    "This product listing policy mentioned the types of products and services you cannot list on Smitox, a leading B2B eCommerce portal. As a seller on Smitox, remember that any product or service you are offering must not violate any laws (international, national, state, or city laws) in the areas where Smitox has its presence.",
    "Also, the products or services you list must comply with import or export laws of any nation we have a reach-in. If you are not sure about any of the laws, feel free to reach out, and we’ll guide you. If you “assume” that a product or service is legal in a city, locality, state, nation, or an international level and you prove to be wrong, Smitox will not be liable in any manner. A seller would be responsible and answerable for all such actions.",
    "The product listing has to be done sincerely to avoid Smitox seller account deactivation.",
    "The listing must have",
    "1. Accurate category selection (proper category mapping)",
    "2. Proper or actual or real image of the product",
    "3. Appropriate details of the product",
    "4. Along with the proper pricing",
    "If any seller’s product listing is found incomplete or improper then the seller account will be deactivated or the seller's product will not display on the Smitox platform.",
    "Standard Forbidden Items :Though Smitox is an entity in India, the B2B marketplace has reached many countries and continents. Hence, you are responsible, as a seller to not list any products/ services that are outlawed in any part of these nations or continents.",
    "In addition to legally prohibited items, we have also banned the items that encourage illegal activities like lock pick tools, racially, religiously, and ethically depredatory items, items that are sexual in nature, items that are not classified as a physical product,s or service like digital currencies, any types of financial securities, giveaways, and any such items offered to collect user information.",
    "Specific Outlawed Items:DrugsAny illegal drugs (like narcotics) or equipment needed to make or use them (drug precursor chemicals or carburetor pipes) or even to pack them (marijuana grow lights). Any media or content offering information on the production of such drugs is also banned.",
    "ChemicalsSmitox prohibits any hazardous, flammable, or explosive chemicals including radioactive substances, poisonous chemicals, or toxic chemicals.Ozone-depleting substances, harmful substances like products containing asbestos or even fireworks and firecrackers are also banned.",
    "WeaponsAny ammunition and firearms are prohibited. Any content or media on the creation of arms, ammunition, or weapons (chemical, biological, and nuclear) are also banned. Even lookalike or replica of firearms or their components are not allowed. Any weapon that can potentially harm others like batons, stun guns, crossbows, or batons is also prohibited (including disguised knives or switchblade knives).",
    "Law Enforcement, Government Or Military Issued ItemsClothing, badges, medals, awards, decorations, insignia, uniforms that resemble any such items offered by the law enforcement agencies, government, or the military are banned.Only items that are sold as toys like toy badges or historical items (like badges) that are no longer used and Authorized general souvenirs are allowed.The mass transit-related items like clothing, badges, medals, awards, decorations, insignia, uniforms pertaining to pilots, airport personnel, railway personnel, metro personnel, etc. must not be listed.Safety manuals of buses, trains, airplanes, etc. can only be sold if they are obsolete.Any kind of classified, official, internal, or non-public documents can’t be listed no matter when they were created.Unless you can prove that you are a legally authorized dealer and intend to serve only legal authorities, you cannot list police equipment or any associated products.",
    "Medical DrugsListing of prescription drugs, narcotics, and psychotropic drugs is prohibited. Products claiming to enhance sexual abilities, whether orally administered or indigested are strictly prohibited. Prescription veterinary drugs might or might not be listed (specific to the drug you are listing). Over the counter medications can be listed if you have & can offer production and sales permits to SmitoxMedical DevicesAny seller is not allowed to provide unauthorized medical devices that have been manufactured without the vital production and sales permits.",
    "Adult Content Or DevicesPosting of any content or devices pertaining to pornography, sexual activity, rapes, or incest are strictly prohibited. Some kinds of sex toys can be listed but without any graphic images.",
    "Crime-Oriented Equipment And ItemsAny product that has to do with gaining access to unauthorized access like descramblers are not allowed. Any information that can lead to a crime like how to use hacking software is also prohibited. Devices designs to block or jam communications, spy equipment or devices used to intercept electronic communications are not allowed. Though hidden photographic items can be listed, they should not be used for illicit purposes. Unauthorized circumvention devices, skimmers, and black card readers are also not allowed.",
    "Illegal ServicesIf a listing claims to provide a government service is found, it will be removed. Documents related to confidential government operations are also prohibited. Any devices used to create or forge government IDs or documents are not allowed.No invoices, receipts, financial services, healthcare, or medical services should be listed. Any listing containing bulk email or spam messages is prohibited. Even job postings and non-business-to-business transactions are not allowed. Non-transferable items like airline tickets, lottery tickets, event tickets can’t be sold or listed.Artifacts, Collections, Humans, And AnimalsArtifacts, collections and precious metals, legal tender & stamps, gold, silver, and other precious metals (excluding jewelry), rough diamonds, human parts, human remains, protected fauna & flora, species, or animal parts, parts of mammals like whales and products made from animal skin or any equipment that can be used to harm animals illegally are not permittedReplicas of coins and collectibles are permitted if they are marked with words like replica, reproduction, and copy. Human hair like wigs for commercial uses is permitted. Listing or sale of livestock, pets, and poultry can be listed for sales but not in wholesale.",
    "Threats To National SecurityMedia, information, and publications that can aid terrorist organizations or threaten national security are strictly prohibited. Racially offensive postings and listings advocating, supporting, or promoting Nazism and Fascism and other extreme ideologies are prohibited as well.",
    "Tobacco And Related ProductsThe listing of all tobacco products, including cigars, tobacco leaf, and cigarettes, is strictly prohibited. The listing of e-cigarettes & accessories and equipment for processing and producing tobacco products can be listed as per the laws of specific countries. For instance, Smitox members located in mainland China can only list equipment used for tobacco production and processing after they have acquired vital sales and production permits and can share the same with us.",
    "Gambling Related ListingsProducts that can be used for gambling are prohibited with the exception of equipment used for fun like playing cards.",
    "Laws And Trade RestrictionsProducts prohibited by trade restrictions, regulations, sanctions, and laws in any country, state, city, locality or internationally are prohibited on Smitox too.",
    "Harmful, Used Or Refurbished ProductsProducts that can harm others like toys made by using lead, automotive airbags, and any explosive materials are prohibited. Listing refurbished laptops, mobile phones, computers, etc. is also prohibited. Used clothing can be listed (excluding undergarments) if they are thoroughly cleaned. Make sure that the postings don’t contain any inappropriate or extraneous descriptions. Used cosmetics listings are prohibited.",
    "Tickets And ContractsBefore listing any kind of contracts or tickets, make sure you are doing so legally. For example, there are certain terms printed on an airline ticket that may restrict you from selling them on Smitox. You can resell event tickets if they are permitted by law and the terms listed on the tickets. Before listing any real estate items, make sure you are within the law limits. Listing of any kind of stolen illegally acquired or acquired without authorization is strictly prohibited.",
    "IPR Related ListingsListing that imitates an image, the signature or the name of another person or entity is prohibited unless you have proper authorization from the person or entity. The listing of unauthorized copies of video games, movies TV series, photographs, or software is prohibited too.",
    "Counterfeit ProductsListings containing non-licensed replicas, counterfeits, and unauthorized items like designer clothes or sunglasses are prohibited. Products that have the name of a brand but are weren’t endorsed or originate from the brand are prohibited. Only postings of branded items that have a certificate of authorization issued by the brand owner are permitted.",
    "Software ListingsUnauthorized listings of academic software are prohibited. You need to furnish a certificate of authorization if you want to list academic software. Bundled copies or OEM software products aren’t allowed on Smitox as they prohibit a purchaser from reselling it.",
    "Adult ListingsAny adult subscription or chatting services or items containing nudity are prohibited on Smitox.",
    "DegreesCopies of original or fake degrees, diplomas, and other educational certifications is strictly prohibited on Smitox Any Issue Seller Him self Is Resonpible For This .DonationsAny listings requesting donations on behalf of a person or entity are strictly prohibited.Please note that Smitox reserves the right to change the product listing policy at any point in time and it is the responsibility of the sellers to check it from time to time. Being unaware of a product listing policy will not be considered as an excuse when we take actions like removing a listing or banning a member (temporarily or permanently).",
    "All decisions taken by Smitox with regard to product listing policy will be final and irrevocable. In case of any queries or concerns regarding a product listing or its removal, please contact the customer care team of Smitox, we’ll be happy to help you.",
    "sellersTerms and condition :-⦁ Smitox give access to register and active gst number to sell on smitox .⦁ Vendor can sell their product through smitox platform to all over india in any category which in mention in system .For any other Category He Needs Approve then we can approve and add that category .⦁ Smitox connect vendor to customer and customer place order and seller has too communicate with buyer and has per buyer and vendor satisfaction they can send goods has their communication .⦁ Smitox is Not responsible any kind of loss or fraud done by seller or buyer or courier company .smitox only connects vendor to customer for vendor and customer to sell and purchase right product with low price and good quality .⦁ Smitox registration is free .⦁ Smitox one month selling in free and after that 3000+gst charges will be their for maintanence charge .Rest Smitox Does Not ask for any other charges from seller .⦁ Smitox will Support you Monday to Saturday -11am to 7 pm .⦁ If product is defective and different from what was order in that case buyer will return the product and seller has to accept it .⦁ If any missuse of policy seller will be block on smitox for sell and strick action will be taken against seller ..Smitox is not responsible any kind of product listing i.e: copy or any other things .According to Governmant Policy ,Terms and condtion May changes .Note: Whatever rates you set for your product, it is assumed that you actually want to sell it at the mentioned price. Keep on checking your pricing and make sure you have set competitive prices. Smitox won't be responsible for product pricing even if the buyer is buying the product directly through the portal via clicking on the Buy Now button.Smitox is not responsible for any kind of product damage ,product loss by courier ,not for different product receive and not for any advance payment .Buyer and seller coordinate and make payment courier has per their rules .Smitox Only Generates leads and order to seller after that Buyer and seller co-odinate and send goods has their condition ."
    
  ];

  // Function to toggle expanded state
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <Layout title={"Privacy Policy"}>
      <div className="row contactus" style={{ position: "relative", width: "100%",   padding: "100px 25px", }}>
        <div className="col-md-6">
          <img
            src="/images/contactus.jpeg"
            alt="contactus"
            style={{ width: "100%" }}
          />
        </div>
        <div className="col-md-4" style={{ maxHeight: "400px", overflowY: "auto",padding:"40px" }}>
          {privacyPolicyContent.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
          {!expanded && (
            <p>
              <button className="btn btn-link" onClick={toggleExpanded}>
                Read More
              </button>
            </p>
          )}
          {expanded && (
            <p>
              <button className="btn btn-link" onClick={toggleExpanded}>
                Show Less
              </button>
            </p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Terms;
