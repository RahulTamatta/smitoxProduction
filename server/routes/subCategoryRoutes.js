import express from "express";
import { requireSignIn } from "../middlewares/authMiddleware.js";
import { requireCapability, auditLog } from "../middlewares/rbacMiddleware.js";
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
  requireCapability("categories:write"),
  toggleSubcategoryStatusController
);

// Create subcategory
router.post(
  "/create-subcategory",
  requireSignIn,
  requireCapability("categories:write"),
  createSubcategoryController
);

// Get single subcategory
router.get("/singleSubcategory/:id", getSingleSubcategoryController);

// Update subcategory
router.put(
  "/update-subcategory/:id",
  requireSignIn,
  requireCapability("categories:write"),
  updateSubcategoryController
);

// Delete subcategory
router.delete(
  "/delete-subcategory/:id",
  requireSignIn,
  requireCapability("categories:delete"),
  auditLog("delete", "subcategory", "high"),
  deleteSubcategoryController
);

// Get all subcategories
router.get("/get-subcategories", getAllSubcategoriesController);

export default router;
