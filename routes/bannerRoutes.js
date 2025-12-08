import express from "express";
import { requireSignIn } from "../middlewares/authMiddleware.js";
import { requireCapability, auditLog } from "../middlewares/rbacMiddleware.js";
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
  requireCapability("banners:write"),

  createBannerController,

);

// Update banner
router.put(
  "/update-banner/:id",
  requireSignIn,
  requireCapability("banners:write"),

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
  requireCapability("banners:delete"),
  auditLog("delete", "banner", "high"),
  deleteBannerController
);
router.get("/banner-product/:categoryId/:subcategoryId", getBannerProductsController);

export default router;