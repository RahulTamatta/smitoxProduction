import mongoose from 'mongoose';
import Cart from '../models/cartModel.js';
import Product from '../models/productModel.js';

const MONGO_URI = 'mongodb+srv://smitox:JSbWYZGtLBJGWxjO@smitox.rlcilry.mongodb.net/?retryWrites=true&w=majority&appName=smitox';

async function cleanupCarts() {
  try {
    console.log('Starting cart cleanup process...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Get all carts
    const carts = await Cart.find({});
    console.log(`Found ${carts.length} carts to process`);

    let totalRemovedItems = 0;
    let processedCarts = 0;

    // Process each cart
    for (const cart of carts) {
      try {
        const originalItemCount = cart.products.length;
        const validProducts = [];
        
        // Check each product in the cart
        for (const item of cart.products) {
          try {
            const product = await Product.findById(item.product);
            
            // Keep product if it exists, is active, and has stock
            if (product && 
                product.isActive === "1" && 
                product.stock > 0) {
              validProducts.push(item);
            } else {
              console.log(`Removing invalid product ${item.product} from cart ${cart._id}`);
              totalRemovedItems++;
            }
          } catch (productError) {
            console.error(`Error processing product ${item.product}:`, productError);
            // Skip this item if there's an error
            continue;
          }
        }

        // Update cart if items were removed
        if (validProducts.length !== originalItemCount) {
          cart.products = validProducts;
          await cart.save();
          console.log(`Updated cart ${cart._id}: Removed ${originalItemCount - validProducts.length} items`);
        }

        processedCarts++;
        
        // Log progress every 100 carts
        if (processedCarts % 100 === 0) {
          console.log(`Processed ${processedCarts} of ${carts.length} carts`);
        }

      } catch (cartError) {
        console.error(`Error processing cart ${cart._id}:`, cartError);
        // Continue with next cart
        continue;
      }
    }

    console.log('\nCleanup Summary:');
    console.log(`Processed ${processedCarts} carts`);
    console.log(`Removed ${totalRemovedItems} invalid items`);

  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('Cleanup process completed');
  }
}

// Run the cleanup
cleanupCarts();
