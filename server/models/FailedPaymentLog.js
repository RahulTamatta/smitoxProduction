import mongoose from "mongoose";

/**
 * Model to track failed payment-to-order conversions for reconciliation
 * Replaces the in-memory failedPaymentLog array
 */
const failedPaymentLogSchema = new mongoose.Schema({
    // Timestamp when the failure occurred
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    },

    // Razorpay identifiers
    order_id: {
        type: String,
        required: true,
        index: true
    },
    payment_id: {
        type: String,
        required: true,
        index: true,
        unique: true  // Prevent duplicate logging of same payment
    },

    // Payment details
    amount: {
        type: Number,
        required: true
    },
    contact: String,
    email: String,
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        index: true
    },

    // Error information
    error: {
        type: String,
        required: true
    },
    errorMessage: String,
    errorStack: String,

    // Product data (for reconciliation)
    products: mongoose.Schema.Types.Mixed,

    // Reconciliation tracking
    resolved: {
        type: Boolean,
        default: false,
        index: true
    },
    resolvedAt: Date,
    resolvedBy: String,
    resolvedNote: String,

    // Additional metadata
    attemptCount: {
        type: Number,
        default: 1
    },
    lastAttemptAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for querying unresolved failures
failedPaymentLogSchema.index({ resolved: 1, timestamp: -1 });

// Index for querying by user
failedPaymentLogSchema.index({ userId: 1, resolved: 1 });

export default mongoose.model("FailedPaymentLog", failedPaymentLogSchema);
