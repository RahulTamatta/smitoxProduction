import axios from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/auth';
import { useCart } from '../../../context/cart';

export const useCartOperations = (product) => {
  const navigate = useNavigate();
  const [auth] = useAuth();
  const [cart, setCart] = useCart();
  const [selectedQuantity, setSelectedQuantity] = useState(0);
  const [selectedBulk, setSelectedBulk] = useState(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [unitSet, setUnitSet] = useState(1);
  const [quantity, setQuantity] = useState(1);
  const [displayQuantity, setDisplayQuantity] = useState(0);
  const [showQuantitySelector, setShowQuantitySelector] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showStockPopup, setShowStockPopup] = useState(false);

  // FIX 1: Track in-flight state via a ref BUT also mirror it to state so the
  // button can correctly re-render disabled/enabled without stale closure issues.
  const isAddingToCartRef = useRef(false);

  // FIX 2: Use a ref to hold the LATEST displayQuantity so async callbacks
  // always operate on the correct value without stale closures.
  const displayQuantityRef = useRef(0);
  useEffect(() => {
    displayQuantityRef.current = displayQuantity;
  }, [displayQuantity]);

  // FIX 3: Serialise quantity-change operations so rapid clicks are queued
  // rather than dropped. Each click is processed in order.
  const pendingOpsRef = useRef(Promise.resolve());
  const enqueueOp = useCallback((opFn) => {
    pendingOpsRef.current = pendingOpsRef.current
      .then(opFn)
      .catch((err) => console.error('[Cart] Queued op failed:', err));
  }, []);

  // FIX 4: Track last touch timestamp to prevent double-fire on touch + click
  const lastTouchRef = useRef(0);
  const TOUCH_CLICK_THRESHOLD_MS = 350;

  const axiosConfig = {
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      'Connection': 'keep-alive'
    }
  };

  useEffect(() => {
    if (product._id && auth?.user?._id) {
      checkWishlistStatus(product._id);
      fetchInitialQuantity(product._id);
    }
  }, [product._id, auth?.user?._id]);

  useEffect(() => {
    setUnitSet(product?.unitSet || 1);
  }, [product?.unitSet]);

  const getApplicableBulkProduct = (quantity) => {
    if (!product.bulkProducts || product.bulkProducts.length === 0) return null;

    const sortedBulkProducts = [...product.bulkProducts]
      .filter((bulk) => bulk && bulk.minimum)
      .sort((a, b) => b.minimum - a.minimum);

    if (
      sortedBulkProducts.length > 0 &&
      quantity >= sortedBulkProducts[0].minimum * unitSet
    ) {
      return sortedBulkProducts[0];
    }

    for (let i = 0; i < sortedBulkProducts.length; i++) {
      const bulk = sortedBulkProducts[i];
      if (
        quantity >= bulk.minimum * unitSet &&
        (!bulk.maximum || quantity <= bulk.maximum * unitSet)
      ) {
        return bulk;
      }
    }

    return null;
  };

  const calculateTotalPrice = (bulk, quantity) => {
    if (bulk) {
      setTotalPrice(quantity * parseFloat(bulk.selling_price_set));
    } else {
      setTotalPrice(quantity * parseFloat(product.perPiecePrice || 0));
    }
  };

  const addToCart = async () => {
    if (!auth.user) {
      setShowLoginPrompt(true);
      navigate('/login');
      return;
    }

    if (isAddingToCartRef.current) {
      console.log('[Cart] Add to cart operation in progress');
      return;
    }

    if (!navigator.onLine) {
      toast.error("No internet connection. Please check your network.");
      return;
    }

    isAddingToCartRef.current = true;
    setIsAddingToCart(true);

    try {
      console.log('[Cart] Adding product to cart');
      const initialQuantity = unitSet * 1;
      const applicableBulk = getApplicableBulkProduct(initialQuantity);

      // Check stock before adding
      if (initialQuantity > product.stock) {
        setShowStockPopup(true);
        return;
      }

      // FIX 5: Optimistic UI update — show quantity immediately so the user
      // gets instant feedback, even before the server responds.
      setDisplayQuantity(initialQuantity);
      setSelectedBulk(applicableBulk);
      calculateTotalPrice(applicableBulk, initialQuantity);
      setShowQuantitySelector(true);

      const response = await axios.post(
        `/api/v1/carts/users/${auth.user._id}/cart`,
        {
          productId: product._id,
          quantity: initialQuantity,
          price: applicableBulk ? parseFloat(applicableBulk.selling_price_set) : parseFloat(product.price),
          bulkProductDetails: applicableBulk,
        },
        axiosConfig
      );

      console.log('[Cart] Add to cart response:', response.data);

      if (response.data.status === "success") {
        setCart(response.data.cart);
        toast.success("Product added to cart");
      } else {
        // Rollback optimistic update on failure
        setDisplayQuantity(0);
        setShowQuantitySelector(false);
        setSelectedBulk(null);
        setTotalPrice(0);
      }
    } catch (error) {
      console.error('[Cart] Error adding to cart:', error);

      // Rollback optimistic update on error
      setDisplayQuantity(0);
      setShowQuantitySelector(false);
      setSelectedBulk(null);
      setTotalPrice(0);

      let errorMessage = "Failed to add product to cart";

      if (!navigator.onLine) {
        errorMessage = "No internet connection. Please check your network.";
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = "Request timed out. Please try again.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast.error(errorMessage);
    } finally {
      isAddingToCartRef.current = false;
      setIsAddingToCart(false);
    }
  };

  // FIX 6: Wrap handleQuantityChange so it guards against touch/click double-fire
  // and queues operations so rapid taps are all processed in order.
  const handleQuantityChange = useCallback((increment, eventType = 'click') => {
    // Ignore click events that fired within 350ms of a touchstart (double-fire guard)
    if (eventType === 'click') {
      const now = Date.now();
      if (now - lastTouchRef.current < TOUCH_CLICK_THRESHOLD_MS) {
        console.log('[Cart] Ignoring click — already handled by touchstart');
        return;
      }
    }
    if (eventType === 'touch') {
      lastTouchRef.current = Date.now();
    }

    if (!navigator.onLine) {
      toast.error("No internet connection. Please check your network.");
      return;
    }

    // FIX 7: Compute the next quantity from the ref (not stale closure) so
    // multiple rapid clicks each see the correct running total.
    const currentQty = displayQuantityRef.current;
    const newQuantity = currentQty + (increment ? 1 : -1) * unitSet;
    const updatedQuantity = Math.max(0, newQuantity);

    // Check stock limit BEFORE optimistic update
    if (increment && updatedQuantity > product.stock) {
      setShowStockPopup(true);
      return;
    }

    // FIX 8: Optimistic UI — update the display immediately so taps feel instant.
    displayQuantityRef.current = updatedQuantity;
    setDisplayQuantity(updatedQuantity);

    if (updatedQuantity === 0) {
      setShowQuantitySelector(false);
      setSelectedBulk(null);
      setTotalPrice(0);
      // Enqueue the actual removal
      enqueueOp(() => removeFromCart(product._id));
      return;
    }

    const applicableBulk = getApplicableBulkProduct(updatedQuantity);
    setSelectedBulk(applicableBulk);
    calculateTotalPrice(applicableBulk, updatedQuantity);

    // Enqueue the API sync — if user clicks fast, all changes are applied in order
    enqueueOp(() => updateQuantity(updatedQuantity, applicableBulk));
  }, [unitSet, product.stock, product._id, enqueueOp]);

  const updateQuantity = async (quantity, applicableBulk) => {
    if (!auth?.user?._id) {
      return;
    }

    try {
      await axios.post(
        `/api/v1/carts/users/${auth.user._id}/cartq/${product._id}`,
        { quantity },
        {
          headers: {
            Authorization: `Bearer ${auth.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // FIX 9: Use functional updater to avoid stale closure on cart state.
      setCart(prevCart => prevCart.map(item =>
        item.product._id === product._id
          ? { ...item, quantity }
          : item
      ));

    } catch (error) {
      console.error("Quantity update error:", error);
      // On API failure, re-fetch the real quantity from the server to re-sync
      await fetchInitialQuantity(product._id);
    }
  };

  const removeFromCart = async (productId) => {
    if (!auth.user._id) return;

    try {
      await axios.delete(
        `/api/v1/carts/users/${auth.user._id}/cart/${productId}`,
        {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        }
      );

      // FIX 10: Use functional updater to avoid stale closure on cart state.
      setCart(prevCart => prevCart.filter(item => item.product._id !== productId));

    } catch (error) {
      console.error("Remove from cart failed:", error.message);
      // Re-sync on failure
      await fetchInitialQuantity(productId);
    }
  };

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

      if (data.quantity) {
        const quantity = data.quantity;
        displayQuantityRef.current = quantity;
        setDisplayQuantity(quantity);
        setShowQuantitySelector(quantity > 0);

        const applicableBulk = getApplicableBulkProduct(quantity);
        setSelectedBulk(applicableBulk);
        calculateTotalPrice(applicableBulk, quantity);
      } else {
        displayQuantityRef.current = 0;
        setDisplayQuantity(0);
        setShowQuantitySelector(false);
        setSelectedBulk(null);
        setTotalPrice(0);
      }
    } catch (error) {
      console.error("Error fetching quantity:", error);
      displayQuantityRef.current = 0;
      setDisplayQuantity(0);
      setShowQuantitySelector(false);
      setSelectedBulk(null);
      setTotalPrice(0);
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
