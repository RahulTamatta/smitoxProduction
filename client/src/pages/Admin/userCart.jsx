import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout/Layout";
import { useNavigate } from "react-router-dom";
import DropIn from "braintree-web-drop-in-react";
import { AiFillWarning } from "react-icons/ai";
import axios from "axios";
import toast from "react-hot-toast";
import "../cart/cartPage.css"
import { useCart } from "../../context/cart";
import { useAuth } from "../../context/auth";
import { useParams } from 'react-router-dom';
import CartSearchModal from "../Admin/addTocartModal";
import OptimizedImage from "../../components/OptimizedImage";

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
  const { userId ,user_fullname} = useParams();
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

  const decodedUserName = decodeURIComponent(user_fullname);

  // Place COD order on behalf of user
  const handleCODOrder = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    if (totalPrice() < minimumOrder) {
      toast.error(`Minimum order amount is ${minimumOrderCurrency} ${minimumOrder}`);
      return;
    }

    setOrderPlacementInProgress(true);
    setOrderErrorMessage("");

    try {
      // Place order on behalf of the user - format same as CartPage
      const orderData = {
        products: Array.isArray(cart)
          ? cart.map(item => ({
              product: item.product._id,
              quantity: item.quantity,
              price: getPriceForProduct(item.product, item.quantity),
            }))
          : [],
        paymentMethod: "COD",
        amount: 0, // COD amount is 0
        amountPending: totalPrice() // Full amount pending for COD
      };

      const { data } = await axios.post("/api/v1/product/process-payment", orderData, {
        headers: {
          Authorization: auth?.token
        }
      });

      if (data.success) {
        // Clear the user's cart after successful order
        await axios.delete(`/api/v1/carts/users/${userId}/cart`, {
          headers: {
            Authorization: auth?.token
          }
        });
        
        setCart([]);
        toast.success(`Order placed successfully on behalf of ${decodedUserName}!`);
        navigate('/dashboard/admin/orders');
      } else {
        setOrderErrorMessage(data.message || "Failed to place order");
        toast.error(data.message || "Failed to place order");
      }
    } catch (error) {
      console.error("Order placement error:", error);
      const errorMessage = error.response?.data?.message || "Failed to place order";
      setOrderErrorMessage(errorMessage);
      toast.error(errorMessage);
    } finally {
      setOrderPlacementInProgress(false);
    }
  };

  useEffect(() => {
    if (userId) {
      getCart(userId);
    }
  }, [userId]);

  return (
    <Layout>
      <div className="container-fluid" style={{ paddingTop: '80px', minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
        {/* Header Section */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card shadow-sm">
              <div className="card-body text-center">
                <h2 className="card-title mb-3" style={{ color: '#2c3e50' }}>
                  Admin Cart Management
                </h2>
                <p className="card-text mb-3" style={{ fontSize: '1.1rem' }}>
                  Managing cart for: <strong>{decodedUserName}</strong>
                </p>
                <p className="text-muted mb-3">
                  Total Items: <span className="badge bg-primary fs-6">{cart?.length || 0}</span>
                </p>
                <button 
                  className="btn btn-success btn-lg"
                  onClick={() => handleOpenSearchModal(userId)}
                >
                  <i className="fas fa-plus me-2"></i>
                  Add Products to Cart
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Cart Search Modal */}
        <CartSearchModal
          show={showSearchModal}
          handleClose={() => setShowSearchModal(false)}
          userId={selectedUserId}
        />

        {/* Main Content */}
        <div className="row">
          {/* Cart Items Section */}
          <div className="col-lg-8 col-md-12 mb-4">
            
            {cart.length === 0 ? (
              <div className="card shadow-sm">
                <div className="card-body text-center py-5">
                  <i className="fas fa-shopping-cart fa-3x text-muted mb-3"></i>
                  <h4 className="text-muted">Cart is Empty</h4>
                  <p className="text-muted">Add some products to get started!</p>
                </div>
              </div>
            ) : (
              Array.isArray(cart) && cart.map((p) => (
                p?.product && (
                  <div key={p._id} className="card shadow-sm mb-3">
                    <div className="card-body">
                      <div className="row align-items-center">
                        {/* Product Image */}
                        <div className="col-lg-3 col-md-4 col-sm-12 mb-3 mb-md-0">
                          <OptimizedImage
                            src={p.product.photos}
                            alt={p.product.name}
                            width={200}
                            height={150}
                            style={{ width: "100%", height: "150px", borderRadius: "8px" }}
                            objectFit="cover"
                            quality={75}
                            loading="lazy"
                          />
                        </div>
                        
                        {/* Product Details */}
                        <div className="col-lg-5 col-md-8 col-sm-12 mb-3 mb-lg-0">
                          <h5 className="card-title mb-2">{p.product.name}</h5>
                          <p className="text-muted mb-2">
                            Unit Price: <strong>{minimumOrderCurrency} {getPriceForProduct(p.product, p.quantity).toFixed(2)}</strong>
                          </p>
                          <p className="text-success mb-0">
                            Total: <strong>{minimumOrderCurrency} {(getPriceForProduct(p.product, p.quantity) * p.quantity).toFixed(2)}</strong>
                          </p>
                        </div>
                        
                        {/* Quantity Controls */}
                        <div className="col-lg-4 col-md-12 col-sm-12">
                          <div className="d-flex flex-column gap-2">
                            <div className="d-flex align-items-center justify-content-center gap-2">
                              <button
                                className="btn btn-outline-secondary btn-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const product = cart.find(item => item.product._id === p.product._id)?.product;
                                  if (product) {
                                    const unitSet = product.unitSet || 1;
                                    handleQuantityChange(p.product._id, p.quantity - unitSet);
                                  }
                                }}
                                style={{ minWidth: "40px" }}
                              >
                                -
                              </button>
                              
                              <input
                                type="number"
                                min="1"
                                max="10000"
                                value={p.quantity}
                                readOnly
                                className="form-control text-center"
                                style={{ 
                                  width: "80px",
                                  backgroundColor: '#f8f9fa',
                                  border: '2px solid #dee2e6',
                                  fontWeight: 'bold'
                                }}
                              />
                              
                              <button
                                className="btn btn-outline-secondary btn-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const product = cart.find(item => item.product._id === p.product._id)?.product;
                                  if (product) {
                                    const unitSet = product.unitSet || 1;
                                    handleQuantityChange(p.product._id, p.quantity + unitSet);
                                  }
                                }}
                                style={{ minWidth: "40px" }}
                              >
                                +
                              </button>
                            </div>
                            
                            <button
                              className="btn btn-outline-danger btn-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeCartItem(p.product._id);
                              }}
                            >
                              <i className="fas fa-trash me-1"></i>
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              ))
            )}
          </div>
          
          {/* Sidebar - Cart Summary and Place Order */}
          <div className="col-lg-4 col-md-12">
            {cart.length > 0 ? (
              <div className="sticky-top" style={{ top: '100px' }}>
                {/* Cart Summary */}
                <div className="card shadow-sm mb-4">
                  <div className="card-header bg-primary text-white">
                    <h5 className="mb-0">
                      <i className="fas fa-shopping-cart me-2"></i>
                      Cart Summary
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="d-flex justify-content-between mb-2">
                      <span>Total Items:</span>
                      <span className="badge bg-primary">{cart.length}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-3">
                      <span><strong>Total Amount:</strong></span>
                      <span className="text-success fw-bold">
                        {minimumOrderCurrency} {totalPrice().toFixed(2)}
                      </span>
                    </div>
                    {minimumOrder > 0 && (
                      <div className="alert alert-info py-2">
                        <small>
                          <i className="fas fa-info-circle me-1"></i>
                          Minimum Order: {minimumOrderCurrency} {minimumOrder}
                        </small>
                      </div>
                    )}
                    {orderErrorMessage && (
                      <div className="alert alert-danger py-2">
                        <small>
                          <i className="fas fa-exclamation-triangle me-1"></i>
                          {orderErrorMessage}
                        </small>
                      </div>
                    )}
                  </div>
                </div>

                {/* Place Order */}
                <div className="card shadow-sm">
                  <div className="card-header bg-success text-white">
                    <h5 className="mb-0">
                      <i className="fas fa-credit-card me-2"></i>
                      Place Order
                    </h5>
                  </div>
                  <div className="card-body">
                    <p className="text-muted mb-3">
                      <small>Placing order on behalf of:</small><br />
                      <strong>{decodedUserName}</strong>
                    </p>
                    
                    <div className="mb-3">
                      <label className="form-label">Payment Method</label>
                      <select 
                        className="form-select"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        disabled={orderPlacementInProgress}
                      >
                        <option value="COD">Cash on Delivery (COD)</option>
                      </select>
                    </div>
                    
                    <button
                      className="btn btn-success w-100 btn-lg"
                      onClick={handleCODOrder}
                      disabled={orderPlacementInProgress || cart.length === 0 || totalPrice() < minimumOrder}
                    >
                      {orderPlacementInProgress ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Placing Order...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-check-circle me-2"></i>
                          Place Order - {minimumOrderCurrency} {totalPrice().toFixed(2)}
                        </>
                      )}
                    </button>
                    
                    {totalPrice() < minimumOrder && minimumOrder > 0 && (
                      <div className="alert alert-warning mt-3 py-2">
                        <small>
                          <i className="fas fa-exclamation-triangle me-1"></i>
                          Minimum order amount is {minimumOrderCurrency} {minimumOrder}
                        </small>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="card shadow-sm">
                <div className="card-body text-center">
                  <i className="fas fa-info-circle fa-2x text-muted mb-3"></i>
                  <p className="text-muted">Add items to cart to see summary and place order.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};



export default AddToCartPages;