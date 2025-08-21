// Note: requires @tanstack/react-query. Safe until imported by the app.
import { useQuery } from "@tanstack/react-query";
import { getProduct } from "../api/product.api";
import { normalizeProductForCard } from "../../../shared/lib/normalizeProduct";

export const useProduct = (slug) => {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: () => getProduct(slug),
    enabled: !!slug,
    select: (p) => ({
      ...p,
      multipleimages: Array.isArray(p.multipleimages) ? p.multipleimages : [],
      photos: normalizeProductForCard(p).photos,
    }),
  });
};
