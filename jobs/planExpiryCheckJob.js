/**
 * Plan Expiry Check Middleware
 * Checks and updates plan expiry status on every seller request
 */

import sellerApplicationModel from "../models/sellerApplicationModel.js";
import subscriptionPlanModel from "../models/subscriptionPlanModel.js";
import userModel from "../models/userModel.js";
import { computeCapabilities, ROLES } from "../config/rbac-policy.js";

/**
 * Check and update plan expiry status
 * Called on every seller request
 */
export const checkPlanExpiry = async (req, res, next) => {
  try {
    // Only check for authenticated users
    if (!req.user || !req.user._id) {
      return next();
    }

    // Get seller application
    const application = await sellerApplicationModel
      .findOne({ userId: req.user._id, status: "active" })
      .populate("selectedPlanId");

    if (!application) {
      return next();
    }

    const today = new Date();
    const expiryDate = new Date(application.planExpiryDate);
    const gracePeriodEnd = new Date(application.gracePeriodEndDate);

    let statusUpdated = false;
    let newStatus = application.planStatus;

    // Check if expired
    if (today > expiryDate) {
      // Check if in grace period
      if (today <= gracePeriodEnd) {
        newStatus = "grace_period";
      } else {
        // Grace period ended - fallback to Free Plan
        newStatus = "expired";

        // Find Free Plan
        const freePlan = await subscriptionPlanModel.findOne({ isFree: true });
        if (freePlan) {
          // Switch to Free Plan
          application.selectedPlanId = freePlan._id;
          application.planStatus = "expired";

          // Update expiry date to 30 days from now
          const newExpiryDate = new Date();
          newExpiryDate.setDate(newExpiryDate.getDate() + 30);
          application.planExpiryDate = newExpiryDate;

          // Log the fallback
          application.renewalHistory.push({
            renewalDate: new Date(),
            previousPlanId: application.selectedPlanId,
            newPlanId: freePlan._id,
            renewalType: "auto_fallback",
          });

          // Update user capabilities to Free Plan capabilities
          const user = await userModel.findById(req.user._id);
          if (user) {
            user.permissions = {
              grantedCapabilities: freePlan.includedCapabilities || [],
              deniedCapabilities: freePlan.excludedCapabilities || [],
            };
            await user.save();
          }

          statusUpdated = true;
          console.log(
            `[Plan Expiry] Seller ${req.user._id} auto-fallback to Free Plan`
          );
        }
      }
    } else if (today > new Date(expiryDate.getTime() - 7 * 24 * 60 * 60 * 1000)) {
      // Less than 7 days remaining
      newStatus = "expiring_soon";
    } else {
      newStatus = "active";
    }

    // Update status if changed
    if (newStatus !== application.planStatus) {
      application.planStatus = newStatus;
      statusUpdated = true;
    }

    // Save if updated
    if (statusUpdated) {
      await application.save();
    }

    // Update req.user with current plan info
    req.user.currentPlan = {
      planId: application.selectedPlanId._id,
      planName: application.selectedPlanId.name,
      planStatus: application.planStatus,
      expiryDate: application.planExpiryDate,
      daysRemaining: Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24)),
    };

    next();
  } catch (error) {
    console.error("Error checking plan expiry:", error);
    // Don't block request on error
    next();
  }
};

/**
 * CRON Job - Run daily to auto-fallback expired plans
 * Can be scheduled with node-cron or similar
 */
export const runDailyPlanExpiryCheck = async () => {
  try {
    console.log("[CRON] Running daily plan expiry check...");

    const today = new Date();

    // Find all active applications with expired plans
    const expiredApplications = await sellerApplicationModel
      .find({
        status: "active",
        planExpiryDate: { $lt: today },
        planStatus: { $ne: "expired" },
      })
      .populate("selectedPlanId");

    console.log(
      `[CRON] Found ${expiredApplications.length} applications with expired plans`
    );

    // Find Free Plan
    const freePlan = await subscriptionPlanModel.findOne({ isFree: true });
    if (!freePlan) {
      console.error("[CRON] Free Plan not found!");
      return;
    }

    // Process each expired application
    for (const application of expiredApplications) {
      try {
        // Check grace period
        const gracePeriodEnd = new Date(application.gracePeriodEndDate);

        if (today > gracePeriodEnd) {
          // Grace period ended - auto-fallback
          application.selectedPlanId = freePlan._id;
          application.planStatus = "expired";

          // Update expiry date to 30 days from now
          const newExpiryDate = new Date();
          newExpiryDate.setDate(newExpiryDate.getDate() + 30);
          application.planExpiryDate = newExpiryDate;

          // Log the fallback
          application.renewalHistory.push({
            renewalDate: new Date(),
            previousPlanId: application.selectedPlanId,
            newPlanId: freePlan._id,
            renewalType: "auto_fallback",
          });

          await application.save();

          // Update user capabilities
          const user = await userModel.findById(application.userId);
          if (user) {
            user.permissions = {
              grantedCapabilities: freePlan.includedCapabilities || [],
              deniedCapabilities: freePlan.excludedCapabilities || [],
            };
            await user.save();
          }

          console.log(
            `[CRON] Auto-fallback: Seller ${application.userId} → Free Plan`
          );
        } else {
          // Still in grace period - just update status
          application.planStatus = "grace_period";
          await application.save();
        }
      } catch (error) {
        console.error(
          `[CRON] Error processing application ${application._id}:`,
          error
        );
      }
    }

    console.log("[CRON] Daily plan expiry check completed");
  } catch (error) {
    console.error("[CRON] Error in daily plan expiry check:", error);
  }
};

export default {
  checkPlanExpiry,
  runDailyPlanExpiryCheck,
};
