
import mongoose from "mongoose";

const Schema = mongoose.Schema;

const wishlistSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User', // Refers to the User model
    required: true
  },
  products: [ // This should be 'products', not 'items'
    {
      product: {
        type: Schema.Types.ObjectId,
        ref: 'Product', // Refers to the Product model
        required: true
      },
      addedAt: {
        type: Date,
        default: Date.now
      }
    }
  ]
});
export default mongoose.model("Wishlist", wishlistSchema);