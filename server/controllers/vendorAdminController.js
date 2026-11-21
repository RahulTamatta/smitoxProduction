import mongoose from "mongoose";
import { ROLES } from "../config/rbac-policy.js";
import { resolveUserRole } from "../helpers/tokenHelper.js";
import { logAuditEvent } from "../middlewares/rbacMiddleware.js";
import productModel from "../models/productModel.js";
import sellerApplicationModel from "../models/sellerApplicationModel.js";
import sellerProfileModel from "../models/sellerProfileModel.js";
import subscriptionPlanModel from "../models/subscriptionPlanModel.js";
import userModel from "../models/userModel.js";
import subscriptionHistoryModel from "../models/subscriptionHistoryModel.js";
import { hashPassword } from "../helpers/authHelper.js";
import { GRACE_DAYS, recordSubscriptionEvent } from "../helpers/subscriptionLifecycle.js";
import { ensureStoreSlug, isValidStoreSlug, slugifyStoreName } from "../helpers/storeSlug.js";
import { escapeRegex, queryVendorProducts } from "./sellerPortalController.js";

const COMPLIMENTARY_PLAN_NAME = "Admin Complimentary";
const isId = (v) => mongoose.Types.ObjectId.isValid(String(v || ""));
const fail = (res, code, message) => res.status(code).send({ success: false, message });
const text = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : undefined);

const audit = (req, action, resourceId, description) =>
  logAuditEvent({
    actor: req.user?._id,
    actorRole: req.user?.role,
    action,
    resourceType: "seller_profile",
    resourceId,
    severity: "medium",
    description,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  }).catch(() => {});

/**
 * "Vendor without a subscription" = a hidden, free, unlimited plan. This keeps
 * SellerProfile/SellerApplication (which require a plan) consistent without
 * special-casing a missing plan everywhere.
 */
const ensureComplimentaryPlan = async () => {
  let plan = await subscriptionPlanModel.findOne({ name: COMPLIMENTARY_PLAN_NAME });
  if (!plan) {
    plan = await subscriptionPlanModel.create({
      name: COMPLIMENTARY_PLAN_NAME,
      description: "Admin-granted access with no subscription fee.",
      price: 0,
      billingCycle: "yearly",
      features: [],
      maxProducts: null,
      maxOrders: null,
      isActive: false, // never shown on the public plan page
      isFree: true,
      displayOrder: 999,
      tags: ["complimentary"],
    });
  }
  return plan;
};

const planSnapshot = (plan) => ({
  _id: plan._id,
  name: plan.name,
  price: plan.price,
  currency: plan.currency,
  billingCycle: plan.billingCycle,
  isFree: plan.isFree,
  includedCapabilities: plan.includedCapabilities || [],
  excludedCapabilities: plan.excludedCapabilities || [],
  version: plan.version || 1,
  capturedAt: new Date(),
});

/**
 * Grants vendor access to a user on a plan without payment (admin action).
 * Mirrors the free-plan activation in sellerApplicationControllerV2.approveApplication.
 */
const activateVendor = async ({ user, plan, expiresInDays, storeName }) => {
  const now = new Date();
  const expiresAt =
    expiresInDays && Number(expiresInDays) > 0
      ? new Date(now.getTime() + Number(expiresInDays) * 86400000)
      : null;

  let application = await sellerApplicationModel.findOne({ userId: user._id }).sort({ createdAt: -1 });
  if (!application) {
    application = new sellerApplicationModel({
      userId: user._id,
      selectedPlanId: plan._id,
      firstName: (user.user_fullname || "").split(" ")[0] || "Vendor",
      lastName: (user.user_fullname || "").split(" ").slice(1).join(" ") || "-",
      email: user.email_id || "",
      phone: user.mobile_no ? String(user.mobile_no) : "",
      businessName: storeName || user.user_fullname || "Vendor",
      storeName: storeName || user.user_fullname || "Vendor",
    });
  }
  application.selectedPlanId = plan._id;
  application.selectedPlanSnapshot = planSnapshot(plan);
  application.status = "approved";
  application.planStatus = "active";
  application.planStartDate = now;
  application.planExpiryDate = expiresAt;
  application.gracePeriodEndDate = expiresAt ? new Date(expiresAt.getTime() + GRACE_DAYS * 86400000) : null;
  await application.save({ validateBeforeSave: false });

  const profile = await sellerProfileModel.findOneAndUpdate(
    { userId: user._id },
    {
      $set: {
        userId: user._id,
        applicationId: application._id,
        currentPlanId: plan._id,
        isActive: true,
        status: "active",
        subscriptionStatus: "active",
        planActivatedAt: now,
        planExpiresAt: expiresAt,
        gracePeriodEndDate: application.gracePeriodEndDate,
        lastStatusChange: now,
        "permissions.grantedCapabilities": plan.includedCapabilities || [],
        "permissions.deniedCapabilities": plan.excludedCapabilities || [],
        ...(storeName ? { storeName } : {}),
      },
      $setOnInsert: {
        businessName: application.businessName || storeName || "",
        primaryContactName: `${application.firstName || ""} ${application.lastName || ""}`.trim(),
        primaryContactEmail: application.email || user.email_id || "",
        primaryContactPhone: application.phone || "",
      },
      $push: { statusHistory: { status: "active", changedAt: now, reason: `Admin granted plan "${plan.name}"` } },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  user.roleString = ROLES.SELLER;
  user.permissions = {
    grantedCapabilities: plan.includedCapabilities || [],
    deniedCapabilities: plan.excludedCapabilities || [],
  };
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();

  // Re-show listings that were held when the vendor was previously hidden/removed
  await productModel.updateMany(
    { userId: String(user._id), adminHold: true },
    { $set: { isActive: "1", adminHold: false } }
  );
  await ensureStoreSlug(profile);
  await recordSubscriptionEvent({
    userId: user._id, profileId: profile._id, newPlanId: plan._id, actionType: "initial_activation",
    triggeredBy: "admin", metadata: { complimentary: true, expiresAt },
  });
  return profile;
};

const resolvePlan = async (planId) => {
  if (!planId) return ensureComplimentaryPlan();
  if (!isId(planId)) return null;
  return subscriptionPlanModel.findById(planId);
};

const productCounts = async (userIds) => {
  if (!userIds.length) return {};
  const rows = await productModel.aggregate([
    { $match: { userId: { $in: userIds.map(String) } } },
    { $group: { _id: "$userId", total: { $sum: 1 }, active: { $sum: { $cond: [{ $eq: ["$isActive", "1"] }, 1, 0] } } } },
  ]);
  return Object.fromEntries(rows.map((r) => [r._id, { total: r.total, active: r.active }]));
};

// GET /api/v1/admin/vendors
export const listVendors = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const filter = {};
    if (req.query.status) filter.status = String(req.query.status);
    if (isId(req.query.plan)) filter.currentPlanId = req.query.plan;
    const search = String(req.query.search || "").trim().slice(0, 80);
    if (search) {
      const rx = { $regex: escapeRegex(search), $options: "i" };
      filter.$or = [{ storeName: rx }, { businessName: rx }, { primaryContactName: rx }, { primaryContactEmail: rx }, { primaryContactPhone: rx }];
    }
    const [vendors, total] = await Promise.all([
      sellerProfileModel
        .find(filter)
        .select("-statusHistory -paymentAttempts")
        .populate("userId", "user_fullname email_id mobile_no isActive")
        .populate("currentPlanId", "name price billingCycle isFree maxProducts")
        .sort({ displayPriority: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      sellerProfileModel.countDocuments(filter),
    ]);
    const counts = await productCounts(vendors.map((v) => v.userId?._id).filter(Boolean));
    const rows = vendors.map((v) => ({ ...v, listings: counts[String(v.userId?._id)] || { total: 0, active: 0 } }));
    res.send({ success: true, vendors: rows, total, page, limit, pages: Math.ceil(total / limit) || 1 });
  } catch (error) {
    console.error("listVendors error:", error.message);
    fail(res, 500, "Could not load vendors");
  }
};

// GET /api/v1/admin/vendors/:id
export const getVendor = async (req, res) => {
  try {
    if (!isId(req.params.id)) return fail(res, 400, "Invalid vendor id");
    const vendor = await sellerProfileModel
      .findById(req.params.id)
      .populate("userId", "user_fullname email_id mobile_no isActive roleString")
      .populate("currentPlanId", "name price currency billingCycle isFree maxProducts features")
      .lean();
    if (!vendor) return fail(res, 404, "Vendor not found");
    const application = await sellerApplicationModel
      .findById(vendor.applicationId)
      .select(
        "status firstName lastName email phone addressLine1 addressLine2 area city state pincode landmark " +
          "identityProofType identityProofNumber identityProofImage addressProofImage panNumber panImage businessType businessCategory reviewNotes submittedAt reviewedAt " +
          "selectedPlanSnapshot planStatus planStartDate planExpiryDate gracePeriodEndDate payment renewalHistory"
      )
      .lean();
    const counts = await productCounts([vendor.userId?._id].filter(Boolean));
    res.send({ success: true, vendor, application, listings: counts[String(vendor.userId?._id)] || { total: 0, active: 0 } });
  } catch (error) {
    console.error("getVendor error:", error.message);
    fail(res, 500, "Could not load vendor");
  }
};

// GET /api/v1/admin/vendors/:id/products
export const getVendorProducts = async (req, res) => {
  try {
    if (!isId(req.params.id)) return fail(res, 400, "Invalid vendor id");
    const vendor = await sellerProfileModel.findById(req.params.id).select("userId").lean();
    if (!vendor) return fail(res, 404, "Vendor not found");
    res.send({ success: true, ...(await queryVendorProducts(vendor.userId, req.query)) });
  } catch (error) {
    console.error("getVendorProducts error:", error.message);
    fail(res, 500, "Could not load vendor listings");
  }
};

// PUT /api/v1/admin/vendors/:id   (store profile fields only)
export const updateVendor = async (req, res) => {
  try {
    if (!isId(req.params.id)) return fail(res, 400, "Invalid vendor id");
    const b = req.body || {};
    const updates = {};
    const strings = {
      storeName: 80, businessName: 120, businessDescription: 1000, businessCategory: 80,
      primaryContactName: 80, primaryContactEmail: 120, primaryContactPhone: 20, complianceNotes: 500,
    };
    for (const [key, max] of Object.entries(strings)) {
      const v = text(b[key], max);
      if (v !== undefined) updates[key] = v;
    }
    if (b.commissionRate !== undefined) {
      const c = Number(b.commissionRate);
      if (!Number.isFinite(c) || c < 0 || c > 100) return fail(res, 400, "Commission must be between 0 and 100");
      updates.commissionRate = c;
    }
    if (b.storeSlug !== undefined) {
      const slug = slugifyStoreName(b.storeSlug);
      if (!isValidStoreSlug(slug)) return fail(res, 400, "Store URL can use letters, numbers and dashes, and can't be a reserved word");
      if (await sellerProfileModel.exists({ storeSlug: slug, _id: { $ne: req.params.id } })) {
        return fail(res, 409, `The store URL "${slug}" is already taken`);
      }
      updates.storeSlug = slug;
    }
    if (b.showOnHome !== undefined) updates.showOnHome = Boolean(b.showOnHome);
    if (b.isVerified !== undefined) {
      updates.isVerified = Boolean(b.isVerified);
      updates.verificationDate = updates.isVerified ? new Date() : null;
    }
    const vendor = await sellerProfileModel.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true }).select("-statusHistory -paymentAttempts").lean();
    if (!vendor) return fail(res, 404, "Vendor not found");
    audit(req, "update_vendor", vendor._id, `Updated vendor profile (${Object.keys(updates).join(", ")})`);
    res.send({ success: true, vendor });
  } catch (error) {
    console.error("updateVendor error:", error.message);
    fail(res, 500, "Could not update vendor");
  }
};

// PUT /api/v1/admin/vendors/:id/visibility   { visible: boolean }
export const setVendorVisibility = async (req, res) => {
  try {
    if (!isId(req.params.id)) return fail(res, 400, "Invalid vendor id");
    if (typeof req.body?.visible !== "boolean") return fail(res, 400, "`visible` must be true or false");
    const visible = req.body.visible;
    const vendor = await sellerProfileModel.findById(req.params.id);
    if (!vendor) return fail(res, 404, "Vendor not found");

    vendor.isActive = visible;
    vendor.status = visible ? "active" : "inactive";
    vendor.lastStatusChange = new Date();
    vendor.statusHistory.push({ status: vendor.status, changedAt: new Date(), reason: visible ? "Shown by admin" : "Hidden by admin" });
    await vendor.save({ validateBeforeSave: false });

    const uid = String(vendor.userId);
    const result = visible
      ? await productModel.updateMany({ userId: uid, adminHold: true }, { $set: { isActive: "1", adminHold: false } })
      : await productModel.updateMany({ userId: uid, isActive: "1" }, { $set: { isActive: "0", adminHold: true } });

    audit(req, visible ? "show_vendor" : "hide_vendor", vendor._id, `${visible ? "Showed" : "Hid"} vendor and ${result.modifiedCount} listings`);
    res.send({ success: true, visible, listingsChanged: result.modifiedCount });
  } catch (error) {
    console.error("setVendorVisibility error:", error.message);
    fail(res, 500, "Could not change vendor visibility");
  }
};

// PUT /api/v1/admin/vendors/:id/priority   { priority: number }  (higher = earlier; 0 = normal)
export const setVendorPriority = async (req, res) => {
  try {
    if (!isId(req.params.id)) return fail(res, 400, "Invalid vendor id");
    const priority = Number(req.body?.priority);
    if (!Number.isInteger(priority) || priority < 0 || priority > 1000) {
      return fail(res, 400, "Priority must be a whole number from 0 to 1000");
    }
    const vendor = await sellerProfileModel.findByIdAndUpdate(req.params.id, { $set: { displayPriority: priority } }, { new: true }).select("userId displayPriority");
    if (!vendor) return fail(res, 404, "Vendor not found");
    const result = await productModel.updateMany({ userId: String(vendor.userId) }, { $set: { boost: priority } });
    audit(req, "set_vendor_priority", vendor._id, `Set storefront priority ${priority} on ${result.modifiedCount} listings`);
    res.send({ success: true, priority, listingsChanged: result.modifiedCount });
  } catch (error) {
    console.error("setVendorPriority error:", error.message);
    fail(res, 500, "Could not set vendor priority");
  }
};

// POST /api/v1/admin/vendors/:id/grant-plan   { planId?: id, expiresInDays?: number }
export const grantVendorPlan = async (req, res) => {
  try {
    if (!isId(req.params.id)) return fail(res, 400, "Invalid vendor id");
    const vendor = await sellerProfileModel.findById(req.params.id).select("userId storeName");
    if (!vendor) return fail(res, 404, "Vendor not found");
    const plan = await resolvePlan(req.body?.planId);
    if (!plan) return fail(res, 404, "Subscription plan not found");
    const user = await userModel.findById(vendor.userId);
    if (!user) return fail(res, 404, "Vendor account not found");
    const profile = await activateVendor({ user, plan, expiresInDays: req.body?.expiresInDays });
    audit(req, "grant_vendor_plan", profile._id, `Granted plan "${plan.name}" without payment`);
    res.send({ success: true, planName: plan.name, planExpiresAt: profile.planExpiresAt });
  } catch (error) {
    console.error("grantVendorPlan error:", error.message);
    fail(res, 500, "Could not grant plan");
  }
};

// POST /api/v1/admin/vendors   { email | phone, storeName, planId?, expiresInDays? }
export const createVendor = async (req, res) => {
  try {
    const email = text(req.body?.email, 120)?.toLowerCase();
    const phone = text(String(req.body?.phone || ""), 20);
    const storeName = text(req.body?.storeName, 80);
    if (!email && !phone) return fail(res, 400, "Provide the user's email or phone");
    if (!storeName) return fail(res, 400, "Store name is required");

    const user = await userModel.findOne(email ? { email_id: email } : { mobile_no: phone });
    if (!user) return fail(res, 404, "No registered user with that email/phone. Ask them to sign up first.");
    const role = resolveUserRole(user);
    if (role !== ROLES.USER && role !== ROLES.SELLER) {
      return fail(res, 400, "Staff accounts cannot be converted to vendors");
    }
    const plan = await resolvePlan(req.body?.planId);
    if (!plan) return fail(res, 404, "Subscription plan not found");
    const profile = await activateVendor({ user, plan, expiresInDays: req.body?.expiresInDays, storeName });
    audit(req, "create_vendor", profile._id, `Created vendor "${storeName}" on plan "${plan.name}"`);
    res.status(201).send({ success: true, vendorId: profile._id });
  } catch (error) {
    console.error("createVendor error:", error.message);
    fail(res, 500, "Could not create vendor");
  }
};

// DELETE /api/v1/admin/vendors/:id?deleteListings=true
export const removeVendor = async (req, res) => {
  try {
    if (!isId(req.params.id)) return fail(res, 400, "Invalid vendor id");
    const vendor = await sellerProfileModel.findById(req.params.id);
    if (!vendor) return fail(res, 404, "Vendor not found");
    const uid = String(vendor.userId);

    const user = await userModel.findById(vendor.userId);
    if (user && resolveUserRole(user) === ROLES.SELLER) {
      user.roleString = ROLES.USER;
      user.permissions = { grantedCapabilities: [], deniedCapabilities: [] };
      user.tokenVersion = (user.tokenVersion || 0) + 1;
      await user.save();
    }
    await sellerApplicationModel.updateOne(
      { _id: vendor.applicationId },
      { $set: { status: "rejected", planStatus: "expired", reviewNotes: "Vendor removed by admin" } }
    );

    let listings;
    if (req.query.deleteListings === "true") {
      listings = await productModel.deleteMany({ userId: uid });
    } else {
      listings = await productModel.updateMany({ userId: uid, isActive: "1" }, { $set: { isActive: "0", adminHold: true } });
    }
    await sellerProfileModel.deleteOne({ _id: vendor._id });
    audit(req, "remove_vendor", vendor._id, `Removed vendor "${vendor.storeName}" (${req.query.deleteListings === "true" ? "listings deleted" : "listings hidden"})`);
    res.send({ success: true, listingsAffected: listings.deletedCount ?? listings.modifiedCount ?? 0 });
  } catch (error) {
    console.error("removeVendor error:", error.message);
    fail(res, 500, "Could not remove vendor");
  }
};

// PUT /api/v1/admin/vendors/:id/credentials   { email?, mobile?, password? }
// Changes the vendor's login. Note: existing tokens stay valid until they expire (tokenVersion is not checked by requireSignIn).
export const updateVendorCredentials = async (req, res) => {
  try {
    if (!isId(req.params.id)) return fail(res, 400, "Invalid vendor id");
    const vendor = await sellerProfileModel.findById(req.params.id).select("userId");
    if (!vendor) return fail(res, 404, "Vendor not found");
    const user = await userModel.findById(vendor.userId);
    if (!user) return fail(res, 404, "Vendor login account not found");

    const set = {};
    const changed = [];
    const email = text(req.body?.email, 120)?.toLowerCase();
    if (email !== undefined && email !== user.email_id) {
      if (!/^\S+@\S+\.\S+$/.test(email)) return fail(res, 400, "Enter a valid email");
      if (await userModel.exists({ email_id: email, _id: { $ne: user._id } })) return fail(res, 409, "That email is used by another account");
      set.email_id = email;
      changed.push("email");
    }
    if (req.body?.mobile !== undefined && String(req.body.mobile).trim() !== "") {
      const digits = String(req.body.mobile).replace(/\D/g, "");
      if (!/^\d{10}$/.test(digits)) return fail(res, 400, "Enter a 10-digit mobile number");
      if (Number(digits) !== Number(user.mobile_no)) {
        if (await userModel.exists({ mobile_no: Number(digits), _id: { $ne: user._id } })) return fail(res, 409, "That mobile number is used by another account");
        set.mobile_no = Number(digits);
        changed.push("mobile");
      }
    }
    if (req.body?.password !== undefined && req.body.password !== "") {
      const pw = String(req.body.password);
      if (pw.length < 8) return fail(res, 400, "Password must be at least 8 characters");
      set.password = await hashPassword(pw);
      changed.push("password");
    }
    if (!changed.length) return fail(res, 400, "Nothing to change");

    await userModel.updateOne({ _id: user._id }, { $set: set, $inc: { tokenVersion: 1 } });
    const contact = {};
    if (set.email_id) contact.primaryContactEmail = set.email_id;
    if (set.mobile_no) contact.primaryContactPhone = String(set.mobile_no);
    if (Object.keys(contact).length) await sellerProfileModel.updateOne({ _id: vendor._id }, { $set: contact });
    audit(req, "update_vendor_credentials", vendor._id, `Changed vendor login (${changed.join(", ")})`);
    res.send({ success: true, changed });
  } catch (error) {
    console.error("updateVendorCredentials error:", error.message);
    fail(res, 500, "Could not update vendor login");
  }
};

// GET /api/v1/admin/vendors/subscriptions/report?from=&to=
// Every vendor's plan state plus the subscription money received.
export const getSubscriptionReport = async (req, res) => {
  try {
    const now = new Date();
    const from = req.query.from ? new Date(req.query.from) : null;
    const to = req.query.to ? new Date(req.query.to) : null;
    const dateFilter = {};
    if (from && !Number.isNaN(from.getTime())) dateFilter.$gte = from;
    if (to && !Number.isNaN(to.getTime())) dateFilter.$lte = to;

    const [vendors, apps, events] = await Promise.all([
      sellerProfileModel
        .find({})
        .select("userId storeName storeSlug businessName status isActive showOnHome currentPlanId planActivatedAt planExpiresAt gracePeriodEndDate subscriptionStatus createdAt")
        .populate("userId", "user_fullname email_id mobile_no")
        .populate("currentPlanId", "name price billingCycle isFree")
        .lean(),
      sellerApplicationModel
        .find({ status: { $in: ["approved", "approved_pending_payment", "approved_payment_failed", "suspended"] } })
        .select("userId status planStatus planExpiryDate gracePeriodEndDate payment")
        .lean(),
      subscriptionHistoryModel
        .find(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {})
        .sort({ createdAt: -1 })
        .populate("newPlanId", "name price billingCycle")
        .populate("previousPlanId", "name")
        .lean(),
    ]);
    const appByUser = Object.fromEntries(apps.map((a) => [String(a.userId), a]));
    const paidByUser = {};
    for (const e of events) {
      if (e.paymentStatus !== "success") continue;
      const k = String(e.sellerId);
      paidByUser[k] = paidByUser[k] || { total: 0, count: 0, last: null };
      paidByUser[k].total += Number(e.paymentAmount) || 0;
      paidByUser[k].count += 1;
      if (!paidByUser[k].last) paidByUser[k].last = e.createdAt;
    }
    const counts = await productCounts(vendors.map((v) => v.userId?._id).filter(Boolean));
    const DAY = 86400000;
    const rows = vendors.map((v) => {
      const uid = String(v.userId?._id || v.userId);
      const app = appByUser[uid] || {};
      const expiry = app.planExpiryDate || v.planExpiresAt || null;
      const daysLeft = expiry ? Math.ceil((new Date(expiry) - now) / DAY) : null;
      return {
        vendorId: v._id,
        storeName: v.storeName || v.businessName || "",
        storeSlug: v.storeSlug || null,
        owner: v.userId?.user_fullname || "",
        email: v.userId?.email_id || "",
        mobile: v.userId?.mobile_no ? String(v.userId.mobile_no) : "",
        plan: v.currentPlanId ? { name: v.currentPlanId.name, price: v.currentPlanId.price, billingCycle: v.currentPlanId.billingCycle, isFree: v.currentPlanId.isFree } : null,
        applicationStatus: app.status || null,
        planStatus: app.planStatus || v.subscriptionStatus || null,
        storeStatus: v.isActive ? v.status : "inactive",
        showOnHome: v.showOnHome !== false,
        activatedAt: v.planActivatedAt || null,
        expiresAt: expiry,
        graceEndsAt: app.gracePeriodEndDate || v.gracePeriodEndDate || null,
        daysLeft,
        pendingPayment: app.payment?.status === "pending" ? { amount: app.payment.amount, orderId: app.payment.orderId } : null,
        totalPaid: paidByUser[uid]?.total || 0,
        paymentsCount: paidByUser[uid]?.count || 0,
        lastPaymentAt: paidByUser[uid]?.last || null,
        listings: counts[uid] || { total: 0, active: 0 },
      };
    });
    const payments = events
      .filter((e) => e.paymentStatus === "success")
      .map((e) => {
        const v = vendors.find((x) => String(x.userId?._id || x.userId) === String(e.sellerId));
        return {
          at: e.createdAt,
          storeName: v?.storeName || v?.businessName || "",
          vendorId: v?._id || null,
          type: e.actionType,
          plan: e.newPlanId?.name || "",
          amount: Number(e.paymentAmount) || 0,
          paymentId: e.paymentId || "",
        };
      });
    const summary = {
      vendors: rows.length,
      active: rows.filter((r) => r.storeStatus === "active").length,
      paidPlans: rows.filter((r) => r.plan && !r.plan.isFree).length,
      expiringIn7Days: rows.filter((r) => r.daysLeft !== null && r.daysLeft >= 0 && r.daysLeft <= 7).length,
      inGracePeriod: rows.filter((r) => r.planStatus === "grace_period").length,
      expired: rows.filter((r) => r.planStatus === "expired").length,
      pendingPayments: rows.filter((r) => r.pendingPayment).length,
      revenue: payments.reduce((sum, p) => sum + p.amount, 0),
      paymentsCount: payments.length,
    };
    res.send({ success: true, summary, vendors: rows, payments, events: events.slice(0, 200) });
  } catch (error) {
    console.error("getSubscriptionReport error:", error.message);
    fail(res, 500, "Could not build the subscription report");
  }
};
