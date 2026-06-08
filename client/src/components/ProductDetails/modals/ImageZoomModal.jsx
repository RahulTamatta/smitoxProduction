import { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

const ImageZoomModal = ({
  showImageZoom,
  setShowImageZoom,
  product,
  selectedImage,
  setSelectedImage
}) => {
  const [failedImages, setFailedImages] = useState(new Set());
  const [activeTab, setActiveTab] = useState('images');

  // Reset tab when modal opens or closes
  useEffect(() => {
    if (showImageZoom) {
      setActiveTab('images');
    }
  }, [showImageZoom]);

  if (!showImageZoom || !product) return null;

  const hasVideo = !!product.youtubeUrl;

  // Helper to normalize image URLs
  const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    if (url.startsWith('uploads/')) return `/${url}`;
    if (url.startsWith('/uploads/')) return url;
    return url;
  };

  // Helper to get YouTube Embed URL
  const getYoutubeEmbedUrl = (url) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11)
      ? `https://www.youtube.com/embed/${match[2]}?autoplay=1&mute=0`
      : url;
  };

  // Get current main image URL
  const getMainImageUrl = () => {
    if (selectedImage === 0) {
      return getImageUrl(product.photos);
    }
    if (product.multipleimages &&
      Array.isArray(product.multipleimages) &&
      product.multipleimages.length > 0 &&
      selectedImage <= product.multipleimages.length) {
      return getImageUrl(product.multipleimages[selectedImage - 1]);
    }
    return getImageUrl(product.photos);
  };

  const mainImageUrl = getMainImageUrl();

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      zIndex: 1000,
      display: "flex",
      justifyContent: "center",
      alignItems: "center"
    }}>
      <div style={{
        backgroundColor: "#fff",
        width: "95vw",
        height: "90vh",
        maxWidth: "1400px",
        borderRadius: "8px",
        display: "flex",
        flexDirection: "row",
        position: "relative",
        boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
        overflow: "hidden"
      }}>
        {/* Close Button */}
        <button
          onClick={() => setShowImageZoom(false)}
          style={{
            position: "absolute",
            top: "15px",
            right: "20px",
            backgroundColor: "transparent",
            border: "none",
            color: "#333",
            fontSize: "24px",
            cursor: "pointer",
            zIndex: 1001,
            padding: "5px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            transition: "background-color 0.2s"
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <FaTimes size={20} />
        </button>

        {/* Left Column - Media View */}
        <div style={{
          flex: "0 0 65%",
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid #eee",
          backgroundColor: "#fff"
        }}>
          {/* Tabs */}
          {hasVideo && (
            <div style={{
              display: "flex",
              borderBottom: "1px solid #ddd",
              padding: "0 20px"
            }}>
              <button
                onClick={() => setActiveTab('videos')}
                style={{
                  padding: "15px 20px",
                  backgroundColor: "transparent",
                  border: "none",
                  borderBottom: activeTab === 'videos' ? "3px solid #008296" : "3px solid transparent",
                  color: activeTab === 'videos' ? "#008296" : "#555",
                  fontWeight: activeTab === 'videos' ? "bold" : "normal",
                  fontSize: "14px",
                  cursor: "pointer",
                  outline: "none"
                }}
              >
                VIDEOS
              </button>
              <button
                onClick={() => setActiveTab('images')}
                style={{
                  padding: "15px 20px",
                  backgroundColor: "transparent",
                  border: "none",
                  borderBottom: activeTab === 'images' ? "3px solid #008296" : "3px solid transparent",
                  color: activeTab === 'images' ? "#008296" : "#555",
                  fontWeight: activeTab === 'images' ? "bold" : "normal",
                  fontSize: "14px",
                  cursor: "pointer",
                  outline: "none"
                }}
              >
                IMAGES
              </button>
            </div>
          )}

          {/* Media Content */}
          <div style={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "20px",
            overflow: "hidden"
          }}>
            {activeTab === 'videos' && hasVideo ? (
              <iframe
                width="100%"
                height="100%"
                src={getYoutubeEmbedUrl(product.youtubeUrl)}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ maxHeight: "100%", maxWidth: "100%" }}
              ></iframe>
            ) : (
              <img
                src={mainImageUrl}
                alt={product.name}
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain"
                }}
              />
            )}
          </div>
        </div>

        {/* Right Column - Product Info & Thumbnails */}
        <div style={{
          flex: "0 0 35%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#fff",
          padding: "25px 20px 20px 20px"
        }}>
          {/* Product Details */}
          <div style={{ marginBottom: "20px" }}>
            <h2 style={{ 
              fontSize: "20px", 
              fontWeight: "500", 
              color: "#0F1111", 
              margin: "0 0 10px 0",
              lineHeight: "1.3"
            }}>
              {product.name}
            </h2>
            {product.price && (
              <div style={{ fontSize: "24px", color: "#B12704", fontWeight: "400", marginBottom: "5px" }}>
                ₹{product.price}
              </div>
            )}
            {product.custom_order !== undefined && (
              <div style={{ fontSize: "14px", color: "#565959", marginBottom: "5px" }}>
                SKU: {product.sku || product.custom_order}
              </div>
            )}
          </div>

          {/* Thumbnails Grid with Scroll */}
          <div style={{
            flex: 1,
            overflowY: "auto",
            paddingRight: "10px",
            // Custom scrollbar styling for webkit
            cssText: `
              &::-webkit-scrollbar { width: 8px; }
              &::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
              &::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 4px; }
              &::-webkit-scrollbar-thumb:hover { background: #a8a8a8; }
            `
          }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "10px",
              paddingBottom: "20px"
            }}>
              {/* Main image thumbnail */}
              <div
                onClick={() => {
                  setSelectedImage(0);
                  setActiveTab('images');
                }}
                style={{
                  aspectRatio: "1",
                  border: selectedImage === 0 && activeTab === 'images' ? "2px solid #008296" : "1px solid #D5D9D9",
                  borderRadius: "4px",
                  overflow: "hidden",
                  cursor: "pointer",
                  padding: "4px",
                  boxShadow: selectedImage === 0 && activeTab === 'images' ? "0 0 5px rgba(0,130,150,0.5)" : "none"
                }}
              >
                <img
                  src={getImageUrl(product.photos)}
                  alt={`${product.name} - Main`}
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              </div>

              {/* Additional images */}
              {product.multipleimages && Array.isArray(product.multipleimages) && 
                product.multipleimages
                .filter(imgUrl => imgUrl && typeof imgUrl === 'string' && imgUrl.trim() &&
                  imgUrl !== 'null' && imgUrl !== '[null]' && imgUrl !== 'undefined')
                .filter(imgUrl => !failedImages.has(imgUrl))
                .map((imgUrl, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      setSelectedImage(index + 1);
                      setActiveTab('images');
                    }}
                    style={{
                      aspectRatio: "1",
                      border: selectedImage === index + 1 && activeTab === 'images' ? "2px solid #008296" : "1px solid #D5D9D9",
                      borderRadius: "4px",
                      overflow: "hidden",
                      cursor: "pointer",
                      padding: "4px",
                      boxShadow: selectedImage === index + 1 && activeTab === 'images' ? "0 0 5px rgba(0,130,150,0.5)" : "none"
                    }}
                  >
                    <img
                      src={getImageUrl(imgUrl)}
                      alt={`${product.name} - ${index + 1}`}
                      style={{ width: "100%", height: "100%", objectFit: "contain" }}
                      onError={() => {
                        setFailedImages(prev => new Set(prev).add(imgUrl));
                      }}
                    />
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageZoomModal;
