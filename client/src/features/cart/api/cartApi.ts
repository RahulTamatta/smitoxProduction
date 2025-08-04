import apiClient from '../../../services/apiClient';

export const cartApi = {
  getCart: async () => {
    const response = await apiClient.get('/cart');
    return response.data;
  },

  addToCart: async (productId: string, quantity: number) => {
    const response = await apiClient.post('/cart/add', { productId, quantity });
    return response.data;
  },

  updateCartItem: async (itemId: string, quantity: number) => {
    const response = await apiClient.put(`/cart/items/${itemId}`, { quantity });
    return response.data;
  },

  removeFromCart: async (itemId: string) => {
    const response = await apiClient.delete(`/cart/items/${itemId}`);
    return response.data;
  },

  clearCart: async () => {
    const response = await apiClient.delete('/cart');
    return response.data;
  }
};
