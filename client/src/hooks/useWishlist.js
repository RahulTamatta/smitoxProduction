import { useCallback } from 'react';
import useWishlistStore from '../store/wishlist.store';

/**
 * Custom hook for wishlist operations
 * Abstracts wishlist store and provides instant toggle UX
 */
const useWishlist = () => {
    const wishlist = useWishlistStore(state => state.wishlist);
    const addToWishlist = useWishlistStore(state => state.addToWishlist);
    const removeFromWishlist = useWishlistStore(state => state.removeFromWishlist);
    const toggleWishlist = useWishlistStore(state => state.toggleWishlist);
    const isInWishlist = useWishlistStore(state => state.isInWishlist);
    const moveToCart = useWishlistStore(state => state.moveToCart);
    const syncWishlist = useWishlistStore(state => state.syncWishlist);
    const clearWishlist = useWishlistStore(state => state.clearWishlist);
    const getItemCount = useWishlistStore(state => state.getItemCount);
    const isLoading = useWishlistStore(state => state.isLoading);
    const error = useWishlistStore(state => state.error);

    /**
     * Toggle wishlist with animation-friendly callback
     */
    const handleToggleWishlist = useCallback(async (product, onSuccess, onError) => {
        const success = await toggleWishlist(product);

        if (success && onSuccess) {
            onSuccess();
        } else if (!success && onError) {
            onError();
        }

        return success;
    }, [toggleWishlist]);

    /**
     * Check if product is in wishlist (memoized)
     */
    const checkIsInWishlist = useCallback((productId) => {
        return isInWishlist(productId);
    }, [isInWishlist]);

    /**
     * Get wishlist item by product ID
     */
    const getWishlistItem = useCallback((productId) => {
        return wishlist.find(item => item.product._id === productId);
    }, [wishlist]);

    return {
        // State
        wishlist,
        isLoading,
        error,

        // Actions
        addToWishlist,
        removeFromWishlist,
        toggleWishlist: handleToggleWishlist,
        moveToCart,
        syncWishlist,
        clearWishlist,

        // Computed
        isInWishlist: checkIsInWishlist,
        getItemCount,
        getWishlistItem,
    };
};

export default useWishlist;
