// ===================================
// ORDER HOOKS
// ===================================

import { useState, useEffect } from 'react';
import { orderApi } from '../../admin/api/adminApi';
import { Order, PaginationParams, OrderStatus } from '../../../types';

export interface OrderParams extends PaginationParams {
  status?: string;
}

// Hook for managing orders state
export function useOrders(initialParams?: OrderParams) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalOrders, setTotalOrders] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async (params: OrderParams) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, total } = await orderApi.getOrders(params);
      setOrders(Array.isArray(data) ? data : []);
      setTotalOrders(total);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialParams) {
      fetchOrders(initialParams);
    }
  }, [initialParams]);

  return { orders, totalOrders, loading, error, fetchOrders };
}

// Hook for managing single order state
export function useOrder(orderId: string) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      
      setLoading(true);
      try {
        const data = await orderApi.getOrder(orderId);
        setOrder(data);
      } catch (err) {
        console.error('Failed to fetch order:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  return { order, loading, error, setOrder };
}

// Hook for updating order status
export function useOrderStatus() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const updateStatus = async (orderId: string, status: OrderStatus | string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await orderApi.updateOrderStatus(orderId, status);
      setSuccess('Order status updated successfully!');
    } catch (err) {
      console.error('Failed to update order status:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { updateStatus, loading, error, success };
}

// Hook for adding products to order
export function useOrderProducts() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const addProductToOrder = async (orderId: string, productData: any) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await orderApi.addProductToOrder(orderId, productData);
      setSuccess('Product added to order successfully!');
      return response;
    } catch (err) {
      console.error('Failed to add product to order:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { addProductToOrder, loading, error, success };
}

// Hook for updating order details
export function useOrderMutations() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const updateOrder = async (orderId: string, orderData: Partial<Order>) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await orderApi.updateOrder(orderId, orderData);
      setSuccess('Order updated successfully!');
      return response;
    } catch (err) {
      console.error('Failed to update order:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { updateOrder, loading, error, success };
}

// Hook for calculating order totals
export function useOrderCalculations(order: Order | null) {
  const calculateTotals = () => {
    if (!order || !order.products) {
      return { subtotal: 0, gst: 0, total: 0 };
    }

    const subtotal = order.products.reduce(
      (acc, product) => acc + Number(product.price) * Number(product.quantity),
      0
    );

    const gst = order.products.reduce((acc, product) => {
      return (
        acc +
        (Number(product.price) *
          Number(product.quantity) *
          (Number(product.gst) || 0)) /
          100
      );
    }, 0);

    const total =
      subtotal +
      gst +
      (Number(order.deliveryCharges) || 0) +
      (Number(order.codCharges) || 0) -
      (Number(order.discount) || 0);

    return { subtotal, gst, total };
  };

  return { calculateTotals };
}
