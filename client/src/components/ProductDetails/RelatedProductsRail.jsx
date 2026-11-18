import React from 'react';
import ProductCard from '../../pages/ProductCard';

/**
 * Horizontal product rail used on the product page for
 * "Linked products" (shared FK tags) and "Similar products".
 * Renders nothing when there are no products.
 */
const RelatedProductsRail = ({ title, products, onProductClick }) => {
  if (!products || products.length === 0) return null;

  return (
    <section className="max-w-container-max mx-auto px-4 md:px-margin-desktop mt-stack-md">
      <h2 className="font-headline-md text-headline-md text-on-surface mb-stack-sm">{title}</h2>
      <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 snap-x">
        {products.map((product) => (
          <div
            key={product._id}
            className="snap-start shrink-0 w-[46%] sm:w-[31%] md:w-[23%] lg:w-[18%]"
          >
            <ProductCard product={product} onClick={onProductClick} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default RelatedProductsRail;
