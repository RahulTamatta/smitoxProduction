import productModel from "../models/productModel.js";
import sellerProfileModel from "../models/sellerProfileModel.js";
import { escapeRegex } from "./sellerPortalController.js";

// Public vendor storefronts. Only active vendors with a store URL are exposed,
// and only public fields (no KYC, bank, contact or plan data).
const LIVE = { isActive: true, status: "active", storeSlug: { $type: "string" } };
const PUBLIC_PRODUCT = { isActive: "1", stock: { $gt: 0 } };
const CARD_FIELDS = "name slug photos multipleimages perPiecePrice price mrp stock unitSet setPrice bulkProducts brand category userId custom_order boost createdAt";
const storeCard = (v) => ({
  storeName: v.storeName || v.businessName || "",
  storeSlug: v.storeSlug,
  logo: v.businessLogo || null,
  banner: v.businessBanner || null,
  category: v.businessCategory || "",
  description: v.businessDescription || "",
  isVerified: Boolean(v.isVerified),
});

// GET /api/v1/stores?limit=12  — "Shop by seller" sections (super admin controls showOnHome + priority)
export const listStores = async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 50);
    const vendors = await sellerProfileModel
      .find({ ...LIVE, showOnHome: { $ne: false } })
      .select("userId storeName businessName storeSlug businessLogo businessBanner businessCategory businessDescription isVerified displayPriority createdAt")
      .sort({ displayPriority: -1, createdAt: 1 })
      .lean();
    if (!vendors.length) return res.send({ success: true, stores: [] });

    const ids = vendors.map((v) => String(v.userId));
    const counts = await productModel.aggregate([
      { $match: { ...PUBLIC_PRODUCT, userId: { $in: ids } } },
      { $sort: { boost: -1, createdAt: -1 } },
      { $group: { _id: "$userId", count: { $sum: 1 }, photos: { $push: "$photos" } } },
    ]);
    const byUser = Object.fromEntries(counts.map((c) => [c._id, c]));
    // Automatic: a store appears as soon as it has at least one live listing
    const stores = vendors
      .filter((v) => byUser[String(v.userId)]?.count > 0)
      .slice(0, limit)
      .map((v) => ({
        ...storeCard(v),
        productCount: byUser[String(v.userId)].count,
        previewPhotos: byUser[String(v.userId)].photos.filter(Boolean).slice(0, 3),
      }));
    res.send({ success: true, stores });
  } catch (error) {
    console.error("listStores error:", error.message);
    res.status(500).send({ success: false, message: "Could not load stores" });
  }
};

// GET /api/v1/stores/:slug?page=1&limit=24&search=&sort=newest|price_asc|price_desc
export const getStore = async (req, res) => {
  try {
    const slug = String(req.params.slug || "").toLowerCase().slice(0, 80);
    const vendor = await sellerProfileModel
      .findOne({ ...LIVE, storeSlug: slug })
      .select("userId storeName businessName storeSlug businessLogo businessBanner businessCategory businessDescription isVerified createdAt")
      .lean();
    if (!vendor) return res.status(404).send({ success: false, message: "Store not found" });

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 24, 1), 60);
    const filter = { ...PUBLIC_PRODUCT, userId: String(vendor.userId) };
    const search = String(req.query.search || "").trim().slice(0, 80);
    if (search) filter.name = { $regex: escapeRegex(search), $options: "i" };
    const SORTS = {
      price_asc: { perPiecePrice: 1 },
      price_desc: { perPiecePrice: -1 },
      newest: { createdAt: -1 },
    };
    const sort = SORTS[req.query.sort] || { boost: -1, custom_order: 1, createdAt: -1 };

    const [products, total] = await Promise.all([
      productModel.find(filter).select(CARD_FIELDS).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
      productModel.countDocuments(filter),
    ]);
    const { userId, ...publicVendor } = vendor;
    res.send({
      success: true,
      store: { ...storeCard(publicVendor), memberSince: vendor.createdAt, productCount: total },
      products: products.map((p) => ({ ...p, photoUrl: p.photos })),
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    console.error("getStore error:", error.message);
    res.status(500).send({ success: false, message: "Could not load this store" });
  }
};
