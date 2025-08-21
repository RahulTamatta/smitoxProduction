import { useQuery } from "@tanstack/react-query";
import { fetchOrders } from "../../order/api/order.api";

export const useOrders = (filters) => {
  return useQuery({
    queryKey: ["orders", filters],
    queryFn: () => fetchOrders(filters),
    keepPreviousData: true,
    select: (res) => res, // { orders, total }
  });
};
