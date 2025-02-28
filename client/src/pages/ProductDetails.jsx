import React, { useState, useEffect, useRef } from "react";
import Layout from "./../components/Layout/Layout";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useCart } from "../context/cart";
import { useAuth } from "../context/auth";
import toast from "react-hot-toast";
import ProductCard from "./ProductCard";
import OptimizedImage from "../components/OptimizedImage";

const ProductDetails = () => {
  const params = useParams();
  const navigate = useNavigate();
  const [auth] = useAuth();
  const [product, setProduct] = useState({});
  const [productsForYou, setProductsForYou] = useState([]);
  const [selectedQuantity, setSelectedQuantity] = useState(0);
  const [selectedBulk, setSelectedBulk] = useState(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [cart, setCart] = useCart();
  const [unitSet, setUnitSet] = useState(1);
  const [quantity, setQuantity] = useState(1);
  const [displayQuantity, setDisplayQuantity] = useState(0);
  const [showQuantitySelector, setShowQuantitySelector] = useState(false);
  const [productIds, setProductId] = useState();
  const [categoryId, setCategoryId] = useState();
  const [subcategoryId, setSubcategoryId] = useState();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth > 768 && window.innerWidth <= 1024);

  // Debounce addToCart function
  const isAddingToCartRef = useRef(false);
  const prevSlugRef = useRef(params?.slug);

  // Handle responsive layout detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsTablet(window.innerWidth > 768 && window.innerWidth <= 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const scrollPosition = sessionStorage.getItem("productDetailsScrollPosition");
    if (scrollPosition) {
      window.scrollTo(0, parseInt(scrollPosition, 10));
      sessionStorage.removeItem("productDetailsScrollPosition");
    }

    return () => {
      sessionStorage.setItem("productDetailsScrollPosition", window.scrollY);
    };
  }, [params?.slug]);

  // Reset product-specific state when slug changes
  useEffect(() => {
    // Check if the slug has actually changed to avoid unnecessary resets
    if (prevSlugRef.current !== params?.slug) {
      // Reset all product-specific state variables
      setDisplayQuantity(0);
      setShowQuantitySelector(false);
      setSelectedBulk(null);
      setTotalPrice(0);
      setIsInWishlist(false);
      setUnitSet(1);
      setQuantity(1);
      setProductsForYou([]);
      setProduct({}); // Clear previous product data
      
      // Update the ref to current slug
      prevSlugRef.current = params?.slug;
      
      // Scroll to top when navigating to a new product
      window.scrollTo(0, 0);
    }
    
    if (params?.slug) {
      if (auth?.user?.pincode) {
        checkPincode(auth.user.pincode);
      }
      getProduct();
    }
  }, [params?.slug, auth?.user?.pincode]);

  useEffect(() => {
    if (product._id && auth?.user?._id) {
      checkWishlistStatus(product._id);
      fetchInitialQuantity(product._id);
    }
    
    // Add this to ensure productsForYou gets loaded when product data is available
    if (product.category?._id && product.subcategory?._id) {
      getProductsForYou();
    }
  }, [product._id, product.category, product.subcategory, auth?.user?._id]);

  const getProduct = async () => {
    try {
      const { data } = await axios.get(`/api/v1/product/get-product/${params.slug}`);
      if (data.success === true) {
        setProduct(data.product);
        setUnitSet(data?.product?.unitSet || 1);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getProductsForYou = async () => {
    try {
      const { data } = await axios.get(
        `/api/v1/productForYou/products/${product.category?._id}/${product.subcategory?._id}`
      );
      if (data?.success) {
        setProductsForYou(data.products || []);
      }
    } catch (error) {
      // Error handling is already commented out
    }
  };

  const addToCart = async () => {
    if (!auth.user) {
      setShowLoginPrompt(true);
      navigate('/login');
      return;
    }

    if (isAddingToCartRef.current) return;
    isAddingToCartRef.current = true;

    try {
      const initialQuantity = unitSet * 1;
      const applicableBulk = getApplicableBulkProduct(initialQuantity);

      const response = await axios.post(`/api/v1/carts/users/${auth.user._id}/cart`, {
        productId: product._id,
        quantity: initialQuantity,
        price: applicableBulk ? parseFloat(applicableBulk.selling_price_set) : parseFloat(product.price),
        bulkProductDetails: applicableBulk,
      });

      if (response.data.status === "success") {
        setCart(response.data.cart);
        setDisplayQuantity(initialQuantity);
        setSelectedBulk(applicableBulk);
        calculateTotalPrice(applicableBulk, initialQuantity);
        setShowQuantitySelector(true);
      }
    } catch (error) {
      console.error(error);
    } finally {
      isAddingToCartRef.current = false;
    }
  };

  const handleQuantityChange = async (increment) => {
    const newQuantity = displayQuantity + (increment ? 1 : -1) * unitSet;
    const updatedQuantity = Math.max(0, newQuantity);

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

  // Keep other functions (getApplicableBulkProduct, calculateTotalPrice, etc.)
  // ...

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

  const checkPincode = async (pincode) => {
    try {
      const { data } = await axios.get("/api/v1/pincodes/get-pincodes");
      if (data.success) {
        const availablePincodes = data.pincodes.map((pin) => pin.code);
        if (availablePincodes.includes(pincode.toString())) {
          // setIsPincodeAvailable(true);
        } else {
          // setIsPincodeAvailable(false);
        }
      }
    } catch (error) {
      console.log(error);
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
        // If no quantity data returned, explicitly reset values
        setDisplayQuantity(0);
        setShowQuantitySelector(false);
        setSelectedBulk(null);
        setTotalPrice(0);
      }
    } catch (error) {
      console.error("Error fetching quantity:", error);
      // On error, also reset values to ensure clean state
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

  // Responsive Styles
  const containerStyle = {
    maxWidth: "1200px",
    margin: "0 auto",
    paddingTop: isMobile ? "0.5rem" : "1rem",
    paddingLeft: isMobile ? "10px" : "15px",
    paddingRight: isMobile ? "10px" : "15px",
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#f5f5f5",
    borderRadius: "8px",
    boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
  };

  const productDetailStyle = {
    display: "flex",
    flexDirection: isMobile ? "column" : "row",
    flexWrap: "wrap",
    gap: isMobile ? "15px" : "20px",
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    padding: isMobile ? "15px" : "20px",
    marginBottom: "20px",
  };

  const imageStyle = {
    flex: isMobile ? "1 1 100%" : "1 1 300px",
    maxWidth: isMobile ? "100%" : "500px",
    margin: isMobile ? "0 auto" : "0",
  };

  const infoStyle = {
    flex: isMobile ? "1 1 100%" : "1 1 300px",
    minWidth: isMobile ? "100%" : "300px",
  };

  const headingStyle = {
    fontSize: isMobile ? "18px" : isTablet ? "19px" : "20px",
    fontWeight: "bold",
    color: "#333",
    marginBottom: isMobile ? "10px" : "15px",
  };

  const priceStyle = {
    fontSize: isMobile ? "20px" : "24px",
    fontWeight: "bold",
    color: "#e47911",
    marginBottom: isMobile ? "15px" : "20px",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
  };

  const strikeThroughStyle = {
    textDecoration: "line-through",
    color: "#888",
    marginRight: "10px",
    fontSize: isMobile ? "16px" : "20px",
  };

  const descriptionStyle = {
    fontSize: isMobile ? "14px" : "16px",
    lineHeight: "1.6",
    color: "#555",
    marginBottom: "20px",
    padding: isMobile ? "10px" : "15px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    backgroundColor: "#f9f9f9",
  };

  const quantitySelectorStyle = {
    display: "flex",
    alignItems: "center",
    marginBottom: isMobile ? "15px" : "20px",
  };

  const buttonStyle = {
    padding: isMobile ? "8px 16px" : "10px 20px",
    fontSize: isMobile ? "14px" : "16px",
    cursor: "pointer",
    backgroundColor: "red", // Complementary blue for wishlist
    color: isInWishlist ? "#ffffff" : "#111111",
    border: "none",
    borderRadius: "20px",
    transition: "background-color 0.3s",
  };

  const addToCartButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#ffa41c",
    color: "#000000",
    fontWeight: "bold",
    width: "100%",
    marginTop: "20px",
  };

  const inputStyle = {
    width: isMobile ? "40px" : "50px",
    height: isMobile ? "36px" : "40px",
    textAlign: "center",
    margin: "0 10px",
    padding: "5px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontSize: isMobile ? "16px" : "14px", // Larger on mobile for better touch
  };

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "20px",
    fontSize: isMobile ? "13px" : "14px",
  };

  const thTdStyle = {
    border: "1px solid #ddd",
    padding: isMobile ? "3px" : "4px",
    textAlign: "left",
    fontSize: isMobile ? "12px" : "14px",
  };
  
  // Mobile-specific card display for Products For You
  const responsiveCardStyle = {
    position: "relative",
    borderRadius: "8px",
    overflow: "hidden",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
    height: "100%",
    transition: "transform 0.2s ease-in-out",
  };
  
  const totalPriceAreaStyle = {
    display: "flex",
    flexDirection: isMobile ? "column" : "row",
    alignItems: isMobile ? "flex-start" : "center",
    justifyContent: isMobile ? "flex-start" : "space-between",
    gap: isMobile ? "10px" : "0",
    marginBottom: "15px",
  };

  if (!product || Object.keys(product).length === 0) {
    return (
      <Layout>
        <div style={containerStyle}>
          <p>Loading product details...</p>
        </div>
      </Layout>
    );
  }
  return (
    <Layout>
      <div style={containerStyle}>
        <div style={productDetailStyle}>
          {/* Product Image */}
          <div style={imageStyle}>
            <OptimizedImage
              src={product.photos}
              alt={product.name}
              style={{ 
                borderRadius: "8px",
                width: "100%",
                height: "auto",
                maxHeight: isMobile ? "300px" : "500px"
              }}
              width={isMobile ? 300 : 500}
              height={isMobile ? 300 : 500}
              objectFit="contain"
              backgroundColor="#ffffff"
              quality={isMobile ? 75 : 85}
              loading="eager"
            />
          </div>

          {/* Product Info */}
          <div style={infoStyle}>
            <h1 style={headingStyle}>{product.name}</h1>
            <div style={priceStyle}>
              <span style={strikeThroughStyle}>₹{product.mrp}</span>
              <span style={{ color: "red", fontSize: isMobile ? "18px" : "22px" }}>₹{product.perPiecePrice}</span>
            </div>
            <div style={totalPriceAreaStyle}>
              <span style={{ 
                fontSize: isMobile ? "16px" : "18px",
                fontWeight: "500" 
              }}>Total Price: ₹{totalPrice.toFixed(2)}</span>
              <div style={quantitySelectorStyle}>
                <button 
                  onClick={() => handleQuantityChange(false)} 
                  style={{
                    ...buttonStyle,
                    minWidth: isMobile ? "36px" : "40px",
                    height: isMobile ? "36px" : "40px",
                    padding: "0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <span style={{ fontSize: isMobile ? "18px" : "20px" }}>-</span>
                </button>
                <input
                  type="number"
                  value={displayQuantity}
                  readOnly
                  style={{ 
                    ...inputStyle, 
                    width: `${Math.max(displayQuantity.toString().length, 2) * (isMobile ? 16 : 14)}px`,
                    minWidth: isMobile ? "40px" : "50px" 
                  }}
                />
                <button
                  onClick={() => {
                    if (displayQuantity === 0) {
                      addToCart();
                    } else {
                      handleQuantityChange(true);
                    }
                  }}
                  style={{
                    ...buttonStyle,
                    minWidth: isMobile ? "36px" : "40px",
                    height: isMobile ? "36px" : "40px",
                    padding: "0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                  disabled={isAddingToCartRef.current}
                >
                  <span style={{ fontSize: isMobile ? "18px" : "20px" }}>+</span>
                </button>
              </div>
            </div>

            <h3 style={{ ...headingStyle, fontSize: isMobile ? "16px" : "18px", marginTop: "20px" }}>
              Bulk Pricing
            </h3>
            
            {/* Responsive Table for Bulk Pricing */}
            {product.bulkProducts && product.bulkProducts.length > 0 ? (
              <div style={{ overflowX: isMobile ? "auto" : "visible" }}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thTdStyle}>Min Qty</th>
                      <th style={thTdStyle}>Max Qty</th>
                      <th style={thTdStyle}>Price/set</th>
                      <th style={thTdStyle}>Total Price</th>
                      <th style={thTdStyle}>Select</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.bulkProducts.map((bulk, index) => {
                      if (!bulk || !bulk.minimum || !bulk.selling_price_set) {
                        return null;
                      }

                      const minQty = bulk.minimum * unitSet;
                      const maxQty = bulk.maximum
                        ? bulk.maximum * unitSet
                        : "No limit";

                      const autoSelectCondition =
                        selectedBulk && selectedBulk._id === bulk._id;

                      return (
                        <tr
                          key={index}
                          style={{
                            backgroundColor: autoSelectCondition
                              ? "#e6f7ff"
                              : "transparent",
                          }}
                        >
                          <td style={thTdStyle}>{minQty}</td>
                          <td style={thTdStyle}>{maxQty}</td>
                          <td style={thTdStyle}>
                            ₹{parseFloat(bulk.selling_price_set).toFixed(2)}
                          </td>
                          <td style={thTdStyle}>
                            {autoSelectCondition
                              ? `₹${totalPrice.toFixed(2)}`
                              : "-"}
                          </td>
                          <td style={{...thTdStyle, textAlign: "center"}}>
                            <input
                              type="checkbox"
                              checked={autoSelectCondition}
                              readOnly
                              disabled
                              style={{
                                width: isMobile ? "16px" : "20px",
                                height: isMobile ? "16px" : "20px",
                                backgroundColor: autoSelectCondition
                                  ? "#000000"
                                  : "#333333",
                                border: "2px solid #000000",
                                cursor: "not-allowed",
                                accentColor: "#ffffff",
                              }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ fontSize: isMobile ? "14px" : "16px" }}>No bulk pricing available for this product.</p>
            )}

            <h3 style={{ ...headingStyle, fontSize: isMobile ? "16px" : "18px", marginTop: "20px" }}>
              Description
            </h3>

            <p style={{ fontSize: isMobile ? "14px" : "16px", marginTop: "0px" }}>
              {product.description}
            </p>
          </div>
        </div>
        
        {/* Login Prompt Modal - Made Responsive */}
        {showLoginPrompt && (
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'white',
            padding: isMobile ? '15px' : '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            zIndex: 1000,
            maxWidth: '90%',
            width: isMobile ? '90%' : '300px',
            textAlign: 'center'
          }}>
            <h3 style={{ fontSize: isMobile ? '18px' : '20px' }}>Please Login</h3>
            <p style={{ fontSize: isMobile ? '14px' : '16px' }}>You need to login to add items to cart</p>
            <div style={{ 
              display: 'flex', 
              flexDirection: isMobile ? 'column' : 'row',
              gap: '10px',
              justifyContent: 'center'
            }}>
              <button 
                onClick={() => navigate('/login')}
                style={{
                  ...buttonStyle,
                  backgroundColor: '#007bff',
                  padding: isMobile ? '10px' : '10px 20px',
                  margin: isMobile ? '5px 0' : '10px',
                  width: isMobile ? '100%' : 'auto'
                }}
              >
                Go to Login
              </button>
              <button 
                onClick={() => setShowLoginPrompt(false)}
                style={{
                  ...buttonStyle,
                  backgroundColor: '#6c757d',
                  padding: isMobile ? '10px' : '10px 20px',
                  width: isMobile ? '100%' : 'auto'
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Products For You Section - Made Responsive */}
      <div className="container mt-5" style={{ 
        padding: isMobile ? '0 10px' : '0 15px'
      }}>
        <h2 className="text-center mb-4" style={{ 
          fontSize: isMobile ? '1.5rem' : '2rem' 
        }}>
          Products For You
        </h2>
        <div className="row g-2">
          {productsForYou.map((item) => (
            <div
              key={item.productId?._id}
              className={isMobile ? "col-6 mb-2" : "col-lg-4 col-md-4 col-sm-6 mb-3"}
            >
              <div className="card product-card h-100" style={responsiveCardStyle}>
                <div
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate(`/product/${item.productId.slug}`)}
                >
                  {/* Image container with fixed aspect ratio */}
                  <div style={{ 
                    position: "relative",
                    paddingTop: "75%", // 4:3 aspect ratio
                    width: "100%",
                    overflow: "hidden"
                  }}>
                    <OptimizedImage
                      src={item.productId.photos || '/placeholder-image.jpg'}
                      alt={item.productId.name}
                      className="card-img-top product-image"
                      width={isMobile ? 150 : 200}
                      height={isMobile ? 150 : 200}
                      objectFit="contain"
                      backgroundColor="#ffffff"
                      quality={isMobile ? 70 : 75}
                      loading="lazy"
                      style={{
                        position: "absolute",
                        top: "0",
                        left: "0",
                        width: "100%",
                        height: "100%",
                        padding: isMobile ? "5px" : "8px",
                      }}
                    />
                  </div>
                  
                  <div className="p-2 d-flex flex-column h-100">
                    {/* Product Name with ellipsis */}
                    <div style={{
                      fontSize: isMobile ? "0.8rem" : "0.9rem",
                      fontWeight: "600",
                      color: "#333",
                      marginBottom: isMobile ? "6px" : "10px",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      lineHeight: "1.4",
                      height: isMobile ? "2.4em" : "2.8em"
                    }}>
                      {item.productId.name}
                    </div>
                    
                    {/* Price Section */}
                    <div className="d-flex flex-column h-100">
                      <h5 style={{
                        fontSize: isMobile ? "0.9rem" : "1rem",
                        fontWeight: "700",
                        color: "#333",
                        margin: 0
                      }}>
                        ₹{item.productId.perPiecePrice}
                      </h5>
                      {item.productId.mrp && (
                        <h6 style={{
                          fontSize: isMobile ? "0.7rem" : "0.8rem",
                          textDecoration: "line-through",
                          color: "red",
                          margin: "2px 0 0 0"
                        }}>
                          ₹{item.productId.mrp}
                        </h6>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetails;