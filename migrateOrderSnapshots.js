import mongoose from "mongoose";
import dotenv from "dotenv";
import Order from "./models/orderModel.js";
import Product from "./models/productModel.js";

// Load environment variables
dotenv.config();

/**
 * Migration Script: Populate Order Snapshot Data
 * 
 * This script populates missing snapshot data for existing orders:
 * - unitPrice: Price per unit at time of order
 * - netAmount: unitPrice * quantity (before tax)
 * - taxAmount: GST amount
 * - totalAmount: netAmount + taxAmount
 * - gst: GST percentage
 * - productName: Product name snapshot
 * - productImage: Product image snapshot
 * - unitSet: Unit set snapshot
 */

// Calculate bulk price for a product based on quantity
const calculateBulkPrice = (product, quantity) => {
  const unitSet = product.unitSet || 1;
  
  if (!product.bulkProducts || product.bulkProducts.length === 0) {
    return parseFloat(product.perPiecePrice || product.price || 0);
  }

  // Sort bulk products by minimum quantity (descending)
  const sortedBulkProducts = [...product.bulkProducts]
    .filter(bp => bp && bp.minimum)
    .sort((a, b) => b.minimum - a.minimum);

  // Check highest tier first
  if (sortedBulkProducts.length > 0 && quantity >= (sortedBulkProducts[0].minimum * unitSet)) {
    return parseFloat(sortedBulkProducts[0].selling_price_set);
  }

  // Find applicable tier
  const applicableBulk = sortedBulkProducts.find(
    (bp) => quantity >= (bp.minimum * unitSet) && 
            (!bp.maximum || quantity <= (bp.maximum * unitSet))
  );

  if (applicableBulk) {
    return parseFloat(applicableBulk.selling_price_set);
  }

  // Fallback to regular price
  return parseFloat(product.perPiecePrice || product.price || 0);
};

// Main migration function
const migrateOrderSnapshots = async () => {
  try {
    console.log("🚀 Starting order snapshot migration...\n");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB\n");

    // Fetch all orders
    const orders = await Order.find({}).populate('products.product');
    console.log(`📦 Found ${orders.length} orders to process\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const order of orders) {
      try {
        let orderModified = false;

        for (let i = 0; i < order.products.length; i++) {
          const orderProduct = order.products[i];
          
          // Skip if snapshot data already exists
          if (orderProduct.unitPrice && orderProduct.netAmount && orderProduct.totalAmount) {
            continue;
          }

          // Fetch full product details if not populated
          let product = orderProduct.product;
          if (!product || !product.name) {
            try {
              product = await Product.findById(orderProduct.product);
              if (!product) {
                console.log(`⚠️  Product not found for order ${order._id}, product ID: ${orderProduct.product}`);
                continue;
              }
            } catch (err) {
              console.log(`❌ Error fetching product for order ${order._id}: ${err.message}`);
              continue;
            }
          }

          const quantity = orderProduct.quantity || 0;
          
          // Calculate unit price (use existing price or calculate bulk price)
          let unitPrice = parseFloat(orderProduct.price) || 0;
          if (unitPrice === 0) {
            unitPrice = calculateBulkPrice(product, quantity);
          }

          // Get GST percentage
          const gst = parseFloat(product.gst) || 0;

          // Calculate amounts
          const netAmount = unitPrice * quantity;
          const taxAmount = (netAmount * gst) / 100;
          const totalAmount = netAmount + taxAmount;

          // Update snapshot data
          order.products[i].unitPrice = unitPrice;
          order.products[i].netAmount = parseFloat(netAmount.toFixed(2));
          order.products[i].taxAmount = parseFloat(taxAmount.toFixed(2));
          order.products[i].totalAmount = parseFloat(totalAmount.toFixed(2));
          order.products[i].gst = gst;
          order.products[i].productName = product.name || "";
          order.products[i].productImage = product.photos || "";
          order.products[i].unitSet = product.unitSet || 1;

          orderModified = true;
        }

        if (orderModified) {
          await order.save();
          updatedCount++;
          console.log(`✅ Updated order: ${order._id}`);
        } else {
          skippedCount++;
        }

      } catch (error) {
        errorCount++;
        console.log(`❌ Error processing order ${order._id}: ${error.message}`);
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log("📊 Migration Summary:");
    console.log("=".repeat(50));
    console.log(`✅ Orders updated: ${updatedCount}`);
    console.log(`⏭️  Orders skipped (already had snapshot data): ${skippedCount}`);
    console.log(`❌ Orders with errors: ${errorCount}`);
    console.log(`📦 Total orders processed: ${orders.length}`);
    console.log("=".repeat(50) + "\n");

    console.log("🎉 Migration completed successfully!");

  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("✅ Database connection closed");
    process.exit(0);
  }
};

// Run migration
migrateOrderSnapshots();
