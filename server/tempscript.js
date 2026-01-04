import mongoose from "mongoose";
import Product from "./models/productModel.js";

const uri = "mongodb+srv://smitox:JSbWYZGtLBJGWxjO@smitox.rlcilry.mongodb.net/?retryWrites=true&w=majority&appName=smitox";

// Set mongoose options to address warnings and timeout issues
mongoose.set('strictQuery', false);

const connectOptions = {
  useNewUrlParser: true, 
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000, // Increase connection timeout
  socketTimeoutMS: 45000, // Increase socket timeout
};

mongoose.connect(uri, connectOptions)
  .then(() => console.log('Connected to MongoDB...'))
  .catch((err) => console.log('Error connecting to MongoDB:', err));

async function assignCustomOrder() {
  try {
    // Find all products, with increased timeout
    const products = await Product.find({}).maxTimeMS(30000).sort({ createdAt: -1 });
    
    console.log(`Total products found: ${products.length}`);
    
    // Use bulk write for more efficient updates
    const bulkOps = products.map((product, index) => ({
      updateOne: {
        filter: { _id: product._id },
        update: { $set: { custom_order: index + 1 } }
      }
    }));

    await Product.bulkWrite(bulkOps);
    
    console.log('Custom order assigned successfully');
  } catch (error) {
    console.error('Error assigning custom order:', error);
  } finally {
    mongoose.connection.close();
  }
}

assignCustomOrder();