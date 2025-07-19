

import React, { useState, useEffect, useRef } from "react";
import Layout from "./../components/Layout/Layout";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useCart } from "../context/cart";
import { useAuth } from "../context/auth";
import { AiFillWarning, AiFillYoutube } from 'react-icons/ai'; // Icons import
import { FaExpand, FaTimes } from 'react-icons/fa'; // Additional icons for zoom
import toast from "react-hot-toast";
import ProductCard from "./ProductCard";
import OptimizedImage from "../components/OptimizedImage";
import StockPopup from "./cart/StockPopup"; // Import the StockPopup component

function normalizeProductForCard(product) {
  // Helper to check if a value is a valid non-empty image URL
  const isValidImage = (val) =>
    typeof val === "string" && val.trim() !== "" && val !== "/placeholder-image.jpg";

  let photo = product?.photos;
  if (!isValidImage(photo)) {
    let images = product?.multipleimages;
    if (typeof images === "string") {
      try {
        images = JSON.parse(images);
      } catch {
        images = [];
      }
    }
    if (Array.isArray(images)) {
      images = images.filter(isValidImage);
      if (images.length > 0) {
        photo = images[0];
      }
    }
    if (!isValidImage(photo)) {
      photo = "/placeholder-image.jpg";
    }
  }
  return { ...product, photos: photo };
}

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
  const [showStockPopup, setShowStockPopup] = useState(false); // State for stock popup
  const [isNetworkError, setIsNetworkError] = useState(false);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [selectedImage, setSelectedImage] = useState(0); // Track the selected image index
  const [showYoutubePopup, setShowYoutubePopup] = useState(false); // Controls YouTube popup
  const [showImageZoom, setShowImageZoom] = useState(false); // Controls image zoom popup
  const MAX_RETRIES = 3;

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
      setSelectedImage(0); // Reset selected image to main image
      setShowImageZoom(false); // Close image zoom if open
      setShowYoutubePopup(false); // Close YouTube popup if open
      
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

  const axiosConfig = {
    timeout: 30000, // 30 second timeout
    headers: {
      'Content-Type': 'application/json',
      'Connection': 'keep-alive'
    }
  };

  // Handle network status
  useEffect(() => {
    const handleOnline = () => {
      console.log('[Network] Connection restored');
      setIsNetworkError(false);
      // Retry failed requests when connection is restored
      if (retryAttempts > 0) {
        getProduct();
      }
    };

    const handleOffline = () => {
      console.log('[Network] Connection lost');
      setIsNetworkError(true);
      toast.error("Internet connection lost. Please check your network.");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [retryAttempts]);

  const getProduct = async () => {
    if (!navigator.onLine) {
      setIsNetworkError(true);
      toast.error("No internet connection");
      return;
    }

    try {
      console.log(`[Product] Fetching product details for slug: ${params.slug}`);
      const { data } = await axios.get(
        `/api/v1/product/get-product/${params.slug}`,
        axiosConfig
      );

      if (data.success === true) {
        console.log('[Product] Product fetched successfully');
        
        // Parse multipleimages if it's a JSON string
        let processedProduct = { ...data.product };
        if (processedProduct.multipleimages && typeof processedProduct.multipleimages === 'string') {
          try {
            processedProduct.multipleimages = JSON.parse(processedProduct.multipleimages);
          } catch (error) {
            console.warn('Failed to parse multipleimages:', error);
            processedProduct.multipleimages = [];
          }
        }
        
        // Ensure multipleimages is an array and filter out invalid URLs
        if (Array.isArray(processedProduct.multipleimages)) {
          processedProduct.multipleimages = processedProduct.multipleimages.filter(img => 
            typeof img === 'string' && img.trim() !== '' && img !== '/placeholder-image.jpg'
          );
        } else {
          processedProduct.multipleimages = [];
        }
        
        setProduct(processedProduct);
        setUnitSet(processedProduct?.unitSet || 1);
        setRetryAttempts(0); // Reset retry counter on success
      }
    } catch (error) {
      console.error('[Product] Error fetching product:', error);
      
      const isNetworkError = error.message && (
        error.message.includes('network') ||
        error.message.includes('timeout') ||
        error.message.includes('abort')
      );

      if (isNetworkError && retryAttempts < MAX_RETRIES) {
        console.log(`[Product] Retry attempt ${retryAttempts + 1}/${MAX_RETRIES}`);
        setRetryAttempts(prev => prev + 1);
        setTimeout(getProduct, 2000); // Retry after 2 seconds
      } else {
        toast.error("Failed to load product details. Please try again later.");
      }
    }
  };

  const getProductsForYou = async () => {
    try {
      const { data } = await axios.get(
        `/api/v1/productForYou/products/${product.category?._id}/${product.subcategory?._id}`
      );
      if (data?.success) {
        setProductsForYou(
          (data.products || []).map(item => ({
            ...item,
            productId: normalizeProductForCard(item.productId)
          }))
        );
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
      {isNetworkError && (
        <div className="alert alert-warning m-2">
          <AiFillWarning /> Network connection issues detected. 
          Some features may not work properly.
        </div>
      )}
      <div style={containerStyle}>
        <div style={productDetailStyle}>
          {/* Product Image Gallery */}
          <div style={imageStyle}>
            {/* Main large image display */}
            <div 
              onClick={() => setShowImageZoom(true)}
              style={{ 
                marginBottom: "10px", 
                borderRadius: "8px",
                overflow: "hidden",
                boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                position: "relative",
                cursor: "zoom-in",
                paddingTop: isMobile ? "16px" : "28px" // Added padding to top for better visual spacing
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "10px",
                  right: "10px",
                  zIndex: 2,
                  backgroundColor: "rgba(255,255,255,0.7)",
                  borderRadius: "50%",
                  width: "30px",
                  height: "30px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer"
                }}
              >
                <FaExpand color="#333" size={16} />
              </div>
              <OptimizedImage
                src={selectedImage === 0 ? product.photos : 
                      (product.multipleimages && product.multipleimages.length > 0) ? 
                      product.multipleimages[selectedImage - 1] : product.photos}
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
            
            {/* Thumbnail gallery */}
            {(product.multipleimages && product.multipleimages.length > 0) && (
              <div style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
                justifyContent: isMobile ? "center" : "flex-start"
              }}>
                {/* Main product image thumbnail */}
                <div 
                  onClick={() => setSelectedImage(0)}
                  style={{
                    width: isMobile ? "60px" : "80px",
                    height: isMobile ? "60px" : "80px",
                    border: selectedImage === 0 ? "2px solid #ffa41c" : "1px solid #ddd",
                    borderRadius: "4px",
                    overflow: "hidden",
                    cursor: "pointer"
                  }}
                >
                  <OptimizedImage
                    src={product.photos}
                    alt={`${product.name} - Main`}
                    style={{ width: "100%", height: "100%" }}
                    width={isMobile ? 60 : 80}
                    height={isMobile ? 60 : 80}
                    objectFit="cover"
                    quality={60}
                  />
                </div>
                
                {/* Additional images thumbnails */}
                {product.multipleimages.map((imgUrl, index) => (
                  <div 
                    key={index}
                    onClick={() => setSelectedImage(index + 1)}
                    style={{
                      width: isMobile ? "60px" : "80px",
                      height: isMobile ? "60px" : "80px",
                      border: selectedImage === index + 1 ? "2px solid #ffa41c" : "1px solid #ddd",
                      borderRadius: "4px",
                      overflow: "hidden",
                      cursor: "pointer"
                    }}
                  >
                    <OptimizedImage
                      src={imgUrl}
                      alt={`${product.name} - ${index + 1}`}
                      style={{ width: "100%", height: "100%" }}
                      width={isMobile ? 60 : 80}
                      height={isMobile ? 60 : 80}
                      objectFit="cover"
                      quality={60}
                    />
                  </div>
                ))}
              </div>
            )}
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
              
              {/* YouTube Button - Show only if product has YouTube URL */}
              {product.youtubeUrl && (
                <button
                  onClick={() => setShowYoutubePopup(true)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    backgroundColor: "#ff0000",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    padding: "5px 10px",
                    marginTop: "10px",
                    cursor: "pointer",
                    fontSize: isMobile ? "14px" : "16px",
                    fontWeight: "bold"
                  }}
                >
                  <AiFillYoutube size={isMobile ? 16 : 20} />
                  Watch Video
                </button>
              )}
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
              <ProductCard
                product={normalizeProductForCard(item.productId)}
                onClick={() => {
                  setSelectedImage(0);
                  setShowImageZoom(false);
                  setShowYoutubePopup(false);
                  setDisplayQuantity(0);
                  setShowQuantitySelector(false);
                  setSelectedBulk(null);
                  setTotalPrice(0);
                  setIsInWishlist(false);
                  setUnitSet(1);
                  setQuantity(1);
                  setProduct({});
                  setProductsForYou([]); // Clear to prevent stale/blank cards
                  prevSlugRef.current = item.productId.slug;
                  navigate(`/product/${item.productId.slug}`);
                }}
              />
            </div>
          ))}
        </div>
      </div>
      
      {/* Stock Popup Modal */}
      <StockPopup
        show={showStockPopup}
        onHide={() => setShowStockPopup(false)}
        product={product}
        requestedQuantity={quantity}
      />

      {/* YouTube Video Popup */}
      {showYoutubePopup && product.youtubeUrl && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          zIndex: 1000,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column"
        }}>
          <div style={{
            position: "relative",
            width: isMobile ? "90%" : "70%",
            maxWidth: "800px",
            aspectRatio: "16/9"
          }}>
            <button
              onClick={() => setShowYoutubePopup(false)}
              style={{
                position: "absolute",
                top: "-40px",
                right: "0",
                backgroundColor: "transparent",
                border: "none",
                color: "white",
                fontSize: "24px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <FaTimes />
            </button>
            <iframe
              width="100%"
              height="100%"
              src={product.youtubeUrl ? 
                (product.youtubeUrl.includes('embed/') ? 
                  product.youtubeUrl : 
                  product.youtubeUrl.replace('watch?v=', 'embed/')
                ) : ''}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}

      {/* Image Zoom Popup */}
      {showImageZoom && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0, 0, 0, 0.9)",
          zIndex: 1000,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column"
        }}>
          <button
            onClick={() => setShowImageZoom(false)}
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              backgroundColor: "transparent",
              border: "none",
              color: "white",
              fontSize: "24px",
              cursor: "pointer",
              zIndex: 1001
            }}
          >
            <FaTimes size={24} />
          </button>
          
          <div style={{
            width: "90%",
            maxWidth: "1200px",
            maxHeight: "90vh",
            overflow: "hidden",
            display: "flex",
            justifyContent: "center"
          }}>
            <img
              src={selectedImage === 0 ? product.photos : 
                  (product.multipleimages && product.multipleimages.length > 1) ? 
                  product.multipleimages[selectedImage - 1] : product.photos}
              alt={product.name}
              style={{
                maxWidth: "100%",
                maxHeight: "90vh",
                objectFit: "contain"
              }}
            />
          </div>
          
          {/* Thumbnail navigation in zoom view if there are multiple images */}
          {(product.multipleimages && product.multipleimages.length > 0) && (
            <div style={{
              display: "flex",
              overflowX: "auto",
              gap: "10px",
              padding: "15px",
              marginTop: "15px",
              maxWidth: "90%",
              backgroundColor: "rgba(0,0,0,0.5)",
              borderRadius: "8px"
            }}>
              {/* Main image thumbnail */}
              <div
                onClick={() => setSelectedImage(0)}
                style={{
                  width: "60px",
                  height: "60px",
                  border: selectedImage === 0 ? "2px solid #ffa41c" : "1px solid #555",
                  borderRadius: "4px",
                  overflow: "hidden",
                  cursor: "pointer",
                  flexShrink: 0
                }}
              >
                <img
                  src={product.photos}
                  alt={`${product.name} - Main`}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              
              {/* Additional images */}
              {product.multipleimages.map((imgUrl, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedImage(index + 1)}
                  style={{
                    width: "60px",
                    height: "60px",
                    border: selectedImage === index + 1 ? "2px solid #ffa41c" : "1px solid #555",
                    borderRadius: "4px",
                    overflow: "hidden",
                    cursor: "pointer",
                    flexShrink: 0
                  }}
                >
                  <img
                    src={imgUrl}
                    alt={`${product.name} - ${index + 1}`}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Layout>
  );
};

export default ProductDetails;
