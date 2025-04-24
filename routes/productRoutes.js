import express from "express";
import {
  createProductController,
  deleteProductController,
  getProductController,
  getSingleProductController,verifyPaymentController,
  productCategoryController,
  productCountController,
  productFiltersController,
  productListController,
  productPhotoController,
  realtedProductController,
  searchProductController,
  updateProductController,
  getProductPhoto,
  productSubcategoryController,
  processPaymentController, // Add this new controller
  // braintreeTokenController, // Keep this for UPI token generation
} from "../controllers/productController.js";
import { isAdmin, requireSignIn } from "../middlewares/authMiddleware.js";
import formidable from "express-formidable";
import productModel from "../models/productModel.js";

const router = express.Router();

// Existing routes
router.post(
  "/create-product",
  requireSignIn,
  isAdmin,
  formidable(),
  createProductController
);

router.put(
  "/update-product/:pid",
  requireSignIn,
  isAdmin,
  formidable(),
  updateProductController
);

router.get("/get-product", getProductController);
import mongoose from 'mongoose';
import Cart from '../models/cartModel.js';
import Product from '../models/productModel.js';

router.put("/updateStatus/products/:id", async (req, res) => {
  try {
    // Ensure `isActive` is provided in the request body
    if (!req.body.isActive) {
      return res.status(400).send({
        success: false,
        message: "isActive field is required",
      });
    }

    // Find and update the product by ID
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: req.body.isActive },
      { new: true, runValidators: true } // Use runValidators to ensure enum validation
    );

    if (!product) {
      return res.status(404).send({
        success: false,
        message: "Product not found",
      });
    }

    // If the product is inactive, remove it from all carts
    if (req.body.isActive === "0") {
      await cleanupCartsForProduct(req.params.id);
    }

    // Send success response with updated product
    res.send({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Error updating product status:", error); // Log the error for debugging
    res.status(500).send({
      success: false,
      message: "Server error",
      error: error.message, // Include error message for debugging
    });
  }
});

// Function to remove a specific product from all carts
async function cleanupCartsForProduct(productId) {
  try {
    console.log(`Starting cleanup for product ID: ${productId}`);

    // Connect to MongoDB (if not already connected)
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('Connected to MongoDB');
    }

    // Get all carts
    const carts = await Cart.find({});
    console.log(`Found ${carts.length} carts to process`);

    let totalRemovedItems = 0;

    // Process each cart
    for (const cart of carts) {
      const originalItemCount = cart.products.length;
      const validProducts = cart.products.filter(
        (item) => item.product.toString() !== productId
      );

      // Update cart if items were removed
      if (validProducts.length !== originalItemCount) {
        cart.products = validProducts;
        await cart.save();
        console.log(`Updated cart ${cart._id}: Removed 1 item`);
        totalRemovedItems++;
      }
    }

    console.log(`Cleanup Summary for product ID ${productId}:`);
    console.log(`Removed ${totalRemovedItems} items from carts`);
  } catch (error) {
    console.error(`Error during cleanup for product ID ${productId}:`, error);
  }
}


router.get("/get-product/:slug", getSingleProductController);
router.get("/product-photo/:pid", productPhotoController);
router.delete("/delete-product/:pid", deleteProductController);
router.post("/product-filters", productFiltersController);
router.get("/product-count", productCountController);
router.get("/product-list/:page", productListController);
router.get("/search/:keyword", searchProductController);
router.get("/related-product/:pid/:cid", realtedProductController);
router.get("/product-category/:slug", productCategoryController);
router.get("/product-subcategory/:subcategoryId", productSubcategoryController);
// Keep this for UPI token
// router.get("/product-photo/:pid", getProductPhoto);
// New route for processing payments (both COD and UPI)
router.post("/process-payment", requireSignIn, processPaymentController);
router.post("/verify-payment", requireSignIn, verifyPaymentController);

export default router;