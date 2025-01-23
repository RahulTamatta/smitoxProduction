import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/auth';
import { Heart } from 'lucide-react';
import toast from 'react-hot-toast';

const ProductCard = ({ product, onClick }) => {  
  const navigate = useNavigate();
  const [auth] = useAuth();
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (auth?.user?._id && product?._id) {
      checkWishlistStatus();
    }
  }, [auth?.user?._id, product?._id]);

  const checkWishlistStatus = async () => {
    try {
      const { data } = await axios.get(
        `/api/v1/carts/users/${auth.user._id}/wishlist/check/${product._id}`
      );
      setIsInWishlist(data.exists);
    } catch (error) {
      console.error("Error checking wishlist status:", error);
    }
  };

  const toggleWishlist = async (e) => {
    e.stopPropagation();

    if (!auth.user) {
      //toast.error("Please log in to manage your wishlist");
      return;
    }

    try {
      if (isInWishlist) {
        await axios.delete(
          `/api/v1/carts/users/${auth.user._id}/wishlist/${product._id}`
        );
        setIsInWishlist(false);
        toast.success("Removed from wishlist");
      } else {
        await axios.post(`/api/v1/carts/users/${auth.user._id}/wishlist`, {
          productId: product._id,
        });
        setIsInWishlist(true);
        toast.success("Added to wishlist");
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);
      //toast.error("Error updating wishlist");
    }
  };

  const handleProductClick = () => {
    // Save current scroll position before navigating
    localStorage.setItem('homePageScrollPosition', window.scrollY.toString());
    
    // Navigate to product details with scroll position state
    navigate(`/product/${product.slug}`, { 
      state: { 
        fromHomePage: true,
        scrollPosition: window.scrollY 
      } 
    });
  };

  const getFontSizes = () => {
    if (screenWidth <= 576) {
      return {
        name: "0.8rem",
        price: "0.9rem",
        mrp: "0.7rem",
      };
    } else if (screenWidth <= 768) {
      return {
        name: "0.9rem",
        price: "1rem",
        mrp: "0.75rem",
      };
    } else {
      return {
        name: "1rem",
        price: "1.25rem",
        mrp: "0.875rem",
      };
    }
  };

  const fontSizes = getFontSizes();

  if (!product) {
    return (
      <div className="col-md-4 col-sm-6 col-12 mb-3">
        <div className="card product-card h-100">
          <div className="card-body d-flex flex-column">
            <h5 style={{ fontSize: "0.9rem" }}>Product not available</h5>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="col-md-10 col-sm-10 col-12 mb-3">
      <div
        className="card product-card h-100"
        style={{ cursor: "pointer", position: "relative" }}
        onClick={handleProductClick}
      >
        {!imageLoaded && (
          <div
            style={{
              width: "100%",
              height: "200px",
              background: "#f0f0f0",
            }}
          />
        )}
        
        <img
          src={product.photos || '/placeholder-image.jpg'}
          className="card-img-top product-image img-fluid"
          alt={product.name}
          style={{
            width: "100%",
            height: "200px",
            objectFit: "cover",
            display: imageLoaded ? "block" : "none"
          }}
          onLoad={() => setImageLoaded(true)}
        />
        
        <div className="p-4 flex flex-col h-full">
          <h5
            style={{
              fontSize: fontSizes.name,
              fontWeight: "600",
              color: "#333",
              marginBottom: "10px",
            }}
          >
            {product.name.length > 20
              ? `${product.name.slice(0, 18)}.....`
              : product.name}
            <button
              onClick={toggleWishlist}
              style={{
                position: "absolute",
                right: "10px",
                zIndex: 2,
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              <Heart
                size={24}
                fill={isInWishlist ? "#e47911" : "none"}
                color={isInWishlist ? "#e47911" : "#000000"}
              />
            </button>
          </h5>
        </div>
        
        <div className="mt-auto">
          <h5
            style={{
              fontSize: fontSizes.price,
              fontWeight: "700",
              color: "#333",
              padding: "0 1px 5px 20px"
            }}
          >
            {product.perPiecePrice?.toLocaleString("en-US", {
              style: "currency",
              currency: "INR",
            }) || "Price not available"}
          </h5>
          {product.mrp && (
            <h6
              style={{
                fontSize: fontSizes.mrp,
                textDecoration: "line-through",
                color: "red",
                padding: "0 1px 5px 20px"
              }}
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
  );
};

export default ProductCard;