
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
  advancePercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  }
});

export default  mongoose.model('MinimumOrder', minimumOrderSchema);
