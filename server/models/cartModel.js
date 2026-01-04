import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.ObjectId,
      ref: "users",
      required: true,
    },
    products: [
      {
        product: {
          type: mongoose.ObjectId,
          ref: "Product",
        },
        quantity: {
          type: Number,
          default: 1,
        },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Cart", cartSchema);