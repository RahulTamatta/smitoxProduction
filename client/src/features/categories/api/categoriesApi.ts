import apiClient from '../../../services/apiClient';

export const categoriesApi = {
  getCategories: async () => {
    const response = await apiClient.get('/categories');
    return response.data;
  },

  getCategoryById: async (id: string) => {
    const response = await apiClient.get(`/categories/${id}`);
    return response.data;
  },

  createCategory: async (categoryData: any) => {
    const response = await apiClient.post('/categories', categoryData);
    return response.data;
  },

  updateCategory: async (id: string, categoryData: any) => {
    const response = await apiClient.put(`/categories/${id}`, categoryData);
    return response.data;
  },

  deleteCategory: async (id: string) => {
    const response = await apiClient.delete(`/categories/${id}`);
    return response.data;
  }
};
