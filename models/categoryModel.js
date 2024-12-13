import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  photo: {
    type: String,  // This will store the base64 string
  },
  slug: {
    type: String,
    lowercase: true,
  },
  subcategories: [{ type: String }],
});

export default mongoose.model("Category", categorySchema);
