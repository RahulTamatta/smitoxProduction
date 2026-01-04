import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.ObjectId,
      ref: "users",
      required: true,
    },
    planId: {
      type: mongoose.ObjectId,
      ref: "SubscriptionPlan",
      required: true,
    },
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
    },
    razorpayPaymentId: {
      type: String,
      sparse: true,
    },
    razorpaySignature: {
      type: String,
      sparse: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "INR",
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["razorpay", "stripe", "paypal"],
      default: "razorpay",
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    refundReason: {
      type: String,
      sparse: true,
    },
    refundedAt: {
      type: Date,
      sparse: true,
    },
    completedAt: {
      type: Date,
      sparse: true,
    },
    notes: {
      type: String,
      sparse: true,
    },
  },
  { timestamps: true }
);

// Index for faster queries
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ razorpayOrderId: 1 });

export default mongoose.model("Payment", paymentSchema);
