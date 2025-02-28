import { useState, useEffect } from 'react';

// Define getOptimizedImageUrl locally with improved error handling
const getOptimizedImageUrl = (url, { width, height, quality = 80, format = 'webp' } = {}) => {
  if (!url) return '/placeholder-image.jpg';
  
  // Handle base64 encoded images (return as is)
  if (url.startsWith('data:')) return url;

  // Check if URL is already an ImageKit URL
  const isImageKitUrl = url.includes('ik.imagekit.io');
  
  if (!isImageKitUrl) return url;
  
  try {
    // Parse the URL properly to handle the transformations
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // Extract the endpoint and the actual path
    // Format: /endpoint/path-to-image
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length < 1) return url;
    
    const endpoint = parts[0];
    let imagePath;
    
    // Check if there are already transformations in the path
    if (parts[1] && parts[1].startsWith('tr:')) {
      // If transformations already exist, we need to replace them
      imagePath = parts.slice(2).join('/');
    } else {
      imagePath = parts.slice(1).join('/');
    }
    
    // Create transformation parameters
    const transforms = [];
    if (width) transforms.push(`w-${width}`);
    if (height) transforms.push(`h-${height}`);
    transforms.push(`q-${quality}`);
    transforms.push(`f-${format}`);
    
    // Construct the new URL with transformations
    const transformedUrl = `https://ik.imagekit.io/${endpoint}/tr:${transforms.join(',')}/${imagePath}`;
    
    return transformedUrl;
  } catch (error) {
    console.error('Error generating optimized URL:', error);
    return url; // Return original URL on error
  }
};

/**
 * Custom hook to provide optimized image URLs and loading states
 * @param {string} imageUrl - Original image URL
 * @param {Object} options - Image optimization options
 * @returns {Object} - Optimized URL and loading state
 */
const useOptimizedImage = (imageUrl, options = {}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [optimizedUrl, setOptimizedUrl] = useState('');
  const [placeholderUrl, setPlaceholderUrl] = useState('');

  useEffect(() => {
    // Reset states when image URL changes
    setLoaded(false);
    setError(false);
    
    if (!imageUrl) {
      setOptimizedUrl('/placeholder-image.jpg');
      return;
    }

    // Generate low-quality placeholder image first
    const placeholderOptions = {
      width: options.width ? Math.round(options.width / 10) : 40,
      height: options.height ? Math.round(options.height / 10) : 40,
      quality: 30,
      format: 'webp'
    };
    
    // Generate optimized image URL with proper sizing
    const quality = options.quality || 80;
    const format = options.format || 'webp';
    
    try {
      setPlaceholderUrl(getOptimizedImageUrl(imageUrl, placeholderOptions));
      setOptimizedUrl(getOptimizedImageUrl(imageUrl, { ...options, quality, format }));
    } catch (err) {
      console.error("Error optimizing image:", err);
      setError(true);
      setOptimizedUrl('/placeholder-image.jpg');
    }
  }, [imageUrl, options.width, options.height, options.quality, options.format]);
  
  const handleLoad = () => setLoaded(true);
  const handleError = () => {
    setError(true);
    setOptimizedUrl('/placeholder-image.jpg');
  };
  
  return {
    optimizedUrl,
    placeholderUrl,
    loaded,
    error,
    handleLoad,
    handleError
  };
};

export default useOptimizedImage;
