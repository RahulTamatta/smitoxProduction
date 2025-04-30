import express from "express";
import cartModel from "../models/cartModel.js";
import wishlistModel from "../models/wishlistModel.js";
import productForYouModel from "../models/productForYouModel.js";
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
// router.post('/generate-sku', generateSKU);


router.put(
  "/update-product/:pid",
  requireSignIn,
  isAdmin,
  formidable(),
  updateProductController
);

router.get("/get-product", getProductController);
router.put("/updateStatus/products/:id", async (req, res) => {
  try {
    // Ensure `isActive` is provided and convert to boolean if needed
    if (req.body.isActive === undefined || req.body.isActive === null) {
      return res.status(400).send({
        success: false,
        message: "isActive field is required",
      });
    }
    
    // Convert to the expected enum string "1" or "0"
    const isActive = (req.body.isActive === true || req.body.isActive === "true" || req.body.isActive === "1") ? "1" : "0";

    // Find and update the product by ID
    const product = await productModel.findByIdAndUpdate(
      req.params.id,
      { isActive: isActive },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).send({
        success: false,
        message: "Product not found",
      });
    }

    // If product is being set to inactive, remove it from carts, wishlists, and productForYou
    if (isActive === "0") {
      try {
        console.log(`Product ${req.params.id} deactivated. Starting atomic cleanup...`);
        // Remove from all cart products arrays
        const cartUpdateResult = await cartModel.updateMany(
          {},
          { $pull: { products: { product: req.params.id } } }
        );
        console.log(`Carts updated: ${cartUpdateResult.modifiedCount}`);

        // Remove from all wishlists
        const wishlistUpdateResult = await wishlistModel.updateMany(
          {},
          { $pull: { products: { product: req.params.id } } }
        );
        console.log(`Wishlists updated: ${wishlistUpdateResult.modifiedCount}`);

        // Remove from productForYou
        const productForYouDeleteResult = await productForYouModel.deleteMany({ productId: req.params.id });
        console.log(`ProductForYou deleted: ${productForYouDeleteResult.deletedCount}`);

      } catch (cleanupError) {
        console.error('Error cleaning up product references:', cleanupError);
        // We don't want to fail the main operation if cleanup has issues
      }
    }

    // Send success response with updated product
    res.send({
      success: true,
      product,
      message: isActive === "0" ? 'Product deactivated and removed from all carts, wishlists, and featured products' : 'Product status updated successfully'
    });
  } catch (error) {
    console.error("Error updating product status:", error);
    res.status(500).send({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});


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