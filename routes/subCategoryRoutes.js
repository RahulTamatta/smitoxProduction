import express from "express";
import { isAdmin, requireSignIn } from "../middlewares/authMiddleware.js";
import {
  createSubcategoryController,
  getSingleSubcategoryController,
  updateSubcategoryController,
  deleteSubcategoryController,
  getAllSubcategoriesController,
  toggleSubcategoryStatusController,
} from "../controllers/subCategoryController.js";

const router = express.Router();
router.patch(
  "/toggle-subcategory/:id",
  requireSignIn,
  isAdmin,
  toggleSubcategoryStatusController
);

// Create subcategory
router.post(
  "/create-subcategory",
  requireSignIn,
  isAdmin,
  createSubcategoryController
);

// Get single subcategory
router.get("/singleSubcategory/:id", getSingleSubcategoryController);

// Update subcategory
router.put(
  "/update-subcategory/:id",
  requireSignIn,
  isAdmin,
  updateSubcategoryController
);

// Delete subcategory
router.delete(
  "/delete-subcategory/:id",
  requireSignIn,
  isAdmin,
  deleteSubcategoryController
);

// Get all subcategories
router.get("/get-subcategories", getAllSubcategoriesController);

export default router;
