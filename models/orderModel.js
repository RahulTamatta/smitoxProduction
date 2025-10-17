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
        price: {  // Unit price at time of order (snapshot)
          type: Number,
          default: 0
        },
        // Snapshot data - stored at time of order placement
        unitPrice: {  // Price per unit (same as price, for clarity)
          type: Number,
          default: 0
        },
        netAmount: {  // unitPrice * quantity (before tax)
          type: Number,
          default: 0
        },
        taxAmount: {  // GST amount
          type: Number,
          default: 0
        },
        totalAmount: {  // netAmount + taxAmount
          type: Number,
          default: 0
        },
        gst: {  // GST percentage at time of order
          type: Number,
          default: 0
        },
        productName: {  // Product name snapshot
          type: String,
          default: ""
        },
        productImage: {  // Product image snapshot
          type: String,
          default: ""
        },
        unitSet: {  // Unit set snapshot
          type: Number,
          default: 1
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
        "Confirmed", 
        "Accepted", 
        "Cancelled", 
        "Rejected", 
        "Dispatched", 
        "Delivered", 
        "Returned"
      ]
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