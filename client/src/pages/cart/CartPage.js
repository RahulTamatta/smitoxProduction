import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout/Layout";
import { useCart } from "../../context/cart";
import { useAuth } from "../../context/auth";
import { useNavigate } from "react-router-dom";
import DropIn from "braintree-web-drop-in-react";
import { AiFillWarning } from "react-icons/ai";
import axios from "axios";
import toast from "react-hot-toast";
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
  const [advance, setAdvcance] = useState(0);
  const [minimumOrderCurrency, setMinimumOrderCurrency] = useState("");
  const [orderPlacementInProgress, setOrderPlacementInProgress] = useState(false);
  const [orderErrorMessage, setOrderErrorMessage] = useState("");


  const [isPincodeAvailable, setIsPincodeAvailable] = useState(false);
  

  const navigate = useNavigate();

  // New function to get price based on product and quantity
  const getPriceForProduct = (product, quantity) => {
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
      setCart(data.cart || []);
    } catch (error) {
      console.log(error);
      toast.error("Error fetching cart");
      setCart([]);
    }
  };

  const fetchMinimumOrder = async () => {
    try {
      const { data } = await axios.get('/api/v1/minimumOrder/getMinimumOrder');
      if (data) {
        setMinimumOrder(data.amount);
        setAdvcance(data.advance)
        setMinimumOrderCurrency(data.currency === "rupees" ? "INR" : data.currency);
      }
    } catch (error) {
      console.error('Error fetching minimum order:', error);
      toast.error("Error fetching minimum order amount");
    }
  };


  // const getToken = async () => {
  //   try {
  //     const { data } = await axios.get("/api/v1/product/braintree/token");
  //     setClientToken(data?.clientToken);
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };

  const removeCartItem = async (pid) => {
    try {
      // Modified to include productId in the URL path instead of request body
      await axios.delete(`/api/v1/carts/users/${auth.user._id}/cart/${pid}`);
      getCart(); // Refresh cart after removal
      toast.success("Item removed from cart");
    } catch (error) {
      console.log(error);
      toast.error("Error removing item from cart");
    }
  };

  const clearCart = async () => {
    try {
      if (!auth?.user?._id) return;

      const response = await axios.delete(`/api/v1/carts/users/${auth.user._id}/cart`);

      if (response.data.status === 'success') {
        setCart([]);
        toast.success("Cart cleared successfully");
      } else {
        toast.error("Failed to clear cart");
      }
    } catch (error) {
      console.log(error);
      toast.error("Error clearing cart");
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
    if (newQuantity < 1) {
      removeCartItem(productId);
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
        item.product._id === productId 
          ? { ...item, quantity: newQuantity }
          : item
      );
      setCart(updatedCart);
      
      toast.success("Quantity updated successfully");
    } catch (error) {
      console.error("Quantity update error:", error);
      toast.error("Failed to update quantity");
    }
  };

  const totalPrice = () => {
    try {
      if (!Array.isArray(cart)) return 0;
  
      let total = 0;
  
      cart.forEach((item) => {
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
  

  const checkPincode = async (pincode) => {
    try {
      const { data } = await axios.get("/api/v1/pincodes/get-pincodes");
      if (data.success) {
        const availablePincodes = data.pincodes.map((pin) => pin.code);
        if (availablePincodes.includes(pincode.toString())) {
          setIsPincodeAvailable(true);
          toast.success("Delivery available for your pincode");
        } else {
          setIsPincodeAvailable(false);
          toast.error("Delivery not available for your pincode");
        }
      }
    } catch (error) {
      console.log(error);
      setIsPincodeAvailable(false);
      toast.error("Error checking pincode");
    }
  };
  const handlePayment = async () => {
    const total = totalPrice();
  
    if (!isPincodeAvailable) {
      toast.error("Service is not available in your area or pincode.");
      return;
    }
  
    if (total < minimumOrder) {
      toast.error(`Minimum order amount is ${minimumOrderCurrency} ${minimumOrder}`);
      return;
    }
  
    if (!auth?.user?._id) {
      toast.error("Please login to proceed with payment");
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
          amount = total * 0.1; // 10% of total
          amountPending = total * 0.9; // 90% of total
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
  
      if (paymentMethod === "COD" || paymentMethod === "Advance") {
        const { data } = await axios.post("/api/v1/product/process-payment", payload);
        if (data.success) {
          await clearCart();
          toast.success("Order Placed Successfully!");
          navigate("/dashboard/user/orders");
        } else {
          throw new Error(data.message || "Failed to place order");
        }
        return;
      }
  
      if (paymentMethod === "Razorpay") {
        const { data } = await axios.post("/api/v1/product/process-payment", payload);
  
        if (!data.success || !data.razorpayOrder) {
          throw new Error(data.message || "Failed to create Razorpay order");
        }
  
        const options = {
          key: data.key,
          amount: data.razorpayOrder.amount,
          currency: "INR",
          name: "Smitox",
          description: "Order Payment",
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
                verifyPayload
              );
  
              if (verifyResponse.data.success) {
                await clearCart();
                toast.success("Payment successful! Order placed successfully");
                navigate("/dashboard/user/orders");
              } else {
                throw new Error(verifyResponse.data.message || "Payment verification failed");
              }
            } catch (verifyError) {
              toast.error(verifyError.message || "Payment verification failed");
              console.error("Verification error:", verifyError);
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
          toast.error("Payment failed. Please try again.");
          setLoading(false);
          setOrderPlacementInProgress(false);
        });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Payment processing failed";
      setOrderErrorMessage(errorMessage);
      toast.error(errorMessage);
      console.error("Payment error:", error);
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
  

  return (
    <Layout>
      <div className="cart-page container" style={{ paddingTop: "100px" }}>
        <div className="row">
          <div className="col-12">
            <h1 className="text-center bg-light p-2 mb-1">
              {!auth?.user ? "Hello Guest" : `Hello ${auth?.user?.user_fullname}`}
              <p className="text-center">
                {cart?.length
                  ? `You Have ${cart.length} items in your cart ${
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
            {cart?.length > 0 ? (
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
                    {cart.map((item) => (
                      <tr key={item._id}>
                        <td>
                          <img
                            src={item.product.photos}
                            alt={item.product.name}
                            style={{
                              width: "80px",
                              height: "80px",
                              objectFit: "cover",
                            }}
                          />
                        </td>
                        <td>{item.product.name}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuantityChange(
                                  item.product._id,
                                  item.quantity - item.product.unitSet
                                );
                              }}
                              className="btn btn-sm btn-light"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => {
                                const newQuantity = parseInt(e.target.value);
                                handleQuantityChange(
                                  item.product._id,
                                  newQuantity
                                );
                              }}
                              className="form-control mx-2"
                              style={{ width: "60px", textAlign: "center" }}
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuantityChange(
                                  item.product._id,
                                  item.quantity + item.product.unitSet
                                );
                              }}
                              className="btn btn-sm btn-light"
                            >
                              +
                            </button>
                          </div>
                        </td>
                      
                        <td>
                    
                          {getPriceForProduct(item.product, item.quantity).toFixed(2)}
                        </td>
                        <td>
                          
                          {item.quantity *getPriceForProduct(item.product, item.quantity).toFixed(2)}
                        </td>
                        <td>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeCartItem(item.product._id);
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

            <p>
              Minimum Order:{" "}
              {minimumOrder.toLocaleString("en-US", {
                style: "currency",
                currency: minimumOrderCurrency || "INR",
              })}
            </p>
            {totalPrice() < minimumOrder && (
              <p className="text-danger">
                Order total is below the minimum order amount.
                Courier charge will be added  (depends on weight n cod amount)
                10 % you have to pay advance now for confirming the order

              </p>
              
              
              
            )}
            <div className="mb-3">
              <label className="form-label">Payment Method</label>
              <select
                className="form-select"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="COD">COD</option>
                <option value="Razorpay">Razorpay</option>
                {/* <option value="Advance">Advance</option> */}
              </select>
            </div>
            <button
              className="btn btn-primary w-100"
              onClick={handlePayment}
              disabled={
                loading ||
                orderPlacementInProgress ||
                totalPrice() < minimumOrder ||
                !isPincodeAvailable ||
                (paymentMethod === "Braintree" && !instance)
              }
            >
              {orderPlacementInProgress ? "Processing..." : "Place Order"}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};
export default CartPage;