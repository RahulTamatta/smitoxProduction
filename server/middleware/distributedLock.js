/**
 * Distributed Lock Middleware
 * Prevents race conditions in concurrent operations using MongoDB
 */

import mongoose from 'mongoose';
import { SUBSCRIPTION_CONFIG } from '../config/subscriptionConfig.js';
import { createLogger } from '../utils/logger.js';

const { lock: lockConfig } = SUBSCRIPTION_CONFIG;

// Lock Schema for MongoDB-based locking
const lockSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    owner: {
        type: String,
        required: true,
    },
    acquiredAt: {
        type: Date,
        default: Date.now,
    },
    expiresAt: {
        type: Date,
        required: true,
        index: true,
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
});

// TTL index to auto-cleanup expired locks
lockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Lock = mongoose.model('DistributedLock', lockSchema);

/**
 * Distributed Lock Manager
 */
class DistributedLockManager {
    constructor() {
        this.logger = createLogger(null, { component: 'DistributedLock' });
    }

    /**
     * Generate a unique owner ID for this process/request
     * @param {string} correlationId - Request correlation ID
     * @returns {string} Unique owner identifier
     */
    generateOwnerId(correlationId) {
        return `${process.pid}_${correlationId || Date.now()}_${Math.random().toString(36).slice(2)}`;
    }

    /**
     * Acquire a distributed lock
     * @param {string} resourceId - Resource to lock (e.g., application ID)
     * @param {Object} options - Lock options
     * @param {number} options.ttl - Lock TTL in milliseconds
     * @param {number} options.maxRetries - Max retry attempts
     * @param {number} options.retryDelay - Delay between retries in ms
     * @param {string} options.correlationId - Request correlation ID
     * @param {Object} options.metadata - Additional metadata
     * @returns {Object} Lock result { success, lockId, owner }
     */
    async acquire(resourceId, options = {}) {
        const {
            ttl = lockConfig.defaultTTL,
            maxRetries = lockConfig.maxRetries,
            retryDelay = lockConfig.retryDelay,
            correlationId = null,
            metadata = {},
        } = options;

        const key = `${lockConfig.keyPrefix}${resourceId}`;
        const owner = this.generateOwnerId(correlationId);
        const expiresAt = new Date(Date.now() + ttl);

        let attempt = 0;

        while (attempt < maxRetries) {
            attempt++;

            try {
                // Try to create the lock
                const lock = await Lock.create({
                    key,
                    owner,
                    expiresAt,
                    metadata: {
                        ...metadata,
                        correlationId,
                        attempt,
                    },
                });

                this.logger.debug('Lock acquired', {
                    key,
                    owner,
                    attempt,
                    ttl,
                });

                return {
                    success: true,
                    lockId: lock._id.toString(),
                    owner,
                    key,
                    expiresAt,
                };
            } catch (error) {
                // Duplicate key error means lock exists
                if (error.code === 11000) {
                    // Check if existing lock has expired
                    const existingLock = await Lock.findOne({ key });

                    if (existingLock && existingLock.expiresAt < new Date()) {
                        // Lock expired, try to take it over
                        const taken = await Lock.findOneAndUpdate(
                            { key, expiresAt: { $lt: new Date() } },
                            { owner, expiresAt, metadata: { ...metadata, correlationId, attempt } },
                            { new: true }
                        );

                        if (taken) {
                            this.logger.debug('Expired lock taken over', {
                                key,
                                owner,
                                previousOwner: existingLock.owner,
                            });

                            return {
                                success: true,
                                lockId: taken._id.toString(),
                                owner,
                                key,
                                expiresAt,
                            };
                        }
                    }

                    // Lock is held by someone else, wait and retry
                    if (attempt < maxRetries) {
                        this.logger.debug('Lock busy, retrying', {
                            key,
                            attempt,
                            maxRetries,
                            currentOwner: existingLock?.owner,
                        });

                        await this.sleep(retryDelay);
                        continue;
                    }
                } else {
                    // Unexpected error
                    this.logger.error('Lock acquisition error', error);
                    throw error;
                }
            }
        }

        // Failed to acquire lock after all retries
        this.logger.warn('Lock acquisition failed', {
            key,
            attempts: attempt,
            maxRetries,
        });

        return {
            success: false,
            error: 'Failed to acquire lock after maximum retries',
            key,
            attempts: attempt,
        };
    }

    /**
     * Release a distributed lock
     * @param {string} resourceId - Resource to unlock
     * @param {string} owner - Lock owner (must match)
     * @returns {Object} Release result
     */
    async release(resourceId, owner) {
        const key = `${lockConfig.keyPrefix}${resourceId}`;

        try {
            const result = await Lock.findOneAndDelete({ key, owner });

            if (result) {
                this.logger.debug('Lock released', { key, owner });
                return { success: true, key };
            } else {
                // Lock doesn't exist or owner doesn't match
                this.logger.warn('Lock release failed - not owner or not found', {
                    key,
                    owner,
                });
                return {
                    success: false,
                    error: 'Lock not found or not owned by requester',
                    key,
                };
            }
        } catch (error) {
            this.logger.error('Lock release error', error);
            throw error;
        }
    }

    /**
     * Extend a lock's TTL
     * @param {string} resourceId - Resource ID
     * @param {string} owner - Lock owner
     * @param {number} additionalTTL - Additional TTL in milliseconds
     * @returns {Object} Extension result
     */
    async extend(resourceId, owner, additionalTTL = lockConfig.defaultTTL) {
        const key = `${lockConfig.keyPrefix}${resourceId}`;
        const newExpiresAt = new Date(Date.now() + additionalTTL);

        try {
            const result = await Lock.findOneAndUpdate(
                { key, owner },
                { expiresAt: newExpiresAt },
                { new: true }
            );

            if (result) {
                this.logger.debug('Lock extended', { key, owner, newExpiresAt });
                return { success: true, key, expiresAt: newExpiresAt };
            } else {
                this.logger.warn('Lock extension failed - not owner', { key, owner });
                return {
                    success: false,
                    error: 'Lock not found or not owned by requester',
                    key,
                };
            }
        } catch (error) {
            this.logger.error('Lock extension error', error);
            throw error;
        }
    }

    /**
     * Check if a resource is locked
     * @param {string} resourceId - Resource ID
     * @returns {Object} Lock status
     */
    async isLocked(resourceId) {
        const key = `${lockConfig.keyPrefix}${resourceId}`;

        try {
            const lock = await Lock.findOne({ key, expiresAt: { $gt: new Date() } });

            return {
                locked: !!lock,
                owner: lock?.owner,
                expiresAt: lock?.expiresAt,
            };
        } catch (error) {
            this.logger.error('Lock check error', error);
            throw error;
        }
    }

    /**
     * Execute a function with a lock
     * @param {string} resourceId - Resource to lock
     * @param {Function} fn - Async function to execute
     * @param {Object} options - Lock options
     * @returns {*} Function result
     */
    async withLock(resourceId, fn, options = {}) {
        const lockResult = await this.acquire(resourceId, options);

        if (!lockResult.success) {
            throw new Error(`Failed to acquire lock: ${lockResult.error}`);
        }

        try {
            // Execute the function
            const result = await fn();
            return result;
        } finally {
            // Always release the lock
            await this.release(resourceId, lockResult.owner);
        }
    }

    /**
     * Helper to sleep for a duration
     * @param {number} ms - Milliseconds to sleep
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Cleanup expired locks (manual cleanup, TTL index should handle this)
     * @returns {number} Number of locks cleaned
     */
    async cleanup() {
        try {
            const result = await Lock.deleteMany({ expiresAt: { $lt: new Date() } });
            this.logger.info('Expired locks cleaned', { count: result.deletedCount });
            return result.deletedCount;
        } catch (error) {
            this.logger.error('Lock cleanup error', error);
            throw error;
        }
    }
}

// Export singleton
export const lockManager = new DistributedLockManager();

/**
 * Express middleware for locking a resource during request
 * @param {Function} getResourceId - Function to extract resource ID from request
 * @param {Object} options - Lock options
 * @returns {Function} Express middleware
 */
export const lockMiddleware = (getResourceId, options = {}) => {
    return async (req, res, next) => {
        const resourceId = getResourceId(req);

        if (!resourceId) {
            return next();
        }

        const lockResult = await lockManager.acquire(resourceId, {
            ...options,
            correlationId: req.logger?.correlationId,
        });

        if (!lockResult.success) {
            return res.status(423).json({
                success: false,
                message: 'Resource is currently locked by another operation',
                error: 'RESOURCE_LOCKED',
                retryAfter: 5,
            });
        }

        // Store lock info in request for cleanup
        req.distributedLock = lockResult;

        // Release lock on response finish
        res.on('finish', async () => {
            await lockManager.release(resourceId, lockResult.owner);
        });

        next();
    };
};

export default lockManager;
