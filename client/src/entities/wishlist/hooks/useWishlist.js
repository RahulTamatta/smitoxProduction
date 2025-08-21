import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addToWishlist, removeFromWishlist, checkWishlist } from "../api/wishlist.api";

export const useWishlist = (userId, productId) => {
  const qc = useQueryClient();

  const { data: exists } = useQuery({
    queryKey: ["wishlist", userId, productId],
    queryFn: () => checkWishlist(userId, productId),
    enabled: !!userId && !!productId,
  });

  const add = useMutation({
    mutationFn: () => addToWishlist(userId, productId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wishlist", userId, productId] }),
  });

  const remove = useMutation({
    mutationFn: () => removeFromWishlist(userId, productId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wishlist", userId, productId] }),
  });

  return { exists: !!exists, add, remove };
};
