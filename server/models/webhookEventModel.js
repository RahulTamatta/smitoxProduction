/**
 * Webhook Event Model
 * Tracks processed webhooks for idempotency and retry logic
 */

import mongoose from 'mongoose';

const webhookEventSchema = new mongoose.Schema({
    // Unique identifier from payment provider
    eventId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },

    // Payment provider (razorpay, stripe, etc.)
    provider: {
        type: String,
        required: true,
        enum: ['razorpay', 'stripe'],
        default: 'razorpay',
    },

    // Event type (payment.captured, order.paid, etc.)
    eventType: {
        type: String,
        required: true,
        index: true,
    },

    // Processing status
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'skipped'],
        default: 'pending',
        index: true,
    },

    // Raw payload (for debugging and reprocessing)
    payload: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
    },

    // Extracted key data
    paymentId: {
        type: String,
        index: true,
    },
    orderId: {
        type: String,
        index: true,
    },
    amount: Number,

    // Related entities
    applicationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SellerApplication',
        index: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true,
    },

    // Processing metadata
    processingAttempts: {
        type: Number,
        default: 0,
    },
    lastAttemptAt: Date,
    nextRetryAt: {
        type: Date,
        index: true,
    },

    // Error tracking
    lastError: {
        message: String,
        stack: String,
        code: String,
    },

    // Completion tracking
    completedAt: Date,
    processingDurationMs: Number,

    // Signature verification
    signatureValid: {
        type: Boolean,
        default: null,
    },

    // Correlation ID for tracing
    correlationId: String,

    // Additional metadata
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
}, {
    timestamps: true,
});

// Indexes for query performance
webhookEventSchema.index({ status: 1, nextRetryAt: 1 }); // For retry worker
webhookEventSchema.index({ createdAt: -1 }); // For listing
webhookEventSchema.index({ paymentId: 1, eventType: 1 }); // For lookups

// TTL index for cleanup (keep for 90 days)
webhookEventSchema.index(
    { createdAt: 1 },
    { expireAfterSeconds: 90 * 24 * 60 * 60 }
);

/**
 * Check if event has already been processed
 */
webhookEventSchema.statics.isProcessed = async function (eventId) {
    const event = await this.findOne({
        eventId,
        status: { $in: ['completed', 'skipped'] },
    });
    return !!event;
};

/**
 * Get events pending retry
 */
webhookEventSchema.statics.getPendingRetries = async function (limit = 100) {
    return this.find({
        status: 'failed',
        nextRetryAt: { $lte: new Date() },
        processingAttempts: { $lt: 5 },
    })
        .sort({ nextRetryAt: 1 })
        .limit(limit);
};

/**
 * Record processing attempt
 */
webhookEventSchema.methods.recordAttempt = async function (success, error = null) {
    this.processingAttempts += 1;
    this.lastAttemptAt = new Date();

    if (success) {
        this.status = 'completed';
        this.completedAt = new Date();
        this.processingDurationMs = Date.now() - this.createdAt.getTime();
    } else {
        this.status = 'failed';
        this.lastError = error ? {
            message: error.message,
            stack: error.stack,
            code: error.code,
        } : null;

        // Calculate next retry time with exponential backoff
        const delays = [60, 300, 900, 3600, 7200]; // 1m, 5m, 15m, 1h, 2h
        const delayIndex = Math.min(this.processingAttempts - 1, delays.length - 1);
        const delaySeconds = delays[delayIndex];
        this.nextRetryAt = new Date(Date.now() + delaySeconds * 1000);
    }

    return this.save();
};

export default mongoose.model('WebhookEvent', webhookEventSchema);
