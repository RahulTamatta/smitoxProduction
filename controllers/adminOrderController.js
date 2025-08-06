import mongoose from "mongoose";
import orderModel from "../models/orderModel.js";
import productModel from "../models/productModel.js";
import userModel from "../models/userModel.js";

// Controller for admin to place orders on behalf of users
export const createAdminOrderController = async (req, res) => {
  try {
    console.log(`[Admin Order] Request initiated | IP: ${req.ip}`);
    
    // Check if user is admin
    console.log(`[Admin Order Check] User role: ${req.user?.role}, User ID: ${req.user?._id}`);
    if (!req.user || req.user.role != 1) {  // Use != instead of !== to handle both string and number
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
        currentRole: req.user?.role,
      });
    }

    const { products, paymentMethod, amount, amountPending, userId } = req.body;

    // Validate userId
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Valid user ID is required",
      });
    }

    // Check if target user exists
    const targetUser = await userModel.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "Target user not found",
      });
    }

    // Validate products array
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Products array is required and must not be empty",
      });
    }

    // Validate each product
    for (const [index, item] of products.entries()) {
      if (!item.product || !mongoose.Types.ObjectId.isValid(item.product)) {
        return res.status(400).json({
          success: false,
          message: `Invalid product ID at position ${index + 1}`,
        });
      }
      
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid quantity at position ${index + 1}`,
        });
      }
    }

    // Stock validation
    for (const item of products) {
      const product = await productModel.findById(item.product);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product with ID ${item.product} not found`,
        });
      }
      
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product "${product.name}"`,
        });
      }
    }

    // Calculate total amount if not provided
    let totalAmount = amount || 0;
    if (totalAmount === 0) {
      for (const item of products) {
        const product = await productModel.findById(item.product);
        let itemPrice = parseFloat(product.price || 0);
        
        // Apply bulk pricing if available
        if (product.bulkProducts && product.bulkProducts.length > 0) {
          const unitSet = product.unitSet || 1;
          const sortedBulkProducts = [...product.bulkProducts]
            .filter(bp => bp && bp.minimum)
            .sort((a, b) => b.minimum - a.minimum);

          const applicableBulk = sortedBulkProducts.find(
            bp => item.quantity >= bp.minimum * unitSet &&
                  (!bp.maximum || item.quantity <= bp.maximum * unitSet)
          );

          if (applicableBulk) {
            itemPrice = parseFloat(applicableBulk.selling_price_set);
          }
        }
        
        totalAmount += itemPrice * item.quantity;
      }
    }

    // Create order with target user's details
    const order = new orderModel({
      products: products.map(item => ({
        product: item.product,
        quantity: item.quantity,
        price: item.price || 0,
      })),
      payment: {
        paymentMethod,
        transactionId: `${paymentMethod}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        status: paymentMethod === "COD" ? false : true,
      },
      buyer: userId, // Use target user's ID instead of admin's ID
      amount: totalAmount,
      amountPending: amountPending || (paymentMethod === "COD" ? totalAmount : 0),
      status: "Pending",
      placedBy: req.user._id, // Track which admin placed the order
    });

    await order.save();

    // Update stock for each product
    await Promise.all(
      products.map(async (item) => {
        await productModel.findByIdAndUpdate(
          item.product,
          { $inc: { stock: -item.quantity } },
          { new: true }
        );
      })
    );

    res.json({
      success: true,
      message: `Order placed successfully on behalf of ${targetUser.user_fullname}`,
      order,
    });

  } catch (error) {
    console.error("[Admin Order] Error:", error);
    res.status(500).json({
      success: false,
      message: "Error processing admin order",
      error: error.message,
    });
  }
};
