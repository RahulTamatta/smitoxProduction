import express from "express";
import { requireSignIn } from "./../middlewares/authMiddleware.js";
import { requireCapability, auditLog } from "../middlewares/rbacMiddleware.js";
import {
  createPincodeController,
  updatePincodeController,
  getAllPincodesController,
  getSinglePincodeController,
  deletePincodeController,
  checkPincodeController
} from "./../controllers/pincodeController.js";

const router = express.Router();

// Create pincode
router.post(
  "/create-pincode",
  requireSignIn,
  requireCapability("settings:write"),
  createPincodeController
);

// Update pincode
router.put(
  "/update-pincode/:id",
  requireSignIn,
  requireCapability("settings:write"),
  updatePincodeController
);

// Get all pincodes
router.get("/get-pincodes", getAllPincodesController);
router.get("/get-pincodes", getAllPincodesController);
router.get('/check-pincode', checkPincodeController);

// Get single pincode
router.get("/single-pincode/:id", getSinglePincodeController);

// Delete pincode
router.delete(
  "/delete-pincode/:id",
  requireSignIn,
  requireCapability("settings:write"),
  auditLog("delete", "pincode", "high"),
  deletePincodeController
);

export default router;