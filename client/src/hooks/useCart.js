import { useCallback, useEffect, useRef } from 'react';
import useCartStore from '../store/cart.store';

/**
 * Custom hook for cart operations with debounced quantity updates
 * Abstracts cart store and provides smooth UX
 */
const useCart = () => {
    const cart = useCartStore(state => state.cart);
    const addToCart = useCartStore(state => state.addToCart);
    const removeFromCart = useCartStore(state => state.removeFromCart);
    const increaseQuantity = useCartStore(state => state.increaseQuantity);
    const decreaseQuantity = useCartStore(state => state.decreaseQuantity);
    const setQuantity = useCartStore(state => state.setQuantity);
    const clearCart = useCartStore(state => state.clearCart);
    const syncCart = useCartStore(state => state.syncCart);
    const getTotalPrice = useCartStore(state => state.getTotalPrice);
    const getItemCount = useCartStore(state => state.getItemCount);
    const isLoading = useCartStore(state => state.isLoading);
    const error = useCartStore(state => state.error);

    // Debounce timer ref
    const debounceTimerRef = useRef(null);
    const pendingUpdatesRef = useRef({});

    /**
     * Debounced quantity update (300ms)
     * Prevents API spam during rapid clicks
     */
    const debouncedSetQuantity = useCallback((productId, quantity) => {
        // Store pending update
        pendingUpdatesRef.current[productId] = quantity;

        // Clear existing timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Set new timer
        debounceTimerRef.current = setTimeout(async () => {
            const updates = { ...pendingUpdatesRef.current };
            pendingUpdatesRef.current = {};

            // Execute all pending updates
            for (const [pid, qty] of Object.entries(updates)) {
                await setQuantity(pid, qty);
            }
        }, 300);
    }, [setQuantity]);

    /**
     * Increase quantity with immediate UI update and debounced API sync
     */
    const handleIncreaseQuantity = useCallback(async (productId, amount) => {
        const result = await increaseQuantity(productId, amount);
        if (result && result.quantity) {
            debouncedSetQuantity(productId, result.quantity);
        }
        return result;
    }, [increaseQuantity, debouncedSetQuantity]);

    /**
     * Decrease quantity with immediate UI update and debounced API sync
     */
    const handleDecreaseQuantity = useCallback(async (productId, amount) => {
        const result = await decreaseQuantity(productId, amount);
        if (result && result.quantity) {
            debouncedSetQuantity(productId, result.quantity);
        }
        return result;
    }, [decreaseQuantity, debouncedSetQuantity]);

    /**
     * Get price for a specific product based on quantity
     */
    const getPriceForProduct = useCallback((product, quantity) => {
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
    }, []);

    /**
     * Check if quantity is at minimum (for disabling decrease button)
     */
    const isAtMinimum = useCallback((productId) => {
        const item = cart.find(item => item.product._id === productId);
        if (!item) return true;
        const unitSet = item.product.unitSet || 1;
        return item.quantity <= unitSet;
    }, [cart]);

    /**
     * Check if quantity is at maximum stock (for disabling increase button)
     */
    const isAtMaximum = useCallback((productId) => {
        const item = cart.find(item => item.product._id === productId);
        if (!item) return true;
        return item.quantity >= item.product.stock;
    }, [cart]);

    /**
     * Get cart item by product ID
     */
    const getCartItem = useCallback((productId) => {
        return cart.find(item => item.product._id === productId);
    }, [cart]);

    // Cleanup debounce timer on unmount
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    return {
        // State
        cart,
        isLoading,
        error,

        // Actions
        addToCart,
        removeFromCart,
        increaseQuantity: handleIncreaseQuantity,
        decreaseQuantity: handleDecreaseQuantity,
        setQuantity: debouncedSetQuantity,
        clearCart,
        syncCart,

        // Computed
        getTotalPrice,
        getItemCount,
        getPriceForProduct,
        isAtMinimum,
        isAtMaximum,
        getCartItem,
    };
};

export default useCart;
