import { http } from "../../../shared/api/http";

export const getProduct = (slug) =>
  http.get(`/product/get-product/${slug}`).then((r) => r.data.product);

export const getProductsForYou = (categoryId, subcategoryId) =>
  http
    .get(`/productForYou/products/${categoryId}/${subcategoryId}`)
    .then((r) => r.data.products ?? []);
