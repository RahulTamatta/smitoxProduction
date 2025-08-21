import { useQuery } from "@tanstack/react-query";
import { getProductsForYou } from "../api/product.api";
import { normalizeProductForCard } from "../../../shared/lib/normalizeProduct";

export const useProductsForYou = (categoryId, subId) => {
  return useQuery({
    queryKey: ["productsForYou", categoryId, subId],
    queryFn: () => getProductsForYou(categoryId, subId),
    enabled: !!categoryId && !!subId,
    select: (items) =>
      items.map((i) => ({ ...i, productId: normalizeProductForCard(i.productId) })),
  });
};
