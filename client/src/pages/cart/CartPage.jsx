import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout/Layout";
import { useCart } from "../../context/cart";
import { useAuth } from "../../context/auth";
import { useNavigate } from "react-router-dom";
import DropIn from "braintree-web-drop-in-react";
import { AiFillWarning } from "react-icons/ai";
import axios from "axios";
import toast from "react-hot-toast";
import StockPopup from "./StockPopup"; // Import the StockPopup component
import { Modal, Button } from 'react-bootstrap'; // Import Modal and Button from react-bootstrap
import "./cartPage.css";
//new build

const CartPage = () => {
  const [auth] = useAuth();
  const [cart, setCart] = useCart();
  const [clientToken, setClientToken] = useState("");
  const [instance, setInstance] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [minimumOrder, setMinimumOrder] = useState(0);
  const [advancePercentage, setAdvancePercentage] = useState(0);
  const [minimumOrderCurrency, setMinimumOrderCurrency] = useState("");
  const [orderPlacementInProgress, setOrderPlacementInProgress] = useState(false);
  const [orderErrorMessage, setOrderErrorMessage] = useState("");
  const [retryCount, setRetryCount] = useState(0); // Track payment retry attempts
  const [isProcessing, setIsProcessing] = useState(false); // Track processing state
  const [networkError, setNetworkError] = useState(false); // Track network errors
  const [showStockPopup, setShowStockPopup] = useState(false); // State for stock popup visibility
  const [exceededProduct, setExceededProduct] = useState(null); // State for the product that exceeded stock

  const navigate = useNavigate();

  // New function to get price based on product and quantity
  const getPriceForProduct = (product, quantity) => {
    if (!product) return 0;
    
    const unitSet = product.unitSet || 1;
  
    if (product.bulkProducts && product.bulkProducts.length > 0) {
      // Sort bulk products based on minimum quantity in descending order
      const sortedBulkProducts = [...product.bulkProducts]
        .filter(bp => bp && bp.minimum)
        .sort((a, b) => b.minimum - a.minimum);
  
      // If quantity is greater than the maximum quantity of the first bulk price
      // (which is the highest one due to descending sort), use that price
      if (
        sortedBulkProducts.length > 0 && 
        quantity >= (sortedBulkProducts[0].minimum * unitSet)
      ) {
        return parseFloat(sortedBulkProducts[0].selling_price_set);
      }
  
      // Find the bulk price that applies to the current quantity
      const applicableBulk = sortedBulkProducts.find(
        (bp) =>
          quantity >= (bp.minimum * unitSet) && 
          (!bp.maximum || quantity <= (bp.maximum * unitSet))
      );
  
      // Return the selling price from the applicable bulk price
      if (applicableBulk) {
        return parseFloat(applicableBulk.selling_price_set);
      }
    }
  
    // Fallback: return the regular price
    return parseFloat(product.perPiecePrice || product.price || 0);
  };

  useEffect(() => {
    if (auth?.token && auth?.user?._id) {
      getCart();
      fetchMinimumOrder();
      if (auth?.user?.pincode) {
        checkPincode(auth.user.pincode);
      }
      // getToken();
    }
  }, [auth?.token, auth?.user?._id]);

  const getCart = async () => {
    try {
      const { data } = await axios.get(`/api/v1/carts/users/${auth.user._id}/cart`);
      // Filter out items with null products to prevent errors
      const validCartItems = (data.cart || []).filter(item => item.product !== null);
      setCart(validCartItems);
    } catch (error) {
      console.log(error);
      ////toast.error("Error fetching cart");
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
      ////toast.error("Error fetching minimum order amount");
    }
  };

  const removeCartItem = async (pid) => {
    try {
      // Modified to include productId in the URL path instead of request body
      await axios.delete(`/api/v1/carts/users/${auth.user._id}/cart/${pid}`);
      getCart(); // Refresh cart after removal
      //toast.success("Item removed from cart");
    } catch (error) {
      console.log(error);
      ////toast.error("Error removing item from cart");
    }
  };

  const clearCart = async () => {
    try {
      if (!auth?.user?._id) return;

      const response = await axios.delete(`/api/v1/carts/users/${auth.user._id}/cart`);

      if (response.data.status === 'success') {
        setCart([]);
        //toast.success("Cart cleared successfully");
      } else {
        ////toast.error("Failed to clear cart");
      }
    } catch (error) {
      console.log(error);
      ////toast.error("Error clearing cart");
    }
  };

  useEffect(() => {
    // Dynamically load the Razorpay script
    const loadRazorpayScript = (src) => {
      return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = src;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });
    };

    const initRazorpay = async () => {
      const isScriptLoaded = await loadRazorpayScript("https://checkout.razorpay.com/v1/checkout.js");

      if (!isScriptLoaded) {
        alert("Failed to load Razorpay checkout script.");
      }
    };

    initRazorpay();
  }, []);

  const handleQuantityChange = async (productId, newQuantity) => {
    const product = cart.find(item => item.product._id === productId)?.product;
    if (!product) return;
  
    if (newQuantity < 1) {
      removeCartItem(productId);
      return;
    }
  
    if (newQuantity > product.stock) {
      setExceededProduct(product);
      setShowStockPopup(true);
      return;
    }
  
    try {
      await axios.post(
        `/api/v1/carts/users/${auth.user._id}/cartq/${productId}`,
        { quantity: newQuantity },
        {
          headers: {
            'Authorization': `Bearer ${auth.user.token}`,
            'Content-Type': 'application/json'
          }
        }
      );
  
      const updatedCart = cart.map(item => 
        item.product && item.product._id === productId 
          ? { ...item, quantity: newQuantity }
          : item
      );
      setCart(updatedCart);
      
      //toast.success("Quantity updated successfully");
    } catch (error) {
      console.error("Quantity update error:", error);
      ////toast.error("Failed to update quantity");
    }
  };

  const totalPrice = () => {
    try {
      if (!Array.isArray(cart)) return 0;
  
      let total = 0;
  
      cart.forEach((item) => {
        if (!item || !item.product) return;
        
        const { product, quantity } = item;
        if (product && quantity > 0) {
          const itemPrice = getPriceForProduct(product, quantity);
          total += itemPrice * quantity;
        }
      });
  
      return total;
    } catch (error) {
      console.error("Error calculating total price:", error);
      return 0;
    }
  };

  const canPlaceOrder = () => {
    const total = totalPrice();
    return (
      !loading &&
      !orderPlacementInProgress &&
      total >= minimumOrder &&
      Array.isArray(cart) && cart.length > 0 &&
      (paymentMethod !== "Braintree" || instance)
    );
  };

  const checkPincode = async (pincode) => {
    try {
      const { data } = await axios.get("/api/v1/pincodes/get-pincodes");
      if (data.success) {
        const availablePincodes = data.pincodes.map((pin) => pin.code);
        if (availablePincodes.includes(pincode.toString())) {
          // setIsPincodeAvailable(true);
          // //toast.success("Delivery available for your pincode");
        } else {
          // setIsPincodeAvailable(false);
          ////toast.error("Delivery not available for your pincode");
        }
      }
    } catch (error) {
      console.log(error);
      // setIsPincodeAvailable(false);
      ////toast.error("Error checking pincode");
    }
  };

  const handlePaymentWithRetry = async () => {
    if (isProcessing) return; // Prevent multiple clicks
    
    setIsProcessing(true);
    setNetworkError(false);
    setOrderErrorMessage("");
    
    try {
      await handlePayment();
    } catch (error) {
      console.error("Payment processing error:", error);
      
      // Only retry network errors, not validation errors
      const isNetworkError = error.message && (
        error.message.includes("network") || 
        error.message.includes("connection") ||
        error.message.includes("abort") ||
        error.message.includes("timeout")
      );
      
      if (isNetworkError && retryCount < 2) {
        setNetworkError(true);
        setRetryCount(prev => prev + 1);
        //toast.error("Network error. Retrying payment...");
        
        // Retry after a short delay
        setTimeout(() => {
          handlePaymentWithRetry();
        }, 2000);
      } else {
        //toast.error("Payment failed. Please try again later.");
        setOrderErrorMessage(
          "Payment processing failed. Please check your internet connection and try again."
        );
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayment = async () => {
    const total = totalPrice();
  
    if (!auth?.user?._id) {
      ////toast.error("Please login to proceed with payment");
      return;
    }
  
    setLoading(true);
    setOrderPlacementInProgress(true);
    setOrderErrorMessage("");
  
    try {
      let amount = 0;
      let amountPending = 0;
  
      // Set amounts based on payment method
      switch(paymentMethod) {
        case "Razorpay":
          amount = total;
          amountPending = 0;
          break;
        case "COD":
          amount = 0;
          amountPending = total;
          break;
        case "Advance":
          const advanceAmount = (advancePercentage / 100) * total;
          amount = advanceAmount;
          amountPending = total - advanceAmount;
          break;
        default:
          amount = 0;
          amountPending = total;
      }
  
      const payload = {
        products: Array.isArray(cart)
          ? cart.map(item => ({
              product: item.product._id,
              quantity: item.quantity,
              price: getPriceForProduct(item.product, item.quantity),
            }))
          : [],
        paymentMethod,
        amount,
        amountPending
      };
  
      if (paymentMethod === "COD") {
        // Configure timeout for the API request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        try {
          const { data } = await axios.post(
            "/api/v1/product/process-payment", 
            payload, 
            {
              signal: controller.signal,
              timeout: 30000, // Axios timeout
              headers: {
                'Content-Type': 'application/json',
                                'Cache-Control': 'no-cache',
                'Authorization': auth?.token
              }
            }
          );
          
          clearTimeout(timeoutId);
          
          if (data.success) {
            await clearCart();
            //toast.success("Order Placed Successfully!");
            navigate("/dashboard/user/orders");
          } else {
            throw new Error(data.message || "Failed to place order");
          }
        } catch (error) {
          clearTimeout(timeoutId);
          
          // Enhanced error handling with more detailed messages
          if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
            throw new Error("Request timed out. Please check your internet connection and try again.");
          }
          
          if (error.response) {
            // The server responded with a status code outside the 2xx range
            throw new Error(error.response.data.message || "Server responded with an error");
          } else if (error.request) {
            // The request was made but no response was received
            throw new Error("No response from server. Please check your internet connection.");
          } else {
            // Something else happened in setting up the request
            throw error;
          }
        }
        
        return;
      }
  
      if (paymentMethod === "Razorpay" || paymentMethod === "Advance") {
        // Configure timeout for the API request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        try {
          const { data } = await axios.post(
            "/api/v1/product/process-payment", 
            payload, 
            {
              signal: controller.signal,
              timeout: 30000, // Axios timeout
              headers: {
                'Content-Type': 'application/json',
                                'Cache-Control': 'no-cache', 
                    'Authorization': auth?.token
              }
            }
          );
          
          clearTimeout(timeoutId);
  
          if (!data.success || !data.razorpayOrder) {
            throw new Error(data.message || "Failed to create Razorpay order");
          }
  
          const options = {
            key: data.key,
            amount: data.razorpayOrder.amount,
            currency: "INR",
            name: "Smitox",
            description: paymentMethod === "Advance" ? "Advance Payment" : "Order Payment",
            order_id: data.razorpayOrder.id,
            handler: async function (response) {
              try {
                const verifyPayload = {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                };
  
                const verifyResponse = await axios.post(
                  "/api/v1/product/verify-payment", 
                  verifyPayload,
                  {
                    timeout: 30000, // 30 second timeout
                    headers: {
                      'Content-Type': 'application/json',
                                            'Authorization': auth?.token
                    }
                  }
                );
  
                if (verifyResponse.data.success) {
                  await clearCart();
                  //toast.success("Payment successful! Order placed successfully");
                  navigate("/dashboard/user/orders");
                } else {
                  throw new Error(verifyResponse.data.message || "Payment verification failed");
                }
              } catch (verifyError) {
                //toast.error(verifyError.message || "Payment verification failed");
                console.error("Verification error:", verifyError);
                setOrderErrorMessage("Payment verification failed. Please contact support.");
              } finally {
                setLoading(false);
                setOrderPlacementInProgress(false);
              }
            },
            prefill: {
              name: auth?.user?.user_fullname || "",
              email: auth?.user?.email || "",
              contact: auth?.user?.phone || "",
            },
            theme: {
              color: "#3399cc",
            },
            modal: {
              ondismiss: function() {
                setLoading(false);
                setOrderPlacementInProgress(false);
              }
            }
          };
  
          const rzp = new window.Razorpay(options);
          rzp.open();
  
          rzp.on('payment.failed', function (response) {
            ////toast.error("Payment failed. Please try again.");
            setLoading(false);
            setOrderPlacementInProgress(false);
            setOrderErrorMessage("Payment gateway reported a failure. Please try again or use a different payment method.");
          });
        } catch (error) {
          clearTimeout(timeoutId);
          
          // Enhanced error handling with more detailed messages
          let errorMessage = "Payment processing failed";
          
          if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
            errorMessage = "Request timed out. Please check your internet connection and try again.";
          } else if (error.response) {
            errorMessage = error.response.data.message || "Server responded with an error";
          } else if (error.request) {
            errorMessage = "No response from server. Please check your internet connection.";
          } else {
            errorMessage = error.message || "Payment processing failed";
          }
          
          setOrderErrorMessage(errorMessage);
          //toast.error(errorMessage);
          console.error("Payment error:", error);
          throw error; // Rethrow for retry mechanism
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Payment processing failed";
      setOrderErrorMessage(errorMessage);
      //toast.error(errorMessage);
      console.error("Payment error:", error);
      throw error; // Rethrow for retry mechanism
    } finally {
      if (paymentMethod === "COD" || paymentMethod === "Advance") {
        setLoading(false);
        setOrderPlacementInProgress(false);
      }
    }
  };

  const handleProductClick = (slug) => {
    navigate(`/product/${slug}`);
  };
  
  // Ensure cart is an array before filtering
  const validCartItems = Array.isArray(cart) 
    ? cart.filter(item => item && item.product) 
    : [];

  return (
    <Layout>
      <div className="cart-page container" style={{ paddingTop: "100px" }}>
        <div className="row">
          <div className="col-12">
            <h1 className="text-center bg-light p-2 mb-1">
              {!auth?.user ? "Hello Guest" : `Hello ${auth?.user?.user_fullname}`}
              <p className="text-center">
                {validCartItems.length
                  ? `You Have ${validCartItems.length} items in your cart ${
                      auth?.token ? "" : "please login to checkout!"
                    }`
                  : "Your Cart Is Empty"}
              </p>
            </h1>
          </div>
        </div>

        {/* Table Layout for Cart Items */}
        <div className="row">
          <div className="col-md-8">
            {validCartItems.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-bordered">
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Unit Price</th>
                      <th>Total Price</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validCartItems.map((item) => (
                      <tr key={item._id}>
                        <td>
                          <img
                            src={item.product?.photos || '/placeholder-image.png'}
                            alt={item.product?.name || 'Product'}
                            style={{
                              width: "80px",
                              height: "80px",
                              objectFit: "cover",
                            }}
                            loading="lazy" // Add lazy loading attribute
                          />
                        </td>
                        <td>{item.product?.name || 'Product no longer available'}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (item.product) {
                                  const unitSet = item.product.unitSet || 1;
                                  handleQuantityChange(
                                    item.product._id,
                                    item.quantity - unitSet
                                  );
                                }
                              }}
                              className="btn btn-sm btn-light"
                              disabled={!item.product}
                            >
                              -
                            </button>
                            <input
                            type="number"
                            min="1"
                            max="10000"
                            value={item.quantity}
                            readOnly // Make the input non-editable
                            className="form-control mx-2"
                            style={{ width: "100px", textAlign: "center" }}
                          />

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (item.product) {
                                  const unitSet = item.product.unitSet || 1;
                                  handleQuantityChange(
                                    item.product._id,
                                    item.quantity + unitSet
                                  );
                                }
                              }}
                              className="btn btn-sm btn-light"
                              disabled={!item.product}
                            >
                              +
                            </button>
                          </div>
                        </td>
                      
                        <td>
                          {item.product ? 
                            getPriceForProduct(item.product, item.quantity).toFixed(2) : 
                            'N/A'}
                        </td>
                        <td>
                          {item.product ? 
                            (item.quantity * getPriceForProduct(item.product, item.quantity)).toFixed(2) : 
                            'N/A'}
                        </td>
                        <td>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (item.product) {
                                removeCartItem(item.product._id);
                              }
                            }}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center">Your cart is empty.</p>
            )}
          </div>

          {/* Cart Summary */}
          <div className="col-md-4">
            <h2>Cart Summary</h2>
            
            <hr />
            
            <p>
              Total:{" "}
              {totalPrice().toLocaleString("en-US", {
                style: "currency",
                currency: minimumOrderCurrency || "INR",
              })}
            </p>
            
            {advancePercentage > 0 && paymentMethod === "Advance" && (
              <>
                <p>
                  Advance Amount ({advancePercentage}%):{" "}
                  {((advancePercentage / 100) * totalPrice()).toLocaleString("en-US", {
                    style: "currency",
                    currency: minimumOrderCurrency || "INR",
                  })}
                </p>
                <p>
                  Remaining Amount:{" "}
                  {(totalPrice() - (advancePercentage / 100) * totalPrice()).toLocaleString("en-US", {
                    style: "currency",
                    currency: minimumOrderCurrency || "INR",
                  })}
                </p>
              </>
            )}

            <p>
              Minimum Order:{" "}
              {minimumOrder.toLocaleString("en-US", {
                style: "currency",
                currency: minimumOrderCurrency || "INR",
              })}
            </p>
            {   
             <p className="text-danger">
          
         {totalPrice() < minimumOrder && (
              <p className="text-danger">
                Order total is below the minimum order amount.
              </p>
            )}
        
        </p>}
        {   
             <p className="text-danger">
          <ul>
  
            <li>Courier charge will be added (depends on weight and COD amount).</li>
            {advancePercentage > 0 && (
              <li>{advancePercentage}% advance payment is available to confirm the order.</li>
            )}
          </ul>
        </p>}
        <div className="mb-3">
            <label className="form-label">Payment Method</label>
            <select
              className="form-select"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="COD">COD</option>
              <option value="Razorpay">Razorpay</option>
              {advancePercentage > 0 && (
                <option value="Advance">Advance Payment ({advancePercentage}%)</option>
              )}
            </select>
          </div>

          <button
            className="btn btn-primary w-100"
            onClick={handlePaymentWithRetry}
            disabled={!canPlaceOrder() || isProcessing}
          >
            {isProcessing ? 
              "Processing..." : 
              networkError ? 
                `Retrying (${retryCount})...` : 
                "Place Order"}
          </button>

          {/* Network error message */}
          {networkError && (
            <div className="alert alert-warning mt-2">
              <AiFillWarning /> Network issues detected. Retrying payment...
            </div>
          )}

          {/* Order error message with more details */}
          {orderErrorMessage && (
            <div className="alert alert-danger mt-2">
              <AiFillWarning /> {orderErrorMessage}
              <p className="mt-2 small">
                If you continue to face issues, please:
                <br />
                1. Check your internet connection
                <br />
                2. Try refreshing the page
                <br />
                3. Contact our support if the problem persists
              </p>
            </div>
          )}
          
          {/* ...existing code... */}
        </div>
        </div>
        {/* Stock Popup Modal */}
        <StockPopup
          show={showStockPopup}
          onHide={() => setShowStockPopup(false)}
          product={exceededProduct}
          requestedQuantity={
            exceededProduct ? 
            cart.find(item => item.product._id === exceededProduct._id)?.quantity + 1 : 
            0
          }
        />
      </div>
    </Layout>
  );
};
export default CartPage;