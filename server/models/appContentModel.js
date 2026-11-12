import mongoose from "mongoose";

const appContentSchema = new mongoose.Schema(
  {
    whatsappNumber: {
      type: String,
      default: "+91 9876543210",
      trim: true,
    },
    businessEmail: {
      type: String,
      default: "support@smitox.com",
      trim: true,
    },
    gstNumber: {
      type: String,
      default: "",
      trim: true,
    },
    legalName: {
      type: String,
      default: "PMK E-COMMERCE PRIVATE LIMITED",
      trim: true,
    },
    tradeName: {
      type: String,
      default: "SMITOX B2B",
      trim: true,
    },
    registeredAddress: {
      type: String,
      default: "Mumbai, Maharashtra 400072, India",
      trim: true,
    },
    privacyPolicy: {
      type: String,
      default: "",
    },
    termsAndConditions: {
      type: String,
      default: "",
    },
    aboutUs: {
      type: String,
      default: "Smitox helps Indian SMEs trade through a low-cost B2B marketplace built for brands, retailers, and manufacturers.",
    },
    returnPolicy: {
      type: String,
      default: "Returns are accepted only when explicitly allowed for the order. Buyers must provide a complete unboxing video and coordinate return claims directly with the seller.",
    },
    // Admin-managed note shown above the "Place Order" button on web + app checkout.
    checkoutNote: {
      type: String,
      default: "",
      trim: true,
      maxlength: 5000,
    },
    // Admin-managed cart notices (web + app). Placeholders: {amount}, {percent}.
    // An empty string hides that line.
    minimumOrderNotice: {
      type: String,
      default: "Order total is below the minimum order amount {amount}.",
      trim: true,
      maxlength: 500,
    },
    courierChargeNotice: {
      type: String,
      default: "Courier charge will be added (depends on weight and COD amount).",
      trim: true,
      maxlength: 500,
    },
    advancePaymentNotice: {
      type: String,
      default: "{percent}% advance payment is available to confirm the order.",
      trim: true,
      maxlength: 500,
    },
    // When false, checkout shows only "Place Order" and orders are created with
    // payment.paymentMethod = "Order Placed"; admin collects payment manually (GPay / COD).
    razorpayEnabled: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("AppContent", appContentSchema);
