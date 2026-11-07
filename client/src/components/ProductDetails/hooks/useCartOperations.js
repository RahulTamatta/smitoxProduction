import axios from 'axios';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/auth';
import useCartStore from '../../../store/cart.store';

/**
 * Product page cart logic.
 *
 * The quantity lives in the shared cart store (store/cart.store.js), so a
 * change here shows up on every product card, the cart page and the header —
 * and a change on a product card shows up here.
 */
export const useCartOperations = (product) => {
  const navigate = useNavigate();
  const [auth] = useAuth();
  const [selectedQuantity] = useState(0);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [quantity] = useState(1);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showStockPopup, setShowStockPopup] = useState(false);
  const isAddingToCartRef = useRef(false);

  const unitSet = Math.max(1, Number(product?.unitSet) || 1);

  // Shared quantity for this product (re-renders when any page changes it)
  const displayQuantity = useCartStore((state) => {
    const item = (state.cart || []).find(
      (i) => (i.product?._id || i.product) === product?._id
    );
    return item ? item.quantity : 0;
  });
  const showQuantitySelector = displayQuantity > 0;

  // Guard against touch + click double-fire (same as before)
  const lastTouchRef = useRef(0);
  const TOUCH_CLICK_THRESHOLD_MS = 350;

  useEffect(() => {
    if (product._id && auth?.user?._id) {
      checkWishlistStatus(product._id);
      fetchInitialQuantity(product._id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product._id, auth?.user?._id]);

  const getApplicableBulkProduct = useCallback((qty) => {
    if (!product.bulkProducts || product.bulkProducts.length === 0) return null;

    const sortedBulkProducts = [...product.bulkProducts]
      .filter((bulk) => bulk && bulk.minimum)
      .sort((a, b) => b.minimum - a.minimum);

    if (sortedBulkProducts.length > 0 && qty >= sortedBulkProducts[0].minimum * unitSet) {
      return sortedBulkProducts[0];
    }

    for (let i = 0; i < sortedBulkProducts.length; i++) {
      const bulk = sortedBulkProducts[i];
      if (qty >= bulk.minimum * unitSet && (!bulk.maximum || qty <= bulk.maximum * unitSet)) {
        return bulk;
      }
    }

    return null;
  }, [product.bulkProducts, unitSet]);

  // Bulk tier + total derived from the shared quantity
  const selectedBulk = useMemo(
    () => (displayQuantity > 0 ? getApplicableBulkProduct(displayQuantity) : null),
    [displayQuantity, getApplicableBulkProduct]
  );
  const totalPrice = useMemo(() => {
    if (displayQuantity <= 0) return 0;
    return selectedBulk
      ? displayQuantity * parseFloat(selectedBulk.selling_price_set)
      : displayQuantity * parseFloat(product.perPiecePrice || 0);
  }, [displayQuantity, selectedBulk, product.perPiecePrice]);

  // Kept for backwards compatibility with callers; totals are now derived.
  const calculateTotalPrice = () => {};

  const addToCart = async () => {
    if (!auth.user) {
      setShowLoginPrompt(true);
      navigate('/login');
      return;
    }
    if (isAddingToCartRef.current) return;
    if (!navigator.onLine) {
      toast.error("No internet connection. Please check your network.");
      return;
    }
    if (unitSet > product.stock) {
      setShowStockPopup(true);
      return;
    }

    isAddingToCartRef.current = true;
    setIsAddingToCart(true);
    try {
      const store = useCartStore.getState();
      // Optimistic: the quantity selector appears immediately
      const result = store.setProductQuantity(product, unitSet);
      if (result === 'exceedsStock') {
        setShowStockPopup(true);
        return;
      }
      await store.flushProduct(product._id);
      if (useCartStore.getState().getQuantity(product._id) > 0) {
        toast.success("Product added to cart");
      } else {
        toast.error(useCartStore.getState().error || "Failed to add product to cart");
      }
    } finally {
      isAddingToCartRef.current = false;
      setIsAddingToCart(false);
    }
  };

  const handleQuantityChange = useCallback((increment, eventType = 'click') => {
    // Ignore click events that fired within 350ms of a touchstart (double-fire guard)
    if (eventType === 'click' && Date.now() - lastTouchRef.current < TOUCH_CLICK_THRESHOLD_MS) {
      return;
    }
    if (eventType === 'touch') {
      lastTouchRef.current = Date.now();
    }
    if (!navigator.onLine) {
      toast.error("No internet connection. Please check your network.");
      return;
    }

    const store = useCartStore.getState();
    // Read the latest value from the store (never a stale closure)
    const currentQty = store.getQuantity(product._id);
    const updatedQuantity = Math.max(0, currentQty + (increment ? 1 : -1) * unitSet);

    if (increment && updatedQuantity > product.stock) {
      setShowStockPopup(true);
      return;
    }

    // Optimistic update + debounced, serialised server sync (in the store)
    const result = store.setProductQuantity(product, updatedQuantity);
    if (result === 'exceedsStock') setShowStockPopup(true);
    if (result === 'notLoggedIn') navigate('/login');
  }, [unitSet, product, navigate]);

  const fetchInitialQuantity = async (productId) => {
    if (!auth?.user?._id || !productId) return;

    try {
      const { data } = await axios.get(
        `/api/v1/carts/users/${auth.user._id}/products/${productId}/quantity`,
        {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        }
      );
      // Share the server value (ignored if the user already changed it)
      useCartStore.getState().applyServerQuantity(product, Number(data?.quantity) || 0);
    } catch (error) {
      console.error("Error fetching quantity:", error);
    }
  };

  const toggleWishlist = async () => {
    if (!auth.user) {
      return;
    }

    try {
      if (isInWishlist) {
        await axios.delete(
          `/api/v1/carts/users/${auth.user._id}/wishlist/${product._id}`
        );
        setIsInWishlist(false);
      } else {
        await axios.post(`/api/v1/carts/users/${auth.user._id}/wishlist`, {
          productId: product._id,
        });
        setIsInWishlist(true);
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);
    }
  };

  const checkWishlistStatus = async (productId) => {
    if (!auth.user) return;

    try {
      const { data } = await axios.get(
        `/api/v1/carts/users/${auth.user._id}/wishlist/check/${productId}`
      );
      setIsInWishlist(data.exists);
    } catch (error) {
      console.error(error);
      setIsInWishlist(false);
    }
  };

  return {
    selectedQuantity,
    selectedBulk,
    totalPrice,
    isInWishlist,
    unitSet,
    quantity,
    displayQuantity,
    showQuantitySelector,
    showLoginPrompt,
    setShowLoginPrompt,
    isAddingToCart,
    showStockPopup,
    setShowStockPopup,
    isAddingToCartRef,
    addToCart,
    handleQuantityChange,
    toggleWishlist,
    getApplicableBulkProduct,
    calculateTotalPrice
  };
};
