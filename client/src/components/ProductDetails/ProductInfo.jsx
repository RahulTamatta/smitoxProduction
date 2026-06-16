import React from 'react';
import { AiFillYoutube } from 'react-icons/ai';
import QuantitySelector from './QuantitySelector';

const ProductInfo = ({
  product,
  totalPrice,
  setShowYoutubePopup,
  isMobile,
  isTablet,
  displayQuantity,
  handleQuantityChange,
  addToCart,
  isAddingToCartRef
}) => {
  return (
    <div className="mb-6">
      <div className="flex gap-2 mb-3">
        <span className="bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm px-3 py-1 rounded-lg flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">check_circle</span> In Stock
        </span>
        <span className="bg-secondary-container text-on-secondary-container font-label-sm text-label-sm px-3 py-1 rounded-lg">
          Ready to Ship
        </span>
      </div>
      
      <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">
        {product.name}
      </h1>
      
      <p className="font-body-md text-body-md text-on-surface-variant mb-4">
        MRP: <span className="line-through mr-2">₹{product.mrp}</span>
        <span className="text-primary font-bold text-xl">₹{product.perPiecePrice}</span> / piece
      </p>

      <QuantitySelector
        displayQuantity={displayQuantity}
        handleQuantityChange={handleQuantityChange}
        addToCart={addToCart}
        isAddingToCartRef={isAddingToCartRef}
        isMobile={isMobile}
      />

      {product.description && (
        <p className="font-body-md text-body-md text-on-surface-variant mb-4 bg-surface-container-low p-3 md:p-4 rounded-xl border border-surface-container break-words overflow-hidden">
          {product.description}
        </p>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4 bg-primary-fixed/20 p-3 rounded-xl border border-primary-fixed overflow-hidden">
        <span className="font-label-md text-label-md text-on-surface">
          Total Price: <span className="font-bold text-primary text-lg">₹{totalPrice.toFixed(2)}</span>
        </span>
        
        {/* YouTube Button - Show only if product has YouTube URL */}
        {product.youtubeUrl && (
          <button
            onClick={() => setShowYoutubePopup(true)}
            className="flex items-center gap-2 bg-[#ff0000] text-white rounded-full px-4 py-2 text-sm font-bold hover:bg-[#cc0000] transition-colors"
          >
            <AiFillYoutube size={20} />
            Watch Video
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductInfo;
