/**
 * Search Service
 * 
 * Production-grade search service with:
 * - Autocomplete (first character response)
 * - Fuzzy matching (typo tolerance)
 * - Field boosting (name > brand > category)
 * - Result ranking by relevance and popularity
 */

import client, { ELASTICSEARCH_INDEX } from '../config/elasticsearch.js';
import { getCachedSearch, setCachedSearch } from '../config/redis.js';

/**
 * Search products with autocomplete and fuzzy matching
 * 
 * @param {string} query - Search query (can be single character)
 * @param {Object} options - Search options
 * @param {number} options.page - Page number (1-indexed)
 * @param {number} options.limit - Results per page
 * @param {boolean} options.includeOutOfStock - Include out of stock products
 * @param {boolean} options.includeInactive - Include inactive products (admin only)
 * @returns {Object} Search results with pagination
 */
export const searchProducts = async (query, options = {}) => {
    const {
        page = 1,
        limit = 20,
        includeOutOfStock = false,
        includeInactive = false
    } = options;

    const startTime = Date.now();

    // Check cache first
    const cacheKey = `${query}:${page}:${limit}:${includeOutOfStock}:${includeInactive}`;
    const cached = await getCachedSearch(cacheKey, page, limit);
    if (cached) {
        return {
            ...cached,
            fromCache: true,
            responseTime: `${Date.now() - startTime}ms`
        };
    }

    try {
        // Build filter conditions
        const filterConditions = [];

        if (!includeInactive) {
            filterConditions.push({ term: { isActive: "1" } });
        }

        if (!includeOutOfStock) {
            filterConditions.push({ range: { stock: { gt: 0 } } });
        }

        // Build the search query
        const searchBody = {
            query: {
                bool: {
                    must: [
                        {
                            multi_match: {
                                query: query,
                                type: "best_fields",
                                fields: [
                                    "name^10",           // Highest boost for product name
                                    "brandName^5",       // High boost for brand
                                    "categoryName^3",    // Medium boost for category
                                    "subcategoryName^2", // Lower boost for subcategory
                                    "tags^2",            // Tags for keywords
                                    "sku^2",             // SKU exact or partial match
                                    "description"        // Full text search in description
                                ],
                                fuzziness: query.length > 2 ? "AUTO" : "0", // No fuzzy for short queries
                                prefix_length: 1,
                                operator: "or"
                            }
                        }
                    ],
                    filter: filterConditions
                }
            },
            sort: [
                { _score: "desc" },           // Primary: relevance score
                { salesCount: { order: "desc", missing: "_last" } }, // Secondary: popularity
                { createdAt: "desc" }         // Tertiary: recency
            ],
            size: limit,
            from: (page - 1) * limit,
            _source: [
                "name", "slug", "brand", "brandName", "category", "categoryName",
                "subcategory", "subcategoryName", "perPiecePrice", "mrp", "stock",
                "photos", "isActive", "sku", "salesCount", "tags"
            ],
            highlight: {
                fields: {
                    name: {},
                    brandName: {},
                    categoryName: {}
                },
                pre_tags: ["<mark>"],
                post_tags: ["</mark>"]
            }
        };

        // Execute search
        const response = await client.search({
            index: ELASTICSEARCH_INDEX,
            body: searchBody
        });

        // Process results
        const hits = response.hits.hits;
        const total = typeof response.hits.total === 'object'
            ? response.hits.total.value
            : response.hits.total;

        const results = hits.map(hit => ({
            _id: hit._id,
            ...hit._source,
            _score: hit._score,
            highlights: hit.highlight || {}
        }));

        const responseData = {
            success: true,
            results,
            total,
            page,
            pages: Math.ceil(total / limit),
            limit,
            query,
            responseTime: `${Date.now() - startTime}ms`,
            fromCache: false
        };

        // Cache the results
        await setCachedSearch(cacheKey, page, limit, responseData);

        return responseData;
    } catch (error) {
        console.error('Elasticsearch search error:', error.message);
        throw error;
    }
};

/**
 * Get autocomplete suggestions (faster, simpler query)
 * 
 * @param {string} prefix - Prefix to autocomplete
 * @param {number} limit - Max suggestions to return
 * @returns {Array} Autocomplete suggestions
 */
export const getAutocompleteSuggestions = async (prefix, limit = 10) => {
    const startTime = Date.now();

    try {
        const response = await client.search({
            index: ELASTICSEARCH_INDEX,
            body: {
                query: {
                    bool: {
                        must: [
                            {
                                multi_match: {
                                    query: prefix,
                                    type: "bool_prefix",
                                    fields: [
                                        "name^10",
                                        "name._2gram^5",
                                        "name._3gram^3",
                                        "brandName^5",
                                        "categoryName^3"
                                    ]
                                }
                            }
                        ],
                        filter: [
                            { term: { isActive: "1" } },
                            { range: { stock: { gt: 0 } } }
                        ]
                    }
                },
                size: limit,
                _source: ["name", "slug", "photos", "perPiecePrice", "brandName"]
            }
        });

        const suggestions = response.hits.hits.map(hit => ({
            _id: hit._id,
            name: hit._source.name,
            slug: hit._source.slug,
            photos: hit._source.photos,
            perPiecePrice: hit._source.perPiecePrice,
            brandName: hit._source.brandName,
            _score: hit._score
        }));

        return {
            success: true,
            suggestions,
            responseTime: `${Date.now() - startTime}ms`
        };
    } catch (error) {
        console.error('Autocomplete error:', error.message);
        throw error;
    }
};

/**
 * Admin search - includes inactive and out of stock products
 */
export const adminSearchProducts = async (query, options = {}) => {
    return searchProducts(query, {
        ...options,
        includeOutOfStock: true,
        includeInactive: true
    });
};

export default {
    searchProducts,
    getAutocompleteSuggestions,
    adminSearchProducts
};
