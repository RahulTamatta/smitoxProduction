import React from 'react';
import RelatedProductsRail from './RelatedProductsRail';

const ProductsForYou = ({
  productsForYou,
  normalizeProductForCard,
  onProductClick,
  excludeIds = []
}) => {
  const excluded = new Set((excludeIds || []).map(String));
  const seen = new Set();

  const products = (productsForYou || [])
    .map((item) => item?.productId)
    .filter(Boolean)
    .filter((product) => {
      const id = String(product._id);
      if (excluded.has(id) || seen.has(id)) return false;
      seen.add(id);
      return true;
    })
    .map(normalizeProductForCard);

  if (products.length === 0) return null;

  return (
    <RelatedProductsRail
      title="You might like"
      products={products}
      onProductClick={onProductClick}
    />
  );
};

export default ProductsForYou;
