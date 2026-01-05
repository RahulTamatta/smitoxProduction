import express from "express";
import { upload } from "../middlewares/multer.js";
import { auditLog, requireCapability } from "../middlewares/rbacMiddleware.js";
import {
  categoryControlller,
  createCategoryController,
  deleteCategoryCOntroller,
  singleCategoryController,
  updateCategoryController,
} from "./../controllers/categoryController.js";
import { requireSignIn } from "./../middlewares/authMiddleware.js";

const router = express.Router();

//routes
// create category
router.post(
  "/create-category",
  requireSignIn,
  requireCapability("categories:write"),
  upload.single('photo'),
  createCategoryController
);

//update category
router.put(
  "/update-category/:id",
  requireSignIn,
  requireCapability("categories:write"),
  upload.single('photo'),
  updateCategoryController
);

//getALl category
router.get("/get-category", categoryControlller);

//single category
router.get("/single-category/:slug", singleCategoryController);

//delete category
router.delete(
  "/delete-category/:id",
  requireSignIn,
  requireCapability("categories:delete"),
  auditLog("delete", "category", "high"),
  deleteCategoryCOntroller
);

export default router;
