import express from "express";
import {
  getMyOrders,
  getMyProducts,
  changeMyPassword,
  getMyVendor,
  updateMyVendor,
} from "../controllers/sellerPortalController.js";
import { requireSeller, requireSignIn } from "../middlewares/rbacMiddleware.js";

/**
 * Vendor portal API. Everything here is scoped to the signed-in vendor
 * (req.user._id); listing create/update/delete reuse the existing product
 * routes, which are ownership-scoped by middlewares/sellerScope.js.
 */
const router = express.Router();
router.use(requireSignIn, requireSeller);

router.get("/me", getMyVendor);
router.put("/me", updateMyVendor);
router.put("/me/password", changeMyPassword);
router.get("/products", getMyProducts);
router.get("/orders", getMyOrders);

export default router;
