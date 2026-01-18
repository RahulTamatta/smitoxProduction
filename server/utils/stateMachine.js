/**
 * State Machine Validator
 * Validates and manages state transitions for seller applications
 */

import { STATE_TRANSITIONS, SUBSCRIPTION_CONFIG } from '../config/subscriptionConfig.js';
import { createLogger } from './logger.js';

const { states } = SUBSCRIPTION_CONFIG;

/**
 * State Machine for Subscription Management
 */
class StateMachine {
    constructor(logger = null) {
        this.logger = logger || createLogger(null, { component: 'StateMachine' });
        this.transitions = STATE_TRANSITIONS;
        this.states = states;
    }

    /**
     * Check if a state transition is valid
     * @param {string} currentState - Current state
     * @param {string} targetState - Target state
     * @returns {boolean} Whether transition is valid
     */
    canTransition(currentState, targetState) {
        const allowedTransitions = this.transitions[currentState] || [];
        return allowedTransitions.includes(targetState);
    }

    /**
     * Validate and perform state transition
     * @param {Object} params - Transition parameters
     * @param {string} params.currentState - Current state
     * @param {string} params.targetState - Target state
     * @param {string} params.actor - Who is making the transition
     * @param {string} params.reason - Reason for transition
     * @param {boolean} params.adminOverride - Whether admin is forcing transition
     * @returns {Object} Transition result
     */
    transition({ currentState, targetState, actor, reason, adminOverride = false }) {
        // Check if transition is valid
        const isValid = this.canTransition(currentState, targetState);

        if (!isValid && !adminOverride) {
            this.logger.warn('Invalid state transition attempted', {
                currentState,
                targetState,
                actor,
                reason,
            });

            return {
                success: false,
                error: `Invalid state transition: ${currentState} → ${targetState}`,
                allowedTransitions: this.transitions[currentState] || [],
            };
        }

        if (!isValid && adminOverride) {
            this.logger.warn('Admin override for invalid state transition', {
                currentState,
                targetState,
                actor,
                reason,
            });
        }

        // Log successful transition
        this.logger.info('State transition validated', {
            currentState,
            targetState,
            actor,
            reason,
            adminOverride,
        });

        return {
            success: true,
            previousState: currentState,
            newState: targetState,
            actor,
            reason,
            timestamp: new Date(),
            adminOverride,
        };
    }

    /**
     * Get all valid next states from current state
     * @param {string} currentState - Current state
     * @returns {string[]} Array of valid next states
     */
    getValidNextStates(currentState) {
        return this.transitions[currentState] || [];
    }

    /**
     * Check if state is terminal (no further transitions allowed)
     * @param {string} state - State to check
     * @returns {boolean} Whether state is terminal
     */
    isTerminalState(state) {
        const nextStates = this.transitions[state];
        return !nextStates || nextStates.length === 0;
    }

    /**
     * Check if state requires payment
     * @param {string} state - State to check
     * @returns {boolean} Whether state requires payment
     */
    requiresPayment(state) {
        return [
            states.APPROVED_PENDING_PAYMENT,
            states.APPROVED_PAYMENT_FAILED,
        ].includes(state);
    }

    /**
     * Check if state represents an active subscription
     * @param {string} state - State to check
     * @returns {boolean} Whether state is active
     */
    isActiveState(state) {
        return [
            states.ACTIVE,
            states.APPROVED,
            states.EXPIRING_SOON,
        ].includes(state);
    }

    /**
     * Check if state allows seller operations
     * @param {string} state - State to check
     * @returns {boolean} Whether seller can operate
     */
    canOperate(state) {
        return [
            states.ACTIVE,
            states.APPROVED,
            states.EXPIRING_SOON,
            states.EXPIRED,        // Limited operations during expired
            states.GRACE_PERIOD,   // Limited operations during grace
        ].includes(state);
    }

    /**
     * Get state metadata
     * @param {string} state - State to get metadata for
     * @returns {Object} State metadata
     */
    getStateMetadata(state) {
        const metadata = {
            [states.DRAFT]: {
                displayName: 'Draft',
                description: 'Application in progress',
                userAction: 'Complete and submit application',
                color: 'gray',
            },
            [states.SUBMITTED]: {
                displayName: 'Submitted',
                description: 'Awaiting admin review',
                userAction: 'Wait for admin review',
                color: 'blue',
            },
            [states.UNDER_REVIEW]: {
                displayName: 'Under Review',
                description: 'Admin is reviewing your application',
                userAction: 'Wait for admin decision',
                color: 'blue',
            },
            [states.APPROVED_PENDING_PAYMENT]: {
                displayName: 'Approved - Payment Required',
                description: 'Complete payment to activate',
                userAction: 'Complete payment',
                color: 'yellow',
            },
            [states.APPROVED_PAYMENT_FAILED]: {
                displayName: 'Payment Failed',
                description: 'Payment could not be processed',
                userAction: 'Retry payment',
                color: 'red',
            },
            [states.PAYMENT_RETRY_EXHAUSTED]: {
                displayName: 'Payment Retries Exhausted',
                description: 'Maximum payment attempts reached',
                userAction: 'Contact support',
                color: 'red',
            },
            [states.APPROVED]: {
                displayName: 'Approved',
                description: 'Application approved (free plan)',
                userAction: 'Start selling',
                color: 'green',
            },
            [states.ACTIVE]: {
                displayName: 'Active',
                description: 'Subscription is active',
                userAction: 'Continue selling',
                color: 'green',
            },
            [states.EXPIRING_SOON]: {
                displayName: 'Expiring Soon',
                description: 'Subscription expires soon',
                userAction: 'Renew subscription',
                color: 'orange',
            },
            [states.EXPIRED]: {
                displayName: 'Expired',
                description: 'Subscription has expired',
                userAction: 'Renew to continue',
                color: 'red',
            },
            [states.GRACE_PERIOD]: {
                displayName: 'Grace Period',
                description: 'Renew before downgrade',
                userAction: 'Renew immediately',
                color: 'red',
            },
            [states.SUSPENDED]: {
                displayName: 'Suspended',
                description: 'Account suspended',
                userAction: 'Contact support',
                color: 'gray',
            },
            [states.CANCELLED]: {
                displayName: 'Cancelled',
                description: 'Application cancelled',
                userAction: 'Start new application',
                color: 'gray',
            },
            [states.REJECTED]: {
                displayName: 'Rejected',
                description: 'Application rejected',
                userAction: 'Review feedback and reapply',
                color: 'red',
            },
        };

        return metadata[state] || {
            displayName: state,
            description: 'Unknown state',
            userAction: 'Contact support',
            color: 'gray',
        };
    }

    /**
     * Create a state history entry
     * @param {Object} params - Entry parameters
     * @returns {Object} History entry
     */
    createHistoryEntry({ previousState, newState, actor, reason, metadata = {} }) {
        return {
            previousState,
            newState,
            actor,
            reason,
            timestamp: new Date(),
            metadata,
        };
    }
}

// Export singleton instance
export const stateMachine = new StateMachine();

// Export class for testing
export { StateMachine };

export default stateMachine;
