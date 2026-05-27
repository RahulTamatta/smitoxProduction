import mongoose from "mongoose";

const sellerApplicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: [
        "draft",
        "submitted",
        "under_review",
        "approved_pending_payment",
        "approved_payment_failed",
        "approved",
        "rejected",
        "active",
        "suspended",
        "reupload_requested",
      ],
      default: "draft",
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewNotes: {
      type: String,
      default: null,
    },
    lockPlan: {
      type: Boolean,
      default: false,
    },
    payment: {
      provider: {
        type: String,
        enum: ["razorpay", "stripe", null],
        default: null,
      },
      orderId: String,
      amount: Number,
      currency: {
        type: String,
        default: "INR",
      },
      status: {
        type: String,
        enum: ["pending", "paid", "failed", null],
        default: null,
      },
      createdAt: Date,
    },
    selectedPlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      required: true,
    },
    // Immutable Plan Snapshot (captured at draft/submit/approval)
    selectedPlanSnapshot: {
      _id: mongoose.Schema.Types.ObjectId,
      name: String,
      price: Number,
      currency: String,
      billingCycle: String,
      isFree: Boolean,
      includedCapabilities: [String],
      excludedCapabilities: [String],
      version: Number,
      capturedAt: Date,
    },
    // Plan Expiry & Renewal Tracking
    planStartDate: {
      type: Date,
      default: null, // Set when approved
    },
    planExpiryDate: {
      type: Date,
      default: null, // 30 days from start date
    },
    planStatus: {
      type: String,
      enum: ["active", "expiring_soon", "expired", "grace_period"],
      default: "active",
    },
    gracePeriodEndDate: {
      type: Date,
      default: null, // 30 days after expiry
    },
    renewalHistory: [
      {
        renewalDate: Date,
        previousPlanId: mongoose.Schema.Types.ObjectId,
        newPlanId: mongoose.Schema.Types.ObjectId,
        renewalType: {
          type: String,
          enum: ["initial", "renewal", "upgrade", "downgrade", "auto_fallback"],
        },
      },
    ],
    // Personal Information
    firstName: {
      type: String,
      default: "",
    },
    lastName: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      default: "",
    },
    alternatePhone: {
      type: String,
      default: "",
    },
    // Address Information
    addressLine1: {
      type: String,
      default: "",
    },
    addressLine2: {
      type: String,
      default: "",
    },
    area: {
      type: String,
      default: "",
    },
    city: {
      type: String,
      default: "",
    },
    state: {
      type: String,
      default: "",
    },
    pincode: {
      type: String,
      default: "",
    },
    landmark: {
      type: String,
      default: "",
    },
    country: {
      type: String,
      default: "India",
    },
    // Pickup Address (may differ from business address)
    pickupAddressLine1: {
      type: String,
      default: "",
    },
    pickupCity: {
      type: String,
      default: "",
    },
    pickupState: {
      type: String,
      default: "",
    },
    pickupPincode: {
      type: String,
      default: "",
    },
    // KYC Documents
    identityProofType: {
      type: String,
      enum: ["aadhar", "pan", "passport", "driving_license"],
      default: "aadhar",
    },
    identityProofNumber: {
      type: String,
      default: "",
    },
    identityProofImage: {
      type: String,
      default: null,
    },
    addressProofType: {
      type: String,
      enum: ["aadhar", "passport", "utility_bill", "lease_agreement"],
      default: "aadhar",
    },
    addressProofImage: {
      type: String,
      default: null,
    },
    // Business Information
    storeName: {
      type: String,
      default: "",
    },
    legalBusinessName: {
      type: String,
      default: "",
    },
    businessName: {
      type: String,
      default: "",
    },
    businessType: {
      type: String,
      enum: ["sole_proprietor", "partnership", "pvt_ltd", "llp", "ngo", "manufacturer", "trader_distributor"],
      default: "sole_proprietor",
    },
    businessCategory: {
      type: String,
      default: "",
    },
    yearsInBusiness: {
      type: Number,
      default: null,
    },
    gstNumber: {
      type: String,
      default: "",
    },
    gstExemptionDeclared: {
      type: Boolean,
      default: false,
    },
    gstImage: {
      type: String,
      default: null,
    },
    panNumber: {
      type: String,
      default: "",
    },
    panImage: {
      type: String,
      default: null,
    },
    businessDescription: {
      type: String,
      maxlength: 1000,
    },
    // Banking Information
    accountHolderName: {
      type: String,
      default: "",
    },
    accountNumber: {
      type: String,
      default: "",
    },
    accountType: {
      type: String,
      enum: ["savings", "current"],
      default: "savings",
    },
    ifscCode: {
      type: String,
      default: "",
    },
    bankName: {
      type: String,
      default: "",
    },
    cancelledCheckImage: {
      type: String,
      default: null,
    },
    // Consents
    termsAccepted: {
      type: Boolean,
      default: false,
    },
    privacyAccepted: {
      type: Boolean,
      default: false,
    },
    communicationConsent: {
      type: Boolean,
      default: false,
    },
    // Immutability tracking (becomes immutable after activation)
    isImmutable: {
      type: Boolean,
      default: false
    },
    activatedAt: {
      type: Date,
      default: null
    },
    // Suspension tracking
    suspendedAt: {
      type: Date,
      default: null,
    },
    suspendedReason: {
      type: String,
      default: null,
    },
    // Re-upload request tracking
    reuploadRequestedFields: {
      type: [String],
      default: [],
    },
    reuploadReason: {
      type: String,
      default: null,
    }
  },
  { timestamps: true }
);

// Indexes for analytics performance
sellerApplicationSchema.index({ userId: 1, createdAt: -1 });
sellerApplicationSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model("SellerApplication", sellerApplicationSchema);
