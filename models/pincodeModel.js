import mongoose from "mongoose";

const pincodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
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
  india: {
    type: String,
    // required: false
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });
export default mongoose.model("Pincode", pincodeSchema);