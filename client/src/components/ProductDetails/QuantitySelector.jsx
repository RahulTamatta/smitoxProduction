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

  const quantitySelectorStyle = {
    display: "flex",
    alignItems: "center",
    marginBottom: isMobile ? "15px" : "20px",
  };

  const buttonStyle = {
    padding: isMobile ? "8px 16px" : "10px 20px",
    fontSize: isMobile ? "14px" : "16px",
    cursor: "pointer",
    backgroundColor: "red",
    color: "#111111",
    border: "none",
    borderRadius: "20px",
    transition: "background-color 0.3s",
    // Prevent text/image selection on rapid tap
    userSelect: "none",
    WebkitUserSelect: "none",
    // Prevent 300ms tap delay on mobile browsers
    touchAction: "manipulation",
  };

  const inputStyle = {
    width: isMobile ? "40px" : "50px",
    height: isMobile ? "36px" : "40px",
    textAlign: "center",
    margin: "0 10px",
    padding: "5px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontSize: isMobile ? "16px" : "14px",
  };

  return (
    <div style={quantitySelectorStyle}>
      {/* MINUS button */}
      <button
        onTouchStart={(e) => {
          e.preventDefault(); // prevent ghost click
          safeHandleQuantityChange(false, 'touch');
        }}
        onClick={(e) => {
          safeHandleQuantityChange(false, 'click');
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
        aria-label="Decrease quantity"
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
        aria-label="Current quantity"
      />

      {/* PLUS button */}
      <button
        onTouchStart={(e) => {
          e.preventDefault(); // prevent ghost click
          if (displayQuantity === 0) {
            safeAddToCart('touch');
          } else {
            safeHandleQuantityChange(true, 'touch');
          }
        }}
        onClick={(e) => {
          if (displayQuantity === 0) {
            safeAddToCart('click');
          } else {
            safeHandleQuantityChange(true, 'click');
          }
        }}
        style={{
          ...buttonStyle,
          minWidth: isMobile ? "36px" : "40px",
          height: isMobile ? "36px" : "40px",
          padding: "0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          // FIX: Use isAddingToCart state (not the ref) for disabled so React
          // re-renders correctly. The ref is only used for internal logic guards.
          opacity: isAddingToCartRef.current ? 0.6 : 1,
          pointerEvents: isAddingToCartRef.current ? "none" : "auto",
        }}
        aria-label="Increase quantity"
        aria-disabled={isAddingToCartRef.current}
      >
        <span style={{ fontSize: isMobile ? "18px" : "20px" }}>+</span>
      </button>
    </div>
  );
};

export default QuantitySelector;
