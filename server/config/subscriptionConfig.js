/**
 * Subscription System Configuration
 * Central configuration for all subscription-related settings
 */

export const SUBSCRIPTION_CONFIG = {
    // Payment Gateway
    razorpay: {
        keyId: process.env.RAZORPAY_KEY_ID,
        keySecret: process.env.RAZORPAY_KEY_SECRET,
        webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
        currency: 'INR',
        // Circuit breaker settings
        circuitBreaker: {
            failureThreshold: 5,        // Open circuit after 5 failures
            resetTimeout: 30000,        // Try again after 30 seconds
            monitorInterval: 10000,     // Check circuit state every 10s
        },
        // Retry settings
        retry: {
            maxAttempts: 3,
            baseDelay: 1000,            // 1 second
            maxDelay: 10000,            // 10 seconds max
            backoffMultiplier: 2,
        },
        // Timeout for API calls
        timeout: 30000,               // 30 seconds
    },

    // State Machine
    states: {
        DRAFT: 'draft',
        SUBMITTED: 'submitted',
        UNDER_REVIEW: 'under_review',
        APPROVED_PENDING_PAYMENT: 'approved_pending_payment',
        APPROVED_PAYMENT_FAILED: 'approved_payment_failed',
        PAYMENT_RETRY_EXHAUSTED: 'payment_retry_exhausted',
        APPROVED: 'approved',
        ACTIVE: 'active',
        EXPIRING_SOON: 'expiring_soon',
        EXPIRED: 'expired',
        GRACE_PERIOD: 'grace_period',
        SUSPENDED: 'suspended',
        CANCELLED: 'cancelled',
        REJECTED: 'rejected',
    },

    // Plan Status (lifecycle within active subscription)
    planStatus: {
        ACTIVE: 'active',
        EXPIRING_SOON: 'expiring_soon',
        EXPIRED: 'expired',
        GRACE_PERIOD: 'grace_period',
    },

    // Payment status
    paymentStatus: {
        PENDING: 'pending',
        PROCESSING: 'processing',
        PAID: 'paid',
        FAILED: 'failed',
        REFUNDED: 'refunded',
        DISPUTED: 'disputed',
    },

    // Timing Configuration
    timing: {
        gracePeriodDays: 30,          // Days after expiry before downgrade
        expiryWarningDays: 7,         // Days before expiry to warn user
        paymentRetryMaxAttempts: 3,   // Max payment retry attempts
        paymentRetryWindow: 72,       // Hours to retry payment
        lockTimeout: 30000,           // 30 seconds lock timeout
        webhookProcessingTimeout: 60000, // 60 seconds for webhook processing
    },

    // Billing Cycles (in days)
    billingCycles: {
        monthly: 30,
        quarterly: 90,
        yearly: 365,
    },

    // Distributed Lock
    lock: {
        keyPrefix: 'subscription_lock:',
        defaultTTL: 30000,            // 30 seconds
        retryDelay: 100,              // 100ms between lock attempts
        maxRetries: 50,               // Max 50 retries (5 seconds total)
    },

    // Webhook Processing
    webhook: {
        deduplicationTTL: 86400,      // 24 hours in seconds
        maxRetries: 5,
        retryDelays: [60, 300, 900, 3600, 7200], // 1m, 5m, 15m, 1h, 2h
    },

    // Audit Logging
    audit: {
        enabled: true,
        retentionDays: 365,           // Keep audit logs for 1 year
    },
};

// Valid state transitions
export const STATE_TRANSITIONS = {
    [SUBSCRIPTION_CONFIG.states.DRAFT]: [
        SUBSCRIPTION_CONFIG.states.SUBMITTED,
    ],
    [SUBSCRIPTION_CONFIG.states.SUBMITTED]: [
        SUBSCRIPTION_CONFIG.states.UNDER_REVIEW,
        SUBSCRIPTION_CONFIG.states.REJECTED,
    ],
    [SUBSCRIPTION_CONFIG.states.UNDER_REVIEW]: [
        SUBSCRIPTION_CONFIG.states.APPROVED_PENDING_PAYMENT,
        SUBSCRIPTION_CONFIG.states.APPROVED,  // For free plans
        SUBSCRIPTION_CONFIG.states.REJECTED,
    ],
    [SUBSCRIPTION_CONFIG.states.APPROVED_PENDING_PAYMENT]: [
        SUBSCRIPTION_CONFIG.states.ACTIVE,
        SUBSCRIPTION_CONFIG.states.APPROVED_PAYMENT_FAILED,
        SUBSCRIPTION_CONFIG.states.CANCELLED,
    ],
    [SUBSCRIPTION_CONFIG.states.APPROVED_PAYMENT_FAILED]: [
        SUBSCRIPTION_CONFIG.states.APPROVED_PENDING_PAYMENT,  // Retry
        SUBSCRIPTION_CONFIG.states.PAYMENT_RETRY_EXHAUSTED,
        SUBSCRIPTION_CONFIG.states.CANCELLED,
    ],
    [SUBSCRIPTION_CONFIG.states.PAYMENT_RETRY_EXHAUSTED]: [
        SUBSCRIPTION_CONFIG.states.APPROVED_PENDING_PAYMENT,  // Admin override
        SUBSCRIPTION_CONFIG.states.CANCELLED,
    ],
    [SUBSCRIPTION_CONFIG.states.APPROVED]: [
        SUBSCRIPTION_CONFIG.states.ACTIVE,
    ],
    [SUBSCRIPTION_CONFIG.states.ACTIVE]: [
        SUBSCRIPTION_CONFIG.states.EXPIRING_SOON,
        SUBSCRIPTION_CONFIG.states.SUSPENDED,
        SUBSCRIPTION_CONFIG.states.CANCELLED,
    ],
    [SUBSCRIPTION_CONFIG.states.EXPIRING_SOON]: [
        SUBSCRIPTION_CONFIG.states.ACTIVE,    // Renewed
        SUBSCRIPTION_CONFIG.states.EXPIRED,
        SUBSCRIPTION_CONFIG.states.SUSPENDED,
    ],
    [SUBSCRIPTION_CONFIG.states.EXPIRED]: [
        SUBSCRIPTION_CONFIG.states.GRACE_PERIOD,
        SUBSCRIPTION_CONFIG.states.ACTIVE,    // Immediate renewal
    ],
    [SUBSCRIPTION_CONFIG.states.GRACE_PERIOD]: [
        SUBSCRIPTION_CONFIG.states.ACTIVE,    // Renewed during grace
        SUBSCRIPTION_CONFIG.states.SUSPENDED, // Auto-downgrade/suspend
    ],
    [SUBSCRIPTION_CONFIG.states.SUSPENDED]: [
        SUBSCRIPTION_CONFIG.states.ACTIVE,    // Reactivation
    ],
    [SUBSCRIPTION_CONFIG.states.CANCELLED]: [],  // Terminal state
    [SUBSCRIPTION_CONFIG.states.REJECTED]: [
        SUBSCRIPTION_CONFIG.states.DRAFT,     // Allow reapplication
    ],
};

export default SUBSCRIPTION_CONFIG;
