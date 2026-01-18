/**
 * Sync Service
 * 
 * MongoDB to Elasticsearch synchronization service.
 * Handles indexing, updating, and deleting products in Elasticsearch.
 */

import client, { ELASTICSEARCH_INDEX, initializeIndex } from '../config/elasticsearch.js';
import { invalidateSearchCache } from '../config/redis.js';
import productModel from '../models/productModel.js';

/**
 * Transform MongoDB product to Elasticsearch document
 * @param {Object} product - MongoDB product document
 * @returns {Object} Elasticsearch document
 */
const transformProduct = (product) => {
    // Handle populated vs non-populated references
    const categoryName = typeof product.category === 'object'
        ? product.category?.name
        : null;
    const subcategoryName = typeof product.subcategory === 'object'
        ? product.subcategory?.name
        : null;
    const brandName = typeof product.brand === 'object'
        ? product.brand?.name
        : null;

    return {
        name: product.name,
        slug: product.slug,
        description: product.description || '',
        brand: product.brand?._id?.toString() || product.brand?.toString() || null,
        brandName: brandName,
        category: product.category?._id?.toString() || product.category?.toString() || null,
        categoryName: categoryName,
        subcategory: product.subcategory?._id?.toString() || product.subcategory?.toString() || null,
        subcategoryName: subcategoryName,
        tags: Array.isArray(product.tag) ? product.tag : [],
        sku: product.sku || '',
        perPiecePrice: product.perPiecePrice || 0,
        mrp: product.mrp || 0,
        stock: product.stock || 0,
        isActive: product.isActive || '1',
        photos: product.photos || '',
        salesCount: product.salesCount || 0,
        popularity: product.popularity || 0,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
    };
};

/**
 * Index a single product in Elasticsearch
 * @param {Object} product - Product document (with populated refs)
 */
export const indexProduct = async (product) => {
    try {
        const doc = transformProduct(product);

        await client.index({
            index: ELASTICSEARCH_INDEX,
            id: product._id.toString(),
            document: doc,
            refresh: true // Make immediately searchable
        });

        // Invalidate search cache
        await invalidateSearchCache();

        console.log(`Indexed product: ${product.name} (${product._id})`);
        return true;
    } catch (error) {
        console.error(`Error indexing product ${product._id}:`, error.message);
        return false;
    }
};

/**
 * Update a product in Elasticsearch
 * @param {Object} product - Updated product document
 */
export const updateProductIndex = async (product) => {
    try {
        const doc = transformProduct(product);

        await client.update({
            index: ELASTICSEARCH_INDEX,
            id: product._id.toString(),
            doc: doc,
            doc_as_upsert: true, // Create if doesn't exist
            refresh: true
        });

        // Invalidate search cache
        await invalidateSearchCache();

        console.log(`Updated product index: ${product.name} (${product._id})`);
        return true;
    } catch (error) {
        console.error(`Error updating product index ${product._id}:`, error.message);
        return false;
    }
};

/**
 * Delete a product from Elasticsearch
 * @param {string} productId - Product ID to delete
 */
export const deleteProductIndex = async (productId) => {
    try {
        await client.delete({
            index: ELASTICSEARCH_INDEX,
            id: productId.toString(),
            refresh: true
        });

        // Invalidate search cache
        await invalidateSearchCache();

        console.log(`Deleted product from index: ${productId}`);
        return true;
    } catch (error) {
        if (error.meta?.statusCode === 404) {
            console.log(`Product ${productId} not found in index (already deleted)`);
            return true;
        }
        console.error(`Error deleting product ${productId} from index:`, error.message);
        return false;
    }
};

/**
 * Full reindex of all products
 * Use this for initial migration or to rebuild the index
 */
export const fullReindex = async () => {
    console.log('Starting full product reindex...');
    const startTime = Date.now();

    try {
        // Initialize index (creates if not exists)
        await initializeIndex();

        // Count total products
        const totalProducts = await productModel.countDocuments({ isActive: '1' });
        console.log(`Found ${totalProducts} active products to index`);

        // Batch size for bulk operations
        const BATCH_SIZE = 100;
        let indexed = 0;
        let errors = 0;
        let skip = 0;

        while (skip < totalProducts) {
            // Fetch batch with populated references
            const products = await productModel
                .find({ isActive: '1' })
                .populate('category', 'name')
                .populate('subcategory', 'name')
                .populate('brand', 'name')
                .skip(skip)
                .limit(BATCH_SIZE)
                .lean();

            if (products.length === 0) break;

            // Prepare bulk operations
            const operations = products.flatMap(product => [
                { index: { _index: ELASTICSEARCH_INDEX, _id: product._id.toString() } },
                transformProduct(product)
            ]);

            // Execute bulk indexing
            const bulkResponse = await client.bulk({
                refresh: false, // Don't refresh after each bulk
                operations
            });

            // Count successes and errors
            if (bulkResponse.errors) {
                bulkResponse.items.forEach((item, i) => {
                    if (item.index?.error) {
                        errors++;
                        console.error(`Error indexing product:`, item.index.error);
                    } else {
                        indexed++;
                    }
                });
            } else {
                indexed += products.length;
            }

            skip += BATCH_SIZE;
            console.log(`Progress: ${Math.min(skip, totalProducts)}/${totalProducts} products processed`);
        }

        // Refresh index to make all documents searchable
        await client.indices.refresh({ index: ELASTICSEARCH_INDEX });

        // Invalidate all search cache
        await invalidateSearchCache();

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`Reindex complete: ${indexed} indexed, ${errors} errors, ${duration}s`);

        return {
            success: true,
            indexed,
            errors,
            total: totalProducts,
            duration: `${duration}s`
        };
    } catch (error) {
        console.error('Full reindex failed:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Get index statistics
 */
export const getIndexStats = async () => {
    try {
        const stats = await client.indices.stats({ index: ELASTICSEARCH_INDEX });
        const count = await client.count({ index: ELASTICSEARCH_INDEX });

        return {
            documentCount: count.count,
            indexSize: stats._all.primaries.store.size_in_bytes,
            indexSizeHuman: formatBytes(stats._all.primaries.store.size_in_bytes)
        };
    } catch (error) {
        return {
            error: error.message
        };
    }
};

// Helper to format bytes
const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default {
    indexProduct,
    updateProductIndex,
    deleteProductIndex,
    fullReindex,
    getIndexStats
};
