/**
 * Schedule Plan Expiry Check CRON Job
 * Runs daily at midnight to auto-fallback expired plans
 */

import cron from "node-cron";
import { runDailyPlanExpiryCheck } from "./planExpiryCheckJob.js";

let scheduledJob = null;

/**
 * Start the plan expiry check CRON job
 * Runs daily at 00:00 (midnight)
 */
export const startPlanExpiryJob = () => {
  try {
    // Schedule to run daily at midnight
    scheduledJob = cron.schedule("0 0 * * *", async () => {
      console.log(
        `[${new Date().toISOString()}] Running scheduled plan expiry check...`
      );
      await runDailyPlanExpiryCheck();
    });

    console.log("✅ Plan Expiry CRON Job scheduled (runs daily at 00:00)");
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
