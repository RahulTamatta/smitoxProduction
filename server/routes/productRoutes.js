import express from "express";
import {
  createProductController,
  deleteProductController,
  getProductController,
  getSingleProductController,
  processPaymentController,
  productCategoryController,
  productCountController,
  productFiltersController,
  productListController,
  productPhotoController,
  productSubcategoryController,
  realtedProductController,
  searchProductController,
  updateProductController,
  verifyPaymentController
} from "../controllers/productController.js";
import { requireSignIn } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/multer.js";
import { auditLog, requireCapability } from "../middlewares/rbacMiddleware.js";
// import formidable from "express-formidable";
import Cart from "../models/cartModel.js";
import productModel from "../models/productModel.js";
import Wishlist from "../models/wishlistModel.js";

const router = express.Router();

// Existing routes
router.post(
  "/create-product",
  requireSignIn,
  requireCapability("products:write"),
  upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'images', maxCount: 10 }]),
  createProductController
);
// router.post('/generate-sku', generateSKU);


router.put(
  "/update-product/:pid",
  requireSignIn,
  requireCapability("products:write"),
  upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'images', maxCount: 10 }]),
  updateProductController
);

router.get("/get-product", getProductController);
router.put(
  "/updateStatus/products/:id",
  requireSignIn,
  requireCapability("products:write"),
  async (req, res) => {
    try {
      // Ensure `isActive` is provided in the request body (can be "0" or "1")
      if (req.body.isActive === undefined || req.body.isActive === null) {
        return res.status(400).send({
          success: false,
          message: "isActive field is required",
        });
      }

      // Find and update the product by ID
      const product = await productModel.findByIdAndUpdate(
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

      // Send success response with updated product
      // If product is deactivated, remove it from all carts, wishlists, and banners
      if (product && req.body.isActive === "0") {
        try {
          // Import User model for embedded cart/wishlist cleanup
          const User = (await import("../models/userModel.js")).default;

          await Promise.all([
            // Remove from Cart collection
            Cart.updateMany({}, { $pull: { products: { product: product._id } } }),
            // Remove from Wishlist collection (FIX: match nested structure)
            Wishlist.updateMany({}, { $pull: { products: { product: product._id } } }),
            // Remove from ProductForYou
            (await import("mongoose")).default.model("ProductForYou").deleteMany({ productId: product._id }),
            // Remove from User's embedded cart array
            User.updateMany({}, { $pull: { cart: { product: product._id } } }),
            // Remove from User's embedded wishlist array
            User.updateMany({}, { $pull: { wishlist: product._id } }),
          ]);
          console.log(`Cleaned up inactive product ${product._id} from carts/wishlists/banners`);
        } catch (cleanupErr) {
          console.error("Error cleaning up carts/wishlists/banners for deactivated product:", cleanupErr);
          // Continue; don't fail the request due to cleanup
        }
      }

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


router.get("/get-product/:slug", getSingleProductController);
router.get("/product-photo/:pid", productPhotoController);
router.delete(
  "/delete-product/:pid",
  requireSignIn,
  requireCapability("products:delete"),
  auditLog("delete", "product", "high"),
  deleteProductController
);
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