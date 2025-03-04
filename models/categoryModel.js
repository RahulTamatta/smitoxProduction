import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  photo: {
    type: mongoose.Schema.Types.Mixed,   // This will store the base64 string
  },
  photos: {
    type: String, // Cloudinary URL for single photo
    required: false,
  },
  slug: {
    type: String,
    lowercase: true,
  },
  subcategories: [{ type: String }],
});

export default mongoose.model("Category", categorySchema);
