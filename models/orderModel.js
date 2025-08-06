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
        price: {  // Made optional with default value
          type: Number,
          default: 0  // Add default value to prevent NaN errors
        }
      },
    ],
    payment: {
      paymentMethod: {
        type: String,
        enum: ["COD", "Razorpay","Advance"],
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
    placedBy: {
      type: mongoose.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);