import React, { useState } from 'react';
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
  const [failedImages, setFailedImages] = useState(new Set());

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Main large image display */}
      <div 
        onClick={() => setShowImageZoom(true)}
        className="w-full aspect-square md:aspect-video lg:aspect-[4/3] bg-surface-container-lowest rounded-[16px] md:rounded-[24px] overflow-hidden ambient-shadow border border-surface-container flex items-center justify-center p-4 md:p-8 relative group cursor-zoom-in"
      >
        <span className="absolute top-4 left-4 bg-tertiary-container text-on-tertiary-container font-label-sm text-label-sm px-3 py-1 rounded-lg z-10">Premium</span>
        <div
          className="absolute top-4 right-4 z-10 bg-white/70 rounded-full w-[30px] h-[30px] flex items-center justify-center cursor-pointer shadow-sm"
        >
          <FaExpand color="#333" size={16} />
        </div>
        <OptimizedImage
          src={selectedImage === 0 ? product.photos : 
                (product.multipleimages && Array.isArray(product.multipleimages) && product.multipleimages.length > 0 && selectedImage <= product.multipleimages.length) ? 
                product.multipleimages[selectedImage - 1] : product.photos}
          alt={product.name}
          className="w-full h-full object-contain mix-blend-multiply hover:scale-105 transition-transform duration-500"
          style={{ width: "100%", height: "100%" }}
          width={isMobile ? 300 : 500}
          height={isMobile ? 300 : 500}
          objectFit="contain"
          backgroundColor="transparent"
          quality={isMobile ? 75 : 85}
          loading="eager"
        />
      </div>
      
      {/* Thumbnail gallery */}
      {(product.multipleimages && Array.isArray(product.multipleimages) && product.multipleimages.length > 0) && (
        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
          {/* Main product image thumbnail */}
          <button 
            onClick={() => setSelectedImage(0)}
            className={`w-20 h-20 md:w-24 md:h-24 shrink-0 rounded-[16px] bg-surface-container-lowest overflow-hidden p-2 transition-colors ${selectedImage === 0 ? 'border-2 border-primary' : 'border border-surface-container hover:border-outline-variant'}`}
          >
            <OptimizedImage
              src={product.photos}
              alt={`${product.name} - Main`}
              className="w-full h-full object-contain"
              style={{ width: "100%", height: "100%" }}
              width={isMobile ? 80 : 96}
              height={isMobile ? 80 : 96}
              objectFit="cover"
              quality={60}
            />
          </button>
          {/* Additional images thumbnails */}
          {product.multipleimages
            .map((imgUrl, index) => {
              if (!imgUrl || typeof imgUrl !== 'string' || !imgUrl.trim()) {
                return null;
              }
              return { imgUrl, index, key: `thumb-${index}` };
            })
            .filter(Boolean)
            .filter(({ imgUrl }) => !failedImages.has(imgUrl))
            .map(({ imgUrl, index, key }) => (
              <button 
                key={key}
                data-thumbnail="true"
                onClick={() => setSelectedImage(index + 1)}
                className={`w-20 h-20 md:w-24 md:h-24 shrink-0 rounded-[16px] bg-surface-container-lowest overflow-hidden p-2 transition-colors ${selectedImage === index + 1 ? 'border-2 border-primary' : 'border border-surface-container hover:border-outline-variant'}`}
              >
                <OptimizedImage
                  src={imgUrl}
                  alt={`${product.name} - ${index + 1}`}
                  className="w-full h-full object-contain"
                  style={{ width: "100%", height: "100%" }}
                  width={isMobile ? 80 : 96}
                  height={isMobile ? 80 : 96}
                  objectFit="cover"
                  quality={60}
                  backgroundColor="transparent"
                  onLoad={() => {
                    setLoadedImages(prev => new Set([...prev, imgUrl]));
                  }}
                  onError={(e) => {
                    setFailedImages(prev => new Set(prev).add(imgUrl));
                  }}
                />
              </button>
            ))}
        </div>
      )}
    </div>
  );
};

export default ProductImageGallery;
