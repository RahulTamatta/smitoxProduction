import React, { useState, useEffect, useRef } from 'react';

/**
 * OptimizedImage component that handles various image services and implements
 * lazy loading with placeholder and fallback logic
 * 
 * @param {Object} props
 * @param {string} props.src - Original image URL
 * @param {string} props.alt - Alt text for the image
 * @param {number} props.width - Desired width of the image
 * @param {number} props.height - Desired height of the image
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.style - Additional styling for the image container
 * @param {string} props.loading - Loading strategy ('lazy' or 'eager')
 * @param {string} props.objectFit - CSS object-fit property (cover, contain, etc.)
 * @param {number} props.quality - Quality of the image (1-100)
 * @param {string} props.format - Image format (webp, jpg, png, etc.)
 * @param {string} props.sizes - Sizes attribute for responsive images
 * @param {Function} props.onLoad - Callback when image loads successfully
 * @param {Function} props.onError - Callback when image fails to load
 * @param {string} props.placeholder - Placeholder image URL
 * @param {string} props.backgroundColor - Background color for the image container
 */
const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  className = '',
  style = {},
  loading = 'lazy',
  objectFit = 'cover',
  quality = 80,
  format = 'auto',
  sizes = '',
  onLoad = () => {},
  onError = () => {},
  placeholder = '/placeholder-image.jpg',
  backgroundColor = '#f0f0f0',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [imgSrc, setImgSrc] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [fallbackTriggered, setFallbackTriggered] = useState(false);
  
  const imageRef = useRef(null);
  const retryCount = useRef(0);
  const maxRetries = 2;

  // Function to optimize image URL based on service (ImageKit, Cloudinary, etc.)
  const getOptimizedUrl = (url, options = {}) => {
    if (!url) return placeholder;
    
    // Handle base64 encoded images
    if (url.startsWith('data:')) return url;

    const { width: w, quality: q = quality, format: f = format } = options;
    
    // Handle ImageKit URLs
    if (url.includes('ik.imagekit.io')) {
      const transformations = [];
      if (w) transformations.push(`w-${w}`);
      transformations.push(`q-${q}`);
      transformations.push(`f-${f}`);
      
      const urlParts = url.split('/');
      const baseUrl = urlParts.slice(0, 3).join('/');
      const path = urlParts.slice(3).join('/');
      
      return `${baseUrl}/tr:${transformations.join(',')}/${path}`;
    }
    
    // Handle Cloudinary URLs
    if (url.includes('cloudinary.com')) {
      try {
        const urlParts = url.split('/upload/');
        if (urlParts.length !== 2) return url;
        
        const transformations = [];
        if (w) transformations.push(`w_${w}`);
        transformations.push(`q_${q}`);
        if (f !== 'auto') transformations.push(`f_${f}`);
        
        return `${urlParts[0]}/upload/${transformations.join(',')}/${urlParts[1]}`;
      } catch (error) {
        console.error('Error optimizing Cloudinary URL:', error);
        return url;
      }
    }
    
    // Return original URL for other services
    return url;
  };

  // Get optimized source URL
  useEffect(() => {
    if (src) {
      setImgSrc(getOptimizedUrl(src, { width }));
    }
  }, [src, width]);

  // Set up intersection observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = imageRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.disconnect();
      }
    };
  }, []);

  // Handle successful image load
  const handleImageLoad = (e) => {
    setIsLoaded(true);
    onLoad(e);
  };

  // Handle image load error with retry logic
  const handleImageError = (e) => {
    // If optimized version fails, try falling back to original
    if (!fallbackTriggered && retryCount.current < maxRetries) {
      retryCount.current += 1;
      console.warn(`Image load failed, trying fallback... (${retryCount.current}/${maxRetries})`);
      
      // Try the original URL without transformations
      if (src && src !== imgSrc) {
        setFallbackTriggered(true);
        setImgSrc(src);
        return;
      }
    }
    
    // If we've already tried or reached max retries, show placeholder
    setHasError(true);
    setImgSrc(placeholder);
    onError(e);
  };

  // Generate srcSet for responsive images
  const generateSrcSet = () => {
    if (!src || hasError || fallbackTriggered) return undefined;
    
    const widths = [width, width * 2];
    return widths
      .map(w => `${getOptimizedUrl(src, { width: w, quality, format })} ${w}w`)
      .join(', ');
  };

  return (
    <div 
      style={{ 
        position: 'relative',
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : 'auto',
        backgroundColor,
        overflow: 'hidden',
        ...style
      }}
      ref={imageRef}
      className={className}
    >
      {isVisible && (
        <>
          {!hasError && !isLoaded && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor,
                transition: 'opacity 0.3s ease',
                opacity: isLoaded ? 0 : 1,
              }}
            />
          )}
          <img
            src={imgSrc || placeholder}
            alt={alt || ''}
            style={{
              transition: 'opacity 0.3s ease',
              opacity: isLoaded ? 1 : 0,
              objectFit,
              width: '100%',
              height: '100%'
            }}
            loading={loading}
            onLoad={handleImageLoad}
            onError={handleImageError}
            sizes={sizes}
            srcSet={generateSrcSet()}
          />
        </>
      )}
    </div>
  );
};

export default OptimizedImage;