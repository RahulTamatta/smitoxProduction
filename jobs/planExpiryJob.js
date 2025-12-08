import cron from "node-cron";
import sellerProfileModel from "../models/sellerProfileModel.js";
import subscriptionPlanModel from "../models/subscriptionPlanModel.js";
import userModel from "../models/userModel.js";
import { logAuditEvent } from "../middlewares/rbacMiddleware.js";
import { ROLES } from "../config/rbac-policy.js";

/**
 * Daily CRON job to handle plan expiry and auto-fallback to Free plan
 * Runs daily at midnight
 */
export const handlePlanExpiry = async () => {
  try {
    console.log("🔄 Starting plan expiry check...");
    const now = new Date();

    // Find all active seller profiles with expired plans
    const expiredProfiles = await sellerProfileModel.find({
      isActive: true,
      planExpiresAt: { $lte: now },
    });

    console.log(`📊 Found ${expiredProfiles.length} expired plans`);

    for (const profile of expiredProfiles) {
      const daysSinceExpiry = Math.floor(
        (now - profile.planExpiresAt) / (1000 * 60 * 60 * 24)
      );

      console.log(
        `⏰ Processing profile ${profile.userId}: ${daysSinceExpiry} days since expiry`
      );

      // Check if should auto-fallback (30 days grace period)
      if (daysSinceExpiry >= 30) {
        await autoFallbackToFreePlan(profile);
      } else if (daysSinceExpiry >= 0) {
        // Send reminder emails
        await sendReminderEmails(profile, daysSinceExpiry);
      }
    }

    console.log("✅ Plan expiry check completed");
  } catch (error) {
    console.error("❌ Error in plan expiry job:", error);
  }
};

/**
 * Auto-fallback seller to Free plan
 */
async function autoFallbackToFreePlan(profile) {
  try {
    console.log(`🔄 Auto-fallback to Free plan for user ${profile.userId}`);

    // Get Free plan
    const freePlan = await subscriptionPlanModel.findOne({
      isFree: true,
      isActive: true,
    });

    if (!freePlan) {
      console.error("❌ No active Free plan found");
      return;
    }

    // Update SellerProfile
    profile.currentPlanId = freePlan._id;
    profile.planActivatedAt = new Date();
    profile.planExpiresAt = null;
    profile.isActive = true;
    profile.permissions = {
      grantedCapabilities: freePlan.includedCapabilities || [],
      deniedCapabilities: freePlan.excludedCapabilities || [],
    };
    await profile.save();

    // Update user
    const user = await userModel.findById(profile.userId);
    if (user) {
      user.permissions = profile.permissions;
      user.tokenVersion = (user.tokenVersion || 0) + 1;
      await user.save();

      console.log(`✅ User ${profile.userId} fallback to Free plan`);
    }

    // Log audit event
    await logAuditEvent({
      actor: null,
      actorRole: ROLES.SYSTEM,
      action: "auto_fallback_to_free",
      resourceType: "seller_profile",
      resourceId: profile._id,
      severity: "medium",
      description: `Seller ${profile.userId} auto-fallback to Free plan after 30-day grace period`,
    });

    // Send email notification
    if (user) {
      await sendFallbackNotificationEmail(user, freePlan);
    }
  } catch (error) {
    console.error("❌ Error in auto-fallback:", error);
  }
}

/**
 * Send reminder emails before expiry
 */
async function sendReminderEmails(profile, daysSinceExpiry) {
  try {
    const user = await userModel.findById(profile.userId);
    if (!user) return;

    const daysUntilExpiry = -daysSinceExpiry; // Convert to positive for days remaining

    // 7 days before expiry
    if (daysUntilExpiry === 7) {
      console.log(`📧 Sending 7-day reminder to ${user.email_id}`);
      await sendEmail(
        user.email_id,
        "Your Subscription Expires in 7 Days",
        `Your seller subscription plan expires in 7 days. Please renew to continue selling.`
      );
    }

    // 1 day before expiry
    if (daysUntilExpiry === 1) {
      console.log(`📧 Sending 1-day reminder to ${user.email_id}`);
      await sendEmail(
        user.email_id,
        "Your Subscription Expires Tomorrow",
        `Your seller subscription plan expires tomorrow. Please renew now to avoid service interruption.`
      );
    }

    // On expiry day
    if (daysUntilExpiry === 0) {
      console.log(`📧 Sending expiry notification to ${user.email_id}`);
      await sendEmail(
        user.email_id,
        "Your Subscription Has Expired",
        `Your seller subscription plan has expired today. You have 30 days to renew before being downgraded to the Free plan.`
      );
    }
  } catch (error) {
    console.error("❌ Error sending reminder emails:", error);
  }
}

/**
 * Send fallback notification email
 */
async function sendFallbackNotificationEmail(user, freePlan) {
  try {
    console.log(`📧 Sending fallback notification to ${user.email_id}`);
    await sendEmail(
      user.email_id,
      "You Have Been Downgraded to Free Plan",
      `Your subscription plan has expired and you have not renewed within the grace period. 
       You are now on the Free plan with limited features. 
       Please upgrade to continue with full features.`
    );
  } catch (error) {
    console.error("❌ Error sending fallback email:", error);
  }
}

/**
 * Placeholder for email sending
 * Replace with actual email service (SendGrid, Nodemailer, etc.)
 */
async function sendEmail(to, subject, message) {
  try {
    // TODO: Implement actual email sending
    console.log(`📧 Email to ${to}: ${subject}`);
    console.log(`   Message: ${message}`);
  } catch (error) {
    console.error("❌ Error sending email:", error);
  }
}

/**
 * Start the plan expiry CRON job
 * Runs daily at midnight (00:00)
 */
export const startPlanExpiryJob = () => {
  try {
    // Schedule job to run daily at midnight
    cron.schedule("0 0 * * *", async () => {
      console.log("⏰ Running plan expiry check...");
      await handlePlanExpiry();
    });
    
    console.log("✅ Plan expiry CRON job scheduled (runs daily at midnight)");
  } catch (error) {
    console.error("❌ Failed to schedule plan expiry CRON job:", error);
    throw error;
  }
};

export default handlePlanExpiry;
