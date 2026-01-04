import express from "express";
import { requireSignIn } from "./../middlewares/authMiddleware.js";
import { requireCapability, auditLog } from "../middlewares/rbacMiddleware.js";
import {
  categoryControlller,
  createCategoryController,
  deleteCategoryCOntroller,
  singleCategoryController,
  updateCategoryController,
} from "./../controllers/categoryController.js";

const router = express.Router();

//routes
// create category
router.post(
  "/create-category",
  requireSignIn,
  requireCapability("categories:write"),
  createCategoryController
);

//update category
router.put(
  "/update-category/:id",
  requireSignIn,
  requireCapability("categories:write"),
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
