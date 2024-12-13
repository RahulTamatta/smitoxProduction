
import mongoose from "mongoose";

const minimumOrderSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    required: true,
  },
});

export default  mongoose.model('MinimumOrder', minimumOrderSchema);
