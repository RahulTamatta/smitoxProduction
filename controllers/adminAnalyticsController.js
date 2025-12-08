import mongoose from "mongoose";
import SellerApplication from "../models/sellerApplicationModel.js";
import User from "../models/userModel.js";

const ACCEPTED_SET = [
  "approved",
  "approved_pending_payment",
  "active",
];

const APPLIED_SET = [
  "submitted",
  "under_review",
  "approved",
  "approved_pending_payment",
  "approved_payment_failed",
  "active",
  "rejected",
];

const dateRange = (from, to) => {
  const end = to ? new Date(to) : new Date();
  const start = from ? new Date(from) : new Date(end.getTime() - 29 * 24 * 3600 * 1000);
  return { start, end };
};

const getBuckets = (start, end, unit) => {
  const buckets = [];
  const d = new Date(start);
  const push = (dt) => buckets.push(new Date(dt));
  if (unit === "month") {
    const cur = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
    const stop = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
    while (cur <= stop) {
      push(cur);
      cur.setUTCMonth(cur.getUTCMonth() + 1);
    }
  } else if (unit === "week") {
    const cur = new Date(d);
    cur.setUTCHours(0, 0, 0, 0);
    while (cur <= end) {
      push(new Date(cur));
      cur.setUTCDate(cur.getUTCDate() + 7);
    }
  } else {
    const cur = new Date(d);
    cur.setUTCHours(0, 0, 0, 0);
    while (cur <= end) {
      push(new Date(cur));
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
  }
  return buckets;
};

export const getSubscriptionsAnalytics = async (req, res) => {
  try {
    const { from, to, groupBy = "day" } = req.query;
    const { start, end } = dateRange(from, to);

    const unit = groupBy === "week" ? "week" : groupBy === "month" ? "month" : "day";

    const appliedPipeline = [
      { $match: { createdAt: { $gte: start, $lte: end }, status: { $in: APPLIED_SET } } },
      { $project: { userId: 1, createdAt: 1 } },
      { $group: { _id: { $dateTrunc: { date: "$createdAt", unit } }, users: { $addToSet: "$userId" } } },
      { $project: { _id: 0, t: "$_id", value: { $size: "$users" } } },
      { $sort: { t: 1 } },
    ];

    const acceptedPipeline = [
      { $match: { createdAt: { $gte: start, $lte: end }, status: { $in: ACCEPTED_SET } } },
      { $sort: { userId: 1, createdAt: 1 } },
      { $group: { _id: "$userId", firstAcceptedAt: { $first: "$createdAt" } } },
      { $group: { _id: { $dateTrunc: { date: "$firstAcceptedAt", unit } }, users: { $addToSet: "$_id" } } },
      { $project: { _id: 0, t: "$_id", value: { $size: "$users" } } },
      { $sort: { t: 1 } },
    ];

    const rejectedBase = [
      { $match: { createdAt: { $gte: start, $lte: end }, status: "rejected" } },
      { $sort: { userId: 1, createdAt: 1 } },
      { $group: { _id: "$userId", rejectedAt: { $first: "$createdAt" } } },
      {
        $lookup: {
          from: "sellerapplications",
          let: { uid: "$_id", rAt: "$rejectedAt" },
          pipeline: [
            { $match: { $expr: { $and: [ { $eq: ["$userId", "$$uid"] }, { $gt: ["$createdAt", "$$rAt"] }, { $in: ["$status", ACCEPTED_SET] } ] } } },
            { $limit: 1 },
          ],
          as: "later",
        },
      },
      { $match: { later: { $size: 0 } } },
      { $group: { _id: { $dateTrunc: { date: "$rejectedAt", unit } }, users: { $addToSet: "$_id" } } },
      { $project: { _id: 0, t: "$_id", value: { $size: "$users" } } },
      { $sort: { t: 1 } },
    ];

    const [applied, accepted, rejected] = await Promise.all([
      SellerApplication.aggregate(appliedPipeline),
      SellerApplication.aggregate(acceptedPipeline),
      SellerApplication.aggregate(rejectedBase),
    ]);

    const buckets = getBuckets(start, end, unit);

    const activeSubscriptions = [];
    for (const t of buckets) {
      const count = await SellerApplication.countDocuments({
        status: "active",
        planStartDate: { $lte: t },
        $or: [ { planExpiryDate: null }, { planExpiryDate: { $gt: t } } ],
      });
      activeSubscriptions.push({ t, value: count });
    }

    const adminsFilter = { roleString: { $in: ["admin", "super_admin"] }, isActive: true };
    const activeAdminAccounts = await User.countDocuments(adminsFilter);
    const ONLINE_WINDOW_MINUTES = 15;
    const onlineSince = new Date(Date.now() - ONLINE_WINDOW_MINUTES * 60 * 1000);
    const currentOnlineAdmins = await User.countDocuments({ ...adminsFilter, lastLogin: { $gte: onlineSince } });

    const toKV = (arr) => arr.map((d) => ({ t: d.t, value: d.value }));

    const series = {
      applied: toKV(applied),
      accepted: toKV(accepted),
      rejected: toKV(rejected),
      activeSubscriptions,
      activeAdmins: [{ t: new Date(), accounts: activeAdminAccounts, currentOnline: currentOnlineAdmins }],
    };

    const appliedDistinctUsers = await SellerApplication.distinct("userId", { createdAt: { $gte: start, $lte: end }, status: { $in: APPLIED_SET } });

    const acceptedDistinctUsers = await SellerApplication.distinct("userId", { createdAt: { $gte: start, $lte: end }, status: { $in: ACCEPTED_SET } });

    const rejectedUsers = await SellerApplication.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end }, status: "rejected" } },
      { $sort: { userId: 1, createdAt: 1 } },
      { $group: { _id: "$userId", rejectedAt: { $first: "$createdAt" } } },
      {
        $lookup: {
          from: "sellerapplications",
          let: { uid: "$_id", rAt: "$rejectedAt" },
          pipeline: [
            { $match: { $expr: { $and: [ { $eq: ["$userId", "$$uid"] }, { $gt: ["$createdAt", "$$rAt"] }, { $in: ["$status", ACCEPTED_SET] } ] } } },
            { $limit: 1 },
          ],
          as: "later",
        },
      },
      { $match: { later: { $size: 0 } } },
      { $count: "cnt" },
    ]);

    const activeSubscriptionsNow = await SellerApplication.countDocuments({ status: "active", planStartDate: { $lte: new Date() }, $or: [ { planExpiryDate: null }, { planExpiryDate: { $gt: new Date() } } ] });

    res.json({
      success: true,
      range: { from: start, to: end, groupBy: unit },
      series,
      totals: {
        appliedDistinctUsers: appliedDistinctUsers.length,
        acceptedDistinctUsers: acceptedDistinctUsers.length,
        rejectedDistinctUsers: rejectedUsers[0]?.cnt || 0,
        activeSubscriptionsNow,
        activeAdminAccounts,
        currentOnlineAdmins,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error computing analytics", error: err.message });
  }
};

export const getSubscriptionsLeaderboard = async (req, res) => {
  try {
    const latestPerUser = [
      { $sort: { userId: 1, createdAt: -1 } },
      { $group: { _id: "$userId", app: { $first: "$$ROOT" } } },
      { $replaceRoot: { newRoot: "$app" } },
    ];

    const byPlan = await SellerApplication.aggregate([
      ...latestPerUser,
      {
        $lookup: {
          from: "subscriptionplans",
          localField: "selectedPlanId",
          foreignField: "_id",
          as: "plan",
        },
      },
      { $addFields: { planName: { $ifNull: ["$selectedPlanSnapshot.name", { $arrayElemAt: ["$plan.name", 0] }] } } },
      { $group: {
          _id: "$planName",
          activeCount: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
          pendingPayment: { $sum: { $cond: [{ $eq: ["$status", "approved_pending_payment"] }, 1, 0] } },
          expiringSoon: { $sum: { $cond: [{ $eq: ["$planStatus", "expiring_soon"] }, 1, 0] } },
          expired: { $sum: { $cond: [{ $eq: ["$planStatus", "expired"] }, 1, 0] } },
        } },
      { $project: { _id: 0, planName: "$_id", activeCount: 1, pendingPayment: 1, expiringSoon: 1, expired: 1 } },
      { $sort: { activeCount: -1 } },
    ]);

    const reapplications = await SellerApplication.aggregate([
      { $match: { status: "rejected" } },
      { $sort: { userId: 1, createdAt: 1 } },
      { $group: { _id: "$userId", rejectedAt: { $first: "$createdAt" }, rejectedAppId: { $first: "$_id" } } },
      {
        $lookup: {
          from: "sellerapplications",
          let: { uid: "$_id", rAt: "$rejectedAt" },
          pipeline: [
            { $match: { $expr: { $and: [ { $eq: ["$userId", "$$uid"] }, { $gt: ["$createdAt", "$$rAt"] }, { $in: ["$status", ACCEPTED_SET] } ] } } },
            { $sort: { createdAt: 1 } },
            { $limit: 1 },
          ],
          as: "later",
        },
      },
      { $unwind: "$later" },
      { $project: { _id: 0, userId: "$_id", rejectedAt: 1, laterStatus: "$later.status", laterAppId: "$later._id", laterApprovedAt: "$later.createdAt" } },
      { $sort: { laterApprovedAt: -1 } },
    ]);

    res.json({ success: true, byPlan, reapplications });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error computing leaderboard", error: err.message });
  }
};
