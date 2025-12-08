import mongoose from "mongoose";

const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      default: 0, // 0 for free plans
    },
    currency: {
      type: String,
      default: "INR",
    },
    billingCycle: {
      type: String,
      enum: ["monthly", "quarterly", "yearly"],
      required: true,
    },
    // Plan Features
    features: [
      {
        name: String,
        description: String,
        limit: Number, // null for unlimited
      },
    ],
    // Limits & Quotas
    maxProducts: {
      type: Number,
      default: null, // null for unlimited
    },
    maxOrders: {
      type: Number,
      default: null,
    },
    maxCategories: {
      type: Number,
      default: null,
    },
    maxBulkPricingTiers: {
      type: Number,
      default: 3,
    },
    // Capabilities/Permissions
    includedCapabilities: [String], // Additional capabilities for this plan
    excludedCapabilities: [String], // Capabilities not available in this plan
    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
    isFree: {
      type: Boolean,
      default: false,
    },
    isRecommended: {
      type: Boolean,
      default: false,
    },
    // Display
    displayOrder: {
      type: Number,
      default: 0,
    },
    badgeText: {
      type: String,
      default: null,
    },
    badgeColor: {
      type: String,
      default: null,
    },
    // Trial Period
    trialDays: {
      type: Number,
      default: 0,
    },
    // Discounts
    setupFee: {
      type: Number,
      default: 0,
    },
    discountPercentage: {
      type: Number,
      default: 0,
    },
    // Support
    supportLevel: {
      type: String,
      enum: ["email", "priority", "dedicated"],
      default: "email",
    },
    // Metadata
    tags: [String],
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

export default mongoose.model("SubscriptionPlan", subscriptionPlanSchema);
