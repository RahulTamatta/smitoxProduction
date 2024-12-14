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
  const [paymentMethod, setPaymentMethod] = useState("COD"); // Changed default to COD like Flutter
  const [minimumOrder, setMinimumOrder] = useState(0);
  const [minimumOrderCurrency, setMinimumOrderCurrency] = useState("");
  const [orderPlacementInProgress, setOrderPlacementInProgress] = useState(false);
  const [orderErrorMessage, setOrderErrorMessage] = useState("");


  const navigate = useNavigate();

  useEffect(() => {
    if (auth?.token && auth?.user?._id) {
      getCart();
      fetchMinimumOrder();
      getToken();
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
        setMinimumOrderCurrency(data.currency);
      }
    } catch (error) {
      console.error('Error fetching minimum order:', error);
      toast.error("Error fetching minimum order amount");
    }
  };

  const getToken = async () => {
    try {
      const { data } = await axios.get("/api/v1/product/braintree/token");
      setClientToken(data?.clientToken);
    } catch (error) {
      console.log(error);
    }
  };

 
  const removeCartItem = async (pid) => {
    try {
      await axios.delete(`/api/v1/carts/users/${auth.user._id}/cart`, { data: { productId: pid } });
      getCart();
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
      // If quantity becomes less than 1, remove the item
      removeCartItem(productId);
      return;
    }

    try {
      // Update quantity on server
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

      // Update local cart state
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
      let total = 0;
      let totalGST = 0;
      
      if (Array.isArray(cart)) {
        cart.forEach((item) => {
          const { product, quantity } = item;
          let itemPrice = product.price;
          const gst = product.gst || 0;
          const unitSet = product.unitSet || 1;

          // Bulk pricing logic
          if (product.bulkProducts && product.bulkProducts.length > 0) {
            const bulkPrice = product.bulkProducts.find(
              (bp) => 
                quantity >= (bp.minimum * unitSet) && 
                quantity <= (bp.maximum * unitSet)
            );
            if (bulkPrice) {
              itemPrice = bulkPrice.selling_price_set;
            }
          }

          // Calculate GST
          const itemGST = (itemPrice * gst) / 100;
          const itemTotal = (itemPrice + itemGST) * quantity;

          total += itemTotal;
          totalGST += itemGST * quantity;
        });
      }
      return total;
    } catch (error) {
      console.error("Total calculation error:", error);
      return 0;
    }
  };

  const handlePayment = async () => {
    const total = totalPrice();
    
    if (total < minimumOrder) {
      toast.error(`Minimum order amount is ${minimumOrderCurrency} ${minimumOrder}`);
      return;
    }

    setLoading(true);
    setOrderPlacementInProgress(true);
    setOrderErrorMessage("");

    try {
      // Prepare payload similar to Flutter implementation
      const payload = {
        products: Array.isArray(cart) ? cart.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
          price: item.product.price,
        })) : [],
        paymentMethod,
        amount: 0, // Server will calculate final amount
      };

      // Add nonce for Braintree payments
      if (paymentMethod === "Braintree" && instance) {
        const { nonce } = await instance.requestPaymentMethod();
        payload.nonce = nonce;
      }

      const { data } = await axios.post("/api/v1/product/process-payment", payload);
      
      if (data.success) {
        await clearCart();
        toast.success("Order Placed Successfully!");
        navigate("/dashboard/user/orders");
      } else {
        setOrderErrorMessage(data.message || "Failed to place order");
        toast.error(data.message || "Failed to place order");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Payment processing failed";
      setOrderErrorMessage(errorMessage);
      toast.error(errorMessage);
      console.error("Payment error:", error);
    } finally {
      setLoading(false);
      setOrderPlacementInProgress(false);
    }
  };

  const handleProductClick = (slug) => {
    navigate(`/product/${slug}`);
  };

  return (
    <Layout>
      <div className="cart-page container">
        <div className="row">
          <div className="col-12">
            <h1 className="text-center bg-light p-2 mb-1">
              {!auth?.user ? "Hello Guest" : `Hello ${auth?.user?.name}`}
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
                      {p.product.bulkProducts?.length > 0
                        ? p.product.bulkProducts.find(
                            bp => p.quantity >= bp.minimum && p.quantity <= bp.maximum
                          )?.selling_price_set || p.product.price
                        : p.product.price} 
                    </p>
                    
                    {/* Quantity Selector */}
                    <div className="d-flex align-items-center" style={{
                      display: 'flex', 
                      alignItems: 'center', 
                      marginBottom: '10px'
                    }}>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuantityChange(p.product._id, p.quantity -  p.product.unitSet);
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

                    <p>Total: {((p.product.bulkProducts?.length > 0
                        ? p.product.bulkProducts.find(
                            bp => p.quantity >= bp.minimum && p.quantity <= bp.maximum
                          )?.selling_price_set || p.product.price
                        : p.product.price) * p.quantity).toFixed(2)}</p>
                    <button
                      className="btn btn-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeCartItem(p.product._id);
                      }}
                    >
                      Remove
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
            <div className="row">
              <div className="col-12">
                <h5>Payment Options</h5>
                {clientToken && (
                  <DropIn
                    options={{
                      authorization: clientToken,
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
              <select 
                className="form-select"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="COD">COD</option>
                <option value="Braintree">Braintree</option>
              </select>
            </div>

            {/* Show DropIn only for Braintree */}
            {paymentMethod === "Braintree" && clientToken && (
              <div className="mb-3">
                <DropIn
                  options={{
                    authorization: clientToken,
                    paypal: { flow: "vault" },
                  }}
                  onInstance={(instance) => setInstance(instance)}
                />
              </div>
            )}

            <button
              className="btn btn-primary w-100"
              onClick={handlePayment}
              disabled={
                loading || 
                orderPlacementInProgress || 
                totalPrice() < minimumOrder ||
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