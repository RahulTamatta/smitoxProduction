import React, { useState } from 'react';
import { FaExternalLinkAlt, FaTimes, FaYoutube } from 'react-icons/fa';

const YouTubePopupModal = ({
  showYoutubePopup,
  setShowYoutubePopup,
  product,
  isMobile
}) => {
  const [iframeError, setIframeError] = useState(false);

  if (!showYoutubePopup || !product.youtubeUrl) return null;

  const getEmbedUrl = (url) => {
    if (!url) return '';
    
    // Regular expression to match various YouTube URL formats
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
    const match = url.match(regExp);
    
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    
    // If it's already an embed URL, just return it
    if (url.includes('embed/')) return url;
    return url.replace('watch?v=', 'embed/');
  };

  const getWatchUrl = (url) => {
    if (!url) return '';
    
    // Extract video ID and build a clean watch URL
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
    const match = url.match(regExp);
    
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/watch?v=${match[2]}`;
    }
    
    // Return original URL as fallback
    return url;
  };

  const handleOpenInNewTab = () => {
    window.open(getWatchUrl(product.youtubeUrl), '_blank', 'noopener,noreferrer');
    setShowYoutubePopup(false);
  };

  const handleIframeError = () => {
    setIframeError(true);
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
        aspectRatio: iframeError ? undefined : "16/9"
      }}>
        <button
          onClick={() => {
            setShowYoutubePopup(false);
            setIframeError(false);
          }}
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

        {!iframeError ? (
          <iframe
            width="100%"
            height="100%"
            src={getEmbedUrl(product.youtubeUrl)}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onError={handleIframeError}
            onLoad={(e) => {
              // Check if iframe loaded but was blocked (shows blank/error)
              // We can't directly detect X-Frame-Options blocks, 
              // but we provide the fallback button regardless
            }}
          ></iframe>
        ) : null}

        {/* Always show "Open in YouTube" button as fallback */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          marginTop: iframeError ? "0" : "15px",
          flexDirection: "column",
          alignItems: "center",
          gap: "15px"
        }}>
          {iframeError && (
            <div style={{
              color: "white",
              textAlign: "center",
              padding: "30px",
              backgroundColor: "rgba(255,255,255,0.1)",
              borderRadius: "12px",
              maxWidth: "400px"
            }}>
              <FaYoutube size={48} color="#FF0000" style={{ marginBottom: "15px" }} />
              <p style={{ fontSize: "16px", marginBottom: "5px" }}>
                This video cannot be embedded here.
              </p>
              <p style={{ fontSize: "14px", opacity: 0.7 }}>
                Click below to watch on YouTube.
              </p>
            </div>
          )}
          <button
            onClick={handleOpenInNewTab}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 24px",
              backgroundColor: "#FF0000",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "background-color 0.2s"
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = "#CC0000"}
            onMouseLeave={(e) => e.target.style.backgroundColor = "#FF0000"}
          >
            <FaExternalLinkAlt size={14} />
            Open in YouTube
          </button>
        </div>
      </div>
    </div>
  );
};

export default YouTubePopupModal;
