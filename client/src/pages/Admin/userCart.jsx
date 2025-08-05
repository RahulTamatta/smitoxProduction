import React, { useState, useEffect } from "react";
import AdminLayout from "../../features/admin/components/layout/AdminLayout";
import { useNavigate } from "react-router-dom";
import { AiFillWarning } from "react-icons/ai";
import axios from "axios";
import toast from "react-hot-toast";
import "../cart/cartPage.css"
import { useAuth } from "../../context/authContext";
import { useParams } from 'react-router-dom';
import CartSearchModal from "../Admin/addTocartModal";

const AddToCartPages = () => {
  const [cart, setCart] = useState([]);
  const [clientToken, setClientToken] = useState("");
  const [instance, setInstance] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [minimumOrder, setMinimumOrder] = useState(0);
  const [minimumOrderCurrency, setMinimumOrderCurrency] = useState("");
  const [orderPlacementInProgress, setOrderPlacementInProgress] = useState(false);
  const [orderErrorMessage, setOrderErrorMessage] = useState("");
  const [isPincodeAvailable, setIsPincodeAvailable] = useState(false);
  const [auth] = useAuth();
  const navigate = useNavigate();
  const { userId } = useParams();
  const [userName, setUserName] = useState("");
  const [showSearchModal, setShowSearchModal] = useState(false);
  
  const [selectedUserId, setSelectedUserId] = useState(null);
    const handleOpenSearchModal = (userId) => {
    setSelectedUserId(userId);
    setShowSearchModal(true);
  };
  
  const getPriceForProduct = (product, quantity) => {
    const unitSet = product.unitSet || 1;
    if (product.bulkProducts && product.bulkProducts.length > 0) {
      const sortedBulkProducts = [...product.bulkProducts]
        .filter((bp) => bp && bp.minimum)
        .sort((a, b) => b.minimum - a.minimum);

      const applicableBulk = sortedBulkProducts.find(
        (bp) => quantity >= bp.minimum * unitSet &&
                (!bp.maximum || quantity <= bp.maximum * unitSet)
      );

      if (applicableBulk) {
        return parseFloat(applicableBulk.selling_price_set);
      }
    }

    return parseFloat(product.perPiecePrice || product.price || 0);
  };

  useEffect(() => {
    if (userId) {
      getCart(userId);
      fetchMinimumOrder();
      fetchUserName(userId);
    }
  }, [userId]);

const getCart = async (userId) => {
    try {
      const { data } = await axios.get(`/api/v1/carts/users/${userId}/cart`);
      setCart(data.cart || []);
    } catch (error) {
      console.error("Error fetching cart:", error);
      ////toast.error("Error fetching cart");
      setCart([]);
    }
  };

  const fetchUserName = async (userId) => {
    try {
      const { data } = await axios.get(`/api/v1/usersLists/users/${userId}`);
      setUserName(data.user_fullname || "User");
    } catch (error) {
      console.error("Error fetching user name:", error);
      setUserName("User");
    }
  };

  const fetchMinimumOrder = async () => {
    try {
      const { data } = await axios.get("/api/v1/minimumOrder/getMinimumOrder");
      if (data) {
        setMinimumOrder(data.amount);
        setMinimumOrderCurrency(data.currency === "rupees" ? "INR" : data.currency);
      }
    } catch (error) {
      console.error("Error fetching minimum order:", error);
      ////toast.error("Error fetching minimum order amount");
    }
  };

  const removeCartItem = async (productId) => {
    try {
      await axios.delete(`/api/v1/carts/users/${userId}/cart/${productId}`);
      getCart(userId);
      //toast.success("Item removed from cart");
    } catch (error) {
      console.error("Error removing item:", error);
      ////toast.error("Error removing item from cart");
    }
  };

  const clearCart = async () => {
    try {
      if (!userId) return;

      const response = await axios.delete(`/api/v1/carts/users/${userId}/cart`);

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

  const handleQuantityChange = async (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeCartItem(productId);
      return;
    }

    try {
      await axios.post(`/api/v1/carts/users/${userId}/cartq/${productId}`, { quantity: newQuantity });
      const updatedCart = cart.map((item) =>
        item.product._id === productId
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
      let total = 0;
      cart.forEach((item) => {
        const { product, quantity } = item;
        const itemPrice = getPriceForProduct(product, quantity);
        total += itemPrice * quantity;
      });
      return total;
    } catch (error) {
      console.error("Error calculating total price:", error);
      return 0;
    }
  };

  const handlePayment = async () => {
    const total = totalPrice();

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
        paymentMethod,
        amount: 0,
        amountPending: total
      };

      const { data } = await axios.post(
        "/api/v1/product/process-payment", 
        payload, 
        {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'X-Admin-Order': 'true',
            'X-Order-User-Id': userId,
            'Authorization': auth?.token
          }
        }
      );

      if (data.success) {
        await clearCart();
        toast.success("Order placed successfully on behalf of the user!");
      } else {
        throw new Error(data.message || "Failed to place order");
      }
    } catch (error) {
      console.error("Payment error:", error);
      setOrderErrorMessage("Payment processing failed. Please try again.");
      toast.error("Failed to place order. Please try again.");
    } finally {
      setLoading(false);
      setOrderPlacementInProgress(false);
    }
  };


  useEffect(() => {
    if (userId) {
      getCart(userId);
    }
  }, [userId]);

  return (
    <AdminLayout>
<div className="cart-page container" style={{ paddingTop: '100px' }}>

<div className="col-12">
  <h1 className="text-center bg-light p-2 mb-1">
    <p className="text-center">
      {cart?.length
        ? ` ${userName} has ${cart.length} items in their cart `
        : `${userName}'s Cart Is Empty`}
    </p>
    {/* Add this button */}
    <button 
      className="btn btn-primary"
      onClick={() => handleOpenSearchModal(userId)}
    >
      Add Products to Cart
    </button>
  </h1>
</div>

{/* Move this outside the header but keep it in the component */}
<CartSearchModal
  show={showSearchModal}
  handleClose={() => setShowSearchModal(false)} // Add this prop
  userId={selectedUserId}
/>
        <div className="row">
          <div className="col-md-7 col-12">
            
            {Array.isArray(cart) && cart.map((p) => (
              p?.product && (
                <div
                  className="row card flex-row my-3"
                  key={p._id}
                  // onClick={() => handleProductClick(p.product.slug)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="col-md-4 col-12">
                    <img
                      src={p.product.photos}
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
  readOnly // Makes the input non-editable
  style={{ 
    width: 'auto', // Auto width to accommodate larger numbers
    minWidth: '70px', // Minimum width for smaller numbers
    height: '40px', // Fixed height for better touch targets
    fontSize: '1.1rem', // Larger text
    textAlign: 'center',
    padding: '8px 12px', // More padding
    border: '2px solid #007bff', // More visible border
    borderRadius: '6px', // Rounded corners
    transition: 'all 0.3s ease', // Smooth transitions
    boxSizing: 'border-box',
    backgroundColor: '#f8f9fa', // Background color to indicate non-editable state
    cursor: 'not-allowed', // Cursor to indicate non-editable state
    overflow: 'visible', // Ensure content is not cut off
    // Responsive styles
    '@media (max-width: 768px)': {
      width: '100%', // Full width on mobile
      height: '48px',
      fontSize: '1.2rem',
      padding: '12px'
    }
  }}
  // Add hover and focus states
  onMouseEnter={(e) => e.target.style.borderColor = '#0056b3'}
  onMouseLeave={(e) => e.target.style.borderColor = '#007bff'}
  onFocus={(e) => {
    e.target.style.borderColor = '#0056b3';
    e.target.style.boxShadow = '0 0 0 2px rgba(0,123,255,0.25)';
  }}
  onBlur={(e) => {
    e.target.style.borderColor = '#007bff';
    e.target.style.boxShadow = 'none';
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
          
          {/* Cart Summary Section */}
          <div className="col-md-5">
            <div className="card">
              <div className="card-body">
                <h4 className="card-title">Cart Summary</h4>
                <hr />
                <div className="mb-3">
                  <p className="d-flex justify-content-between">
                    <span>Total Items:</span>
                    <span>{cart.length}</span>
                  </p>
                  <p className="d-flex justify-content-between">
                    <span>Total Amount:</span>
                    <span>
                      {totalPrice().toLocaleString("en-US", {
                        style: "currency",
                        currency: minimumOrderCurrency || "INR",
                      })}
                    </span>
                  </p>
                  <p className="d-flex justify-content-between text-muted">
                    <span>Minimum Order:</span>
                    <span>
                      {minimumOrder.toLocaleString("en-US", {
                        style: "currency",
                        currency: minimumOrderCurrency || "INR",
                      })}
                    </span>
                  </p>
                </div>
                
                {totalPrice() < minimumOrder && (
                  <div className="alert alert-warning" role="alert">
                    <AiFillWarning className="me-2" />
                    Order total is below the minimum order amount.
                  </div>
                )}
                
                <div className="mb-3">
                  <small className="text-muted">
                    • Order will be placed using COD (Cash on Delivery) only
                    <br />
                    • Courier charges will be added based on weight and COD amount
                    <br />
                    • Order will be placed on behalf of {userName}
                  </small>
                </div>
                
                <button
                  className="btn btn-success w-100 mb-2"
                  onClick={handlePayment}
                  disabled={orderPlacementInProgress || cart.length === 0 || totalPrice() < minimumOrder}
                  style={{ fontSize: '1.1rem', fontWeight: 'bold' }}
                >
                  {orderPlacementInProgress ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Placing Order...
                    </>
                  ) : (
                    `Place Order (COD)`
                  )}
                </button>
                
                {orderErrorMessage && (
                  <div className="alert alert-danger mt-2" role="alert">
                    <AiFillWarning className="me-2" />
                    {orderErrorMessage}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};



export default AddToCartPages;