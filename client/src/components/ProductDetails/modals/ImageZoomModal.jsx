import React from 'react';
import { FaTimes } from 'react-icons/fa';

const ImageZoomModal = ({
  showImageZoom,
  setShowImageZoom,
  product,
  selectedImage,
  setSelectedImage
}) => {
  if (!showImageZoom) return null;

  return (
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
              (product.multipleimages && Array.isArray(product.multipleimages) && product.multipleimages.length > 0 && selectedImage <= product.multipleimages.length) ? 
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
      {(product.multipleimages && Array.isArray(product.multipleimages) && product.multipleimages.length > 0) && (
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
          {product.multipleimages
            .filter(imgUrl => imgUrl && typeof imgUrl === 'string' && imgUrl.trim() && 
              imgUrl !== 'null' && imgUrl !== '[null]' && imgUrl !== 'undefined')
            .map((imgUrl, index) => (
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
  );
};

export default ImageZoomModal;
