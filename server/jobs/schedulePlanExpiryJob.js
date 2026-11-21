/**
 * Schedule Plan Expiry Check CRON Job
 * Runs daily at midnight to auto-fallback expired plans
 */

import cron from "node-cron";
import { runSubscriptionSweep } from "../helpers/subscriptionLifecycle.js";

let scheduledJob = null;

/**
 * Start the plan expiry check CRON job
 * Runs daily at 00:00 (midnight)
 */
const sweep = async (label) => {
  try {
    const counts = await runSubscriptionSweep();
    console.log(`[subscriptions] ${label} sweep:`, JSON.stringify(counts));
  } catch (error) {
    console.error("[subscriptions] sweep failed:", error.message);
  }
};

export const startPlanExpiryJob = () => {
  try {
    // Hourly: grace period, Free-plan fallback and "expiring soon" flags
    scheduledJob = cron.schedule("15 * * * *", () => sweep("hourly"));
    // Catch up immediately after a restart/deploy
    setTimeout(() => sweep("startup"), 10000);
    console.log("✅ Subscription expiry sweep scheduled (hourly)");
    return true;
  } catch (error) {
    console.error("❌ Error scheduling plan expiry job:", error);
    return false;
  }
};

/**
 * Stop the plan expiry check CRON job
 */
export const stopPlanExpiryJob = () => {
  try {
    if (scheduledJob) {
      scheduledJob.stop();
      scheduledJob.destroy();
      console.log("✅ Plan Expiry CRON Job stopped");
      return true;
    }
    return false;
  } catch (error) {
    console.error("❌ Error stopping plan expiry job:", error);
    return false;
  }
};

/**
 * Run plan expiry check immediately (for testing)
 */
export const runPlanExpiryCheckNow = async () => {
  try {
    console.log("[Manual Trigger] Running plan expiry check now...");
    await runDailyPlanExpiryCheck();
    console.log("[Manual Trigger] Plan expiry check completed");
    return true;
  } catch (error) {
    console.error("[Manual Trigger] Error running plan expiry check:", error);
    return false;
  }
};

export default {
  startPlanExpiryJob,
  stopPlanExpiryJob,
  runPlanExpiryCheckNow,
};
