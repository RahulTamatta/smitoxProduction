import React from 'react';
import { AiFillYoutube } from 'react-icons/ai';

const ProductInfo = ({
  product,
  totalPrice,
  setShowYoutubePopup,
  isMobile,
  isTablet
}) => {
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

  const totalPriceAreaStyle = {
    display: "flex",
    flexDirection: isMobile ? "column" : "row",
    alignItems: isMobile ? "flex-start" : "center",
    justifyContent: isMobile ? "flex-start" : "space-between",
    gap: isMobile ? "10px" : "0",
    marginBottom: "15px",
  };

  return (
    <div style={infoStyle}>
      <h1 style={headingStyle}>{product.name}</h1>
      
      <div style={priceStyle}>
        <span style={strikeThroughStyle}>₹{product.mrp}</span>
        <span style={{ color: "red", fontSize: isMobile ? "18px" : "22px" }}>
          ₹{product.perPiecePrice}
        </span>
      </div>
      
      <div style={totalPriceAreaStyle}>
        <span style={{ 
          fontSize: isMobile ? "16px" : "18px",
          fontWeight: "500" 
        }}>
          Total Price: ₹{totalPrice.toFixed(2)}
        </span>
        
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
      </div>

      <h3 style={{ 
        ...headingStyle, 
        fontSize: isMobile ? "16px" : "18px", 
        marginTop: "20px" 
      }}>
        Description
      </h3>

      <p style={{ 
        fontSize: isMobile ? "14px" : "16px", 
        marginTop: "0px" 
      }}>
        {product.description}
      </p>
    </div>
  );
};

export default ProductInfo;
