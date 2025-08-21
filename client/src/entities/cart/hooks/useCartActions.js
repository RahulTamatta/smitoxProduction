import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addToCart, updateCartQty, removeFromCart, getProductQty } from "../api/cart.api";

export const useCartActions = (userId) => {
  const qc = useQueryClient();

  const add = useMutation({
    mutationFn: (payload) => addToCart(userId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart", userId] }),
  });

  const updateQty = useMutation({
    mutationFn: ({ productId, quantity }) => updateCartQty(userId, productId, quantity),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart", userId] }),
  });

  const remove = useMutation({
    mutationFn: (productId) => removeFromCart(userId, productId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart", userId] }),
  });

  const fetchQty = (productId) => getProductQty(userId, productId);

  return { add, updateQty, remove, fetchQty };
};
