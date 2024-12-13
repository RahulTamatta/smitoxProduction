import express from "express";
import { isAdmin, requireSignIn } from "../middlewares/authMiddleware.js";
import {
  createBannerController,getBannerProductsController,
  getBannersController,updateBannerController,
  bannerImageController,deleteBannerController
 
} from "../controllers/bannerController.js";
import formidable from "express-formidable";

const router = express.Router();

// In your productRoutes.js or similar file



// Create banner
router.post(
  "/create-banner",
  requireSignIn,
  isAdmin,
  formidable(),
  createBannerController,

);

// Update banner
router.put(
  "/update-banner/:id",
  requireSignIn,
  isAdmin,
  formidable(),
  updateBannerController
);

// Get all banners
router.get("/get-banners", getBannersController);

// Get single banner
router.get("/single-banner/:id", bannerImageController);

// Delete banner
router.delete(
  "/delete-banner/:id",
  requireSignIn,
  isAdmin,
  deleteBannerController
);
router.get("/banner-product/:categoryId/:subcategoryId", getBannerProductsController);

export default router;