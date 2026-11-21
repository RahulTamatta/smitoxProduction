import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from '../../pages/ProductCard';

/**
 * Horizontal product rail used on the product page for
 * "Frequently bought together", "Similar products" and "You might like".
 * Renders nothing when there are no products.
 */
const RelatedProductsRail = ({ title, subtitle, products, onProductClick }) => {
  const scrollerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    updateScrollState();
    window.addEventListener('resize', updateScrollState);
    return () => window.removeEventListener('resize', updateScrollState);
  }, [products, updateScrollState]);

  const scrollByDirection = (direction) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: el.clientWidth * 0.9 * direction, behavior: 'smooth' });
  };

  if (!products || products.length === 0) return null;

  return (
    <section className="w-full max-w-container-max mx-auto px-4 md:px-margin-desktop mt-stack-md">
      <div className="flex items-start justify-between gap-3 mb-stack-sm">
        <div>
          <h2 className="font-headline-md text-headline-md font-semibold text-on-surface">{title}</h2>
          {subtitle && (
            <p className="font-body-md text-body-md text-on-surface-variant">{subtitle}</p>
          )}
        </div>
        <div className="hidden md:flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => scrollByDirection(-1)}
            disabled={!canScrollLeft}
            aria-label="Scroll left"
            className="w-9 h-9 flex items-center justify-center rounded-full border border-outline-variant text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => scrollByDirection(1)}
            disabled={!canScrollRight}
            aria-label="Scroll right"
            className="w-9 h-9 flex items-center justify-center rounded-full border border-outline-variant text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div
        ref={scrollerRef}
        onScroll={updateScrollState}
        className="flex gap-3 overflow-x-auto hide-scrollbar snap-x pb-2"
      >
        {products.map((product) => (
          <div
            key={product._id}
            className="snap-start shrink-0 w-[85%] sm:w-[31%] md:w-[23%] lg:w-[18%]"
          >
            <ProductCard product={product} onClick={onProductClick} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default RelatedProductsRail;
