import express from "express";
import {
  submitSellerApplication,
  getSellerApplications,
  getSellerApplication,
  approveSellerApplication,
  rejectSellerApplication,
  getMyApplication,
} from "../controllers/sellerApplicationController.js";
import { requireSignIn, requireCapability, requireSuperAdmin, auditLog } from "../middlewares/rbacMiddleware.js";

const router = express.Router();

// Public routes
router.post("/submit", requireSignIn, submitSellerApplication);
router.get("/my-application", requireSignIn, getMyApplication);

// Super Admin routes - with pagination, filtering, sorting
router.get("/", 
  requireSignIn, 
  requireSuperAdmin, 
  getSellerApplications
);

router.get("/:id", 
  requireSignIn, 
  requireSuperAdmin, 
  getSellerApplication
);

router.put("/:id/approve", 
  requireSignIn, 
  requireCapability("sellers:applications:approve"),
  auditLog("approve", "seller_application", "high"),
  approveSellerApplication
);

router.put("/:id/reject", 
  requireSignIn, 
  requireCapability("sellers:applications:reject"),
  auditLog("reject", "seller_application", "high"),
  rejectSellerApplication
);

export default router;
