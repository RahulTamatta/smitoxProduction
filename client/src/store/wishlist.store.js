import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

/**
 * Wishlist Store - Zustand
 * Manages wishlist state with localStorage persistence and instant updates
 */
const useWishlistStore = create(
    persist(
        (set, get) => ({
            // State
            wishlist: [],
            isLoading: false,
            error: null,

            // Actions
            /**
             * Add product to wishlist with optimistic update
             */
            addToWishlist: async (product) => {
                const { wishlist } = get();
                const userId = get().getUserId();

                if (!userId) {
                    set({ error: 'Please login to add items to wishlist' });
                    return false;
                }

                // Check if already in wishlist
                if (wishlist.some(item => item.product._id === product._id)) {
                    return true;
                }

                // Optimistic update
                const newItem = {
                    _id: `temp-${Date.now()}`,
                    product,
                };
                set({ wishlist: [...wishlist, newItem] });

                try {
                    // API call
                    await api.post(`/carts/users/${userId}/wishlist`, {
                        productId: product._id,
                    });
                    return true;
                } catch (error) {
                    // Rollback on error
                    set({ wishlist: wishlist, error: error.message });
                    return false;
                }
            },

            /**
             * Remove product from wishlist
             */
            removeFromWishlist: async (productId) => {
                const { wishlist } = get();
                const userId = get().getUserId();

                if (!userId) return false;

                // Optimistic update
                const previousWishlist = [...wishlist];
                set({ wishlist: wishlist.filter(item => item.product._id !== productId) });

                try {
                    await api.delete(`/carts/users/${userId}/wishlist/${productId}`);
                    return true;
                } catch (error) {
                    // Rollback on error
                    set({ wishlist: previousWishlist, error: error.message });
                    return false;
                }
            },

            /**
             * Toggle product in wishlist (add if not present, remove if present)
             */
            toggleWishlist: async (product) => {
                const { wishlist } = get();
                const isInWishlist = wishlist.some(item => item.product._id === product._id);

                if (isInWishlist) {
                    return get().removeFromWishlist(product._id);
                } else {
                    return get().addToWishlist(product);
                }
            },

            /**
             * Check if product is in wishlist
             */
            isInWishlist: (productId) => {
                const { wishlist } = get();
                return wishlist.some(item => item.product._id === productId);
            },

            /**
             * Move product from wishlist to cart
             */
            moveToCart: async (product, addToCartFn) => {
                const success = await addToCartFn(product, 1);
                if (success) {
                    await get().removeFromWishlist(product._id);
                }
                return success;
            },

            /**
             * Sync wishlist from server (called on login/mount)
             */
            syncWishlist: async () => {
                const userId = get().getUserId();
                if (!userId) return;

                set({ isLoading: true });

                try {
                    const { data } = await api.get(`/carts/users/${userId}/wishlist`);
                    const validWishlistItems = (data.wishlist || []).filter(item => item?.product != null);
                    set({ wishlist: validWishlistItems, isLoading: false });
                } catch (error) {
                    set({ error: error.message, isLoading: false });
                }
            },

            /**
             * Clear entire wishlist
             */
            clearWishlist: () => {
                set({ wishlist: [] });
            },

            /**
             * Get user ID from localStorage
             */
            getUserId: () => {
                try {
                    const auth = localStorage.getItem('auth');
                    if (auth) {
                        const authData = JSON.parse(auth);
                        return authData?.user?._id;
                    }
                } catch (error) {
                    console.error('Error getting user ID:', error);
                }
                return null;
            },

            /**
             * Get wishlist item count
             */
            getItemCount: () => {
                return get().wishlist.length;
            },
        }),
        {
            name: 'wishlist-storage',
            partialize: (state) => ({ wishlist: state.wishlist }),
        }
    )
);

export default useWishlistStore;
