// models/bannerModel.js
import mongoose from "mongoose";

const productForYouSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
    },
    categoryId: {
      type: mongoose.ObjectId,
      ref: "Category",
      required: true,
    },
    subcategoryId: {
      type: mongoose.ObjectId,
      ref: "SubCategory",
      required: true,
    },
    productId: {  // Add this field
      type: mongoose.ObjectId,
      ref: "Product",
      required: true,
    },
    image: {
      data: Buffer,
      contentType: String,
    },
    photos: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("ProductForYou", productForYouSchema);