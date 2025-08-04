import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export const useCartData = (auth, cart, setCart) => {
  const [clientToken, setClientToken] = useState("");
  const [instance, setInstance] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [minimumOrder, setMinimumOrder] = useState(0);
  const [advancePercentage, setAdvancePercentage] = useState(0);
  const [minimumOrderCurrency, setMinimumOrderCurrency] = useState("");
  const [orderPlacementInProgress, setOrderPlacementInProgress] = useState(false);
  const [orderErrorMessage, setOrderErrorMessage] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [showStockPopup, setShowStockPopup] = useState(false);
  const [exceededProduct, setExceededProduct] = useState(null);
  const [showPostPaymentDialog, setShowPostPaymentDialog] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (auth?.token && auth?.user?._id) {
      getCart();
      fetchMinimumOrder();
      if (auth?.user?.pincode) {
        checkPincode(auth.user.pincode);
      }
    }
  }, [auth?.token, auth?.user?._id]);

  const getCart = async () => {
    try {
      const { data } = await axios.get(`/api/v1/carts/users/${auth.user._id}/cart`);
      const validCartItems = (data.cart || []).filter(item => item.product !== null);
      setCart(validCartItems);
    } catch (error) {
      console.log(error);
      setCart([]);
    }
  };

  const fetchMinimumOrder = async () => {
    try {
      const { data } = await axios.get('/api/v1/minimumOrder/getMinimumOrder');
      if (data) {
        setMinimumOrder(data.amount);
        setAdvancePercentage(data.advancePercentage || 0);
        setMinimumOrderCurrency(data.currency === "rupees" ? "INR" : data.currency);
      }
    } catch (error) {
      console.error('Error fetching minimum order:', error);
    }
  };

  return {
    clientToken,
    setClientToken,
    instance,
    setInstance,
    loading,
    setLoading,
    paymentMethod,
    setPaymentMethod,
    minimumOrder,
    advancePercentage,
    minimumOrderCurrency,
    orderPlacementInProgress,
    setOrderPlacementInProgress,
    orderErrorMessage,
    setOrderErrorMessage,
    retryCount,
    setRetryCount,
    isProcessing,
    setIsProcessing,
    networkError,
    setNetworkError,
    showStockPopup,
    setShowStockPopup,
    exceededProduct,
    setExceededProduct,
    showPostPaymentDialog,
    setShowPostPaymentDialog,
    getCart,
    fetchMinimumOrder
  };
};

