<<<<<<< HEAD


import React, { useState, useEffect, useRef } from "react";
import Layout from "./../components/Layout/Layout";
import { useParams, useNavigate } from "react-router-dom";
import { useCart } from "../context/cartContext";
import { useAuth } from "../context/authContext";
import { AiFillWarning, AiFillYoutube } from 'react-icons/ai'; // Icons import
import { FaExpand, FaTimes } from 'react-icons/fa'; // Additional icons for zoom
import toast from "react-hot-toast";
import ProductCard from "./ProductCard";
import OptimizedImage from "../components/UI/OptimizedImage";
import StockPopup from "../features/cart/components/StockPopup"; // Import the StockPopup component
// New centralized API layer & utils
import { http, attachAuth } from "../shared/api/http";
import { getProduct as apiGetProduct, getProductsForYou as apiGetProductsForYou } from "../entities/product/api/product.api";
import { addToCart as apiAddToCart, updateCartQty as apiUpdateCartQty, removeFromCart as apiRemoveFromCart, getProductQty as apiGetProductQty } from "../entities/cart/api/cart.api";
import { addToWishlist as apiAddToWishlist, removeFromWishlist as apiRemoveFromWishlist, checkWishlist as apiCheckWishlist } from "../entities/wishlist/api/wishlist.api";
import { normalizeProductForCard } from "../shared/lib/normalizeProduct";
import { getApplicableBulkProduct as utilGetApplicableBulkProduct, calcTotalPrice as utilCalcTotalPrice } from "../entities/product/utils/bulkPricing";
// Presentational components
import QuantityStepper from "../features/add-to-cart/ui/QuantityStepper";
import BulkPricingTable from "../entities/product/ui/BulkPricingTable";
import YouTubeModal from "../features/product-media/ui/YouTubeModal";
import ImageZoomModal from "../features/product-media/ui/ImageZoomModal";
import ImageGallery from "../entities/product/ui/ImageGallery";

// normalizeProductForCard now imported from shared/lib

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
  const [loadedImages, setLoadedImages] = useState(new Set()); // Track which images have loaded successfully
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
      setLoadedImages(new Set()); // Reset loaded images tracking
      
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

  // Attach auth header centrally for http client
  useEffect(() => {
    attachAuth(() => auth?.user?.token);
  }, [auth?.user?.token]);

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
      const productData = await apiGetProduct(params.slug);
      if (productData) {
        console.log('[Product] Product fetched successfully');
        
        // Parse multipleimages if it's a JSON string
        let processedProduct = { ...productData };
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
          processedProduct.multipleimages = processedProduct.multipleimages.filter(img => {
            if (typeof img !== 'string' || !img.trim()) return false;
            if (img === '/placeholder-image.jpg') return false;
            // Filter out string representations of null/undefined
            if (img === 'null' || img === 'undefined' || img === '[null]' || img === '[undefined]') return false;
            // Filter out empty arrays or objects as strings
            if (img === '[]' || img === '{}' || img === 'null' || img === 'false') return false;
            // Check if it's a valid URL format
            try {
              const url = new URL(img);
              return url.protocol === 'http:' || url.protocol === 'https:';
            } catch {
              // If not a full URL, check if it's a valid relative path
              return img.startsWith('/') && img !== '/' && img.length > 1 || img.includes('cloudinary.com') || img.includes('res.cloudinary.com');
            }
          });
        } else {
          processedProduct.multipleimages = [];
        }
        
        console.log('[Product] Processed multipleimages:', processedProduct.multipleimages);
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
      const items = await apiGetProductsForYou(product.category?._id, product.subcategory?._id);
      setProductsForYou(
        (items || []).map(item => ({
          ...item,
          productId: normalizeProductForCard(item.productId)
        }))
      );
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
      const applicableBulk = utilGetApplicableBulkProduct(product, initialQuantity, unitSet);

      // Check stock before adding
      if (initialQuantity > product.stock) {
        setShowStockPopup(true);
        return;
      }

      const response = await apiAddToCart(auth.user._id, {
        productId: product._id,
        quantity: initialQuantity,
        price: applicableBulk ? parseFloat(applicableBulk.selling_price_set) : parseFloat(product.price),
        bulkProductDetails: applicableBulk,
      });

      console.log('[Cart] Add to cart response:', response);

      if (response.status === "success" || response?.cart) {
        setCart(response.cart || response);
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
      const applicableBulk = utilGetApplicableBulkProduct(product, updatedQuantity, unitSet);
      setSelectedBulk(applicableBulk);
      calculateTotalPrice(applicableBulk, updatedQuantity);
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  };

  // Keep other functions (getApplicableBulkProduct, calculateTotalPrice, etc.)
  // ...

  // getApplicableBulkProduct now provided by util
  
  const calculateTotalPrice = (bulk, quantity) => {
    setTotalPrice(utilCalcTotalPrice(bulk, quantity, product));
  };

  const checkPincode = async (pincode) => {
    try {
      const { data } = await http.get("/pincodes/get-pincodes");
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
      await apiUpdateCartQty(auth.user._id, product._id, quantity);
    } catch (error) {
      console.error("Quantity update error:", error);
    }
  };

  const removeFromCart = async (productId) => {
    if (!auth.user._id) return;

    try {
      await apiRemoveFromCart(auth.user._id, productId);
    } catch (error) {
      console.error("Remove from cart failed:", error.message);
    }
  };

  const fetchInitialQuantity = async (productId) => {
    if (!auth?.user?._id || !productId) return;

    try {
      const qty = await apiGetProductQty(auth.user._id, productId);
      if (qty) {
        const quantity = qty;
        setDisplayQuantity(quantity);
        setShowQuantitySelector(quantity > 0);

        const applicableBulk = utilGetApplicableBulkProduct(product, quantity, unitSet);
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
        await apiRemoveFromWishlist(auth.user._id, product._id);
        setIsInWishlist(false);
      } else {
        await apiAddToWishlist(auth.user._id, product._id);
        setIsInWishlist(true);
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);
    }
  };

  const checkWishlistStatus = async (productId) => {
    if (!auth.user) return;

    try {
      const exists = await apiCheckWishlist(auth.user._id, productId);
      setIsInWishlist(!!exists);
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

  // Build gallery images array: main photo + additional images
  const galleryImages = [
    product.photos,
    ...(Array.isArray(product.multipleimages) ? product.multipleimages : [])
  ].filter((img) => typeof img === 'string' && img.trim());

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
            <ImageGallery
              main={galleryImages[Math.min(selectedImage, Math.max(galleryImages.length - 1, 0))]}
              images={galleryImages}
              selectedIndex={selectedImage}
              onSelect={setSelectedImage}
              onZoom={() => setShowImageZoom(true)}
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
                <QuantityStepper
                  value={displayQuantity}
                  unit={unitSet}
                  disabled={isAddingToCartRef.current}
                  onDec={() => handleQuantityChange(false)}
                  onInc={() => {
                    if (displayQuantity === 0) {
                      addToCart();
                    } else {
                      handleQuantityChange(true);
                    }
                  }}
                />
              </div>
            </div>

            <h3 style={{ ...headingStyle, fontSize: isMobile ? "16px" : "18px", marginTop: "20px" }}>
              Bulk Pricing
            </h3>
            
            {/* Bulk Pricing Table */}
            <BulkPricingTable
              bulkProducts={product.bulkProducts}
              unitSet={unitSet}
              selectedBulk={selectedBulk}
              total={totalPrice}
            />

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
      <YouTubeModal
        url={product.youtubeUrl ? (product.youtubeUrl.includes('embed/') ? product.youtubeUrl : product.youtubeUrl.replace('watch?v=', 'embed/')) : ''}
        open={showYoutubePopup && !!product.youtubeUrl}
        onClose={() => setShowYoutubePopup(false)}
      />

      {/* Image Zoom Popup */}
      <ImageZoomModal
        src={selectedImage === 0 ? product.photos : (
          product.multipleimages && Array.isArray(product.multipleimages) && product.multipleimages.length > 0 && selectedImage <= product.multipleimages.length
        ) ? product.multipleimages[selectedImage - 1] : product.photos}
        thumbs={[product.photos, ...(Array.isArray(product.multipleimages) ? product.multipleimages : [])]}
        open={showImageZoom}
        onClose={() => setShowImageZoom(false)}
        selected={selectedImage}
        onSelect={setSelectedImage}
      />
    </Layout>
  );
};

export default ProductDetails;
=======
>>>>>>> 4dfcbaf53792781327558b6f61c9b00ac93c8749
