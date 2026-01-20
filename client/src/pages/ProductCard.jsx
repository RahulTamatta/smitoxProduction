import { Heart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OptimizedImage from '../components/OptimizedImage';
import useWishlist from '../hooks/useWishlist';

const ProductCard = ({ product, onClick }) => {
  const navigate = useNavigate();
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Use new wishlist hook
  const { isInWishlist, toggleWishlist } = useWishlist();
  const inWishlist = isInWishlist(product?._id);

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleToggleWishlist = async (e) => {
    e.stopPropagation();

    if (!product) return;

    // Optimistic update - instant UI change
    await toggleWishlist(product);
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
        style={{
          cursor: "pointer",
          position: "relative",
          borderRadius: "8px",
          overflow: "hidden",
          boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
        }}
        onClick={handleProductClick}
      >
        {/* Image container with fixed aspect ratio */}
        <div style={{
          position: "relative",
          paddingTop: "75%", // 4:3 aspect ratio
          width: "100%",
          overflow: "hidden"
        }}>

          <OptimizedImage
            src={product.photos || '/placeholder-image.jpg'}
            alt={product.name}
            className="card-img-top product-image"
            width={screenWidth <= 576 ? 150 : 300}
            height={screenWidth <= 576 ? 150 : 300}
            objectFit="cover" // Changed from "cover" to "contain"
            quality={30}
            loading="lazy"
            backgroundColor="#ffffff" // Explicitly set white background
            style={{
              position: "absolute",
              top: "0",
              left: "0",
              width: "100%",
              height: "100%",
              padding: "8px", // Add some padding inside the container
            }}
          />
        </div>

        <div className="p-3 d-flex flex-column" style={{ height: "auto" }}>
          <h5
            style={{
              fontSize: fontSizes.name,
              fontWeight: "600",
              color: "#333",
              marginBottom: "10px",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis",
              lineHeight: "1.4",
              height: "2.8em" // Fixed height for title (2 lines)
            }}
          >
            {product.name}
            <button
              onClick={handleToggleWishlist}
              style={{
                position: "absolute",
                right: "10px",
                top: "10px",
                zIndex: 2,
                background: "rgba(255, 255, 255, 0.8)",
                border: "none",
                borderRadius: "50%",
                padding: "5px",
                cursor: "pointer",
              }}
            >
              <Heart
                size={24}
                fill={inWishlist ? "#d32f2f" : "none"}
                color={inWishlist ? "#d32f2f" : "#000000"}
              />
            </button>
          </h5>
        </div>

        <div className="mt-auto p-3 pt-0">
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: fontSizes.price,
                fontWeight: "800",
                color: "#d32f2f", // Red matching header theme
                margin: 0
              }}
            >
              {product.perPiecePrice?.toLocaleString("en-IN", {
                style: "currency",
                currency: "INR",
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
              }) || "Price not available"}
            </span>
            {product.mrp && (
              <span
                style={{
                  fontSize: fontSizes.mrp,
                  textDecoration: "line-through",
                  color: "#6b7280", // Gray for crossed price
                  fontWeight: "500"
                }}
              >
                {product.mrp.toLocaleString("en-IN", {
                  style: "currency",
                  currency: "INR",
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2
                })}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;