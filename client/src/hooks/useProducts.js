import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
    fetchBanners,
    fetchCategories,
    fetchProductBySlug,
    fetchProductCount,
    fetchProducts,
    fetchProductsByCategory,
    fetchProductsForYou,
    fetchSubcategories,
} from '../services/product.api';

/**
 * Custom hook for fetching products with React Query
 * Provides caching, background refetching, and pagination
 */
export const useProducts = ({ page = 1, limit = 12, filters = {}, sortBy = '' } = {}) => {
    return useQuery({
        queryKey: ['products', page, limit, filters, sortBy],
        queryFn: () => fetchProducts({ page, limit, filters, sortBy }),
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000, // 10 minutes
        keepPreviousData: true, // Keep previous data while fetching new data
    });
};

/**
 * Hook for infinite scroll products
 */
export const useInfiniteProducts = ({ limit = 12, filters = {}, sortBy = '' } = {}) => {
    return useInfiniteQuery({
        queryKey: ['products-infinite', limit, filters, sortBy],
        queryFn: ({ pageParam = 1 }) => fetchProducts({ page: pageParam, limit, filters, sortBy }),
        getNextPageParam: (lastPage, allPages) => {
            const nextPage = allPages.length + 1;
            return lastPage.products.length === limit ? nextPage : undefined;
        },
        staleTime: 5 * 60 * 1000,
        cacheTime: 10 * 60 * 1000,
    });
};

/**
 * Hook for fetching product count
 */
export const useProductCount = () => {
    return useQuery({
        queryKey: ['product-count'],
        queryFn: fetchProductCount,
        staleTime: 10 * 60 * 1000, // 10 minutes
        cacheTime: 15 * 60 * 1000, // 15 minutes
    });
};

/**
 * Hook for fetching single product by slug
 */
export const useProduct = (slug) => {
    return useQuery({
        queryKey: ['product', slug],
        queryFn: () => fetchProductBySlug(slug),
        enabled: !!slug, // Only fetch if slug is provided
        staleTime: 5 * 60 * 1000,
        cacheTime: 10 * 60 * 1000,
    });
};

/**
 * Hook for fetching categories
 */
export const useCategories = () => {
    return useQuery({
        queryKey: ['categories'],
        queryFn: fetchCategories,
        staleTime: 30 * 60 * 1000, // 30 minutes (categories don't change often)
        cacheTime: 60 * 60 * 1000, // 1 hour
    });
};

/**
 * Hook for fetching products by category
 */
export const useProductsByCategory = (categorySlug) => {
    return useQuery({
        queryKey: ['products-by-category', categorySlug],
        queryFn: () => fetchProductsByCategory(categorySlug),
        enabled: !!categorySlug,
        staleTime: 5 * 60 * 1000,
        cacheTime: 10 * 60 * 1000,
    });
};

/**
 * Hook for fetching "Products For You" recommendations
 */
export const useProductsForYou = () => {
    return useQuery({
        queryKey: ['products-for-you'],
        queryFn: fetchProductsForYou,
        staleTime: 10 * 60 * 1000, // 10 minutes
        cacheTime: 15 * 60 * 1000, // 15 minutes
    });
};

/**
 * Hook for fetching banners
 */
export const useBanners = () => {
    return useQuery({
        queryKey: ['banners'],
        queryFn: fetchBanners,
        staleTime: 15 * 60 * 1000, // 15 minutes
        cacheTime: 30 * 60 * 1000, // 30 minutes
    });
};

/**
 * Hook for fetching subcategories
 */
export const useSubcategories = () => {
    return useQuery({
        queryKey: ['subcategories'],
        queryFn: fetchSubcategories,
        staleTime: 30 * 60 * 1000, // 30 minutes
        cacheTime: 60 * 60 * 1000, // 1 hour
    });
};
