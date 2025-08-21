import { http } from "../../../shared/api/http";

// Filters: { status, page, limit, search, sortBy, sortOrder, paymentFilter }
export const fetchOrders = async (filters) => {
  const { data } = await http.get("/auth/all-orders", { params: filters });
  return {
    orders: Array.isArray(data.orders) ? data.orders : [],
    total: Number(data.total ?? 0),
  };
};

export const updateOrderStatus = (orderId, status) =>
  http.put(`/auth/order-status/${orderId}`, { status }).then((r) => r.data);

export const updateOrder = (orderId, payload) =>
  http.put(`/auth/order/${orderId}`, payload).then((r) => r.data);

export const addProductToOrder = (orderId, payload) =>
  http.put(`/auth/order/${orderId}/add`, payload).then((r) => r.data);

export const removeProductFromOrder = (orderId, productId) =>
  http.delete(`/auth/order/${orderId}/remove-product/${productId}`).then((r) => r.data);

export const addTrackingInfo = (orderId, info) =>
  http.put(`/auth/order/${orderId}/tracking`, info).then((r) => r.data);

export const getInvoiceUrl = (orderId) => `/api/v1/auth/order/${orderId}/invoice`;
