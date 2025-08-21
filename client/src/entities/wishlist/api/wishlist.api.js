import { http } from "../../../shared/api/http";

export const addToWishlist = (userId, productId) =>
  http.post(`/carts/users/${userId}/wishlist`, { productId });

export const removeFromWishlist = (userId, productId) =>
  http.delete(`/carts/users/${userId}/wishlist/${productId}`);

export const checkWishlist = (userId, productId) =>
  http
    .get(`/carts/users/${userId}/wishlist/check/${productId}`)
    .then((r) => !!r.data.exists);
