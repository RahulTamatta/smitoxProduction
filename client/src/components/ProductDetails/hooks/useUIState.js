import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

export const useUIState = () => {
  const params = useParams();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth > 768 && window.innerWidth <= 1024);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showYoutubePopup, setShowYoutubePopup] = useState(false);
  const [showImageZoom, setShowImageZoom] = useState(false);
  const [loadedImages, setLoadedImages] = useState(new Set());

  // Handle responsive layout detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsTablet(window.innerWidth > 768 && window.innerWidth <= 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle scroll position restoration
  useEffect(() => {
    const scrollPosition = sessionStorage.getItem("productDetailsScrollPosition");
    if (scrollPosition) {
      window.scrollTo(0, parseInt(scrollPosition, 10));
      sessionStorage.removeItem("productDetailsScrollPosition");
    }

    return () => {
      sessionStorage.setItem("productDetailsScrollPosition", window.scrollY);
    };
  }, [params?.slug]);

  // Reset UI state when slug changes
  useEffect(() => {
    setSelectedImage(0);
    setShowImageZoom(false);
    setShowYoutubePopup(false);
    setLoadedImages(new Set());
  }, [params?.slug]);

  const resetProductState = () => {
    setSelectedImage(0);
    setShowImageZoom(false);
    setShowYoutubePopup(false);
    setLoadedImages(new Set());
  };

  return {
    isMobile,
    isTablet,
    selectedImage,
    setSelectedImage,
    showYoutubePopup,
    setShowYoutubePopup,
    showImageZoom,
    setShowImageZoom,
    loadedImages,
    setLoadedImages,
    resetProductState
  };
};
