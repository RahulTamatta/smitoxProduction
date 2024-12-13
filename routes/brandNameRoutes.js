import express from "express";
import { isAdmin, requireSignIn } from "./../middlewares/authMiddleware.js";
import {
  createBrandController,
  updateBrandController,
  brandControlller,
  singleBrandController,
  deleteBrandController,
} from "../controllers/brandController.js";


const router = express.Router();

// create brand
router.post("/create-brand", createBrandController);

// update brand
router.put("/update-brand/:id", updateBrandController);

// get all brands
router.get("/get-brands", brandControlller);

// get single brand
router.get("/get-brand/:slug", singleBrandController);

// delete brand
router.delete("/delete-brand/:id", deleteBrandController);

export default router;