import React from 'react';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../../pages/ProductCard';

const ProductsForYou = ({
  productsForYou,
  normalizeProductForCard,
  onProductClick,
  isMobile
}) => {
  const navigate = useNavigate();

  const handleProductClick = (item) => {
    // Reset product-specific state and navigate
    onProductClick();
    navigate(`/product/${item.productId.slug}`);
  };

  return (
    <div className="container mt-5" style={{ 
      padding: isMobile ? '0 10px' : '0 15px'
    }}>
      <h2 className="text-center mb-4" style={{ 
        fontSize: isMobile ? '1.5rem' : '2rem' 
      }}>
        Products For You
      </h2>
      <div className="row g-2">
        {productsForYou.map((item) => (
          <div
            key={item.productId?._id}
            className={isMobile ? "col-6 mb-2" : "col-lg-4 col-md-4 col-sm-6 mb-3"}
          >
            <ProductCard
              product={normalizeProductForCard(item.productId)}
              onClick={() => handleProductClick(item)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductsForYou;
