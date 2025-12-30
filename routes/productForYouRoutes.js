import express from "express";
import formidable from "express-formidable";
import {
  adminGetProductsForYouController,
  bulkCreateProductForYouController,
  bulkDeleteProductController,
  createProductForYouController,
  deleteProductController,
  getAllProductsForYouController,
  getBannersController,
  getProductPhoto,
  getProductsForYouController,
  singleProductController,
  updateBannerController
} from "../controllers/productForYouController.js"; // Updated import based on your controllers
import { requireSignIn } from "../middlewares/authMiddleware.js";
import { auditLog, requireCapability } from "../middlewares/rbacMiddleware.js";

const router = express.Router();

// Create a new "Product for You"
router.post(
  "/createProductForYou",
  requireSignIn,
  requireCapability("productforyou:write"),
  formidable(),
  createProductForYouController
);

// Bulk create multiple "Product For You" entries
router.post(
  "/bulk-create",
  requireSignIn,
  requireCapability("productforyou:write"),
  bulkCreateProductForYouController
);

router.get('/get-all', getAllProductsForYouController);
router.get("/single-productImage/:id", singleProductController);

// Admin route to get all products-for-you without pagination
router.get(
  "/admin-get-products",
  requireSignIn,
  requireCapability("productforyou:read"),
  adminGetProductsForYouController
);

// Update a "Product for You"
router.put(
  "/update-product/:id",
  requireSignIn,
  requireCapability("productforyou:write"),
  formidable(),
  updateBannerController
);
router.get("/product-photo/:pid", getProductPhoto);
// Get all "Products for You" (Banners)
router.get("/get-products", getBannersController);

// Get products by category and subcategory
router.get("/products/:categoryId/:subcategoryId?", getProductsForYouController);

;

// Delete a "Product for You"
router.delete(
  "/delete-product/:id",
  requireSignIn,
  requireCapability("productforyou:delete"),
  auditLog("delete", "productforyou", "high"),
  deleteProductController
);

// Bulk delete multiple "Product for You" entries
router.post(
  "/bulk-delete",
  requireSignIn,
  requireCapability("productforyou:delete"),
  bulkDeleteProductController
);

export default router;
