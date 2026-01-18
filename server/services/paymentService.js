/**
 * Payment Service with Circuit Breaker
 * Robust Razorpay integration with retry logic and circuit breaker pattern
 */

import crypto from 'crypto';
import Razorpay from 'razorpay';
import { SUBSCRIPTION_CONFIG } from '../config/subscriptionConfig.js';
import { createLogger } from '../utils/logger.js';

const { razorpay: razorpayConfig } = SUBSCRIPTION_CONFIG;
const logger = createLogger(null, { component: 'PaymentService' });

/**
 * Circuit Breaker States
 */
const CircuitState = {
    CLOSED: 'CLOSED',     // Normal operation
    OPEN: 'OPEN',         // Failing, reject calls
    HALF_OPEN: 'HALF_OPEN', // Testing if recovered
};

/**
 * Circuit Breaker Implementation
 */
class CircuitBreaker {
    constructor(options = {}) {
        this.failureThreshold = options.failureThreshold || 5;
        this.resetTimeout = options.resetTimeout || 30000;
        this.state = CircuitState.CLOSED;
        this.failures = 0;
        this.lastFailureTime = null;
        this.successesInHalfOpen = 0;
        this.requiredSuccessesInHalfOpen = 2;
    }

    /**
     * Check if circuit allows requests
     */
    canRequest() {
        if (this.state === CircuitState.CLOSED) {
            return true;
        }

        if (this.state === CircuitState.OPEN) {
            // Check if reset timeout has passed
            if (Date.now() - this.lastFailureTime >= this.resetTimeout) {
                this.state = CircuitState.HALF_OPEN;
                this.successesInHalfOpen = 0;
                logger.info('Circuit breaker transitioning to HALF_OPEN');
                return true;
            }
            return false;
        }

        // HALF_OPEN - allow limited requests
        return true;
    }

    /**
     * Record a successful call
     */
    recordSuccess() {
        if (this.state === CircuitState.HALF_OPEN) {
            this.successesInHalfOpen++;
            if (this.successesInHalfOpen >= this.requiredSuccessesInHalfOpen) {
                this.state = CircuitState.CLOSED;
                this.failures = 0;
                logger.info('Circuit breaker transitioning to CLOSED');
            }
        } else {
            this.failures = 0;
        }
    }

    /**
     * Record a failed call
     */
    recordFailure() {
        this.failures++;
        this.lastFailureTime = Date.now();

        if (this.state === CircuitState.HALF_OPEN) {
            this.state = CircuitState.OPEN;
            logger.warn('Circuit breaker transitioning to OPEN (failure in half-open)');
        } else if (this.failures >= this.failureThreshold) {
            this.state = CircuitState.OPEN;
            logger.warn('Circuit breaker transitioning to OPEN', {
                failures: this.failures,
                threshold: this.failureThreshold,
            });
        }
    }

    /**
     * Get current state
     */
    getState() {
        return {
            state: this.state,
            failures: this.failures,
            lastFailureTime: this.lastFailureTime,
        };
    }
}

/**
 * Payment Service Class
 */
class PaymentService {
    constructor() {
        this.razorpay = null;
        this.circuitBreaker = new CircuitBreaker(razorpayConfig.circuitBreaker);
        this.initializeClient();
    }

    /**
     * Initialize Razorpay client
     */
    initializeClient() {
        if (!razorpayConfig.keyId || !razorpayConfig.keySecret) {
            logger.warn('Razorpay credentials not configured');
            return;
        }

        try {
            this.razorpay = new Razorpay({
                key_id: razorpayConfig.keyId,
                key_secret: razorpayConfig.keySecret,
            });
            logger.info('Razorpay client initialized');
        } catch (error) {
            logger.error('Failed to initialize Razorpay client', error);
        }
    }

    /**
     * Check if payment service is available
     */
    isAvailable() {
        return !!this.razorpay && this.circuitBreaker.canRequest();
    }

    /**
     * Execute with retry and circuit breaker
     * @param {Function} operation - Async operation to execute
     * @param {string} operationName - Name for logging
     * @returns {*} Operation result
     */
    async executeWithRetry(operation, operationName) {
        if (!this.circuitBreaker.canRequest()) {
            const state = this.circuitBreaker.getState();
            throw new Error(`Payment service circuit breaker is OPEN. Last failure: ${state.lastFailureTime}`);
        }

        const { maxAttempts, baseDelay, maxDelay, backoffMultiplier } = razorpayConfig.retry;
        let lastError;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                const result = await Promise.race([
                    operation(),
                    this.timeout(razorpayConfig.timeout),
                ]);

                this.circuitBreaker.recordSuccess();
                logger.debug(`${operationName} succeeded`, { attempt });
                return result;
            } catch (error) {
                lastError = error;
                logger.warn(`${operationName} attempt ${attempt} failed`, {
                    error: error.message,
                    attempt,
                    maxAttempts,
                });

                // Don't retry on certain errors
                if (this.isNonRetryableError(error)) {
                    this.circuitBreaker.recordFailure();
                    throw error;
                }

                if (attempt < maxAttempts) {
                    const delay = Math.min(baseDelay * Math.pow(backoffMultiplier, attempt - 1), maxDelay);
                    logger.debug(`Retrying ${operationName} in ${delay}ms`);
                    await this.sleep(delay);
                }
            }
        }

        this.circuitBreaker.recordFailure();
        throw lastError;
    }

    /**
     * Check if error should not be retried
     */
    isNonRetryableError(error) {
        // Don't retry validation errors or auth errors
        const nonRetryableCodes = ['BAD_REQUEST_ERROR', 'UNAUTHORIZED', 'FORBIDDEN'];
        return nonRetryableCodes.includes(error.code);
    }

    /**
     * Create a timeout promise
     */
    timeout(ms) {
        return new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), ms);
        });
    }

    /**
     * Sleep helper
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Create a Razorpay order
     * @param {Object} params - Order parameters
     * @returns {Object} Razorpay order
     */
    async createOrder({ amount, currency = 'INR', receipt, notes = {} }) {
        if (!this.razorpay) {
            throw new Error('Payment service not initialized');
        }

        const orderOptions = {
            amount: Math.round(amount * 100), // Convert to paise
            currency,
            receipt: receipt.slice(0, 40), // Razorpay limit
            notes,
        };

        logger.info('Creating Razorpay order', { amount, currency, receipt });

        return this.executeWithRetry(
            () => this.razorpay.orders.create(orderOptions),
            'createOrder'
        );
    }

    /**
     * Fetch order details
     * @param {string} orderId - Razorpay order ID
     * @returns {Object} Order details
     */
    async fetchOrder(orderId) {
        if (!this.razorpay) {
            throw new Error('Payment service not initialized');
        }

        return this.executeWithRetry(
            () => this.razorpay.orders.fetch(orderId),
            'fetchOrder'
        );
    }

    /**
     * Fetch payment details
     * @param {string} paymentId - Razorpay payment ID
     * @returns {Object} Payment details
     */
    async fetchPayment(paymentId) {
        if (!this.razorpay) {
            throw new Error('Payment service not initialized');
        }

        return this.executeWithRetry(
            () => this.razorpay.payments.fetch(paymentId),
            'fetchPayment'
        );
    }

    /**
     * Verify payment signature
     * @param {Object} params - Verification parameters
     * @returns {boolean} Whether signature is valid
     */
    verifyPaymentSignature({ orderId, paymentId, signature }) {
        const body = `${orderId}|${paymentId}`;
        const expectedSignature = crypto
            .createHmac('sha256', razorpayConfig.keySecret)
            .update(body)
            .digest('hex');

        const isValid = expectedSignature === signature;

        logger.info('Payment signature verification', {
            orderId,
            paymentId,
            isValid,
        });

        return isValid;
    }

    /**
     * Verify webhook signature
     * @param {string} body - Raw webhook body
     * @param {string} signature - Webhook signature from header
     * @returns {boolean} Whether signature is valid
     */
    verifyWebhookSignature(body, signature) {
        if (!razorpayConfig.webhookSecret) {
            logger.warn('Webhook secret not configured');
            return false;
        }

        const expectedSignature = crypto
            .createHmac('sha256', razorpayConfig.webhookSecret)
            .update(body)
            .digest('hex');

        const isValid = expectedSignature === signature;

        if (!isValid) {
            logger.error('Invalid webhook signature', {
                received: signature?.slice(0, 20) + '...',
            });
        }

        return isValid;
    }

    /**
     * Initiate refund
     * @param {Object} params - Refund parameters
     * @returns {Object} Refund result
     */
    async initiateRefund({ paymentId, amount, notes = {} }) {
        if (!this.razorpay) {
            throw new Error('Payment service not initialized');
        }

        const refundOptions = {
            amount: amount ? Math.round(amount * 100) : undefined, // Full refund if not specified
            notes,
        };

        logger.info('Initiating refund', { paymentId, amount });

        return this.executeWithRetry(
            () => this.razorpay.payments.refund(paymentId, refundOptions),
            'initiateRefund'
        );
    }

    /**
     * Get circuit breaker status
     */
    getCircuitBreakerStatus() {
        return this.circuitBreaker.getState();
    }

    /**
     * Generate idempotency key for operations
     * @param {string} prefix - Key prefix
     * @param {...string} parts - Key parts
     * @returns {string} Idempotency key
     */
    generateIdempotencyKey(prefix, ...parts) {
        const data = parts.join('|');
        const hash = crypto.createHash('sha256').update(data).digest('hex').slice(0, 16);
        return `${prefix}_${hash}`;
    }
}

// Export singleton
export const paymentService = new PaymentService();

export default paymentService;
