import express from "express";
import { isAdmin, requireSignIn } from "../middlewares/authMiddleware.js";
import {
  createProductForYouController,
  getProductsForYouController,getAllProductsForYouController,
  getBannersController,
  getProductPhoto,
  updateBannerController,singleProductController,
  deleteProductController,
  adminGetProductsForYouController
} from "../controllers/productForYouController.js"; // Updated import based on your controllers
import formidable from "express-formidable";

const router = express.Router();

// Create a new "Product for You"
router.post(
  "/createProductForYou",
  // requireSignIn,
  // isAdmin,
  formidable(),
  createProductForYouController
);

router.get('/get-all', getAllProductsForYouController);
router.get("/single-productImage/:id", singleProductController);

// Admin route to get all products-for-you without pagination
router.get("/admin-get-products", adminGetProductsForYouController);

// Update a "Product for You"
router.put(
  "/update-product/:id",
  requireSignIn,
  isAdmin,
  formidable(),
  updateBannerController
);
router.get("/product-photo/:pid", getProductPhoto);
// Get all "Products for You" (Banners)
router.get("/get-products", getBannersController);

// Get products by category and subcategory
router.get("/products/:categoryId/:subcategoryId", getProductsForYouController);

;

// Delete a "Product for You"
router.delete(
  "/delete-product/:id",
  // requireSignIn,
  // isAdmin,
  deleteProductController
);

export default router;
