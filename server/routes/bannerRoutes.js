import express from "express";
import {
  bannerImageController,
  createBannerController,
  deleteBannerController,
  getBannerProductsController,
  getBannersController, updateBannerController
} from "../controllers/bannerController.js";
import { requireSignIn } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/multer.js";
import { auditLog, requireCapability } from "../middlewares/rbacMiddleware.js";
// import formidable from "express-formidable";

const router = express.Router();

// In your productRoutes.js or similar file



// Create banner
router.post(
  "/create-banner",
  requireSignIn,
  requireCapability("banners:write"),
  upload.single('photo'),
  createBannerController,

);

// Update banner
router.put(
  "/update-banner/:id",
  requireSignIn,
  requireCapability("banners:write"),
  upload.single('photo'),
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