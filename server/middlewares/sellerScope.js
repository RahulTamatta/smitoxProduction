import { ROLES } from "../config/rbac-policy.js";
import { resolveUserRole } from "../helpers/tokenHelper.js";
import productModel from "../models/productModel.js";
import sellerProfileModel from "../models/sellerProfileModel.js";
import subscriptionPlanModel from "../models/subscriptionPlanModel.js";
import userModel from "../models/userModel.js";

/**
 * Keeps vendors (role "seller") inside their own listings on the shared product
 * write routes. Admins and other staff pass through unchanged.
 *
 * - create : forces ownership to the signed-in vendor, enforces the plan's
 *            maxProducts limit, and strips fields only admins may set.
 * - existing (update / status / delete) : the product must belong to the vendor.
 * - slug : same ownership check for the admin single-product read (cost price etc.).
 *
 * Must run AFTER requireSignIn (and after multer for multipart routes so
 * req.body is populated).
 */
export const scopeSellerProducts = (mode) => async (req, res, next) => {
  try {
    const user = await userModel
      .findById(req.user?._id)
      .select("role roleString isActive");
    if (!user || user.isActive === false) {
      return res.status(401).send({ success: false, message: "Account not available" });
    }
    if (resolveUserRole(user) !== ROLES.SELLER) return next(); // staff unchanged

    const profile = await sellerProfileModel.findOne({ userId: user._id });
    if (!profile || !profile.isActive || profile.status !== "active") {
      return res.status(403).send({
        success: false,
        message: "Your seller account is not active. Contact support.",
      });
    }

    req.body = req.body || {};
    // Admin-only placement controls
    delete req.body.custom_order;
    delete req.body.boost;
    delete req.body.adminHold;

    if (mode === "create") {
      const plan = await subscriptionPlanModel
        .findById(profile.currentPlanId)
        .select("maxProducts name");
      const limit = plan?.maxProducts;
      if (limit !== null && limit !== undefined) {
        const count = await productModel.countDocuments({ userId: user._id });
        if (count >= limit) {
          return res.status(403).send({
            success: false,
            code: "PLAN_LIMIT_REACHED",
            message: `Your ${plan.name || "current"} plan allows ${limit} listings. Upgrade your plan to add more.`,
          });
        }
      }
      req.body.userId = String(user._id);
      return next();
    }

    const product =
      mode === "slug"
        ? await productModel.findOne({ slug: req.params.slug }).select("userId")
        : await productModel.findById(req.params.pid || req.params.id).select("userId");
    if (!product) {
      return res.status(404).send({ success: false, message: "Product not found" });
    }
    if (String(product.userId) !== String(user._id)) {
      return res.status(403).send({ success: false, message: "You can only manage your own listings" });
    }
    delete req.body.userId;
    req.sellerOwnsProduct = true;
    return next();
  } catch (error) {
    console.error("sellerScope error:", error.message);
    return res.status(500).send({ success: false, message: "Could not verify listing ownership" });
  }
};
