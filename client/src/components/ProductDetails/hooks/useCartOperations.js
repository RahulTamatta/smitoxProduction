import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/auth';
import { useCart } from '../../../context/cart';
import axios from 'axios';
import toast from 'react-hot-toast';

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
  const isAddingToCartRef = useRef(false);

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
        setDisplayQuantity(initialQuantity);
        setSelectedBulk(applicableBulk);
        calculateTotalPrice(applicableBulk, initialQuantity);
        setShowQuantitySelector(true);
        toast.success("Product added to cart");
      }
    } catch (error) {
      console.error('[Cart] Error adding to cart:', error);
      
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

  const handleQuantityChange = async (increment) => {
    if (!navigator.onLine) {
      toast.error("No internet connection. Please check your network.");
      return;
    }

    const newQuantity = displayQuantity + (increment ? 1 : -1) * unitSet;
    const updatedQuantity = Math.max(0, newQuantity);

    // Check stock limit
    if (increment && updatedQuantity > product.stock) {
      setShowStockPopup(true);
      return;
    }

    if (updatedQuantity === 0) {
      await removeFromCart(product._id);
      setShowQuantitySelector(false);
      setDisplayQuantity(0);
      setSelectedBulk(null);
      setTotalPrice(0);
      return;
    }

    try {
      await updateQuantity(updatedQuantity);
      setDisplayQuantity(updatedQuantity);
      const applicableBulk = getApplicableBulkProduct(updatedQuantity);
      setSelectedBulk(applicableBulk);
      calculateTotalPrice(applicableBulk, updatedQuantity);
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  };

  const updateQuantity = async (quantity) => {
    if (!auth?.user?._id) {
      return;
    }

    try {
      const response = await axios.post(
        `/api/v1/carts/users/${auth.user._id}/cartq/${product._id}`,
        { quantity },
        {
          headers: {
            Authorization: `Bearer ${auth.user.token}`,
            "Content-Type": "application/json",
          },
        }
      );
    } catch (error) {
      console.error("Quantity update error:", error);
    }
  };

  const removeFromCart = async (productId) => {
    if (!auth.user._id) return;

    try {
      const response = await axios.delete(
        `/api/v1/carts/users/${auth.user._id}/cart/${productId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${auth.user.token}`,
          },
        }
      );
    } catch (error) {
      console.error("Remove from cart failed:", error.message);
    }
  };

  const fetchInitialQuantity = async (productId) => {
    if (!auth?.user?._id || !productId) return;

    try {
      const { data } = await axios.get(
        `/api/v1/carts/users/${auth.user._id}/products/${productId}/quantity`,
        {
          headers: {
            Authorization: `Bearer ${auth.user.token}`,
          },
        }
      );

      if (data.quantity) {
        const quantity = data.quantity;
        setDisplayQuantity(quantity);
        setShowQuantitySelector(quantity > 0);

        const applicableBulk = getApplicableBulkProduct(quantity);
        setSelectedBulk(applicableBulk);
        calculateTotalPrice(applicableBulk, quantity);
      } else {
        setDisplayQuantity(0);
        setShowQuantitySelector(false);
        setSelectedBulk(null);
        setTotalPrice(0);
      }
    } catch (error) {
      console.error("Error fetching quantity:", error);
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
