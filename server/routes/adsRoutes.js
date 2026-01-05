import express from "express";
import {
  createAdsBanner,
  getAdsBannerImage,
  getAdsBanners,
} from "../controllers/adsBannerController.js";
import { requireSignIn } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/multer.js";
import { requireCapability } from "../middlewares/rbacMiddleware.js";

const router = express.Router();

// Create banner
router.post(
  "/create-adsbanner",
  requireSignIn,
  requireCapability("banners:write"),
  upload.single("adBannerImage"),
  createAdsBanner
);

// Get all banners
router.get("/get-adsbanners", getAdsBanners);

// Get banner image
router.get("/adsbanner-image/:bid", getAdsBannerImage);

export default router;