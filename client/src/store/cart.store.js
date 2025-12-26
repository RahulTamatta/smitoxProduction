import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

/**
 * Cart Store - Zustand
 * Manages cart state with localStorage persistence and optimistic updates
 */
const useCartStore = create(
    persist(
        (set, get) => ({
            // State
            cart: [],
            isLoading: false,
            error: null,

            // Actions
            /**
             * Add product to cart with optimistic update
             */
            addToCart: async (product, quantity = 1) => {
                const { cart } = get();
                const userId = get().getUserId();

                if (!userId) {
                    set({ error: 'Please login to add items to cart' });
                    return false;
                }

                // Check if product already exists in cart
                const existingItem = cart.find(item => item.product._id === product._id);

                if (existingItem) {
                    // If exists, increase quantity
                    return get().increaseQuantity(product._id, quantity);
                }

                // Optimistic update
                const newItem = {
                    _id: `temp-${Date.now()}`,
                    product,
                    quantity,
                };
                set({ cart: [...cart, newItem] });

                try {
                    // API call
                    const { data } = await api.post(`/carts/users/${userId}/cart`, {
                        productId: product._id,
                        quantity,
                    });

                    // Update with server response
                    set(state => ({
                        cart: state.cart.map(item =>
                            item._id === newItem._id ? data.cart[data.cart.length - 1] : item
                        ),
                    }));

                    return true;
                } catch (error) {
                    // Rollback on error
                    set({ cart: cart, error: error.message });
                    return false;
                }
            },

            /**
             * Remove item from cart
             */
            removeFromCart: async (productId) => {
                const { cart } = get();
                const userId = get().getUserId();

                if (!userId) return false;

                // Optimistic update
                const previousCart = [...cart];
                set({ cart: cart.filter(item => item.product._id !== productId) });

                try {
                    await api.delete(`/carts/users/${userId}/cart/${productId}`);
                    return true;
                } catch (error) {
                    // Rollback on error
                    set({ cart: previousCart, error: error.message });
                    return false;
                }
            },

            /**
             * Increase quantity with debouncing handled by hook
             */
            increaseQuantity: async (productId, amount = 1) => {
                const { cart } = get();
                const userId = get().getUserId();

                if (!userId) return false;

                const item = cart.find(item => item.product._id === productId);
                if (!item) return false;

                const unitSet = item.product.unitSet || 1;
                const newQuantity = item.quantity + (amount || unitSet);

                // Check stock
                if (newQuantity > item.product.stock) {
                    set({ error: 'Insufficient stock' });
                    return false;
                }

                // Optimistic update
                set({
                    cart: cart.map(item =>
                        item.product._id === productId
                            ? { ...item, quantity: newQuantity }
                            : item
                    ),
                });

                return { productId, quantity: newQuantity };
            },

            /**
             * Decrease quantity
             */
            decreaseQuantity: async (productId, amount = 1) => {
                const { cart } = get();
                const userId = get().getUserId();

                if (!userId) return false;

                const item = cart.find(item => item.product._id === productId);
                if (!item) return false;

                const unitSet = item.product.unitSet || 1;
                const newQuantity = item.quantity - (amount || unitSet);

                // Remove if quantity goes below 1
                if (newQuantity < 1) {
                    return get().removeFromCart(productId);
                }

                // Optimistic update
                set({
                    cart: cart.map(item =>
                        item.product._id === productId
                            ? { ...item, quantity: newQuantity }
                            : item
                    ),
                });

                return { productId, quantity: newQuantity };
            },

            /**
             * Set specific quantity (used by debounced updates)
             */
            setQuantity: async (productId, quantity) => {
                const { cart } = get();
                const userId = get().getUserId();

                if (!userId) return false;

                const item = cart.find(item => item.product._id === productId);
                if (!item) return false;

                // Validate quantity
                if (quantity < 1) {
                    return get().removeFromCart(productId);
                }

                if (quantity > item.product.stock) {
                    set({ error: 'Insufficient stock' });
                    return false;
                }

                // Optimistic update
                const previousCart = [...cart];
                set({
                    cart: cart.map(item =>
                        item.product._id === productId
                            ? { ...item, quantity }
                            : item
                    ),
                });

                try {
                    // API sync
                    await api.post(`/carts/users/${userId}/cartq/${productId}`, { quantity });
                    return true;
                } catch (error) {
                    // Rollback on error
                    set({ cart: previousCart, error: error.message });
                    return false;
                }
            },

            /**
             * Clear entire cart
             */
            clearCart: async () => {
                const userId = get().getUserId();
                if (!userId) return false;

                const previousCart = [...get().cart];
                set({ cart: [] });

                try {
                    await api.delete(`/carts/users/${userId}/cart`);
                    return true;
                } catch (error) {
                    set({ cart: previousCart, error: error.message });
                    return false;
                }
            },

            /**
             * Sync cart from server (called on login/mount)
             */
            syncCart: async () => {
                const userId = get().getUserId();
                if (!userId) return;

                set({ isLoading: true });

                try {
                    const { data } = await api.get(`/carts/users/${userId}/cart`);
                    const validCartItems = (data.cart || []).filter(item => item.product !== null);
                    set({ cart: validCartItems, isLoading: false });
                } catch (error) {
                    set({ error: error.message, isLoading: false });
                }
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
             * Calculate total price
             */
            getTotalPrice: () => {
                const { cart } = get();
                return cart.reduce((total, item) => {
                    if (!item || !item.product) return total;
                    const price = getPriceForProduct(item.product, item.quantity);
                    return total + (price * item.quantity);
                }, 0);
            },

            /**
             * Get cart item count
             */
            getItemCount: () => {
                return get().cart.length;
            },
        }),
        {
            name: 'cart-storage',
            partialize: (state) => ({ cart: state.cart }),
        }
    )
);

/**
 * Helper function to get price based on quantity and bulk pricing
 */
const getPriceForProduct = (product, quantity) => {
    if (!product) return 0;

    const unitSet = product.unitSet || 1;

    if (product.bulkProducts && product.bulkProducts.length > 0) {
        const sortedBulkProducts = [...product.bulkProducts]
            .filter(bp => bp && bp.minimum)
            .sort((a, b) => b.minimum - a.minimum);

        if (sortedBulkProducts.length > 0 && quantity >= (sortedBulkProducts[0].minimum * unitSet)) {
            return parseFloat(sortedBulkProducts[0].selling_price_set);
        }

        const applicableBulk = sortedBulkProducts.find(
            (bp) =>
                quantity >= (bp.minimum * unitSet) &&
                (!bp.maximum || quantity <= (bp.maximum * unitSet))
        );

        if (applicableBulk) {
            return parseFloat(applicableBulk.selling_price_set);
        }
    }

    return parseFloat(product.perPiecePrice || product.price || 0);
};

export default useCartStore;
