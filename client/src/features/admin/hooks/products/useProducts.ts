// ===================================
// PRODUCT HOOKS
// ===================================

import { useState, useEffect } from 'react';
import { productApi } from '../../api/adminApi';
import { Product, PaginationParams, ApiResponse } from '../../../../types';

// Hook for managing products state
export function useProducts(initialParams?: PaginationParams) {
  const [products, setProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async (params: PaginationParams) => {
    setLoading(true);
    try {
      const { data, total } = await productApi.getProducts(params);
      setProducts(data);
      setTotalProducts(total);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialParams) {
      fetchProducts(initialParams);
    }
  }, [initialParams]);

  return { products, totalProducts, loading, error, fetchProducts };
}

// Hook for managing single product state
export function useProduct(slug: string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const data = await productApi.getProduct(slug);
        setProduct(data);
      } catch (err) {
        console.error('Failed to fetch product:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  return { product, loading, error };
}

// Hook for creating or updating a product
export function useProductMutations() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const createProduct = async (productData: FormData) => {
    setLoading(true);
    try {
      const response: ApiResponse<Product> = await productApi.createProduct(productData);
      setSuccess('Product created successfully!');
      return response;
    } catch (err) {
      console.error('Failed to create product:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async (id: string, productData: FormData) => {
    setLoading(true);
    try {
      const response: ApiResponse<Product> = await productApi.updateProduct(id, productData);
      setSuccess('Product updated successfully!');
      return response;
    } catch (err) {
      console.error('Failed to update product:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createProduct, updateProduct, loading, error, success };
}

// Hook for deleting a product
export function useDeleteProduct() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const deleteProduct = async (id: string) => {
    setLoading(true);
    try {
      await productApi.deleteProduct(id);
      setSuccess('Product deleted successfully!');
    } catch (err) {
      console.error('Failed to delete product:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return { deleteProduct, loading, error, success };
}
