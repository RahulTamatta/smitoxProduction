import sellerApplicationModel from "../models/sellerApplicationModel.js";
import sellerProfileModel from "../models/sellerProfileModel.js";
import subscriptionHistoryModel from "../models/subscriptionHistoryModel.js";
import subscriptionPlanModel from "../models/subscriptionPlanModel.js";
import productModel from "../models/productModel.js";
import userModel from "../models/userModel.js";

/**
 * Single source of truth for vendor subscription dates and expiry.
 *
 * Rules (unchanged business intent, now actually enforced):
 * - Free plans never expire (expiry = null).
 * - Paid plans run for their billing cycle (30 / 90 / 365 days).
 * - Renewing before expiry extends from the current expiry, so no paid days are lost.
 * - After expiry the vendor keeps selling for a 30-day grace period.
 * - After the grace period the vendor falls back to the active Free plan; if no Free
 *   plan exists, the store is deactivated and its listings are held (adminHold).
 */
export const GRACE_DAYS = 30;
const CYCLE_DAYS = { monthly: 30, quarterly: 90, yearly: 365 };
const DAY = 86400000;

export const cycleDays = (plan) => CYCLE_DAYS[plan?.billingCycle] || 30;

/** Period dates for a plan starting now (or extending an unexpired period). */
export const computePlanDates = (plan, currentExpiry = null) => {
  const now = new Date();
  if (!plan || plan.isFree) {
    return { planStartDate: now, planExpiryDate: null, gracePeriodEndDate: null };
  }
  const base = currentExpiry && new Date(currentExpiry) > now ? new Date(currentExpiry) : now;
  const planExpiryDate = new Date(base.getTime() + cycleDays(plan) * DAY);
  const gracePeriodEndDate = new Date(planExpiryDate.getTime() + GRACE_DAYS * DAY);
  return { planStartDate: now, planExpiryDate, gracePeriodEndDate };
};

/** Mirror the application's plan dates onto the seller profile. */
export const syncProfileDates = async (application, extra = {}) =>
  sellerProfileModel.updateOne(
    { userId: application.userId },
    {
      $set: {
        planExpiresAt: application.planExpiryDate || null,
        gracePeriodEndDate: application.gracePeriodEndDate || null,
        subscriptionStatus: application.planStatus || "active",
        ...extra,
      },
    }
  );

/** Append a subscription money/lifecycle event. Never throws (reporting only). */
export const recordSubscriptionEvent = async ({
  userId, profileId, previousPlanId = null, newPlanId, actionType,
  triggeredBy = "system", paymentId = null, paymentAmount = 0, paymentStatus = "not_required", metadata = {},
}) => {
  try {
    const profile = profileId ? null : await sellerProfileModel.findOne({ userId }).select("_id");
    await subscriptionHistoryModel.create({
      sellerId: userId,
      sellerProfileId: profileId || profile?._id,
      previousPlanId,
      newPlanId,
      actionType,
      triggeredBy,
      paymentId,
      paymentAmount,
      paymentStatus,
      metadata,
    });
  } catch (error) {
    console.error("recordSubscriptionEvent failed:", error.message);
  }
};

const applyPlanToUserAndProfile = async (userId, plan, profileSet = {}) => {
  const permissions = {
    grantedCapabilities: plan.includedCapabilities || [],
    deniedCapabilities: plan.excludedCapabilities || [],
  };
  await sellerProfileModel.updateOne(
    { userId },
    { $set: { currentPlanId: plan._id, permissions, planActivatedAt: new Date(), ...profileSet } }
  );
  await userModel.updateOne({ _id: userId }, { $set: { permissions }, $inc: { tokenVersion: 1 } });
};

/**
 * Moves every approved vendor to the right state for today's date.
 * Safe to run any number of times (idempotent). Returns counts for logging.
 */
export const runSubscriptionSweep = async () => {
  const now = new Date();
  const counts = { grace: 0, downgraded: 0, deactivated: 0 };
  const due = await sellerApplicationModel
    .find({ status: "approved", planExpiryDate: { $ne: null, $lte: now } })
    .populate("selectedPlanId");

  let freePlan;
  for (const app of due) {
    // Older free-plan approvals were given a 30-day expiry; free plans never expire
    if (app.selectedPlanId?.isFree || (!app.selectedPlanId && app.selectedPlanSnapshot?.isFree)) {
      app.planExpiryDate = null;
      app.gracePeriodEndDate = null;
      app.planStatus = "active";
      await app.save({ validateBeforeSave: false });
      await syncProfileDates(app);
      continue;
    }
    const graceEnd = app.gracePeriodEndDate
      ? new Date(app.gracePeriodEndDate)
      : new Date(new Date(app.planExpiryDate).getTime() + GRACE_DAYS * DAY);

    if (now <= graceEnd) {
      if (app.planStatus !== "grace_period") {
        app.planStatus = "grace_period";
        app.gracePeriodEndDate = graceEnd;
        await app.save({ validateBeforeSave: false });
        await syncProfileDates(app);
        counts.grace += 1;
      }
      continue;
    }

    // Grace period over
    if (freePlan === undefined) {
      freePlan = await subscriptionPlanModel.findOne({ isFree: true, isActive: true }).sort({ createdAt: 1 });
    }
    const previousPlanId = app.selectedPlanId?._id || app.selectedPlanId || null;

    if (freePlan) {
      app.selectedPlanId = freePlan._id;
      app.selectedPlanSnapshot = {
        _id: freePlan._id, name: freePlan.name, price: 0, currency: freePlan.currency || "INR",
        billingCycle: freePlan.billingCycle, isFree: true,
        includedCapabilities: freePlan.includedCapabilities || [],
        excludedCapabilities: freePlan.excludedCapabilities || [],
        version: freePlan.version || 1, capturedAt: now,
      };
      app.planStartDate = now;
      app.planExpiryDate = null;
      app.gracePeriodEndDate = null;
      app.planStatus = "active";
      app.renewalHistory.push({ renewalDate: now, previousPlanId, newPlanId: freePlan._id, renewalType: "auto_fallback" });
      await app.save({ validateBeforeSave: false });
      await applyPlanToUserAndProfile(app.userId, freePlan, {
        planExpiresAt: null, gracePeriodEndDate: null, subscriptionStatus: "active",
      });
      await recordSubscriptionEvent({
        userId: app.userId, previousPlanId, newPlanId: freePlan._id, actionType: "auto_downgrade",
        metadata: { reason: "Paid plan expired and grace period ended" },
      });
      counts.downgraded += 1;
    } else {
      app.planStatus = "expired";
      await app.save({ validateBeforeSave: false });
      await sellerProfileModel.updateOne(
        { userId: app.userId },
        {
          $set: { isActive: false, status: "inactive", subscriptionStatus: "expired", lastStatusChange: now },
          $push: { statusHistory: { status: "inactive", changedAt: now, reason: "Plan expired (no Free plan to fall back to)" } },
        }
      );
      await productModel.updateMany(
        { userId: String(app.userId), isActive: "1" },
        { $set: { isActive: "0", adminHold: true } }
      );
      await recordSubscriptionEvent({
        userId: app.userId, previousPlanId, newPlanId: previousPlanId, actionType: "suspension",
        metadata: { reason: "Plan expired; no Free plan available" },
      });
      counts.deactivated += 1;
    }
  }

  // "Expiring soon" flag for vendors within 7 days of expiry (display only)
  const soon = new Date(now.getTime() + 7 * DAY);
  await sellerApplicationModel.updateMany(
    { status: "approved", planStatus: "active", planExpiryDate: { $gt: now, $lte: soon } },
    { $set: { planStatus: "expiring_soon" } }
  );
  return counts;
};
