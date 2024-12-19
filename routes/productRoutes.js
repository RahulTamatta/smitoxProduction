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
    // Ensure `isActive` is provided in the request body
    if (!req.body.isActive) {
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