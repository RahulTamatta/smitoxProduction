import React from 'react';
import { FaTimes } from 'react-icons/fa';

const YouTubePopupModal = ({
  showYoutubePopup,
  setShowYoutubePopup,
  product,
  isMobile
}) => {
  if (!showYoutubePopup || !product.youtubeUrl) return null;

  const getEmbedUrl = (url) => {
    if (!url) return '';
    
    // Regular expression to match various YouTube URL formats
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
    const match = url.match(regExp);
    
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    
    // If it's already an embed URL or simple URL, just return it as fallback
    if (url.includes('embed/')) return url;
    return url.replace('watch?v=', 'embed/');
  };

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
          src={getEmbedUrl(product.youtubeUrl)}
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
