import apiClient from '../../../services/apiClient';

export const ordersApi = {
  getOrders: async () => {
    const response = await apiClient.get('/orders');
    return response.data;
  },

  getOrderById: async (id: string) => {
    const response = await apiClient.get(`/orders/${id}`);
    return response.data;
  },

  createOrder: async (orderData: any) => {
    const response = await apiClient.post('/orders', orderData);
    return response.data;
  },

  updateOrderStatus: async (id: string, status: string) => {
    const response = await apiClient.put(`/orders/${id}/status`, { status });
    return response.data;
  },

  cancelOrder: async (id: string) => {
    const response = await apiClient.put(`/orders/${id}/cancel`);
    return response.data;
  }
};
