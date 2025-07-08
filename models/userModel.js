import mongoose from "mongoose";
const { Schema } = mongoose;  // Extract Schema from mongoose

const userSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
   //   required: true,
      unique: true,
    },
    mobile_no: {
      type: Schema.Types.Mixed,
   //   required: true,
      unique: true,
    },
    email_id: {
      type: String,
   //   required: true,
      unique: true,
    },
    user_fullname: {
      type: String,
   //   required: true,
    },
    password: {
      type: String,
   //   required: true,
    },
    image: {
      type: String,
   //   required: true,
    },
    token: {
      type: String,
   //   required: true,
    },
    country: {
      type: String,
   //   required: true,
    },
    company: {
      type: String,
   //   required: true,
    },
    gst_no: {
      type: String,
   //   required: true,
    },
    pan_no: {
      type: String,
   //   required: true,
    },
    gst_image: {
      type: String,
   //   required: true,
    },
    pan_image: {
      type: String,
   //   required: true,
    },
    account_name: {
      type: String,
   //   required: true,
    },
    account_no: {
      type: String,
   //   required: true,
    },
    ifsccode: {
      type: String,
   //   required: true,
    },
    check_image: {
      type: String,
   //   required: true,
    },
    identity_proof: {
      type: String,
   //   required: true,
    },
    identity_proof_no: {
      type: String,
   //   required: true,
    },
    identity_proof_image: {
      type: String,
   //   required: true,
    },
    address_proof: {
      type: String,
   //   required: true,
    },
    address_proof_no: {
      type: String,
   //   required: true,
    },
    address_proof_image: {
      type: String,
   //   required: true,
    },
    fname: {
      type: String,
   //   required: true,
    },
    lname: {
      type: String,
   //   required: true,
    },
    entity_name: {
      type: String,
   //   required: true,
    },
    b_mobile_no: {
      type: String,
   //   required: true,
    },
    b_email_id: {
      type: String,
   //   required: true,
    },
    pincode: {
      type: String,
   //   required: true,
    },
    address: {
      type: mongoose.Schema.Types.Mixed, // Allows any data type
   //   required: true,
    },
    state: {
      type: String,
      required: false
    },
    city: {
      type: String,
      required: false
    },
    landmark: {
      type: String,
      required: false
    },
    min_order_price: {
      type: Number,
   //   required: true,
    },
    b_form_status: {
      type: Number,
   //   required: true,
    },
    status: {
      type: Number,
      enum: [0, 1, 2], // 0 = Pending, 1 = Active, 2 = Blocked
      default: 0,
    },
    flag: {
      type: Number,
      enum: [0, 1], // 0 = Active, 1 = Inactive
      default: 0,
    },
    entry_datetime: {
      type: Date,
      default: Date.now,
    },
    live_product: {
      type: Number,
      enum: [0, 1], // 0 = Non-live, 1 = Live
      default: 1,
    },
    vacation: {
      type: Number,
      enum: [0, 1], // 0 = No, 1 = Yes
      default: 0,
    },
    credit: {
      type: Number,
   //   required: true,
    },
    order_type: {
      type: Number,
      enum: [0, 1], // 0 = COD, 1 = Advance
      default: 0,
    },
    return_status: {
      type: Number,
      enum: [0, 1, 2, 3, 4], // 0 = No Return, 1 = Applied, 2 = Confirmed, 3 = Cancelled, 4 = Completed
      default: 0,
    },
    return_reason: {
      type: String,
   //   required: true,
    },
    return_proof: {
      type: String,
   //   required: true,
    },
    commission_wallet: {
      type: Number,
      default: 0.0,
    },
    pickup_location: {
      type: String,
      default: "0",
    },
    city: {
      type: String,
   //   required: true,
    },
    state: {
      type: String,
   //   required: true,
    },
    type: {
      type: Number,
   //   required: true,
    },
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    cart: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        quantity: {
          type: Number,
        },
        bulkProductDetails: {
          minimum: {
            type: Number,
          },
          maximum: {
            type: Number,
          },
          selling_price_set: {
            type: Number,
          },
        },
        totalPrice: {
          type: Number,
        },
      },
    ],
    role: {
      type: Number,
      default: 0,
    },
    regular: {
      type: Number,
      enum: [0, 1, 2], // 0 = Non-regular, 1 = Regular, 2 = VIP
      default: 0,
    },
  },
  { timestamps: true }
);


export default mongoose.model("User", userSchema);
