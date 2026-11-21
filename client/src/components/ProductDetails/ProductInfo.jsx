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
  const mrp = Number(product.mrp);
  const perPiecePrice = Number(product.perPiecePrice);
  const hasDiscount = mrp > perPiecePrice && perPiecePrice > 0;
  const discountPct = hasDiscount ? Math.round(((mrp - perPiecePrice) / mrp) * 100) : 0;

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
      
      <h1 className="font-headline-md text-headline-md md:font-headline-lg md:text-headline-lg font-bold text-on-surface leading-tight mb-2">
        {product.name}
      </h1>
      
      <p className="flex flex-wrap items-baseline gap-2 mb-4">
        <span className="text-primary font-bold text-2xl md:text-3xl">₹{product.perPiecePrice}</span>
        <span className="font-body-md text-body-md text-on-surface-variant">/ pc</span>
        <span className="font-body-md text-body-md text-on-surface-variant line-through">MRP: ₹{product.mrp}</span>
        {discountPct > 0 && (
          <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 font-label-sm text-label-sm">
            {discountPct}% OFF
          </span>
        )}
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
