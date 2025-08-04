import apiClient from '../../../services/apiClient';

export const productsApi = {
  getProducts: async (params?: any) => {
    const response = await apiClient.get('/products', { params });
    return response.data;
  },

  getProductById: async (id: string) => {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  },

  getProductBySlug: async (slug: string) => {
    const response = await apiClient.get(`/products/slug/${slug}`);
    return response.data;
  },

  createProduct: async (productData: any) => {
    const response = await apiClient.post('/products', productData);
    return response.data;
  },

  updateProduct: async (id: string, productData: any) => {
    const response = await apiClient.put(`/products/${id}`, productData);
    return response.data;
  },

  deleteProduct: async (id: string) => {
    const response = await apiClient.delete(`/products/${id}`);
    return response.data;
  },

  searchProducts: async (query: string, filters?: any) => {
    const response = await apiClient.get('/products/search', { 
      params: { q: query, ...filters } 
    });
    return response.data;
  }
};
