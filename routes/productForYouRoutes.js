import express from "express";
import { isAdmin, requireSignIn } from "../middlewares/authMiddleware.js";
import {
  createProductForYouController,
  getProductsForYouController,getAllProductsForYouController,
  getBannersController,
  getProductPhoto,
  updateBannerController,singleProductController,
  deleteProductController
} from "../controllers/productForYouController.js"; // Updated import based on your controllers
import formidable from "express-formidable";

const router = express.Router();

// Create a new "Product for You"
router.post(
  "/createProductForYou",
  requireSignIn,
  isAdmin,
  formidable(),
  createProductForYouController
);

router.get('/get-all', getAllProductsForYouController);
router.get("/single-productImage/:id", singleProductController);

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

router.get("/products/:categoryId/:subcategoryId", getProductsForYouController);

// Delete a "Product for You"
router.delete(
  "/delete-product/:id",
  requireSignIn,
  isAdmin,
  deleteProductController
);

export default router;
