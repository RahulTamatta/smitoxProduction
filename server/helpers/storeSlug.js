import sellerProfileModel from "../models/sellerProfileModel.js";

// Paths already used by the seller portal under /seller/* (and other reserved words)
export const RESERVED_STORE_SLUGS = new Set([
  "dashboard", "listings", "orders", "store", "apply", "status", "portal", "login",
  "register", "admin", "settings", "new", "edit", "api", "smitox", "seller", "sellers",
]);

export const slugifyStoreName = (name) => {
  const full = String(name || "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (full.length <= 60) return full;
  // Cut at a word boundary so long names don't end mid-word ("...wholesale-ma")
  const cut = full.slice(0, 61);
  const lastDash = cut.lastIndexOf("-");
  return (lastDash > 20 ? cut.slice(0, lastDash) : full.slice(0, 60)).replace(/-+$/g, "");
};

export const isValidStoreSlug = (slug) =>
  /^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$/.test(slug) && !RESERVED_STORE_SLUGS.has(slug);

/**
 * First free slug for `base`: toy-world, toy-world-2, toy-world-3 ...
 * `excludeId` lets a profile keep / re-check its own slug.
 */
export const uniqueStoreSlug = async (base, excludeId = null) => {
  let root = slugifyStoreName(base) || "store";
  if (RESERVED_STORE_SLUGS.has(root)) root = `${root}-store`;
  for (let n = 1; n < 1000; n += 1) {
    const candidate = n === 1 ? root : `${root}-${n}`;
    const taken = await sellerProfileModel.exists({
      storeSlug: candidate,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    });
    if (!taken) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
};

/** Give a profile a slug if it has none (store name, then business name). Returns the slug. */
export const ensureStoreSlug = async (profile) => {
  if (!profile || profile.storeSlug) return profile?.storeSlug;
  const base = profile.storeName || profile.businessName || profile.primaryContactName || "store";
  // Retry once on a race with another vendor taking the same slug
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const slug = await uniqueStoreSlug(base, profile._id);
    try {
      await sellerProfileModel.updateOne({ _id: profile._id, storeSlug: { $in: [null, ""] } }, { $set: { storeSlug: slug } });
      const fresh = await sellerProfileModel.findById(profile._id).select("storeSlug").lean();
      profile.storeSlug = fresh?.storeSlug;
      return profile.storeSlug;
    } catch (error) {
      if (error?.code !== 11000) throw error;
    }
  }
  return null;
};

/** Startup backfill for vendors created before store URLs existed. */
export const backfillStoreSlugs = async () => {
  const missing = await sellerProfileModel
    .find({ $or: [{ storeSlug: { $exists: false } }, { storeSlug: null }, { storeSlug: "" }] })
    .select("storeName businessName primaryContactName storeSlug")
    .sort({ createdAt: 1 });
  for (const profile of missing) await ensureStoreSlug(profile);
  return missing.length;
};
