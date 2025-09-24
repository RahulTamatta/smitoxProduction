

import React from "react";
import Layout from "./../components/Layout/Layout";
import { AiFillWarning } from 'react-icons/ai';
import StockPopup from "./cart/StockPopup";

// Import modular components
import ProductImageGallery from '../components/ProductDetails/ProductImageGallery';
import ProductInfo from '../components/ProductDetails/ProductInfo';
import QuantitySelector from '../components/ProductDetails/QuantitySelector';
import BulkPricingTable from '../components/ProductDetails/BulkPricingTable';
import ProductsForYou from '../components/ProductDetails/ProductsForYou';
import LoginPromptModal from '../components/ProductDetails/modals/LoginPromptModal';
import YouTubePopupModal from '../components/ProductDetails/modals/YouTubePopupModal';
import ImageZoomModal from '../components/ProductDetails/modals/ImageZoomModal';

// Import custom hooks
import { useProductData } from '../components/ProductDetails/hooks/useProductData';
import { useCartOperations } from '../components/ProductDetails/hooks/useCartOperations';
import { useUIState } from '../components/ProductDetails/hooks/useUIState';


const ProductDetails = () => {
  // Use custom hooks for state management
  const { product, productsForYou, isNetworkError, normalizeProductForCard } = useProductData();
  const {
    selectedBulk,
    totalPrice,
    unitSet,
    displayQuantity,
    showLoginPrompt,
    setShowLoginPrompt,
    showStockPopup,
    setShowStockPopup,
    isAddingToCartRef,
    addToCart,
    handleQuantityChange
  } = useCartOperations(product);
  const {
    isMobile,
    isTablet,
    selectedImage,
    setSelectedImage,
    showYoutubePopup,
    setShowYoutubePopup,
    showImageZoom,
    setShowImageZoom,
    loadedImages,
    setLoadedImages,
    resetProductState
  } = useUIState();

  // Handle product navigation with state reset
  const handleProductNavigation = () => {
    resetProductState();
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
          <ProductImageGallery
            product={product}
            selectedImage={selectedImage}
            setSelectedImage={setSelectedImage}
            setShowImageZoom={setShowImageZoom}
            loadedImages={loadedImages}
            setLoadedImages={setLoadedImages}
            isMobile={isMobile}
          />

          {/* Product Info */}
          <div>
            <ProductInfo
              product={product}
              totalPrice={totalPrice}
              setShowYoutubePopup={setShowYoutubePopup}
              isMobile={isMobile}
              isTablet={isTablet}
            />
            
            {/* Quantity Selector */}
            <QuantitySelector
              displayQuantity={displayQuantity}
              handleQuantityChange={handleQuantityChange}
              addToCart={addToCart}
              isAddingToCartRef={isAddingToCartRef}
              isMobile={isMobile}
            />

            {/* Bulk Pricing Table */}
            <BulkPricingTable
              product={product}
              unitSet={unitSet}
              selectedBulk={selectedBulk}
              totalPrice={totalPrice}
              isMobile={isMobile}
            />
          </div>
        </div>
      </div>
      
      {/* Products For You Section */}
      <ProductsForYou
        productsForYou={productsForYou}
        normalizeProductForCard={normalizeProductForCard}
        onProductClick={handleProductNavigation}
        isMobile={isMobile}
      />
      
      {/* Stock Popup Modal */}
      <StockPopup
        show={showStockPopup}
        onHide={() => setShowStockPopup(false)}
        product={product}
        requestedQuantity={displayQuantity}
      />

      {/* Login Prompt Modal */}
      <LoginPromptModal
        showLoginPrompt={showLoginPrompt}
        setShowLoginPrompt={setShowLoginPrompt}
        isMobile={isMobile}
      />

      {/* YouTube Video Popup */}
      <YouTubePopupModal
        showYoutubePopup={showYoutubePopup}
        setShowYoutubePopup={setShowYoutubePopup}
        product={product}
        isMobile={isMobile}
      />

      {/* Image Zoom Popup */}
      <ImageZoomModal
        showImageZoom={showImageZoom}
        setShowImageZoom={setShowImageZoom}
        product={product}
        selectedImage={selectedImage}
        setSelectedImage={setSelectedImage}
      />
    </Layout>
  );
};

export default ProductDetails;
