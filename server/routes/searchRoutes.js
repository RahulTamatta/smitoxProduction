/**
 * Search Routes
 * 
 * REST API endpoints for product search.
 * GET /api/search?q=<query>&page=1&limit=20
 * 
 * Features:
 * - Elasticsearch-powered search when available
 * - Automatic MongoDB fallback for graceful degradation
 */

import express from 'express';
import { getConnectionStatus, isAvailable } from '../config/elasticsearch.js';
import { getRedisStatus } from '../config/redis.js';
import { requireSignIn } from '../middlewares/authMiddleware.js';
import { requireCapability } from '../middlewares/rbacMiddleware.js';
import productModel from '../models/productModel.js';
import { adminSearchProducts, getAutocompleteSuggestions, searchProducts } from '../services/searchService.js';
import { fullReindex, getIndexStats } from '../services/syncService.js';

const router = express.Router();

/**
 * MongoDB fallback search (fast, simple regex)
 */
const mongoFallbackSearch = async (query, page = 1, limit = 20, includeInactive = false) => {
    const startTime = Date.now();
    const skip = (page - 1) * limit;

    // Simple regex search on name (fast with text index)
    const searchQuery = {
        name: { $regex: query, $options: 'i' },
        stock: { $gt: 0 }
    };

    if (!includeInactive) {
        searchQuery.isActive = '1';
    }

    const [products, total] = await Promise.all([
        productModel
            .find(searchQuery)
            .select('name slug photos perPiecePrice mrp stock category subcategory brand')
            .populate('category', 'name')
            .populate('subcategory', 'name')
            .populate('brand', 'name')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })
            .lean(),
        productModel.countDocuments(searchQuery)
    ]);

    const results = products.map(p => ({
        _id: p._id,
        name: p.name,
        slug: p.slug,
        photos: p.photos,
        perPiecePrice: p.perPiecePrice,
        mrp: p.mrp,
        stock: p.stock,
        categoryName: p.category?.name,
        subcategoryName: p.subcategory?.name,
        brandName: p.brand?.name
    }));

    return {
        success: true,
        results,
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
        query,
        responseTime: `${Date.now() - startTime}ms`,
        fallback: true
    };
};

/**
 * MongoDB fallback for autocomplete
 */
const mongoFallbackAutocomplete = async (prefix, limit = 10) => {
    const startTime = Date.now();

    const products = await productModel
        .find({
            name: { $regex: `^${prefix}`, $options: 'i' },
            isActive: '1',
            stock: { $gt: 0 }
        })
        .select('name slug photos perPiecePrice')
        .limit(limit)
        .lean();

    return {
        success: true,
        suggestions: products.map(p => ({
            _id: p._id,
            name: p.name,
            slug: p.slug,
            photos: p.photos,
            perPiecePrice: p.perPiecePrice
        })),
        responseTime: `${Date.now() - startTime}ms`,
        fallback: true
    };
};

/**
 * GET /api/search
 * Public search endpoint with autocomplete and fuzzy matching
 */
router.get('/', async (req, res) => {
    try {
        const { q, page = 1, limit = 20 } = req.query;

        if (!q || q.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }

        const sanitizedQuery = q.trim().substring(0, 100);
        const sanitizedPage = Math.max(1, parseInt(page) || 1);
        const sanitizedLimit = Math.min(100, Math.max(1, parseInt(limit) || 20));

        // Try Elasticsearch first, fallback to MongoDB
        if (isAvailable()) {
            try {
                const results = await searchProducts(sanitizedQuery, {
                    page: sanitizedPage,
                    limit: sanitizedLimit
                });
                return res.json(results);
            } catch (esError) {
                console.error('ES search failed, falling back to MongoDB:', esError.message);
            }
        }

        // MongoDB fallback
        const results = await mongoFallbackSearch(sanitizedQuery, sanitizedPage, sanitizedLimit);
        res.json(results);
    } catch (error) {
        console.error('Search API error:', error.message);
        res.status(200).json({
            success: true,
            results: [],
            total: 0,
            page: 1,
            pages: 0,
            query: req.query.q || '',
            error: 'Search temporarily unavailable'
        });
    }
});

/**
 * GET /api/search/autocomplete
 * Fast autocomplete suggestions endpoint
 */
router.get('/autocomplete', async (req, res) => {
    try {
        const { q, limit = 10 } = req.query;

        if (!q || q.trim().length === 0) {
            return res.json({ success: true, suggestions: [] });
        }

        const sanitizedQuery = q.trim().substring(0, 50);
        const sanitizedLimit = Math.min(20, Math.max(1, parseInt(limit) || 10));

        // Try Elasticsearch first, fallback to MongoDB
        if (isAvailable()) {
            try {
                const results = await getAutocompleteSuggestions(sanitizedQuery, sanitizedLimit);
                return res.json(results);
            } catch (esError) {
                console.error('ES autocomplete failed, falling back to MongoDB:', esError.message);
            }
        }

        // MongoDB fallback
        const results = await mongoFallbackAutocomplete(sanitizedQuery, sanitizedLimit);
        res.json(results);
    } catch (error) {
        console.error('Autocomplete API error:', error.message);
        res.json({ success: true, suggestions: [] });
    }
});

/**
 * GET /api/search/admin
 * Admin search - includes inactive and out of stock products
 */
router.get('/admin', requireSignIn, requireCapability('products:read'), async (req, res) => {
    try {
        const { q, page = 1, limit = 20 } = req.query;

        if (!q || q.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }

        const sanitizedQuery = q.trim().substring(0, 100);
        const sanitizedPage = Math.max(1, parseInt(page) || 1);
        const sanitizedLimit = Math.min(100, Math.max(1, parseInt(limit) || 20));

        // Try Elasticsearch first, fallback to MongoDB
        if (isAvailable()) {
            try {
                const results = await adminSearchProducts(sanitizedQuery, {
                    page: sanitizedPage,
                    limit: sanitizedLimit
                });
                return res.json(results);
            } catch (esError) {
                console.error('ES admin search failed, falling back to MongoDB:', esError.message);
            }
        }

        // MongoDB fallback (includes inactive)
        const results = await mongoFallbackSearch(sanitizedQuery, sanitizedPage, sanitizedLimit, true);
        res.json(results);
    } catch (error) {
        console.error('Admin search API error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Search error',
            error: error.message
        });
    }
});

/**
 * POST /api/search/reindex
 * Trigger full reindex of products
 */
router.post('/reindex', requireSignIn, requireCapability('products:write'), async (req, res) => {
    try {
        console.log('Reindex triggered by admin');
        const result = await fullReindex();
        res.json(result);
    } catch (error) {
        console.error('Reindex API error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Reindex failed',
            error: error.message
        });
    }
});

/**
 * GET /api/search/status
 * Get search system status (Elasticsearch + Redis)
 */
router.get('/status', async (req, res) => {
    try {
        const [esStatus, indexStats, redisStatus] = await Promise.all([
            getConnectionStatus(),
            getIndexStats().catch(() => ({ error: 'Index unavailable' })),
            Promise.resolve(getRedisStatus())
        ]);

        res.json({
            success: true,
            elasticsearch: esStatus,
            index: indexStats,
            redis: redisStatus,
            usingFallback: !isAvailable()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
