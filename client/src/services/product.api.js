import api from './api';

/**
 * Product API service functions for React Query
 * All product-related API calls centralized here
 */

/**
 * Fetch paginated products
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @param {object} filters - Filter options (category, price range, etc.)
 * @param {string} sortBy - Sort option (price_asc, price_desc, popular, newest)
 */
export const fetchProducts = async ({ page = 1, limit = 12, filters = {}, sortBy = '' }) => {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
    });

    if (sortBy) params.append('sortBy', sortBy);
    if (filters.category) params.append('category', filters.category);
    if (filters.minPrice) params.append('minPrice', filters.minPrice);
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
    if (filters.search) params.append('search', filters.search);

    const { data } = await api.get(`/product/product-list/${page}?${params.toString()}`);
    return data;
};

/**
 * Fetch total product count
 */
export const fetchProductCount = async () => {
    const { data } = await api.get('/product/product-count');
    return data.total;
};

/**
 * Fetch single product by slug
 */
export const fetchProductBySlug = async (slug) => {
    const { data } = await api.get(`/product/get-product/${slug}`);
    return data.product;
};

/**
 * Fetch all categories
 */
export const fetchCategories = async () => {
    const { data } = await api.get('/category/get-category');
    return data.category;
};

/**
 * Fetch products by category
 */
export const fetchProductsByCategory = async (categorySlug) => {
    const { data } = await api.get(`/product/product-category/${categorySlug}`);
    return data.products;
};

/**
 * Fetch "Products For You" recommendations
 */
export const fetchProductsForYou = async () => {
    const { data } = await api.get('/productForYou/get-all');
    return data.productsForYou || [];
};

/**
 * Filter products (for advanced filtering)
 */
export const filterProducts = async ({ checked = [], radio = [] }) => {
    const { data } = await api.post('/product/product-filters', {
        checked,
        radio,
    });
    return data.products;
};

/**
 * Check product inventory/stock
 */
export const checkInventory = async (productId) => {
    const { data } = await api.get(`/product/inventory/${productId}`);
    return data;
};

/**
 * Fetch banners
 */
export const fetchBanners = async () => {
    const { data } = await api.get('/bannerManagement/get-banners');
    return data.banners || [];
};

/**
 * Fetch all subcategories
 */
export const fetchSubcategories = async () => {
    const { data } = await api.get('/subcategory/get-subcategories');
    return data.subcategories || [];
};
