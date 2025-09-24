import React from 'react';
import { FaTimes } from 'react-icons/fa';

const YouTubePopupModal = ({
  showYoutubePopup,
  setShowYoutubePopup,
  product,
  isMobile
}) => {
  if (!showYoutubePopup || !product.youtubeUrl) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      zIndex: 1000,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "column"
    }}>
      <div style={{
        position: "relative",
        width: isMobile ? "90%" : "70%",
        maxWidth: "800px",
        aspectRatio: "16/9"
      }}>
        <button
          onClick={() => setShowYoutubePopup(false)}
          style={{
            position: "absolute",
            top: "-40px",
            right: "0",
            backgroundColor: "transparent",
            border: "none",
            color: "white",
            fontSize: "24px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <FaTimes />
        </button>
        <iframe
          width="100%"
          height="100%"
          src={product.youtubeUrl ? 
            (product.youtubeUrl.includes('embed/') ? 
              product.youtubeUrl : 
              product.youtubeUrl.replace('watch?v=', 'embed/')
            ) : ''}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
};

export default YouTubePopupModal;
