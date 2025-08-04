import React, { useState } from 'react';
import { optimizeImageKitUrl, isImageKitUrl } from '../utils/imageKitHelper';

/**
 * Component for displaying optimized ImageKit images
 */
const ImageKitImage = ({
  src,
  alt = '',
  width,
  height,
  quality = 80,
  format = 'webp',
  className = '',
  style = {},
  placeholder = '/placeholder.jpg',
  onLoad,
  onError
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  
  // If it's an ImageKit URL, optimize it; otherwise use as-is
  const imageSrc = isImageKitUrl(src) 
    ? optimizeImageKitUrl(src, { width, height, quality, format })
    : src;
    
  // Generate srcSet for responsive images
  const generateSrcSet = () => {
    if (!isImageKitUrl(src)) return '';
    
    // Create scaled versions for different viewport sizes
    const sizes = [width/2, width, width*1.5, width*2].filter(w => w > 50 && w < 3000);
    return sizes.map(size => 
      `${optimizeImageKitUrl(src, { width: size, height: Math.round(height * size / width), quality, format })} ${size}w`
    ).join(', ');
  };
  
  const handleLoad = (e) => {
    setLoaded(true);
    if (onLoad) onLoad(e);
  };
  
  const handleError = (e) => {
    setError(true);
    if (onError) onError(e);
    console.error(`Failed to load image: ${src}`);
  };
  
  return (
    <img
      src={error ? placeholder : imageSrc}
      srcSet={!error ? generateSrcSet() : ''}
      alt={alt}
      width={width}
      height={height}
      className={`imagekit-image ${className} ${loaded ? 'loaded' : 'loading'}`}
      style={{ 
        opacity: loaded ? 1 : 0.7, 
        transition: 'opacity 0.3s ease',
        ...style 
      }}
      onLoad={handleLoad}
      onError={handleError}
      loading="lazy"
    />
  );
};

export default ImageKitImage;
