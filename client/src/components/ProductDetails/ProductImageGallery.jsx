import React from 'react';
import { FaExpand } from 'react-icons/fa';
import OptimizedImage from '../OptimizedImage';

const ProductImageGallery = ({
  product,
  selectedImage,
  setSelectedImage,
  setShowImageZoom,
  loadedImages,
  setLoadedImages,
  isMobile
}) => {
  const imageStyle = {
    flex: isMobile ? "1 1 100%" : "1 1 300px",
    maxWidth: isMobile ? "100%" : "500px",
    margin: isMobile ? "0 auto" : "0",
  };

  return (
    <div style={imageStyle}>
      {/* Main large image display */}
      <div 
        onClick={() => setShowImageZoom(true)}
        style={{ 
          marginBottom: "10px", 
          borderRadius: "8px",
          overflow: "hidden",
          boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
          position: "relative",
          cursor: "zoom-in",
          paddingTop: isMobile ? "16px" : "28px"
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            zIndex: 2,
            backgroundColor: "rgba(255,255,255,0.7)",
            borderRadius: "50%",
            width: "30px",
            height: "30px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer"
          }}
        >
          <FaExpand color="#333" size={16} />
        </div>
        <OptimizedImage
          src={selectedImage === 0 ? product.photos : 
                (product.multipleimages && Array.isArray(product.multipleimages) && product.multipleimages.length > 0 && selectedImage <= product.multipleimages.length) ? 
                product.multipleimages[selectedImage - 1] : product.photos}
          alt={product.name}
          style={{ 
            borderRadius: "8px",
            width: "100%",
            height: "auto",
            maxHeight: isMobile ? "300px" : "500px"
          }}
          width={isMobile ? 300 : 500}
          height={isMobile ? 300 : 500}
          objectFit="contain"
          backgroundColor="#ffffff"
          quality={isMobile ? 75 : 85}
          loading="eager"
        />
      </div>
      
      {/* Thumbnail gallery */}
      {(product.multipleimages && Array.isArray(product.multipleimages) && product.multipleimages.length > 0) && (
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          justifyContent: isMobile ? "center" : "flex-start"
        }}>
          {/* Main product image thumbnail */}
          <div 
            onClick={() => setSelectedImage(0)}
            style={{
              width: isMobile ? "60px" : "80px",
              height: isMobile ? "60px" : "80px",
              border: selectedImage === 0 ? "2px solid #ffa41c" : "1px solid #ddd",
              borderRadius: "4px",
              overflow: "hidden",
              cursor: "pointer"
            }}
          >
            <OptimizedImage
              src={product.photos}
              alt={`${product.name} - Main`}
              style={{ width: "100%", height: "100%" }}
              width={isMobile ? 60 : 80}
              height={isMobile ? 60 : 80}
              objectFit="cover"
              quality={60}
            />
          </div>
          {/* Additional images thumbnails */}
          {product.multipleimages
            .map((imgUrl, index) => {
              // Skip if imgUrl is invalid
              if (!imgUrl || typeof imgUrl !== 'string' || !imgUrl.trim()) {
                console.warn(`Invalid image URL at index ${index}:`, imgUrl);
                return null;
              }
              
              return {
                imgUrl,
                index,
                key: `thumb-${index}`
              };
            })
            .filter(Boolean) // Remove null entries
            .map(({ imgUrl, index, key }) => (
              <div 
                key={key}
                data-thumbnail="true"
                onClick={() => setSelectedImage(index + 1)}
                style={{
                  width: isMobile ? "60px" : "80px",
                  height: isMobile ? "60px" : "80px",
                  border: selectedImage === index + 1 ? "2px solid #ffa41c" : "1px solid #ddd",
                  borderRadius: "4px",
                  overflow: "hidden",
                  cursor: "pointer",
                  backgroundColor: "#f8f9fa"
                }}
              >
                <OptimizedImage
                  src={imgUrl}
                  alt={`${product.name} - ${index + 1}`}
                  style={{ width: "100%", height: "100%" }}
                  width={isMobile ? 60 : 80}
                  height={isMobile ? 60 : 80}
                  objectFit="cover"
                  quality={60}
                  backgroundColor="transparent"
                  onLoad={() => {
                    setLoadedImages(prev => new Set([...prev, imgUrl]));
                  }}
                  onError={(e) => {
                    console.error(`Failed to load thumbnail image:`, imgUrl);
                    // Hide the entire thumbnail container if image fails
                    const container = e.target.closest('[data-thumbnail]');
                    if (container) {
                      container.style.display = 'none';
                    }
                  }}
                />
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default ProductImageGallery;
