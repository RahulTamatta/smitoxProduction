export const SUBSCRIPTION_STATES = {
    // Application states (SellerApplication)
    DRAFT: 'draft',
    SUBMITTED: 'submitted',
    UNDER_REVIEW: 'under_review',
    APPROVED_PENDING_PAYMENT: 'approved_pending_payment',
    APPROVED_PAYMENT_FAILED: 'approved_payment_failed',
    REJECTED: 'rejected',

    // Active subscription states (SellerProfile - Source of Truth)
    ACTIVE: 'active',
    EXPIRING_SOON: 'expiring_soon',
    EXPIRED: 'expired',
    GRACE_PERIOD: 'grace_period',
    SUSPENDED: 'suspended'
};

export const APPLICATION_STATES = [
    SUBSCRIPTION_STATES.DRAFT,
    SUBSCRIPTION_STATES.SUBMITTED,
    SUBSCRIPTION_STATES.UNDER_REVIEW,
    SUBSCRIPTION_STATES.APPROVED_PENDING_PAYMENT,
    SUBSCRIPTION_STATES.APPROVED_PAYMENT_FAILED,
    SUBSCRIPTION_STATES.REJECTED
];

export const PROFILE_STATES = [
    SUBSCRIPTION_STATES.ACTIVE,
    SUBSCRIPTION_STATES.EXPIRING_SOON,
    SUBSCRIPTION_STATES.EXPIRED,
    SUBSCRIPTION_STATES.GRACE_PERIOD,
    SUBSCRIPTION_STATES.SUSPENDED
];

// Helper functions
export const isApplicationState = (state) => APPLICATION_STATES.includes(state);
export const isProfileState = (state) => PROFILE_STATES.includes(state);
export const isActiveState = (state) => [
    SUBSCRIPTION_STATES.ACTIVE,
    SUBSCRIPTION_STATES.EXPIRING_SOON
].includes(state);
