import React from 'react';
import { AiFillWarning } from 'react-icons/ai';
import Layout from "./../components/Layout/Layout";
import StockPopup from "./cart/StockPopup";

// Import modular components
import BulkPricingTable from '../components/ProductDetails/BulkPricingTable';
import ProductImageGallery from '../components/ProductDetails/ProductImageGallery';
import ProductInfo from '../components/ProductDetails/ProductInfo';
import ProductsForYou from '../components/ProductDetails/ProductsForYou';
// QuantitySelector is now rendered inside ProductInfo
import ImageZoomModal from '../components/ProductDetails/modals/ImageZoomModal';
import LoginPromptModal from '../components/ProductDetails/modals/LoginPromptModal';
import YouTubePopupModal from '../components/ProductDetails/modals/YouTubePopupModal';

// Import custom hooks
import { useCartOperations } from '../components/ProductDetails/hooks/useCartOperations';
import { useProductData } from '../components/ProductDetails/hooks/useProductData';
import { useUIState } from '../components/ProductDetails/hooks/useUIState';


const ProductDetails = () => {
  // Use custom hooks for state management
  const { product, productsForYou, isNetworkError, isLoading, normalizeProductForCard } = useProductData();
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

  // Removed old containerStyle and productDetailStyle in favor of Tailwind classes

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[60vh] max-w-container-max mx-auto px-margin-desktop">
          <div className="spinner-border text-primary w-16 h-16" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product || Object.keys(product).length === 0) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[60vh] max-w-container-max mx-auto px-margin-desktop">
          <p className="text-[1.2rem] text-[#666]">Product not found.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title={`${product.name} - Buy Wholesale at Smitox`}
      description={`${product.description?.substring(0, 160) || "Buy " + product.name + " at wholesale prices on Smitox."}`}
      keywords={`${product.name}, wholesale ${product.name}, bulk ${product.name}, smitox`}
    >
      {isNetworkError && (
        <div className="alert alert-warning m-2">
          <AiFillWarning /> Network connection issues detected.
          Some features may not work properly.
        </div>
      )}
      <main className="max-w-container-max mx-auto px-4 md:px-margin-desktop py-stack-lg font-body-md text-on-surface bg-background overflow-x-hidden">
        <div className="flex items-center gap-2 text-on-surface-variant font-body-md text-body-md mb-8">
          <a href="/" className="hover:text-primary transition-colors">Home</a>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <a href="#" className="hover:text-primary transition-colors">{product.category?.name || "Category"}</a>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-primary font-medium">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter mb-stack-lg">
          <div className="lg:col-span-7 flex flex-col gap-4">
            <ProductImageGallery
              product={product}
              selectedImage={selectedImage}
              setSelectedImage={setSelectedImage}
              setShowImageZoom={setShowImageZoom}
              loadedImages={loadedImages}
              setLoadedImages={setLoadedImages}
              isMobile={isMobile}
            />
          </div>

          <div className="lg:col-span-5 flex flex-col pt-4">
            <ProductInfo
              product={product}
              totalPrice={totalPrice}
              setShowYoutubePopup={setShowYoutubePopup}
              isMobile={isMobile}
              isTablet={isTablet}
              displayQuantity={displayQuantity}
              handleQuantityChange={handleQuantityChange}
              addToCart={addToCart}
              isAddingToCartRef={isAddingToCartRef}
            />

            <BulkPricingTable
              product={product}
              unitSet={unitSet}
              selectedBulk={selectedBulk}
              totalPrice={totalPrice}
              isMobile={isMobile}
            />
          </div>
        </div>
        
        {/* Specifications Section - Commented out per request
        <div className="mt-stack-lg border-t border-outline-variant/30 pt-stack-lg">
          <div className="flex gap-8 border-b border-outline-variant/30 mb-8 overflow-x-auto hide-scrollbar">
            <button className="pb-4 border-b-2 border-primary font-label-md text-label-md text-primary px-2 whitespace-nowrap">Product Specifications</button>
            <button className="pb-4 border-b-2 border-transparent font-body-md text-body-md text-on-surface-variant hover:text-on-surface px-2 whitespace-nowrap">Wholesale Terms</button>
            <button className="pb-4 border-b-2 border-transparent font-body-md text-body-md text-on-surface-variant hover:text-on-surface px-2 whitespace-nowrap">Reviews (0)</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
            <div className="bg-surface-container-lowest rounded-[24px] p-8 border border-surface-container ambient-shadow">
              <h4 className="font-headline-md text-headline-md text-on-surface mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">memory</span> Core Features
              </h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary-container mt-0.5">check</span>
                  <div>
                    <span className="font-label-md text-label-md text-on-surface block">High Quality Guaranteed</span>
                    <span className="font-body-md text-body-md text-on-surface-variant">Best in class material and build quality.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary-container mt-0.5">check</span>
                  <div>
                    <span className="font-label-md text-label-md text-on-surface block">Wholesale Value</span>
                    <span className="font-body-md text-body-md text-on-surface-variant">Sourced directly from manufacturers for maximum margin.</span>
                  </div>
                </li>
              </ul>
            </div>
            <div className="bg-surface-container-lowest rounded-[24px] p-8 border border-surface-container ambient-shadow">
              <h4 className="font-headline-md text-headline-md text-on-surface mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary">package_2</span> Shipping Details
              </h4>
              <div className="bg-surface p-4 rounded-xl mb-4 font-body-md text-body-md text-on-surface-variant border border-outline-variant/30">
                Dispatched within 3-5 business days across India. Secure packaging for bulk orders.
              </div>
            </div>
          </div>
        </div>
        */}
      </main>

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
