/**
 * Payment Reconciliation Job
 * Periodic job to reconcile payment states between our DB and Razorpay
 */

import { SUBSCRIPTION_CONFIG } from '../config/subscriptionConfig.js';
import SellerApplication from '../models/sellerApplicationModel.js';
import WebhookEvent from '../models/webhookEventModel.js';
import { paymentService } from '../services/paymentService.js';
import { subscriptionService } from '../services/subscriptionServiceV2.js';
import { createLogger } from '../utils/logger.js';

const { states } = SUBSCRIPTION_CONFIG;
const logger = createLogger(null, { component: 'PaymentReconciliation' });

/**
 * Payment Reconciliation Job
 * Runs periodically to catch missed webhooks and fix inconsistent states
 */
class PaymentReconciliationJob {
    constructor() {
        this.isRunning = false;
        this.lastRunAt = null;
        this.stats = {
            runs: 0,
            reconciled: 0,
            errors: 0,
        };
    }

    /**
     * Run the reconciliation job
     */
    async run() {
        if (this.isRunning) {
            logger.warn('Reconciliation job already running, skipping');
            return { skipped: true };
        }

        this.isRunning = true;
        const startTime = Date.now();

        logger.info('Starting payment reconciliation job');

        try {
            const results = {
                pendingPayments: await this.reconcilePendingPayments(),
                stalePayments: await this.findStalePayments(),
                incompleteActivations: await this.fixIncompleteActivations(),
            };

            this.stats.runs++;
            this.lastRunAt = new Date();

            const duration = Date.now() - startTime;
            logger.info('Reconciliation job completed', {
                duration,
                ...results,
            });

            return results;

        } catch (error) {
            this.stats.errors++;
            logger.error('Reconciliation job failed', error);
            throw error;
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Check pending payments against Razorpay
     */
    async reconcilePendingPayments() {
        const pendingApplications = await SellerApplication.find({
            status: states.APPROVED_PENDING_PAYMENT,
            'payment.orderId': { $exists: true },
            'payment.createdAt': {
                $lt: new Date(Date.now() - 5 * 60 * 1000), // At least 5 mins old
            },
        }).limit(100);

        logger.info('Checking pending payments', {
            count: pendingApplications.length,
        });

        let activated = 0;
        let failed = 0;
        let unchanged = 0;

        for (const application of pendingApplications) {
            try {
                const orderId = application.payment.orderId;

                // Fetch order from Razorpay
                const order = await paymentService.fetchOrder(orderId);

                if (order.status === 'paid') {
                    logger.info('Found paid order not captured by webhook', {
                        applicationId: application._id,
                        orderId,
                    });

                    // Get payment details
                    const payments = order.payments || {};
                    const paymentId = Object.keys(payments).find(
                        pid => payments[pid].status === 'captured'
                    );

                    if (paymentId) {
                        // Check if we already processed this via webhook
                        const existingEvent = await WebhookEvent.findOne({
                            paymentId,
                            status: 'completed',
                        });

                        if (!existingEvent) {
                            // Activate the subscription
                            await subscriptionService.activateSubscription({
                                userId: application.userId,
                                applicationId: application._id,
                                planId: application.selectedPlanId,
                                paymentId,
                                triggeredBy: 'reconciliation',
                            });

                            activated++;
                            logger.info('Activated subscription via reconciliation', {
                                applicationId: application._id,
                                paymentId,
                            });
                        } else {
                            unchanged++;
                        }
                    }
                } else if (order.status === 'expired') {
                    // Order expired, mark payment as failed
                    application.status = states.APPROVED_PAYMENT_FAILED;
                    application.payment.status = 'failed';
                    application.payment.lastFailureReason = 'Order expired';
                    await application.save();
                    failed++;
                } else {
                    unchanged++;
                }

            } catch (error) {
                logger.error('Error reconciling payment', {
                    applicationId: application._id,
                    error: error.message,
                });
            }
        }

        return { activated, failed, unchanged };
    }

    /**
     * Find payments that are stuck in pending state too long
     */
    async findStalePayments() {
        const staleThreshold = new Date(
            Date.now() - SUBSCRIPTION_CONFIG.timing.paymentRetryWindow * 60 * 60 * 1000
        );

        const stalePayments = await SellerApplication.find({
            status: { $in: [states.APPROVED_PENDING_PAYMENT, states.APPROVED_PAYMENT_FAILED] },
            'payment.createdAt': { $lt: staleThreshold },
        });

        let exhausted = 0;

        for (const application of stalePayments) {
            try {
                // Check if retry window expired
                if (application.status === states.APPROVED_PENDING_PAYMENT ||
                    (application.payment.retryExpiresAt &&
                        application.payment.retryExpiresAt < new Date())) {

                    application.status = states.PAYMENT_RETRY_EXHAUSTED;
                    await application.save();
                    exhausted++;

                    logger.info('Marked payment as retry exhausted', {
                        applicationId: application._id,
                    });
                }
            } catch (error) {
                logger.error('Error marking stale payment', {
                    applicationId: application._id,
                    error: error.message,
                });
            }
        }

        return { found: stalePayments.length, exhausted };
    }

    /**
     * Fix incomplete activations (crash recovery)
     * Handles case where transaction partially completed
     */
    async fixIncompleteActivations() {
        // Find applications marked as approved/active but user role not updated
        const incompleteActivations = await SellerApplication.aggregate([
            {
                $match: {
                    status: { $in: [states.APPROVED, states.ACTIVE] },
                    activatedAt: { $exists: true },
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user',
                },
            },
            {
                $unwind: '$user',
            },
            {
                $match: {
                    'user.roleString': { $ne: 'seller' },
                },
            },
            {
                $limit: 50,
            },
        ]);

        let fixed = 0;

        for (const application of incompleteActivations) {
            try {
                logger.warn('Found incomplete activation, fixing', {
                    applicationId: application._id,
                    userId: application.userId,
                });

                // Re-run activation (it's idempotent)
                await subscriptionService.activateSubscription({
                    userId: application.userId,
                    applicationId: application._id,
                    planId: application.selectedPlanId,
                    triggeredBy: 'reconciliation',
                });

                fixed++;

            } catch (error) {
                logger.error('Error fixing incomplete activation', {
                    applicationId: application._id,
                    error: error.message,
                });
            }
        }

        return { found: incompleteActivations.length, fixed };
    }

    /**
     * Get job stats
     */
    getStats() {
        return {
            ...this.stats,
            lastRunAt: this.lastRunAt,
            isRunning: this.isRunning,
        };
    }
}

// Export singleton
export const reconciliationJob = new PaymentReconciliationJob();

/**
 * Start reconciliation job on interval
 * @param {number} intervalMs - Interval in milliseconds (default: 5 minutes)
 */
export const startReconciliationJob = (intervalMs = 5 * 60 * 1000) => {
    logger.info('Starting payment reconciliation job', { intervalMs });

    // Run immediately
    reconciliationJob.run().catch(err => {
        logger.error('Initial reconciliation run failed', err);
    });

    // Schedule periodic runs
    const intervalId = setInterval(() => {
        reconciliationJob.run().catch(err => {
            logger.error('Scheduled reconciliation run failed', err);
        });
    }, intervalMs);

    return () => clearInterval(intervalId);
};

export default { reconciliationJob, startReconciliationJob };
