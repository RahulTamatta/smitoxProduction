import express from "express";
import {
  createSubcategoryController,
  deleteSubcategoryController,
  getAllSubcategoriesController,
  getSingleSubcategoryController,
  toggleSubcategoryStatusController,
  updateSubcategoryController,
} from "../controllers/subCategoryController.js";
import { requireSignIn } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/multer.js";
import { auditLog, requireCapability } from "../middlewares/rbacMiddleware.js";

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
  upload.single('photo'),
  createSubcategoryController
);

// Get single subcategory
router.get("/singleSubcategory/:id", getSingleSubcategoryController);

// Update subcategory
router.put(
  "/update-subcategory/:id",
  requireSignIn,
  requireCapability("categories:write"),
  upload.single('photo'),
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
