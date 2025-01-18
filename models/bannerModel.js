// models/bannerModel.js
import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
  {
    bannerName: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      // required: true,
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
    image: {
      data: Buffer,
      contentType: String,
    },
 photos: {
      type: String, // Changed from Buffer to String to store Cloudinary URL
      required: false
    },
  },
  { timestamps: true }
);

export default mongoose.model("Banner", bannerSchema);