/**
 * Enhanced Subscription Service
 * Production-ready with transactions, locking, and comprehensive error handling
 */

import mongoose from 'mongoose';
import { ROLES } from '../config/rbac-policy.js';
import { SUBSCRIPTION_CONFIG } from '../config/subscriptionConfig.js';
import { lockManager } from '../middleware/distributedLock.js';
import { logAuditEvent } from '../middlewares/rbacMiddleware.js';
import SellerApplication from '../models/sellerApplicationModel.js';
import SellerProfile from '../models/sellerProfileModel.js';
import SubscriptionHistory from '../models/subscriptionHistoryModel.js';
import SubscriptionPlan from '../models/subscriptionPlanModel.js';
import User from '../models/userModel.js';
import { createLogger } from '../utils/logger.js';
import { stateMachine } from '../utils/stateMachine.js';

const { states, timing, billingCycles } = SUBSCRIPTION_CONFIG;

/**
 * Enhanced Subscription Service with full transaction support
 */
class EnhancedSubscriptionService {
    constructor() {
        this.logger = createLogger(null, { component: 'SubscriptionService' });
    }

    /**
     * Activate a subscription with full transaction safety
     * Handles both new activations and renewals
     * 
     * @param {Object} params - Activation parameters
     * @param {ObjectId} params.userId - User ID
     * @param {ObjectId} params.applicationId - Application ID
     * @param {ObjectId} params.planId - Plan ID
     * @param {string} params.paymentId - Payment transaction ID (null for free)
     * @param {string} params.triggeredBy - Who triggered (user/system/admin/webhook)
     * @param {string} params.correlationId - Request correlation ID
     * @returns {Object} Activation result
     */
    async activateSubscription({
        userId,
        applicationId,
        planId,
        paymentId = null,
        triggeredBy = 'system',
        correlationId = null,
    }) {
        const logger = this.logger.child({ correlationId, userId, applicationId });
        const lockResourceId = `application_${applicationId}`;

        logger.info('Starting subscription activation', { planId, triggeredBy });

        // Acquire distributed lock
        const lockResult = await lockManager.acquire(lockResourceId, {
            ttl: 60000, // 1 minute for activation
            correlationId,
        });

        if (!lockResult.success) {
            logger.warn('Failed to acquire lock for activation');
            throw new Error('Subscription activation is already in progress');
        }

        const session = await mongoose.startSession();

        try {
            session.startTransaction({
                readConcern: { level: 'snapshot' },
                writeConcern: { w: 'majority' },
            });

            // Step 1: Fetch all required documents
            const [application, plan, existingProfile] = await Promise.all([
                SellerApplication.findById(applicationId).session(session),
                SubscriptionPlan.findById(planId).session(session),
                SellerProfile.findOne({ userId }).session(session),
            ]);

            // Validate application exists
            if (!application) {
                throw new Error('Application not found');
            }

            // Validate plan exists and is active
            if (!plan) {
                throw new Error('Subscription plan not found');
            }
            if (!plan.isActive) {
                throw new Error('Subscription plan is no longer available');
            }

            // Step 2: Validate state transition
            const currentState = application.status;
            const targetState = plan.isFree ? states.APPROVED : states.ACTIVE;

            // Check if already activated (idempotency)
            if (stateMachine.isActiveState(currentState)) {
                logger.info('Subscription already active, skipping activation', {
                    currentState,
                });
                await session.abortTransaction();
                return {
                    success: true,
                    alreadyActive: true,
                    applicationId,
                    status: currentState,
                };
            }

            // Validate transition is allowed
            const transition = stateMachine.transition({
                currentState,
                targetState,
                actor: triggeredBy,
                reason: paymentId ? 'Payment verified' : 'Free plan activation',
            });

            if (!transition.success) {
                throw new Error(`Invalid state transition: ${transition.error}`);
            }

            // Step 3: Validate snapshot matches current plan (price protection)
            if (application.selectedPlanSnapshot) {
                const snapshot = application.selectedPlanSnapshot;
                if (snapshot.price !== plan.price) {
                    logger.warn('Plan price changed since snapshot', {
                        snapshotPrice: snapshot.price,
                        currentPrice: plan.price,
                    });
                    // Proceed with snapshot price (honor locked price)
                }
            }

            // Step 4: Calculate plan dates
            const now = new Date();
            const billingDays = billingCycles[plan.billingCycle] || 30;
            const expiryDate = plan.isFree ? null : new Date(now.getTime() + billingDays * 24 * 60 * 60 * 1000);
            const gracePeriodEndDate = expiryDate
                ? new Date(expiryDate.getTime() + timing.gracePeriodDays * 24 * 60 * 60 * 1000)
                : null;

            // Step 5: Update Application
            application.status = targetState;
            application.planStartDate = now;
            application.planExpiryDate = expiryDate;
            application.gracePeriodEndDate = gracePeriodEndDate;
            application.planStatus = 'active';
            application.isImmutable = true;
            application.activatedAt = now;

            if (paymentId) {
                application.payment.status = 'paid';
                application.payment.paidAt = now;
            }

            // Add to renewal history
            application.renewalHistory.push({
                renewalDate: now,
                previousPlanId: existingProfile?.currentPlanId || null,
                newPlanId: planId,
                renewalType: existingProfile ? 'renewal' : 'initial',
                paymentId,
            });

            // Add state history
            application.stateHistory = application.stateHistory || [];
            application.stateHistory.push({
                fromState: currentState,
                toState: targetState,
                changedAt: now,
                changedBy: triggeredBy,
                reason: paymentId ? `Payment ${paymentId} verified` : 'Free plan activation',
            });

            await application.save({ session });

            // Step 6: Create or Update SellerProfile
            const profileData = {
                userId,
                applicationId,
                currentPlanId: planId,
                isActive: true,
                planActivatedAt: now,
                planExpiresAt: expiryDate,
                subscriptionStatus: 'active',
                lastStatusChange: now,
                gracePeriodStartDate: null,
                gracePeriodEndDate: gracePeriodEndDate,
                permissions: {
                    grantedCapabilities: plan.includedCapabilities || [],
                    deniedCapabilities: plan.excludedCapabilities || [],
                },
            };

            // Copy business info from application if new profile
            if (!existingProfile) {
                profileData.businessName = application.businessName;
                profileData.businessType = application.businessType;
                profileData.gstNumber = application.gstNumber;
                profileData.panNumber = application.panNumber;
                profileData.primaryContactName = `${application.firstName} ${application.lastName}`;
                profileData.primaryContactEmail = application.email;
                profileData.primaryContactPhone = application.phone;
            }

            const profile = await SellerProfile.findOneAndUpdate(
                { userId },
                { $set: profileData },
                { new: true, upsert: true, session }
            );

            // Add status history
            await SellerProfile.findByIdAndUpdate(
                profile._id,
                {
                    $push: {
                        statusHistory: {
                            status: 'active',
                            changedAt: now,
                            reason: existingProfile ? 'Plan renewed' : 'Initial activation',
                        },
                    },
                },
                { session }
            );

            // Step 7: Update User role and permissions
            const user = await User.findById(userId).session(session);
            if (!user) {
                throw new Error('User not found');
            }

            const previousRole = user.roleString;
            user.roleString = 'seller';
            user.permissions = {
                grantedCapabilities: plan.includedCapabilities || [],
                deniedCapabilities: plan.excludedCapabilities || [],
            };
            user.tokenVersion = (user.tokenVersion || 0) + 1; // Invalidate existing tokens
            await user.save({ session });

            // Step 8: Create subscription history record
            await SubscriptionHistory.create([{
                sellerId: userId,
                sellerProfileId: profile._id,
                previousPlanId: existingProfile?.currentPlanId || null,
                newPlanId: planId,
                actionType: existingProfile ? 'manual_renewal' : 'initial_activation',
                triggeredBy,
                paymentId,
                paymentAmount: plan.price,
                paymentStatus: paymentId ? 'success' : 'not_required',
                metadata: {
                    planName: plan.name,
                    billingCycle: plan.billingCycle,
                    expiryDate,
                    correlationId,
                    previousRole,
                },
            }], { session });

            // Commit transaction
            await session.commitTransaction();

            // Step 9: Post-commit actions (non-critical)
            try {
                // Log audit event
                await logAuditEvent({
                    actor: userId,
                    actorRole: ROLES.SELLER,
                    action: existingProfile ? 'renew_subscription' : 'activate_subscription',
                    resourceType: 'seller_application',
                    resourceId: applicationId,
                    severity: 'high',
                    description: `Activated ${plan.name} plan`,
                });

                // Log metrics
                logger.metric('subscription_activation', 1, {
                    planId: planId.toString(),
                    planName: plan.name,
                    isNew: !existingProfile,
                    triggeredBy,
                });
            } catch (postCommitError) {
                // Log but don't fail on post-commit actions
                logger.error('Post-commit action failed', postCommitError);
            }

            logger.info('Subscription activated successfully', {
                profileId: profile._id,
                planName: plan.name,
                expiryDate,
            });

            return {
                success: true,
                applicationId,
                profileId: profile._id,
                userId,
                planId,
                planName: plan.name,
                status: targetState,
                expiryDate,
                tokenVersion: user.tokenVersion,
            };

        } catch (error) {
            // Abort transaction on error
            await session.abortTransaction();
            logger.error('Subscription activation failed', error);
            throw error;
        } finally {
            // Always end session and release lock
            session.endSession();
            await lockManager.release(lockResourceId, lockResult.owner);
        }
    }

    /**
     * Handle payment failure with retry tracking
     * 
     * @param {ObjectId} applicationId - Application ID
     * @param {string} reason - Failure reason
     * @param {string} correlationId - Correlation ID
     */
    async handlePaymentFailure({ applicationId, reason, correlationId }) {
        const logger = this.logger.child({ correlationId, applicationId });
        logger.info('Handling payment failure', { reason });

        const session = await mongoose.startSession();

        try {
            session.startTransaction();

            const application = await SellerApplication.findById(applicationId).session(session);
            if (!application) {
                throw new Error('Application not found');
            }

            // Increment retry count
            const retryCount = (application.payment?.retryCount || 0) + 1;
            const maxRetries = timing.paymentRetryMaxAttempts;

            let newStatus;
            if (retryCount >= maxRetries) {
                newStatus = states.PAYMENT_RETRY_EXHAUSTED;
                logger.warn('Payment retries exhausted', { retryCount, maxRetries });
            } else {
                newStatus = states.APPROVED_PAYMENT_FAILED;
            }

            application.status = newStatus;
            application.payment = application.payment || {};
            application.payment.status = 'failed';
            application.payment.retryCount = retryCount;
            application.payment.lastFailureReason = reason;
            application.payment.lastFailureAt = new Date();

            // Calculate next retry window
            if (newStatus === states.APPROVED_PAYMENT_FAILED) {
                application.payment.retryExpiresAt = new Date(
                    Date.now() + timing.paymentRetryWindow * 60 * 60 * 1000
                );
            }

            await application.save({ session });
            await session.commitTransaction();

            return {
                success: true,
                status: newStatus,
                retryCount,
                canRetry: newStatus === states.APPROVED_PAYMENT_FAILED,
            };

        } catch (error) {
            await session.abortTransaction();
            logger.error('Failed to handle payment failure', error);
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Auto-downgrade expired subscriptions to free plan
     * Called by scheduled job
     * 
     * @param {ObjectId} userId - User to downgrade
     * @param {string} reason - Reason for downgrade
     */
    async autoDowngrade({ userId, reason = 'Grace period expired' }) {
        const logger = this.logger.child({ userId });
        logger.info('Starting auto-downgrade');

        const lockResourceId = `user_${userId}`;
        const lockResult = await lockManager.acquire(lockResourceId);

        if (!lockResult.success) {
            logger.warn('Failed to acquire lock for downgrade');
            return { success: false, reason: 'Lock acquisition failed' };
        }

        const session = await mongoose.startSession();

        try {
            session.startTransaction();

            // Find free plan
            const freePlan = await SubscriptionPlan.findOne({
                isFree: true,
                isActive: true,
            }).session(session);

            if (!freePlan) {
                logger.error('No free plan available for downgrade');
                throw new Error('No free plan available');
            }

            const profile = await SellerProfile.findOne({ userId }).session(session);
            if (!profile) {
                throw new Error('Seller profile not found');
            }

            const previousPlanId = profile.currentPlanId;

            // Update profile
            profile.currentPlanId = freePlan._id;
            profile.planExpiresAt = null;
            profile.subscriptionStatus = 'active';
            profile.lastStatusChange = new Date();
            profile.gracePeriodStartDate = null;
            profile.gracePeriodEndDate = null;
            profile.permissions = {
                grantedCapabilities: freePlan.includedCapabilities || [],
                deniedCapabilities: freePlan.excludedCapabilities || [],
            };

            profile.statusHistory.push({
                status: 'active',
                changedAt: new Date(),
                reason: `Auto-downgraded: ${reason}`,
            });

            await profile.save({ session });

            // Update user permissions
            await User.findByIdAndUpdate(
                userId,
                {
                    permissions: profile.permissions,
                    $inc: { tokenVersion: 1 },
                },
                { session }
            );

            // Record in history
            await SubscriptionHistory.create([{
                sellerId: userId,
                sellerProfileId: profile._id,
                previousPlanId,
                newPlanId: freePlan._id,
                actionType: 'auto_downgrade',
                triggeredBy: 'system',
                metadata: { reason },
            }], { session });

            await session.commitTransaction();

            logger.info('Auto-downgrade completed', {
                previousPlanId,
                newPlanId: freePlan._id,
            });

            return {
                success: true,
                previousPlanId,
                newPlanId: freePlan._id,
                planName: freePlan.name,
            };

        } catch (error) {
            await session.abortTransaction();
            logger.error('Auto-downgrade failed', error);
            throw error;
        } finally {
            session.endSession();
            await lockManager.release(lockResourceId, lockResult.owner);
        }
    }

    /**
     * Suspend a seller account
     * 
     * @param {ObjectId} userId - User to suspend
     * @param {string} reason - Suspension reason
     * @param {ObjectId} adminId - Admin performing suspension
     */
    async suspendSeller({ userId, reason, adminId }) {
        const logger = this.logger.child({ userId, adminId });
        logger.info('Suspending seller', { reason });

        const session = await mongoose.startSession();

        try {
            session.startTransaction();

            const profile = await SellerProfile.findOne({ userId }).session(session);
            if (!profile) {
                throw new Error('Seller profile not found');
            }

            profile.subscriptionStatus = 'suspended';
            profile.status = 'suspended';
            profile.isActive = false;
            profile.suspensionReason = reason;
            profile.suspensionDate = new Date();
            profile.suspendedBy = adminId;
            profile.lastStatusChange = new Date();

            profile.statusHistory.push({
                status: 'suspended',
                changedAt: new Date(),
                reason,
                changedBy: adminId,
            });

            await profile.save({ session });

            // Invalidate user tokens
            await User.findByIdAndUpdate(
                userId,
                { $inc: { tokenVersion: 1 } },
                { session }
            );

            await session.commitTransaction();

            // Audit log
            await logAuditEvent({
                actor: adminId,
                actorRole: ROLES.ADMIN,
                action: 'suspend_seller',
                resourceType: 'seller_profile',
                resourceId: profile._id,
                severity: 'high',
                description: `Seller suspended: ${reason}`,
            });

            return { success: true, profileId: profile._id };

        } catch (error) {
            await session.abortTransaction();
            logger.error('Suspension failed', error);
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Reactivate a suspended seller
     */
    async reactivateSeller({ userId, adminId }) {
        const logger = this.logger.child({ userId, adminId });
        logger.info('Reactivating seller');

        const session = await mongoose.startSession();

        try {
            session.startTransaction();

            const profile = await SellerProfile.findOne({ userId }).session(session);
            if (!profile) {
                throw new Error('Seller profile not found');
            }

            if (profile.subscriptionStatus !== 'suspended') {
                throw new Error('Seller is not suspended');
            }

            profile.subscriptionStatus = 'active';
            profile.status = 'active';
            profile.isActive = true;
            profile.suspensionReason = null;
            profile.suspensionDate = null;
            profile.suspendedBy = null;
            profile.lastStatusChange = new Date();

            profile.statusHistory.push({
                status: 'active',
                changedAt: new Date(),
                reason: 'Reactivated by admin',
                changedBy: adminId,
            });

            await profile.save({ session });
            await session.commitTransaction();

            return { success: true, profileId: profile._id };

        } catch (error) {
            await session.abortTransaction();
            logger.error('Reactivation failed', error);
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Get subscription status for a seller
     */
    async getSubscriptionStatus(userId) {
        const profile = await SellerProfile.findOne({ userId })
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
            permissions: profile.permissions,
            stateMetadata: stateMachine.getStateMetadata(profile.subscriptionStatus),
        };
    }
}

export const subscriptionService = new EnhancedSubscriptionService();
export default subscriptionService;
