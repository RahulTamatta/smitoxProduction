import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    user_id: { 
      type: String, 
    },
    user_fullname: { 
      type: String, 
    },
    email_id: {  // changed from 'email' to 'email_id'
      type: String, 
      unique: true 
    },
    mobile_no: {  // changed from 'phone' to 'mobile_no'
      type: Number, 
      required: true,
      trim: true, 
      unique: true 
    },
    address: { 
      type: String, 
      required: true
    },
    pincode: { 
      type: String, 
      required: true
    },
    status: { 
      type: Number, 
      enum: [0, 1, 2],
      default: 1  // 0: inactive, 1: active
    },
    regular: { 
      type: Number, 
      enum: [0, 1, 2],
      default: 0  // 0: inactive, 1: active
    },
    flag: { 
      type: Number, 
      default: 0  // 0: active, 1: blocked
    },
    products: [{ 
      type: mongoose.ObjectId, 
      ref: "Product" 
    }],
    wishlist: [{ 
      type: mongoose.ObjectId, 
      ref: "Product" 
    }],
    cart: [{
      product: { 
        type: mongoose.ObjectId, 
        ref: "Product" 
      },
      quantity: { 
        type: Number 
      },
      bulkProductDetails: {
        minimum: { 
          type: Number 
        },
        maximum: { 
          type: Number 
        },
        selling_price_set: { 
          type: Number 
        },
      },
      totalPrice: { 
        type: Number 
      },
    }],
    image: { 
      type: String 
    },
    gst_no: {  // added based on example
      type: String 
    },
    pan_no: {  // added based on example
      type: String 
    },
    gst_image: {  // added based on example
      type: String 
    },
    pan_image: {  // added based on example
      type: String 
    },
    account_name: {  // added based on example
      type: String 
    },
    account_no: {  // added based on example
      type: String 
    },
    ifsccode: {  // added based on example
      type: String 
    },
    check_image: {  // added based on example
      type: String 
    },
    identity_proof: {  // added based on example
      type: String 
    },
    identity_proof_no: {  // added based on example
      type: String 
    },
    identity_proof_image: {  // added based on example
      type: String 
    },
    address_proof: {  // added based on example
      type: String 
    },
    address_proof_no: {  // added based on example
      type: String 
    },
    address_proof_image: {  // added based on example
      type: String 
    },
    min_order_price: {  // added based on example
      type: Number 
    },
    vacation: {  // added based on example
      type: Number, 
      default: 0 
    },
    role: { 
      type: Number, 
      default: 0, 
      required: false, // Not required to allow null
    },
    commission_wallet: {  // added based on example
      type: Number, 
      default: 0 
    },
    pickup_location: {  // added based on example
      type: Number, 
      default: 0 
    },
    entry_datetime: { 
      type: Date, 
      default: Date.now 
    },
  },
  { timestamps: true }
);


export default mongoose.model("User", userSchema);
