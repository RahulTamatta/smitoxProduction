import express from "express";
import {
  approveSellerApplication,
  getMyApplication,
  getSellerApplication,
  getSellerApplications,
  rejectSellerApplication,
  submitSellerApplication,
} from "../controllers/sellerApplicationController.js";
import { upload } from "../middlewares/multer.js";
import { auditLog, requireCapability, requireSignIn, requireSuperAdmin } from "../middlewares/rbacMiddleware.js";

const router = express.Router();

// Public routes - submit with file uploads
router.post(
  "/submit",
  requireSignIn,
  upload.fields([
    { name: "identityProofImage", maxCount: 1 },
    { name: "addressProofImage", maxCount: 1 },
    { name: "gstImage", maxCount: 1 },
    { name: "panImage", maxCount: 1 },
    { name: "cancelledCheckImage", maxCount: 1 },
  ]),
  auditLog("submit_seller_application", "seller_application", "medium"),
  submitSellerApplication
);
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
