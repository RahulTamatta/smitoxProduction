import express from "express";
import { isAdmin, requireSignIn } from "./../middlewares/authMiddleware.js";
import {
  createPincodeController,
  updatePincodeController,
  getAllPincodesController,
  getSinglePincodeController,
  deletePincodeController,
} from "./../controllers/pincodeController.js";

const router = express.Router();

// Create pincode
router.post(
  "/create-pincode",
  requireSignIn,
  isAdmin,
  createPincodeController
);

// Update pincode
router.put(
  "/update-pincode/:id",
  requireSignIn,
  isAdmin,
  updatePincodeController
);

// Get all pincodes
router.get("/get-pincodes", getAllPincodesController);

// Get single pincode
router.get("/single-pincode/:id", getSinglePincodeController);

// Delete pincode
router.delete(
  "/delete-pincode/:id",
  requireSignIn,
  isAdmin,
  deletePincodeController
);

export default router;