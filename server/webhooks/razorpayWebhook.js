/**
 * Razorpay Webhook Handler
 * Idempotent, robust webhook processing with retry support
 */

import { SUBSCRIPTION_CONFIG } from '../config/subscriptionConfig.js';
import { lockManager } from '../middleware/distributedLock.js';
import SellerApplication from '../models/sellerApplicationModel.js';
import WebhookEvent from '../models/webhookEventModel.js';
import { paymentService } from '../services/paymentService.js';
import { subscriptionService } from '../services/subscriptionServiceV2.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger(null, { component: 'RazorpayWebhook' });

/**
 * Webhook Event Types we handle
 */
const HANDLED_EVENTS = {
    'payment.captured': handlePaymentCaptured,
    'payment.failed': handlePaymentFailed,
    'order.paid': handleOrderPaid,
    'refund.created': handleRefundCreated,
    'payment.dispute.created': handleDisputeCreated,
};

/**
 * Main webhook handler
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
export const handleRazorpayWebhook = async (req, res) => {
    const correlationId = req.headers['x-correlation-id'] || `webhook_${Date.now()}`;
    const webhookLogger = logger.child({ correlationId });

    // Immediately acknowledge receipt (Razorpay expects quick response)
    res.status(200).json({ status: 'received' });

    try {
        // Get raw body for signature verification
        const rawBody = req.rawBody || JSON.stringify(req.body);
        const signature = req.headers['x-razorpay-signature'];

        webhookLogger.info('Webhook received', {
            event: req.body.event,
            hasSignature: !!signature,
        });

        // Verify signature
        const isValidSignature = paymentService.verifyWebhookSignature(rawBody, signature);

        // Extract event details
        const { event, payload } = req.body;
        const eventId = payload?.payment?.entity?.id ||
            payload?.order?.entity?.id ||
            `${event}_${Date.now()}`;

        // Check for duplicate (idempotency)
        const existingEvent = await WebhookEvent.findOne({
            eventId,
            status: { $in: ['completed', 'processing'] },
        });

        if (existingEvent) {
            webhookLogger.info('Duplicate webhook, skipping', {
                eventId,
                existingStatus: existingEvent.status,
            });
            return;
        }

        // Store webhook event for processing
        const webhookEvent = await WebhookEvent.create({
            eventId,
            provider: 'razorpay',
            eventType: event,
            payload: req.body,
            paymentId: payload?.payment?.entity?.id,
            orderId: payload?.payment?.entity?.order_id || payload?.order?.entity?.id,
            amount: payload?.payment?.entity?.amount / 100,
            signatureValid: isValidSignature,
            correlationId,
            status: 'processing',
        });

        // If signature is invalid, mark as failed and alert
        if (!isValidSignature) {
            webhookLogger.error('Invalid webhook signature', {
                eventId,
                event,
            });

            webhookEvent.status = 'failed';
            webhookEvent.lastError = {
                message: 'Invalid signature',
                code: 'INVALID_SIGNATURE',
            };
            await webhookEvent.save();

            // TODO: Send alert to ops team
            return;
        }

        // Process the event
        const handler = HANDLED_EVENTS[event];

        if (!handler) {
            webhookLogger.info('Unhandled event type, skipping', { event });
            webhookEvent.status = 'skipped';
            await webhookEvent.save();
            return;
        }

        // Execute handler with lock
        await processWebhookEvent(webhookEvent, handler, webhookLogger);

    } catch (error) {
        webhookLogger.error('Webhook processing error', error);
        // Don't throw - we already sent 200 response
    }
};

/**
 * Process a webhook event with locking and error handling
 */
async function processWebhookEvent(webhookEvent, handler, eventLogger) {
    const lockResourceId = `webhook_${webhookEvent.paymentId || webhookEvent.orderId}`;

    try {
        // Try to acquire lock
        const lockResult = await lockManager.acquire(lockResourceId, {
            ttl: SUBSCRIPTION_CONFIG.timing.webhookProcessingTimeout,
            correlationId: webhookEvent.correlationId,
        });

        if (!lockResult.success) {
            eventLogger.warn('Could not acquire lock, will retry later');
            webhookEvent.status = 'pending';
            await webhookEvent.save();
            return;
        }

        try {
            // Execute the handler
            await handler(webhookEvent, eventLogger);

            // Mark as completed
            webhookEvent.status = 'completed';
            webhookEvent.completedAt = new Date();
            await webhookEvent.save();

            eventLogger.info('Webhook processed successfully', {
                eventId: webhookEvent.eventId,
                eventType: webhookEvent.eventType,
            });

        } finally {
            await lockManager.release(lockResourceId, lockResult.owner);
        }

    } catch (error) {
        eventLogger.error('Webhook handler failed', error);
        await webhookEvent.recordAttempt(false, error);
    }
}

/**
 * Handle payment.captured event
 */
async function handlePaymentCaptured(webhookEvent, eventLogger) {
    const { payload } = webhookEvent.payload;
    const payment = payload.payment.entity;

    const orderId = payment.order_id;
    const paymentId = payment.id;
    const amount = payment.amount / 100;

    eventLogger.info('Processing payment.captured', {
        orderId,
        paymentId,
        amount,
    });

    // Find the application by order ID
    const application = await SellerApplication.findOne({
        'payment.orderId': orderId,
    });

    if (!application) {
        eventLogger.error('Application not found for order', { orderId });
        throw new Error(`Application not found for order ${orderId}`);
    }

    // Update webhook event with application reference
    webhookEvent.applicationId = application._id;
    webhookEvent.userId = application.userId;

    // Check if already activated (idempotency)
    if (['approved', 'active'].includes(application.status)) {
        eventLogger.info('Application already activated, skipping', {
            applicationId: application._id,
            status: application.status,
        });
        return;
    }

    // Activate the subscription
    await subscriptionService.activateSubscription({
        userId: application.userId,
        applicationId: application._id,
        planId: application.selectedPlanId,
        paymentId,
        triggeredBy: 'webhook',
        correlationId: webhookEvent.correlationId,
    });
}

/**
 * Handle payment.failed event
 */
async function handlePaymentFailed(webhookEvent, eventLogger) {
    const { payload } = webhookEvent.payload;
    const payment = payload.payment.entity;

    const orderId = payment.order_id;
    const reason = payment.error_description || payment.error_reason || 'Payment failed';

    eventLogger.info('Processing payment.failed', {
        orderId,
        reason,
    });

    // Find the application
    const application = await SellerApplication.findOne({
        'payment.orderId': orderId,
    });

    if (!application) {
        eventLogger.warn('Application not found for failed payment', { orderId });
        return;
    }

    // Update webhook event with references
    webhookEvent.applicationId = application._id;
    webhookEvent.userId = application.userId;

    // Handle the failure
    await subscriptionService.handlePaymentFailure({
        applicationId: application._id,
        reason,
        correlationId: webhookEvent.correlationId,
    });
}

/**
 * Handle order.paid event (alternative to payment.captured)
 */
async function handleOrderPaid(webhookEvent, eventLogger) {
    const { payload } = webhookEvent.payload;
    const order = payload.order.entity;

    eventLogger.info('Processing order.paid', {
        orderId: order.id,
        amount: order.amount / 100,
    });

    // Find application
    const application = await SellerApplication.findOne({
        'payment.orderId': order.id,
    });

    if (!application) {
        eventLogger.error('Application not found for order', { orderId: order.id });
        throw new Error(`Application not found for order ${order.id}`);
    }

    // Update references
    webhookEvent.applicationId = application._id;
    webhookEvent.userId = application.userId;

    // Check if already processed
    if (['approved', 'active'].includes(application.status)) {
        eventLogger.info('Already activated via payment.captured', {
            applicationId: application._id,
        });
        return;
    }

    // Get payment ID from order
    const payments = order.payments || {};
    const paymentId = Object.keys(payments)[0];

    if (!paymentId) {
        eventLogger.warn('No payment ID found in order');
        return;
    }

    // Activate subscription
    await subscriptionService.activateSubscription({
        userId: application.userId,
        applicationId: application._id,
        planId: application.selectedPlanId,
        paymentId,
        triggeredBy: 'webhook',
        correlationId: webhookEvent.correlationId,
    });
}

/**
 * Handle refund.created event
 */
async function handleRefundCreated(webhookEvent, eventLogger) {
    const { payload } = webhookEvent.payload;
    const refund = payload.refund.entity;

    eventLogger.info('Processing refund.created', {
        refundId: refund.id,
        paymentId: refund.payment_id,
        amount: refund.amount / 100,
    });

    // Find application by payment ID
    const application = await SellerApplication.findOne({
        'payment.razorpayPaymentId': refund.payment_id,
    });

    if (!application) {
        eventLogger.warn('Application not found for refund', {
            paymentId: refund.payment_id,
        });
        return;
    }

    // Update payment status
    application.payment.status = 'refunded';
    application.payment.refundId = refund.id;
    application.payment.refundAmount = refund.amount / 100;
    application.payment.refundedAt = new Date();
    await application.save();

    // TODO: Handle subscription cancellation/suspension based on refund
    eventLogger.info('Refund recorded', {
        applicationId: application._id,
        refundAmount: refund.amount / 100,
    });
}

/**
 * Handle payment.dispute.created event
 */
async function handleDisputeCreated(webhookEvent, eventLogger) {
    const { payload } = webhookEvent.payload;
    const dispute = payload.dispute?.entity;

    eventLogger.warn('Payment dispute created', {
        disputeId: dispute?.id,
        paymentId: dispute?.payment_id,
        amount: dispute?.amount / 100,
    });

    // Find application
    const application = await SellerApplication.findOne({
        'payment.razorpayPaymentId': dispute?.payment_id,
    });

    if (!application) {
        return;
    }

    // Update payment status
    application.payment.status = 'disputed';
    application.payment.disputeId = dispute?.id;
    application.payment.disputeReason = dispute?.reason;
    await application.save();

    // TODO: Consider suspending seller during dispute
    // TODO: Alert ops team
}

/**
 * Webhook retry worker - processes failed webhooks
 */
export const processFailedWebhooks = async () => {
    const workerLogger = logger.child({ worker: 'webhookRetry' });

    try {
        const failedEvents = await WebhookEvent.getPendingRetries(50);

        if (failedEvents.length === 0) {
            return { processed: 0 };
        }

        workerLogger.info('Processing failed webhooks', {
            count: failedEvents.length,
        });

        let processed = 0;
        let failed = 0;

        for (const event of failedEvents) {
            try {
                const handler = HANDLED_EVENTS[event.eventType];
                if (!handler) {
                    event.status = 'skipped';
                    await event.save();
                    continue;
                }

                event.status = 'processing';
                await event.save();

                await processWebhookEvent(event, handler, workerLogger);
                processed++;
            } catch (error) {
                failed++;
                workerLogger.error('Retry failed', { eventId: event.eventId, error });
            }
        }

        return { processed, failed };

    } catch (error) {
        workerLogger.error('Webhook retry worker error', error);
        throw error;
    }
};

export default { handleRazorpayWebhook, processFailedWebhooks };
