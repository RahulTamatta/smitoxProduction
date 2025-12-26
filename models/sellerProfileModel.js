import mongoose from "mongoose";

const sellerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SellerApplication",
      required: true,
    },
    currentPlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      required: true,
    },
    planActivatedAt: {
      type: Date,
      default: null,
    },
    planExpiresAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    autoRenew: {
      type: Boolean,
      default: false,
    },
    paymentMethodId: {
      type: String,
      default: null,
    },
    // Profile Status
    status: {
      type: String,
      enum: ["active", "suspended", "inactive", "expired_payment_failed"],
      default: "active",
    },
    // Business Information
    businessName: {
      type: String,
      required: true,
    },
    businessType: {
      type: String,
      enum: ["sole_proprietor", "partnership", "pvt_ltd", "llp", "ngo"],
      required: true,
    },
    gstNumber: {
      type: String,
      required: true,
    },
    panNumber: {
      type: String,
      required: true,
    },
    businessDescription: {
      type: String,
    },
    businessLogo: {
      type: String,
      default: null,
    },
    businessBanner: {
      type: String,
      default: null,
    },
    // Contact Information
    primaryContactName: {
      type: String,
      required: true,
    },
    primaryContactEmail: {
      type: String,
      required: true,
    },
    primaryContactPhone: {
      type: String,
      required: true,
    },
    // Banking Information
    accountHolderName: {
      type: String,
      required: true,
    },
    accountNumber: {
      type: String,
      required: true,
    },
    ifscCode: {
      type: String,
      required: true,
    },
    bankName: {
      type: String,
      required: true,
    },
    // Metrics
    totalProducts: {
      type: Number,
      default: 0,
    },
    totalOrders: {
      type: Number,
      default: 0,
    },
    totalRevenue: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    // Wallet & Commission
    walletBalance: {
      type: Number,
      default: 0,
    },
    commissionRate: {
      type: Number,
      default: 0, // Percentage
    },
    // Verification
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationDate: {
      type: Date,
      default: null,
    },
    // Compliance
    complianceStatus: {
      type: String,
      enum: ["compliant", "warning", "non_compliant"],
      default: "compliant",
    },
    complianceNotes: {
      type: String,
      default: null,
    },
    // Suspension/Deactivation
    suspensionReason: {
      type: String,
      default: null,
    },
    suspensionDate: {
      type: Date,
      default: null,
    },
    // Subscription Status Tracking (Source of Truth)
    subscriptionStatus: {
      type: String,
      enum: ['active', 'expiring_soon', 'expired', 'grace_period', 'suspended'],
      default: 'active'
    },
    lastStatusChange: {
      type: Date,
      default: Date.now
    },
    statusHistory: [{
      status: String,
      changedAt: Date,
      reason: String
    }],
    paymentAttempts: [{
      attemptDate: Date,
      amount: Number,
      status: String, // success, failed, pending
      failureReason: String,
      paymentId: String
    }],
    gracePeriodStartDate: {
      type: Date,
      default: null
    },
    gracePeriodEndDate: {
      type: Date,
      default: null
    },
    // Seller Permissions (fine-grained)
    permissions: {
      canRefundOrders: {
        type: Boolean,
        default: false,
      },
      canDeleteOrders: {
        type: Boolean,
        default: false,
      },
      canModerateSellers: {
        type: Boolean,
        default: false,
      },
      grantedCapabilities: [String],
      deniedCapabilities: [String],
    },
  },
  { timestamps: true }
);

export default mongoose.model("SellerProfile", sellerProfileSchema);
