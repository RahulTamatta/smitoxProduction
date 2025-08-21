import { http } from "../../../shared/api/http";

export const addToCart = (userId, payload) =>
  http.post(`/carts/users/${userId}/cart`, payload).then((r) => r.data);

export const updateCartQty = (userId, productId, quantity) =>
  http.post(`/carts/users/${userId}/cartq/${productId}`, { quantity });

export const removeFromCart = (userId, productId) =>
  http.delete(`/carts/users/${userId}/cart/${productId}`);

export const getProductQty = (userId, productId) =>
  http
    .get(`/carts/users/${userId}/products/${productId}/quantity`)
    .then((r) => r.data.quantity ?? 0);
