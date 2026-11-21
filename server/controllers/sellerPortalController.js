import { comparePassword, hashPassword } from "../helpers/authHelper.js";
import userModel from "../models/userModel.js";
import orderModel from "../models/orderModel.js";
import productModel from "../models/productModel.js";
import sellerProfileModel from "../models/sellerProfileModel.js";

export const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const clamp = (n, min, max, fallback) => {
  const v = parseInt(n, 10);
  return Number.isFinite(v) ? Math.min(Math.max(v, min), max) : fallback;
};

/**
 * Shared listing query for a vendor's own products (used by the seller portal
 * and by the admin vendor detail view).
 */
export const queryVendorProducts = async (vendorUserId, query = {}) => {
  const page = clamp(query.page, 1, 100000, 1);
  const limit = clamp(query.limit, 1, 50, 20);
  const filter = { userId: String(vendorUserId) };

  const search = String(query.search || "").trim().slice(0, 80);
  if (search) filter.name = { $regex: escapeRegex(search), $options: "i" };
  if (query.status === "active") filter.isActive = "1";
  if (query.status === "inactive") filter.isActive = "0";
  if (query.stock === "out") filter.stock = { $lte: 0 };

  const [products, total] = await Promise.all([
    productModel
      .find(filter)
      .select("name slug photos perPiecePrice mrp price stock isActive adminHold boost sku category createdAt")
      .populate("category", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    productModel.countDocuments(filter),
  ]);
  return { products, total, page, limit, pages: Math.ceil(total / limit) || 1 };
};

// GET /api/v1/seller-portal/me
export const getMyVendor = async (req, res) => {
  try {
    const profile = await sellerProfileModel
      .findOne({ userId: req.user._id })
      .select("-statusHistory -paymentAttempts")
      .populate("currentPlanId", "name price currency billingCycle isFree maxProducts maxOrders features badgeText")
      .lean();
    if (!profile) {
      return res.status(404).send({ success: false, message: "Seller profile not found" });
    }
    const userId = String(req.user._id);
    const [total, active] = await Promise.all([
      productModel.countDocuments({ userId }),
      productModel.countDocuments({ userId, isActive: "1" }),
    ]);
    const limit = profile.currentPlanId?.maxProducts ?? null;
    res.send({
      success: true,
      vendor: profile,
      usage: { listings: total, activeListings: active, listingLimit: limit },
    });
  } catch (error) {
    console.error("getMyVendor error:", error.message);
    res.status(500).send({ success: false, message: "Could not load your seller account" });
  }
};

const text = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : undefined);

// PUT /api/v1/seller-portal/me   (store details only; plan/status are admin-controlled)
export const updateMyVendor = async (req, res) => {
  try {
    const b = req.body || {};
    const updates = {};
    const fields = {
      storeName: 80,
      businessDescription: 1000,
      primaryContactName: 80,
      primaryContactEmail: 120,
      primaryContactPhone: 20,
    };
    for (const [key, max] of Object.entries(fields)) {
      const v = text(b[key], max);
      if (v !== undefined) updates[key] = v;
    }
    if (updates.storeName !== undefined && !updates.storeName) {
      return res.status(400).send({ success: false, message: "Store name cannot be empty" });
    }
    const profile = await sellerProfileModel
      .findOneAndUpdate({ userId: req.user._id }, { $set: updates }, { new: true })
      .select("-statusHistory -paymentAttempts")
      .lean();
    if (!profile) return res.status(404).send({ success: false, message: "Seller profile not found" });
    res.send({ success: true, vendor: profile });
  } catch (error) {
    console.error("updateMyVendor error:", error.message);
    res.status(500).send({ success: false, message: "Could not update your store details" });
  }
};

// GET /api/v1/seller-portal/products
export const getMyProducts = async (req, res) => {
  try {
    const result = await queryVendorProducts(req.user._id, req.query);
    res.send({ success: true, ...result });
  } catch (error) {
    console.error("getMyProducts error:", error.message);
    res.status(500).send({ success: false, message: "Could not load your listings" });
  }
};

// GET /api/v1/seller-portal/orders  (read-only; only this vendor's line items)
export const getMyOrders = async (req, res) => {
  try {
    const page = clamp(req.query.page, 1, 100000, 1);
    const limit = clamp(req.query.limit, 1, 50, 20);
    const myProductIds = await productModel.find({ userId: String(req.user._id) }).distinct("_id");
    const mine = new Set(myProductIds.map(String));

    const filter = { "products.product": { $in: myProductIds } };
    if (req.query.status) filter.status = String(req.query.status).slice(0, 40);

    const [orders, total] = await Promise.all([
      orderModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("buyer", "user_fullname city state")
        .populate("products.product", "name slug photos")
        .lean(),
      orderModel.countDocuments(filter),
    ]);

    const rows = orders.map((o) => {
      const items = (o.products || [])
        .filter((p) => p.product && mine.has(String(p.product._id)))
        .map((p) => ({
          productId: p.product._id,
          name: p.product.name,
          slug: p.product.slug,
          photo: p.product.photos,
          quantity: p.quantity,
          unitPrice: p.unitPrice || p.price || 0,
          total: p.totalAmount || (p.unitPrice || p.price || 0) * (p.quantity || 0),
        }));
      return {
        _id: o._id,
        createdAt: o.createdAt,
        status: o.status,
        buyerName: o.buyer?.user_fullname || "Customer",
        buyerCity: o.buyer?.city || "",
        buyerState: o.buyer?.state || "",
        items,
        vendorTotal: items.reduce((sum, i) => sum + (i.total || 0), 0),
      };
    });
    res.send({ success: true, orders: rows, total, page, limit, pages: Math.ceil(total / limit) || 1 });
  } catch (error) {
    console.error("getMyOrders error:", error.message);
    res.status(500).send({ success: false, message: "Could not load your orders" });
  }
};

// PUT /api/v1/seller-portal/me/password   { currentPassword, newPassword }
export const changeMyPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return res.status(400).send({ success: false, message: "New password must be at least 8 characters" });
    }
    const user = await userModel.findById(req.user._id);
    if (!user) return res.status(404).send({ success: false, message: "Account not found" });
    // Accounts created by OTP may have no password yet; then the current one isn't required
    if (user.password) {
      const stored = String(user.password);
      const isHashed = /^\$2[aby]\$\d{2}\$/.test(stored); // same rule as the login controller
      const ok =
        typeof currentPassword === "string" &&
        (isHashed ? await comparePassword(currentPassword, stored) : currentPassword === stored);
      if (!ok) return res.status(400).send({ success: false, message: "Current password is incorrect" });
    }
    user.password = await hashPassword(newPassword);
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();
    res.send({ success: true, message: "Password changed" });
  } catch (error) {
    console.error("changeMyPassword error:", error.message);
    res.status(500).send({ success: false, message: "Could not change password" });
  }
};
