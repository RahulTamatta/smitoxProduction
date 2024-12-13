import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.ObjectId,
      ref: "User",
    },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        quantity: Number,
        price: Number
      },
    ],
    payment: {
      paymentMethod: {
        type: String,
        enum: ["COD", "UPI"],
        // required: true,
      },
      transactionId: String,
     
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      default: "Pending",
      enum: [
        "Pending", 
          "Completed", 
          "Cash on Delivery", 
          "All", 
          "Pending", 
          "Confirmed", 
          "Accepted", 
          "Cancelled", 
          "Rejected", 
          "Dispatched", 
          "Delivered", 
          "Returned"]
    },
    deliveryCharges: {
      type: Number,
      default: 0,
    },
    codCharges: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    amountPending: {
      type: Number,
      default: 0,
    },
    tracking: {
      company: String,
      id: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);