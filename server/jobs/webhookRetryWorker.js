/**
 * Webhook Retry Worker
 * Background job to retry failed webhook processing
 */

import WebhookEvent from '../models/webhookEventModel.js';
import { createLogger } from '../utils/logger.js';
import { processFailedWebhooks } from '../webhooks/razorpayWebhook.js';

const logger = createLogger(null, { component: 'WebhookRetryWorker' });

/**
 * Webhook Retry Worker Class
 */
class WebhookRetryWorker {
    constructor() {
        this.isRunning = false;
        this.intervalId = null;
        this.stats = {
            runs: 0,
            processed: 0,
            failed: 0,
            lastRunAt: null,
        };
    }

    /**
     * Start the worker
     * @param {number} intervalMs - Interval between runs (default: 1 minute)
     */
    start(intervalMs = 60 * 1000) {
        if (this.intervalId) {
            logger.warn('Worker already started');
            return;
        }

        logger.info('Starting webhook retry worker', { intervalMs });

        // Run immediately
        this.run();

        // Schedule periodic runs
        this.intervalId = setInterval(() => this.run(), intervalMs);
    }

    /**
     * Stop the worker
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            logger.info('Webhook retry worker stopped');
        }
    }

    /**
     * Execute one run of the worker
     */
    async run() {
        if (this.isRunning) {
            return;
        }

        this.isRunning = true;
        const startTime = Date.now();

        try {
            // Get count of pending retries
            const pendingCount = await WebhookEvent.countDocuments({
                status: 'failed',
                nextRetryAt: { $lte: new Date() },
                processingAttempts: { $lt: 5 },
            });

            if (pendingCount === 0) {
                this.isRunning = false;
                return;
            }

            logger.info('Processing webhook retries', { pendingCount });

            // Process failed webhooks
            const result = await processFailedWebhooks();

            this.stats.runs++;
            this.stats.processed += result.processed || 0;
            this.stats.failed += result.failed || 0;
            this.stats.lastRunAt = new Date();

            const duration = Date.now() - startTime;

            logger.info('Webhook retry run completed', {
                duration,
                processed: result.processed,
                failed: result.failed,
            });

            // Log metric
            logger.metric('webhook_retry_run', 1, {
                processed: result.processed,
                failed: result.failed,
                duration,
            });

        } catch (error) {
            logger.error('Webhook retry worker error', error);
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Get worker statistics
     */
    getStats() {
        return {
            ...this.stats,
            isRunning: this.isRunning,
            isStarted: !!this.intervalId,
        };
    }

    /**
     * Manually process a specific failed webhook
     * @param {string} eventId - Webhook event ID
     */
    async processOne(eventId) {
        const event = await WebhookEvent.findOne({ eventId });

        if (!event) {
            throw new Error('Webhook event not found');
        }

        if (event.status === 'completed') {
            return { skipped: true, reason: 'Already completed' };
        }

        logger.info('Manually processing webhook', { eventId });

        // Reset status and process
        event.status = 'pending';
        event.nextRetryAt = new Date();
        await event.save();

        await processFailedWebhooks();

        return { processed: true };
    }

    /**
     * Get failed webhooks for admin review
     */
    async getFailedWebhooks({ page = 1, limit = 20 }) {
        const skip = (page - 1) * limit;

        const [events, total] = await Promise.all([
            WebhookEvent.find({
                status: 'failed',
            })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            WebhookEvent.countDocuments({ status: 'failed' }),
        ]);

        return {
            events,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Clean up old completed webhooks
     * @param {number} daysOld - Delete webhooks older than this many days
     */
    async cleanup(daysOld = 30) {
        const cutoff = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

        const result = await WebhookEvent.deleteMany({
            status: { $in: ['completed', 'skipped'] },
            createdAt: { $lt: cutoff },
        });

        logger.info('Webhook cleanup completed', {
            deleted: result.deletedCount,
            daysOld,
        });

        return { deleted: result.deletedCount };
    }
}

// Export singleton
export const webhookRetryWorker = new WebhookRetryWorker();

/**
 * Start webhook retry worker (convenience function)
 * @param {number} intervalMs - Interval in milliseconds
 */
export const startWebhookRetryWorker = (intervalMs = 60 * 1000) => {
    webhookRetryWorker.start(intervalMs);
    return () => webhookRetryWorker.stop();
};

export default { webhookRetryWorker, startWebhookRetryWorker };
