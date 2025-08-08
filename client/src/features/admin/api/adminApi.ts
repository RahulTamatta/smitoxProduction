// ===================================
// ADMIN API SERVICE LAYER
// ===================================

import axios, { AxiosResponse } from 'axios';
import {
  ApiResponse,
  Brand,
  Category,
  CategoryFormData,
  CloudinaryResponse,
  DashboardStats,
  Order,
  PaginatedResponse,
  PaginationParams,
  Product,
  Subcategory,
  User,
  UserFormData
} from '../../../types';

// Base API configuration
const API_BASE_URL = '/api/v1';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const auth = JSON.parse(localStorage.getItem('auth') || '{}');
    if (auth.token) {
      config.headers.Authorization = auth.token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// ===================================
// PRODUCT API SERVICES
// ===================================

export const productApi = {
  // Get all products with pagination and filters
  getProducts: async (params: PaginationParams): Promise<PaginatedResponse<Product>> => {
    const response: AxiosResponse = await apiClient.get('/product/get-product', { params });
    return {
      data: response.data.products,
      total: response.data.total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(response.data.total / params.limit),
    };
  },

  // Get single product by slug
  getProduct: async (slug: string): Promise<Product> => {
    const response: AxiosResponse = await apiClient.get(`/product/get-product/${slug}`);
    return response.data.product;
  },

  // Create new product
  createProduct: async (productData: FormData): Promise<ApiResponse<Product>> => {
    const response: AxiosResponse = await apiClient.post('/product/create-product', productData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Update product
  updateProduct: async (id: string, productData: FormData): Promise<ApiResponse<Product>> => {
    const response: AxiosResponse = await apiClient.put(`/product/update-product/${id}`, productData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Delete product
  deleteProduct: async (id: string): Promise<ApiResponse<void>> => {
    const response: AxiosResponse = await apiClient.delete(`/product/delete-product/${id}`);
    return response.data;
  },

  // Bulk update product status
  updateProductStatus: async (id: string, isActive: string): Promise<ApiResponse<Product>> => {
    const response: AxiosResponse = await apiClient.put(`/product/updateStatus/products/${id}`, {
      isActive,
    });
    return response.data;
  },

  // Get product count
  getProductCount: async (): Promise<number> => {
    const response: AxiosResponse = await apiClient.get('/product/product-count');
    return response.data.total;
  },
};

// ===================================
// ORDER API SERVICES
// ===================================

export const orderApi = {
  // Get all orders with pagination and filters
  getOrders: async (params: PaginationParams & { status?: string }): Promise<PaginatedResponse<Order>> => {
    const response: AxiosResponse = await apiClient.get('/auth/all-orders', { params });
    return {
      data: response.data.orders,
      total: response.data.total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(response.data.total / params.limit),
    };
  },

  // Get single order
  getOrder: async (id: string): Promise<Order> => {
    const response: AxiosResponse = await apiClient.get(`/auth/order/${id}`);
    return response.data.order;
  },

  // Update order status
  updateOrderStatus: async (id: string, status: string): Promise<ApiResponse<Order>> => {
    const response: AxiosResponse = await apiClient.put(`/auth/order-status/${id}`, { status });
    return response.data;
  },

  // Add product to order
  addProductToOrder: async (orderId: string, productData: any): Promise<ApiResponse<Order>> => {
    const response: AxiosResponse = await apiClient.post(`/auth/order/${orderId}/add-product`, productData);
    return response.data;
  },

  // Update order details
  updateOrder: async (id: string, orderData: Partial<Order>): Promise<ApiResponse<Order>> => {
    const response: AxiosResponse = await apiClient.put(`/auth/order/${id}`, orderData);
    return response.data;
  },
};

// ===================================
// USER API SERVICES
// ===================================

export const userApi = {
  // Get all users with pagination
  getUsers: async (params: PaginationParams): Promise<PaginatedResponse<User>> => {
    const response: AxiosResponse = await apiClient.get('/auth/users', { params });
    return {
      data: response.data.users,
      total: response.data.total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(response.data.total / params.limit),
    };
  },

  // Get single user
  getUser: async (id: string): Promise<User> => {
    const response: AxiosResponse = await apiClient.get(`/auth/user/${id}`);
    return response.data.user;
  },

  // Create user
  createUser: async (userData: UserFormData): Promise<ApiResponse<User>> => {
    const response: AxiosResponse = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  // Update user
  updateUser: async (id: string, userData: Partial<UserFormData>): Promise<ApiResponse<User>> => {
    const response: AxiosResponse = await apiClient.put(`/auth/user/${id}`, userData);
    return response.data;
  },

  // Delete user
  deleteUser: async (id: string): Promise<ApiResponse<void>> => {
    const response: AxiosResponse = await apiClient.delete(`/auth/user/${id}`);
    return response.data;
  },
};

// ===================================
// CATEGORY API SERVICES
// ===================================

export const categoryApi = {
  // Get all categories
  getCategories: async (): Promise<Category[]> => {
    const response: AxiosResponse = await apiClient.get('/category/get-category');
    return response.data.category;
  },

  // Create category
  createCategory: async (categoryData: CategoryFormData): Promise<ApiResponse<Category>> => {
    const response: AxiosResponse = await apiClient.post('/category/create-category', categoryData);
    return response.data;
  },

  // Update category
  updateCategory: async (id: string, categoryData: CategoryFormData): Promise<ApiResponse<Category>> => {
    const response: AxiosResponse = await apiClient.put(`/category/update-category/${id}`, categoryData);
    return response.data;
  },

  // Delete category
  deleteCategory: async (id: string): Promise<ApiResponse<void>> => {
    const response: AxiosResponse = await apiClient.delete(`/category/delete-category/${id}`);
    return response.data;
  },
};

// ===================================
// SUBCATEGORY API SERVICES
// ===================================

export const subcategoryApi = {
  // Get all subcategories
  getSubcategories: async (): Promise<Subcategory[]> => {
    const response: AxiosResponse = await apiClient.get('/subcategory/get-subcategories');
    return response.data.subcategories;
  },

  // Create subcategory
  createSubcategory: async (subcategoryData: any): Promise<ApiResponse<Subcategory>> => {
    const response: AxiosResponse = await apiClient.post('/subcategory/create-subcategory', subcategoryData);
    return response.data;
  },

  // Update subcategory
  updateSubcategory: async (id: string, subcategoryData: any): Promise<ApiResponse<Subcategory>> => {
    const response: AxiosResponse = await apiClient.put(`/subcategory/update-subcategory/${id}`, subcategoryData);
    return response.data;
  },

  // Delete subcategory
  deleteSubcategory: async (id: string): Promise<ApiResponse<void>> => {
    const response: AxiosResponse = await apiClient.delete(`/subcategory/delete-subcategory/${id}`);
    return response.data;
  },
};

// ===================================
// BRAND API SERVICES
// ===================================

export const brandApi = {
  // Get all brands
  getBrands: async (): Promise<Brand[]> => {
    const response: AxiosResponse = await apiClient.get('/brand/get-brands');
    return response.data.brands;
  },

  // Create brand
  createBrand: async (brandData: any): Promise<ApiResponse<Brand>> => {
    const response: AxiosResponse = await apiClient.post('/brand/create-brand', brandData);
    return response.data;
  },

  // Update brand
  updateBrand: async (id: string, brandData: any): Promise<ApiResponse<Brand>> => {
    const response: AxiosResponse = await apiClient.put(`/brand/update-brand/${id}`, brandData);
    return response.data;
  },

  // Delete brand
  deleteBrand: async (id: string): Promise<ApiResponse<void>> => {
    const response: AxiosResponse = await apiClient.delete(`/brand/delete-brand/${id}`);
    return response.data;
  },
};

// ===================================
// DASHBOARD API SERVICES
// ===================================

export const dashboardApi = {
  // Get dashboard statistics
  getStats: async (): Promise<DashboardStats> => {
    const response: AxiosResponse = await apiClient.get('/dashboard/stats');
    return response.data;
  },
};

// ===================================
// CLOUDINARY API SERVICES
// ===================================

export const cloudinaryApi = {
  // Upload image to Cloudinary
  uploadImage: async (file: File): Promise<CloudinaryResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'smitoxphoto');
    formData.append('cloud_name', 'daabaruau');

    const response = await fetch(
      'https://api.cloudinary.com/v1_1/daabaruau/image/upload',
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    return await response.json();
  },

  // Upload multiple images
  uploadMultipleImages: async (files: File[]): Promise<CloudinaryResponse[]> => {
    const uploadPromises = files.map(file => cloudinaryApi.uploadImage(file));
    return Promise.all(uploadPromises);
  },
};

// Export all APIs
export default {
  product: productApi,
  order: orderApi,
  user: userApi,
  category: categoryApi,
  subcategory: subcategoryApi,
  brand: brandApi,
  dashboard: dashboardApi,
  cloudinary: cloudinaryApi,
};
