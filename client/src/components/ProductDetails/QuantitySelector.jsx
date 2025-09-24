import React from 'react';

const QuantitySelector = ({
  displayQuantity,
  handleQuantityChange,
  addToCart,
  isAddingToCartRef,
  isMobile
}) => {
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
  );
};

export default QuantitySelector;
