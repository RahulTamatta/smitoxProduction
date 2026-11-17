import express from "express";
import { requireCapability, requireSignIn } from "../middlewares/rbacMiddleware.js";
import {
  createBrandController,
  updateBrandController,
  brandControlller,
  singleBrandController,
  deleteBrandController,
} from "../controllers/brandController.js";


const router = express.Router();

// create brand
router.post("/create-brand", requireSignIn, requireCapability("products:write"), createBrandController);

// update brand
router.put("/update-brand/:id", requireSignIn, requireCapability("products:write"), updateBrandController);

// get all brands
router.get("/get-brands", brandControlller);

// get single brand
router.get("/get-brand/:slug", singleBrandController);

// delete brand
router.delete("/delete-brand/:id", requireSignIn, requireCapability("products:delete"), deleteBrandController);

export default router;