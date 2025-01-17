import mongoose from "mongoose";

const subCategorySchema = new mongoose.Schema({
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  photo: {
    type: String,  // This will store the base64 string
  },
  photos: {
    type: String, // Cloudinary URL for single photo
    required: false,
  },
  slug: {
    type: String,
    lowercase: true,
  },
}, { timestamps: true });

export default mongoose.model("SubCategory", subCategorySchema);
