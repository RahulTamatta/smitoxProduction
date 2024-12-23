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


const CartPage = () => {
  const [auth] = useAuth();
  const [cart, setCart] = useCart();
  const [clientToken, setClientToken] = useState("");
  const [instance, setInstance] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [minimumOrder, setMinimumOrder] = useState(0);
  const [minimumOrderCurrency, setMinimumOrderCurrency] = useState("");
  const [orderPlacementInProgress, setOrderPlacementInProgress] = useState(false);
  const [orderErrorMessage, setOrderErrorMessage] = useState("");


  const [isPincodeAvailable, setIsPincodeAvailable] = useState(false);
  

  const navigate = useNavigate();

  // New function to get price based on product and quantity
  const getPriceForProduct = (product, quantity) => {
    const unitSet = product.unitSet || 1;

    if (product.bulkProducts && product.bulkProducts.length > 0) {
      const sortedBulkProducts = [...product.bulkProducts]
        .filter(bp => bp && bp.minimum)
        .sort((a, b) => b.minimum - a.minimum);

      const applicableBulk = sortedBulkProducts.find(
        (bp) => quantity >= (bp.minimum * unitSet) && 
                (!bp.maximum || quantity <= (bp.maximum * unitSet))
      );

      if (applicableBulk) {
        return parseFloat(applicableBulk.selling_price_set);
      }
    }

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
  
    // Check if user is logged in and has an _id
    if (!auth?.user?._id) {
      toast.error("Please login to proceed with payment");
      return;
    }
  
    setLoading(true);
    setOrderPlacementInProgress(true);
    setOrderErrorMessage("");
  
    try {
      const payload = {
        products: Array.isArray(cart)
          ? cart.map(item => ({
              product: item.product._id,
              quantity: item.quantity,
              price: getPriceForProduct(item.product, item.quantity),
            }))
          : [],
        paymentMethod: paymentMethod === "Razorpay" ? "Razorpay" : "COD",
        amount: total,
      };
  
      // Handle COD orders
      if (paymentMethod === "COD") {
        const { data } = await axios.post("/api/v1/product/process-payment", payload);
        if (data.success) {
          await clearCart();
          toast.success("Order Placed Successfully!");
          navigate("/dashboard/user/orders");
        } else {
          throw new Error(data.message || "Failed to place COD order");
        }
        return;
      }
  
      // Handle Razorpay payments
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
  
        // Use window.Razorpay instead of creating new Razorpay instance
        const rzp = new window.Razorpay(options);
        rzp.open();
  
        // Handle payment modal close
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
      setLoading(false);
      setOrderPlacementInProgress(false);
    } finally {
      // Only set loading false for COD
      if (paymentMethod === "COD") {
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
<div className="cart-page container" style={{ paddingTop: '100px' }}>
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
        <div className="row">
          <div className="col-md-7 col-12">
            {Array.isArray(cart) && cart.map((p) => (
              p?.product && (
                <div
                  className="row card flex-row my-3"
                  key={p._id}
                  onClick={() => handleProductClick(p.product.slug)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="col-md-4 col-12">
                    <img
                      src={`/api/v1/product/product-photo/${p.product._id}`}
                      className="card-img-top"
                      alt={p.product.name}
                      width="100%"
                      height={"130px"}
                    />
                  </div>
                  <div className="col-md-4 col-12">
                    <p>{p.product.name}</p>
                    <p>
                      Price: {minimumOrderCurrency}{" "}
                      {getPriceForProduct(p.product, p.quantity).toFixed(2)}
                    </p>
                    
                    <div className="d-flex align-items-center" style={{
                      display: 'flex', 
                      alignItems: 'center', 
                      marginBottom: '10px'
                    }}>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuantityChange(p.product._id, p.quantity - p.product.unitSet);
                        }} 
                        style={{
                          padding: '5px 10px',
                          backgroundColor: '#f0f0f0',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          marginRight: '10px'
                        }}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={p.quantity}
                        onChange={(e) => {
                          const newQuantity = parseInt(e.target.value);
                          handleQuantityChange(p.product._id, newQuantity);
                        }}
                        className="quantity-input"
                        style={{ 
                          width: '60px', 
                          textAlign: 'center',
                          padding: '5px',
                          border: '1px solid #ddd',
                          borderRadius: '4px'
                        }}
                      />
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuantityChange(p.product._id, p.quantity + p.product.unitSet);
                        }} 
                        style={{
                          padding: '5px 10px',
                          backgroundColor: '#f0f0f0',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          marginLeft: '10px'
                        }}
                      >
                        +
                      </button>
                    </div>

                    <p>
                      {(getPriceForProduct(p.product, p.quantity) * p.quantity).toFixed(2)}
                    </p>
                    <button
                      className="btn btn-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeCartItem(p.product._id);
                      }}
                    >
                      Remove Item
                    </button>
                  </div>
                </div>
              )
            ))}
          </div>
          <div className="col-md-5 col-12 cart-summary">
            <h2>Cart Summary</h2>
            <p>Total | Checkout | Payment</p>
            <hr />
            <h4>Total: {totalPrice().toLocaleString("en-US", {
              style: "currency",
              currency: minimumOrderCurrency || "INR",
            })}</h4>
            <p>Minimum Order: {minimumOrder.toLocaleString("en-US", {
              style: "currency",
              currency: minimumOrderCurrency || "INR",
            })}</p>

            {totalPrice() < minimumOrder && (
              <p className="text-danger">
                <AiFillWarning /> Order total is below the minimum order amount
              </p>
            )}
            {auth?.user?.address ? (
              <>
                <div className="mb-3">
                  <button
                    className="btn btn-primary"
                    onClick={() => navigate("/dashboard/user/profile")}
                  >
                    Edit Address
                  </button>
                </div>
                <hr />
              </>
            ) : (
              <div className="alert alert-warning">
                Please update your address before proceeding with checkout.
              </div>
            )}
                       {
  !isPincodeAvailable && (
    <div style={{ textAlign: 'center', marginTop: '10px' }}>
      <p style={{ color: 'red', fontSize: '16px', marginBottom: '10px' }}>
        Service is not available in your area or pincode.
      </p>
      <a href="https://wa.me/918291541168" target="_blank" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
            <i className="fab fa-whatsapp" style={{ fontSize: '30px', marginRight: '8px', color: '#25D366' }}></i>
            <span style={{ color: '#007bff', fontSize: '16px' }}>Contact Support via WhatsApp</span>
          </a>
    </div>
  )
}
            <div className="row">
              <div className="col-12">
                <h5>Payment Options</h5>
                { (
                  <DropIn
                    options={{
                      // authorization: clientToken,
                      paypal: {
                        flow: "vault",
                      },
                    }}
                    onInstance={(instance) => setInstance(instance)}
                  />
                )}
              </div>
            </div>
            <div className="mb-3">
  <label className="form-label">Payment Method</label>
  <label className="form-label">Payment Method</label>
<select 
  className="form-select"
  value={paymentMethod}
  onChange={(e) => setPaymentMethod(e.target.value)}
>
  <option value="COD">COD</option>
  <option value="Razorpay">Razorpay</option>
  <option value="Advance">Advance</option> {/* New payment method option */}
</select>

</div>


<button
  className="btn btn-primary w-100"
  onClick={handlePayment}
  disabled={
    loading ||
    orderPlacementInProgress ||
    totalPrice() < minimumOrder ||
    !isPincodeAvailable || // Disable button if pincode is not available
    (paymentMethod === "Braintree" && !instance)
  }
>
  {orderPlacementInProgress ? (
    <span className="spinner-border spinner-border-sm me-2" />
  ) : null}
  {orderPlacementInProgress ? "Processing..." : "Place Order"}
</button>

          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CartPage;
