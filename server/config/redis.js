/**
 * Redis Cache Configuration
 * 
 * Redis client setup for caching search results to achieve <50ms response times.
 */

import dotenv from 'dotenv';
import { createClient } from 'redis';

dotenv.config();

// Redis configuration from environment variables
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const CACHE_TTL = parseInt(process.env.SEARCH_CACHE_TTL) || 300; // 5 minutes default

let client = null;
let isConnected = false;

/**
 * Initialize Redis connection with fast timeout
 */
export const initializeRedis = async () => {
    try {
        client = createClient({
            url: REDIS_URL,
            socket: {
                connectTimeout: 2000, // 2 second connection timeout
                reconnectStrategy: (retries) => {
                    if (retries > 3) {
                        console.error('Redis: Max reconnection attempts reached');
                        return new Error('Redis max retries reached');
                    }
                    return Math.min(retries * 200, 1000); // Faster retry
                }
            }
        });

        client.on('error', (err) => {
            // Silent error logging - don't spam console
            if (isConnected) {
                console.error('Redis Client Error:', err.message);
            }
            isConnected = false;
        });

        client.on('connect', () => {
            console.log('Redis connected');
            isConnected = true;
        });

        client.on('reconnecting', () => {
            console.log('Redis reconnecting...');
        });

        // Set a timeout for connection
        const connectPromise = client.connect();
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Redis connection timeout')), 3000)
        );

        await Promise.race([connectPromise, timeoutPromise]);
        isConnected = true;
        return true;
    } catch (error) {
        console.log('Redis not available (search will work without caching):', error.message);
        isConnected = false;
        // Don't throw - allow app to function without cache
        return false;
    }
};

/**
 * Get cached search results
 * @param {string} query - Search query
 * @param {number} page - Page number
 * @param {number} limit - Results per page
 * @returns {Object|null} Cached results or null
 */
export const getCachedSearch = async (query, page = 1, limit = 20) => {
    if (!isConnected || !client) return null;

    try {
        const key = `search:${query.toLowerCase().trim()}:${page}:${limit}`;
        const cached = await client.get(key);

        if (cached) {
            return JSON.parse(cached);
        }
        return null;
    } catch (error) {
        console.error('Redis get error:', error.message);
        return null;
    }
};

/**
 * Cache search results
 * @param {string} query - Search query
 * @param {number} page - Page number
 * @param {number} limit - Results per page
 * @param {Object} results - Search results to cache
 */
export const setCachedSearch = async (query, page, limit, results) => {
    if (!isConnected || !client) return;

    try {
        const key = `search:${query.toLowerCase().trim()}:${page}:${limit}`;
        await client.setEx(key, CACHE_TTL, JSON.stringify(results));
    } catch (error) {
        console.error('Redis set error:', error.message);
    }
};

/**
 * Invalidate cache for a specific product (on update/delete)
 * Clears all search cache since any product could be affected
 */
export const invalidateSearchCache = async () => {
    if (!isConnected || !client) return;

    try {
        // Get all search keys and delete them
        const keys = await client.keys('search:*');
        if (keys.length > 0) {
            await client.del(keys);
            console.log(`Invalidated ${keys.length} search cache entries`);
        }
    } catch (error) {
        console.error('Redis cache invalidation error:', error.message);
    }
};

/**
 * Check Redis connection status
 */
export const getRedisStatus = () => {
    return {
        connected: isConnected,
        url: REDIS_URL.replace(/\/\/.*@/, '//*****@') // Hide credentials
    };
};

export { CACHE_TTL, client as redisClient };
export default {
    initializeRedis,
    getCachedSearch,
    setCachedSearch,
    invalidateSearchCache,
    getRedisStatus
};
