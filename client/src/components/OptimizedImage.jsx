import React, { useState, useEffect, useRef } from 'react';
import useOptimizedImage from '../hooks/useOptimizedImage';

// Helper function for srcSet generation
const getOptimizedImageUrl = (url, { width, quality = 80, format = 'webp' } = {}) => {
  if (!url) return '/placeholder-image.jpg';
  
  // Handle base64 encoded images (return as is)
  if (url.startsWith('data:')) return url;

  // Check if URL is already an ImageKit URL
  const isImageKitUrl = url.includes('ik.imagekit.io');
  
  if (!isImageKitUrl) return url;
  
  // Create transformation parameters
  const transformations = [];
  
  if (width) transformations.push(`w-${width}`);
  transformations.push(`q-${quality}`);
  transformations.push(`f-${format}`);
  
  // If already an ImageKit URL, add transformations
  const urlParts = url.split('/');
  const baseUrl = urlParts.slice(0, 3).join('/');
  const path = urlParts.slice(3).join('/');
  
  return `${baseUrl}/tr:${transformations.join(',')}/${path}`;
};

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
  format = 'webp',
  sizes = '',
  onLoad = () => {},
  onError = () => {},
  placeholder = '/placeholder-image.jpg',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [imgSrc, setImgSrc] = useState(null);
  const [fallbackTriggered, setFallbackTriggered] = useState(false);
  const { optimizedUrl, placeholderUrl, loaded, error, handleLoad, handleError } = useOptimizedImage(src, {
    width,
    height,
    quality,
    format
  });

  const imageRef = useRef(null);
  const retryCount = useRef(0);
  const maxRetries = 2;

  useEffect(() => {
    setImgSrc(optimizedUrl);
  }, [optimizedUrl]);

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

  const handleImageLoad = (e) => {
    handleLoad();
    onLoad(e);
  };

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
    handleError();
    setImgSrc(placeholder);
    onError(e);
  };

  return (
    <div 
      style={{ 
        position: 'relative',
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : 'auto',
        backgroundColor: '#f0f0f0',
        overflow: 'hidden',
        ...style // Allow style prop to override default styles
      }}
      ref={imageRef}
    >
      {isVisible && (
        <>
          {placeholderUrl && !error && (
            <img
              src={placeholderUrl}
              alt=""
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit,
                filter: 'blur(10px)',
                opacity: loaded ? 0 : 1,
                transition: 'opacity 0.3s ease'
              }}
              aria-hidden="true"
              onError={() => {/* Silently ignore placeholder errors */}}
            />
          )}
          <img
            src={imgSrc || placeholder}
            alt={alt || ''}
            className={className}
            style={{
              transition: 'opacity 0.3s ease',
              opacity: loaded ? 1 : 0,
              objectFit,
              width: '100%',
              height: '100%'
            }}
            loading={loading}
            onLoad={handleImageLoad}
            onError={handleImageError}
            sizes={sizes}
            srcSet={
              !error && !fallbackTriggered && width && src
                ? `${optimizedUrl} ${width}w, ${getOptimizedImageUrl(src, { width: width * 2, quality, format })} ${width * 2}w`
                : undefined
            }
          />
        </>
      )}
    </div>
  );
};

export default OptimizedImage;
