import React, { useRef } from 'react';

const QuantitySelector = ({
  displayQuantity,
  handleQuantityChange,
  addToCart,
  isAddingToCartRef,
  isMobile
}) => {
  // FIX: Track last interaction time to prevent touch+click double-fire at the
  // button level as an additional safety net beyond the hook-level guard.
  const lastInteractionRef = useRef(0);
  const DEBOUNCE_MS = 100; // 100ms dedupe window for mechanical double-events

  const safeHandleQuantityChange = (increment, eventType) => {
    const now = Date.now();
    if (now - lastInteractionRef.current < DEBOUNCE_MS) return;
    lastInteractionRef.current = now;
    handleQuantityChange(increment, eventType);
  };

  const safeAddToCart = (eventType) => {
    const now = Date.now();
    if (now - lastInteractionRef.current < DEBOUNCE_MS) return;
    lastInteractionRef.current = now;
    addToCart();
  };



  return (
    <div className="flex flex-col gap-4 w-full mb-4">
      <div className="flex gap-4 h-14 w-full">
        {displayQuantity === 0 ? (
          <button 
            onTouchStart={(e) => {
              e.preventDefault();
              safeAddToCart('touch');
            }}
            onClick={(e) => {
              safeAddToCart('click');
            }}
            className={`w-full bg-primary text-on-primary font-label-md text-label-md rounded-full flex items-center justify-center gap-2 h-14 hover:bg-primary/90 transition-all active:scale-95 inner-glow ambient-shadow ${isAddingToCartRef.current ? 'opacity-60 pointer-events-none' : ''}`}
          >
            <span className="material-symbols-outlined">shopping_cart_checkout</span>
            Add to Bulk Cart
          </button>
        ) : (
          <div className="flex items-center justify-between bg-surface-container-high rounded-full px-2 w-full border border-outline-variant/50">
            {/* MINUS button */}
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                safeHandleQuantityChange(false, 'touch');
              }}
              onClick={(e) => {
                safeHandleQuantityChange(false, 'click');
              }}
              className="w-10 h-10 rounded-full hover:bg-surface-container-highest flex items-center justify-center text-on-surface transition-colors select-none touch-manipulation"
              aria-label="Decrease quantity"
            >
              <span className="material-symbols-outlined text-lg font-bold">-</span>
            </button>

            <input
              type="number"
              value={displayQuantity}
              readOnly
              className="w-full text-center bg-transparent border-none p-0 font-label-md text-label-md text-on-surface focus:ring-0 appearance-none m-0"
              style={{ MozAppearance: "textfield" }}
              aria-label="Current quantity"
            />

            {/* PLUS button */}
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                safeHandleQuantityChange(true, 'touch');
              }}
              onClick={(e) => {
                safeHandleQuantityChange(true, 'click');
              }}
              className="w-10 h-10 rounded-full hover:bg-surface-container-highest flex items-center justify-center text-on-surface transition-colors select-none touch-manipulation"
              aria-label="Increase quantity"
            >
              <span className="material-symbols-outlined text-lg font-bold">+</span>
            </button>
          </div>
        )}
      </div>
      
      <button 
        onClick={() => {
          window.open(`https://wa.me/+918850832942?text=${encodeURIComponent("Hi, I am interested in requesting a custom quote.")}`, '_blank');
        }}
        className="w-full h-12 rounded-full border-2 border-primary text-primary font-label-md text-label-md flex items-center justify-center gap-2 hover:bg-primary-fixed/30 transition-colors"
      >
        <span className="material-symbols-outlined">chat_bubble</span> Request Custom Quote
      </button>
    </div>
  );
};

export default QuantitySelector;
