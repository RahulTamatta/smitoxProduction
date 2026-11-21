import express from "express";
import {
  createVendor,
  getVendor,
  getSubscriptionReport,
  getVendorProducts,
  grantVendorPlan,
  listVendors,
  removeVendor,
  setVendorPriority,
  setVendorVisibility,
  updateVendor,
  updateVendorCredentials,
} from "../controllers/vendorAdminController.js";
import { requireCapability, requireSignIn } from "../middlewares/rbacMiddleware.js";

/**
 * Admin control over vendors: profile, visibility, storefront priority,
 * subscription grants, listings, creation and removal.
 * Sellers hold neither capability (see SELLER_DENY_LIST).
 */
const router = express.Router();
const read = [requireSignIn, requireCapability("sellers:applications:read")];
const write = [requireSignIn, requireCapability("sellers:applications:approve")];

router.get("/", ...read, listVendors);
router.get("/subscriptions/report", ...read, getSubscriptionReport);
router.get("/:id", ...read, getVendor);
router.get("/:id/products", ...read, getVendorProducts);
router.post("/", ...write, createVendor);
router.put("/:id", ...write, updateVendor);
router.put("/:id/credentials", ...write, updateVendorCredentials);
router.put("/:id/visibility", ...write, setVendorVisibility);
router.put("/:id/priority", ...write, setVendorPriority);
router.post("/:id/grant-plan", ...write, grantVendorPlan);
router.delete("/:id", ...write, removeVendor);

export default router;
