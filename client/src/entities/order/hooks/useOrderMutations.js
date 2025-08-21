import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateOrderStatus,
  updateOrder,
  addProductToOrder,
  removeProductFromOrder,
  addTrackingInfo,
} from "../../order/api/order.api";

export const useOrderMutations = () => {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["orders"] });

  const setStatus = useMutation({
    mutationFn: ({ orderId, status }) => updateOrderStatus(orderId, status),
    onSuccess: invalidate,
  });

  const saveOrder = useMutation({
    mutationFn: ({ orderId, payload }) => updateOrder(orderId, payload),
    onSuccess: invalidate,
  });

  const addProduct = useMutation({
    mutationFn: ({ orderId, data }) => addProductToOrder(orderId, data),
    onSuccess: invalidate,
  });

  const removeProduct = useMutation({
    mutationFn: ({ orderId, productId }) => removeProductFromOrder(orderId, productId),
    onSuccess: invalidate,
  });

  const addTracking = useMutation({
    mutationFn: ({ orderId, info }) => addTrackingInfo(orderId, info),
    onSuccess: invalidate,
  });

  return { setStatus, saveOrder, addProduct, removeProduct, addTracking };
};
