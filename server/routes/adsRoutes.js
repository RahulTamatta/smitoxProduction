import express from "express";
import { requireSignIn } from "../middlewares/authMiddleware.js";
import { requireCapability } from "../middlewares/rbacMiddleware.js";
import {
  createAdsBanner,
  getAdsBanners,
  getAdsBannerImage,
} from "../controllers/adsBannerController.js";
import formidable from "express-formidable";

const router = express.Router();

// Create banner
router.post(
  "/create-adsbanner",
  requireSignIn,
  requireCapability("banners:write"),
  formidable(),
  createAdsBanner
);

// Get all banners
router.get("/get-adsbanners", getAdsBanners);

// Get banner image
router.get("/adsbanner-image/:bid", getAdsBannerImage);

export default router;