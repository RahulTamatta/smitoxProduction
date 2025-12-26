import { ROLES } from "../config/rbac-policy.js";
import { SUBSCRIPTION_STATES } from "../config/subscriptionStates.js";
import { logAuditEvent } from "../middlewares/rbacMiddleware.js";
import sellerApplicationModel from "../models/sellerApplicationModel.js";
import sellerProfileModel from "../models/sellerProfileModel.js";
import subscriptionHistoryModel from "../models/subscriptionHistoryModel.js";
import subscriptionPlanModel from "../models/subscriptionPlanModel.js";
import userModel from "../models/userModel.js";

class SubscriptionService {
    /**
     * Activate a new subscription (called after payment or for free plans)
     * @param {ObjectId} userId - User ID
     * @param {ObjectId} planId - Subscription plan ID
     * @param {String} paymentId - Payment transaction ID (null for free plans)
     * @param {String} triggeredBy - Who triggered the activation (user/system/admin)
     * @returns {Promise<SellerProfile>} Updated seller profile
     */
    async activatePlan(userId, planId, paymentId = null, triggeredBy = 'system') {
        try {
            console.log(`🔄 Activating plan for user ${userId}`);

            // Get plan details
            const plan = await subscriptionPlanModel.findById(planId);
            if (!plan) {
                throw new Error('Plan not found');
            }

            // Get or create seller profile
            let profile = await sellerProfileModel.findOne({ userId });
            const isNewProfile = !profile;

            if (isNewProfile) {
                // Create new profile from approved application
                const application = await sellerApplicationModel.findOne({
                    userId,
                    status: { $in: ['approved', 'approved_pending_payment'] }
                });

                if (!application) {
                    throw new Error('No approved application found');
                }

                profile = new sellerProfileModel({
                    userId,
                    applicationId: application._id,
                    currentPlanId: planId,
                    businessName: application.businessName,
                    businessType: application.businessType,
                    gstNumber: application.gstNumber,
                    panNumber: application.panNumber,
                    businessDescription: application.businessDescription,
                    primaryContactName: `${application.firstName} ${application.lastName}`,
                    primaryContactEmail: application.email,
                    primaryContactPhone: application.phone,
                    accountHolderName: application.accountHolderName,
                    accountNumber: application.accountNumber,
                    ifscCode: application.ifscCode,
                    bankName: application.bankName,
                    permissions: {
                        grantedCapabilities: plan.includedCapabilities || [],
                        deniedCapabilities: plan.excludedCapabilities || []
                    }
                });

                // Mark application as immutable
                application.isImmutable = true;
                application.activatedAt = new Date();
                application.status = 'active';
                await application.save();
            }

            // Calculate expiry date based on billing cycle
            const activationDate = new Date();
            let expiryDate = null;

            if (!plan.isFree) {
                switch (plan.billingCycle) {
                    case 'monthly':
                        expiryDate = new Date(activationDate.getTime() + 30 * 24 * 60 * 60 * 1000);
                        break;
                    case 'quarterly':
                        expiryDate = new Date(activationDate.getTime() + 90 * 24 * 60 * 60 * 1000);
                        break;
                    case 'yearly':
                        expiryDate = new Date(activationDate.getTime() + 365 * 24 * 60 * 60 * 1000);
                        break;
                }
            }

            // Update profile
            const previousPlanId = profile.currentPlanId;
            profile.currentPlanId = planId;
            profile.planActivatedAt = activationDate;
            profile.planExpiresAt = expiryDate;
            profile.isActive = true;
            profile.subscriptionStatus = SUBSCRIPTION_STATES.ACTIVE;
            profile.lastStatusChange = activationDate;
            profile.gracePeriodStartDate = null;
            profile.gracePeriodEndDate = null;

            // Add to status history
            profile.statusHistory.push({
                status: SUBSCRIPTION_STATES.ACTIVE,
                changedAt: activationDate,
                reason: isNewProfile ? 'Initial activation' : 'Plan renewed'
            });

            // Update permissions based on plan
            profile.permissions = {
                grantedCapabilities: plan.includedCapabilities || [],
                deniedCapabilities: plan.excludedCapabilities || []
            };

            await profile.save();

            // Update user permissions and invalidate tokens
            const user = await userModel.findById(userId);
            if (user) {
                user.permissions = profile.permissions;
                user.tokenVersion = (user.tokenVersion || 0) + 1;
                await user.save();
            }

            // Log to subscription history
            await subscriptionHistoryModel.create({
                sellerId: userId,
                sellerProfileId: profile._id,
                previousPlanId: isNewProfile ? null : previousPlanId,
                newPlanId: planId,
                actionType: isNewProfile ? 'initial_activation' : 'manual_renewal',
                triggeredBy,
                paymentId,
                paymentAmount: plan.price,
                paymentStatus: paymentId ? 'success' : 'not_required',
                metadata: {
                    planName: plan.name,
                    billingCycle: plan.billingCycle,
                    expiryDate,
                    isNewProfile
                }
            });

            // Log audit event
            await logAuditEvent({
                actor: userId,
                actorRole: ROLES.SELLER,
                action: isNewProfile ? 'activate_subscription' : 'renew_subscription',
                resourceType: 'seller_profile',
                resourceId: profile._id,
                severity: 'medium',
                description: `Activated ${plan.name} plan`
            });

            console.log(`✅ Plan activated successfully for user ${userId}`);
            return profile;

        } catch (error) {
            console.error('❌ Error activating plan:', error);
            throw error;
        }
    }

    /**
     * Update subscription status (central state manager)
     * @param {ObjectId} sellerId - Seller user ID
     * @param {String} newStatus - New subscription status
     * @param {String} reason - Reason for status change
     * @returns {Promise<SellerProfile>} Updated seller profile
     */
    async updateSubscriptionStatus(sellerId, newStatus, reason = '') {
        try {
            const profile = await sellerProfileModel.findOne({ userId: sellerId });
            if (!profile) {
                throw new Error('Seller profile not found');
            }

            const oldStatus = profile.subscriptionStatus;
            if (oldStatus === newStatus) {
                return profile; // No change needed
            }

            profile.subscriptionStatus = newStatus;
            profile.lastStatusChange = new Date();
            profile.statusHistory.push({
                status: newStatus,
                changedAt: new Date(),
                reason
            });

            await profile.save();

            // Log audit event
            await logAuditEvent({
                actor: null,
                actorRole: ROLES.SYSTEM,
                action: 'update_subscription_status',
                resourceType: 'seller_profile',
                resourceId: profile._id,
                severity: 'low',
                description: `Status changed from ${oldStatus} to ${newStatus}: ${reason}`
            });

            console.log(`✅ Status updated: ${oldStatus} → ${newStatus}`);
            return profile;

        } catch (error) {
            console.error('❌ Error updating status:', error);
            throw error;
        }
    }

    /**
     * Auto-downgrade seller to free plan after grace period
     * @param {ObjectId} sellerId - Seller user ID
     * @returns {Promise<SellerProfile>} Updated seller profile
     */
    async autoDowngrade(sellerId) {
        try {
            console.log(`🔄 Auto-downgrading seller ${sellerId} to free plan`);

            const profile = await sellerProfileModel.findOne({ userId: sellerId });
            if (!profile) {
                throw new Error('Seller profile not found');
            }

            // Find free plan
            const freePlan = await subscriptionPlanModel.findOne({
                isFree: true,
                isActive: true
            });

            if (!freePlan) {
                console.error('❌ No free plan available, suspending seller');
                return await this.suspendSeller(sellerId, 'No free plan available for downgrade');
            }

            // Update profile
            const previousPlanId = profile.currentPlanId;
            profile.currentPlanId = freePlan._id;
            profile.planActivatedAt = new Date();
            profile.planExpiresAt = null; // Free plan doesn't expire
            profile.subscriptionStatus = SUBSCRIPTION_STATES.ACTIVE;
            profile.lastStatusChange = new Date();
            profile.gracePeriodStartDate = null;
            profile.gracePeriodEndDate = null;

            profile.statusHistory.push({
                status: SUBSCRIPTION_STATES.ACTIVE,
                changedAt: new Date(),
                reason: 'Auto-downgraded to free plan after grace period'
            });

            profile.permissions = {
                grantedCapabilities: freePlan.includedCapabilities || [],
                deniedCapabilities: freePlan.excludedCapabilities || []
            };

            await profile.save();

            // Update user permissions
            const user = await userModel.findById(sellerId);
            if (user) {
                user.permissions = profile.permissions;
                user.tokenVersion = (user.tokenVersion || 0) + 1;
                await user.save();
            }

            // Log to history
            await subscriptionHistoryModel.create({
                sellerId,
                sellerProfileId: profile._id,
                previousPlanId,
                newPlanId: freePlan._id,
                actionType: 'auto_downgrade',
                triggeredBy: 'system',
                paymentId: null,
                paymentAmount: 0,
                paymentStatus: 'not_required',
                metadata: {
                    reason: 'Grace period expired',
                    previousPlanName: (await subscriptionPlanModel.findById(previousPlanId))?.name,
                    newPlanName: freePlan.name
                }
            });

            console.log(`✅ Seller ${sellerId} downgraded to free plan`);
            return profile;

        } catch (error) {
            console.error('❌ Error in auto-downgrade:', error);
            throw error;
        }
    }

    /**
     * Suspend seller account
     * @param {ObjectId} sellerId - Seller user ID
     * @param {String} reason - Reason for suspension
     * @returns {Promise<SellerProfile>} Updated seller profile
     */
    async suspendSeller(sellerId, reason) {
        try {
            console.log(`🔄 Suspending seller ${sellerId}`);

            const profile = await sellerProfileModel.findOne({ userId: sellerId });
            if (!profile) {
                throw new Error('Seller profile not found');
            }

            profile.subscriptionStatus = SUBSCRIPTION_STATES.SUSPENDED;
            profile.status = 'suspended';
            profile.suspensionReason = reason;
            profile.suspensionDate = new Date();
            profile.lastStatusChange = new Date();
            profile.isActive = false;

            profile.statusHistory.push({
                status: SUBSCRIPTION_STATES.SUSPENDED,
                changedAt: new Date(),
                reason
            });

            await profile.save();

            // Log audit event
            await logAuditEvent({
                actor: null,
                actorRole: ROLES.SYSTEM,
                action: 'suspend_seller',
                resourceType: 'seller_profile',
                resourceId: profile._id,
                severity: 'high',
                description: `Seller suspended: ${reason}`
            });

            console.log(`✅ Seller ${sellerId} suspended`);
            return profile;

        } catch (error) {
            console.error('❌ Error suspending seller:', error);
            throw error;
        }
    }

    /**
     * Get subscription status for a seller
     * @param {ObjectId} sellerId - Seller user ID
     * @returns {Promise<Object>} Subscription status details
     */
    async getSubscriptionStatus(sellerId) {
        try {
            const profile = await sellerProfileModel.findOne({ userId: sellerId })
                .populate('currentPlanId');

            if (!profile) {
                return null;
            }

            const now = new Date();
            let daysUntilExpiry = null;
            let daysInGracePeriod = null;

            if (profile.planExpiresAt) {
                daysUntilExpiry = Math.ceil((profile.planExpiresAt - now) / (1000 * 60 * 60 * 24));
            }

            if (profile.gracePeriodEndDate) {
                daysInGracePeriod = Math.ceil((profile.gracePeriodEndDate - now) / (1000 * 60 * 60 * 24));
            }

            return {
                status: profile.subscriptionStatus,
                plan: profile.currentPlanId,
                expiresAt: profile.planExpiresAt,
                daysUntilExpiry,
                gracePeriodEndDate: profile.gracePeriodEndDate,
                daysInGracePeriod,
                isActive: profile.isActive,
                permissions: profile.permissions
            };

        } catch (error) {
            console.error('❌ Error getting subscription status:', error);
            throw error;
        }
    }
}

export default new SubscriptionService();
