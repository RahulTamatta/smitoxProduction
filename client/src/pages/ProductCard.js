import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/auth';
import { Heart } from 'lucide-react';
import toast from 'react-hot-toast';

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const [auth] = useAuth();
  const [isInWishlist, setIsInWishlist] = useState(false);

  useEffect(() => {
    if (auth?.user?._id && product?._id) {
      checkWishlistStatus();
    }
  }, [auth?.user?._id, product?._id]);

  const checkWishlistStatus = async () => {
    try {
      const { data } = await axios.get(`/api/v1/carts/users/${auth.user._id}/wishlist/check/${product._id}`);
      setIsInWishlist(data.exists);
    } catch (error) {
      console.error('Error checking wishlist status:', error);
    }
  };

  const toggleWishlist = async (e) => {
    e.stopPropagation(); // Prevent navigating to product details when clicking the heart
    
    if (!auth.user) {
      toast.error("Please log in to manage your wishlist");
      return;
    }
  
    try {
      if (isInWishlist) {
        await axios.delete(`/api/v1/carts/users/${auth.user._id}/wishlist/${product._id}`);
        setIsInWishlist(false);
        toast.success("Removed from wishlist");
      } else {
        await axios.post(`/api/v1/carts/users/${auth.user._id}/wishlist`, { 
          productId: product._id 
        });
        setIsInWishlist(true);
        toast.success("Added to wishlist");
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);
      toast.error("Error updating wishlist");
    }
  };

  // Check if product is null or undefined
  if (!product) {
    return (
      <div className="col-md-4 col-sm-6 col-12 mb-3">
        <div className="card product-card h-100">
          <div className="card-body d-flex flex-column">
            <h5 style={{ fontSize: '0.9rem' }}>Product not available</h5>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="col-md-10 col-sm-6 col-12 mb-3">
      <div 
        className="card product-card h-100" 
        style={{ cursor: 'pointer', position: 'relative' }} 
        onClick={() => navigate(`/product/${product.slug}`)}
      >
        <button 
          onClick={toggleWishlist}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 2,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <Heart
            size={24}
            fill={isInWishlist ? "#e47911" : "none"}
            color={isInWishlist ? "#e47911" : "#000000"}
          />
        </button>
        <img
          src={`/api/v1/product/product-photo/${product._id}`}
          className="card-img-top product-image img-fluid"
          alt={product.name}
          style={{   width: "100%",
          height: "200px", objectFit: 'cover' }}
        />
       <div className="p-4 flex flex-col h-full">
       <h5 className="text-xs font-semibold text-gray-900 dark:text-white mb-2">
  {product.name.length > 20 ? `${product.name.slice(0, 20)}.....` : product.name}
</h5>

          <div className="mt-auto">
            <h5 className="text-base font-bold text-gray-900 dark:text-white">
              {product.perPiecePrice?.toLocaleString("en-US", {
                style: "currency",
                currency: "INR",
              }) || "Price not available"}
            </h5>
            {product.mrp && (
              <h6
                className="text-xs text-red-500"
                style={{ textDecoration: "line-through" }}
              >
                {product.mrp.toLocaleString("en-US", {
                  style: "currency",
                  currency: "INR",
                })}
              </h6>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;