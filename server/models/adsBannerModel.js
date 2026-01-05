import mongoose from "mongoose";

const adsbannerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    image: {
      data: Buffer,
      contentType: String,
    },
    photos: {
      type: String,
      required: false,
    },
    link: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("AdsBanner", adsbannerSchema);