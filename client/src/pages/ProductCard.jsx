import { Heart, ShoppingCart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OptimizedImage from '../components/OptimizedImage';
import useWishlist from '../hooks/useWishlist';

const ProductCard = ({ product, onClick }) => {
  const navigate = useNavigate();
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  // Use new wishlist hook
  const { isInWishlist, toggleWishlist } = useWishlist();
  const inWishlist = isInWishlist(product?._id);

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = screenWidth <= 768;

  const handleToggleWishlist = async (e) => {
    e.stopPropagation();
    if (!product) return;
    await toggleWishlist(product);
  };

  const handleProductClick = () => {
    localStorage.setItem('homePageScrollPosition', window.scrollY.toString());
    navigate(`/product/${product.slug}`, {
      state: {
        fromHomePage: true,
        scrollPosition: window.scrollY
      }
    });
  };

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

  // ─── MOBILE: Horizontal card layout ───
  if (isMobile) {
    return (
      <div style={{ padding: "4px 0" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            backgroundColor: "#fff",
            borderRadius: "16px",
            border: "1px solid var(--border-color, #eee)",
            overflow: "hidden",
            cursor: "pointer",
            position: "relative",
            minHeight: "140px",
          }}
          onClick={handleProductClick}
        >
          {/* Left: Image */}
          <div style={{
            width: "40%",
            minWidth: "120px",
            maxWidth: "160px",
            position: "relative",
            flexShrink: 0,
            backgroundColor: "var(--surface-container-low, #f5f5f5)",
          }}>
            {/* Bestseller badge */}
            <div style={{
              position: "absolute",
              top: "8px",
              left: "8px",
              zIndex: 10,
              backgroundColor: "#ffeb3b",
              color: "#5c4300",
              fontSize: "10px",
              fontWeight: "800",
              padding: "3px 8px",
              borderRadius: "6px",
              letterSpacing: "0.5px",
            }}>
              BESTSELLER
            </div>
            <OptimizedImage
              src={product.photos || '/placeholder-image.jpg'}
              alt={product.name}
              width={160}
              height={160}
              objectFit="contain"
              quality={60}
              loading="lazy"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                padding: "12px",
              }}
            />
          </div>

          {/* Right: Details */}
          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            padding: "12px 14px",
            justifyContent: "center",
            position: "relative",
            minWidth: 0,
          }}>
            {/* Wishlist heart - top right */}
            <button
              onClick={handleToggleWishlist}
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                zIndex: 20,
                background: "transparent",
                border: "none",
                padding: "4px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Heart
                size={22}
                fill={inWishlist ? "var(--primary)" : "none"}
                color={inWishlist ? "var(--primary)" : "#ccc"}
                strokeWidth={1.5}
              />
            </button>

            {/* Product name */}
            <h3 style={{
              fontSize: "0.9rem",
              fontWeight: "700",
              color: "var(--text-primary, #222)",
              marginBottom: "10px",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis",
              lineHeight: "1.35",
              paddingRight: "32px",
              margin: 0,
              marginBottom: "12px",
            }}>
              {product.name}
            </h3>

            {/* Price box */}
            <div style={{
              backgroundColor: "var(--surface-container-low, #f5f5f5)",
              borderRadius: "10px",
              padding: "8px 12px",
              display: "inline-flex",
              flexDirection: "column",
              width: "fit-content",
              marginBottom: "8px",
            }}>
              <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-secondary, #888)" }}>
                Bulk Price
              </span>
              <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                <span style={{ fontSize: "1.2rem", fontWeight: "800", color: "var(--primary, #d32f2f)" }}>
                  {product.perPiecePrice ? `₹${product.perPiecePrice}` : "N/A"}
                </span>
                <span style={{ fontSize: "12px", color: "var(--text-secondary, #888)" }}>/pc</span>
              </div>
            </div>

            {/* Cart icon - bottom right */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleProductClick();
              }}
              style={{
                position: "absolute",
                bottom: "10px",
                right: "10px",
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                border: "1px solid #eee",
                backgroundColor: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
              }}
            >
              <ShoppingCart size={18} color="var(--text-secondary, #666)" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── DESKTOP: Vertical card layout (existing) ───
  const getFontSizes = () => {
    if (screenWidth <= 576) {
      return { name: "0.8rem", price: "0.9rem", mrp: "0.7rem" };
    } else if (screenWidth <= 768) {
      return { name: "0.9rem", price: "1rem", mrp: "0.75rem" };
    } else {
      return { name: "1rem", price: "1.25rem", mrp: "0.875rem" };
    }
  };
  const fontSizes = getFontSizes();

  return (
    <div className="h-100" style={{ padding: "8px" }}>
      <div
        className="card-premium h-100 d-flex flex-column"
        style={{
          cursor: "pointer",
          padding: "16px",
          border: "1px solid var(--border-color)"
        }}
        onClick={handleProductClick}
      >
        {/* Badges */}
        <div className="badge-premium" style={{ backgroundColor: "#ffeb3b", color: "#5c4300" }}>
          Bestseller
        </div>

        <button
          onClick={handleToggleWishlist}
          style={{
            position: "absolute",
            right: "16px",
            top: "16px",
            zIndex: 20,
            background: "rgba(255, 255, 255, 0.9)",
            border: "none",
            borderRadius: "50%",
            padding: "8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "var(--shadow-sm)"
          }}
        >
          <Heart
            size={20}
            fill={inWishlist ? "var(--primary)" : "none"}
            color={inWishlist ? "var(--primary)" : "var(--text-secondary)"}
          />
        </button>

        {/* Image container */}
        <div style={{
          position: "relative",
          width: "100%",
          paddingTop: "100%",
          backgroundColor: "var(--surface-container-low)",
          borderRadius: "16px",
          overflow: "hidden",
          marginBottom: "16px"
        }}>
          <OptimizedImage
            src={product.photos || '/placeholder-image.jpg'}
            alt={product.name}
            className="product-image"
            width={300}
            height={300}
            objectFit="contain"
            quality={60}
            loading="lazy"
            style={{
              position: "absolute",
              top: "0",
              left: "0",
              width: "100%",
              height: "100%",
              padding: "16px",
              transition: "transform 0.5s ease"
            }}
          />
        </div>

        {/* Details */}
        <div className="d-flex flex-column flex-grow-1">
          <h3 style={{
            fontSize: fontSizes.name,
            fontWeight: "700",
            color: "var(--text-primary)",
            marginBottom: "16px",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textOverflow: "ellipsis",
            lineHeight: "1.4",
            height: "2.8em"
          }}>
            {product.name}
          </h3>

          {/* B2B Data Box */}
          <div className="mt-auto" style={{
            backgroundColor: "var(--surface-container-low)",
            borderRadius: "12px",
            padding: "12px",
            marginBottom: "16px"
          }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)" }}>
                Bulk Price
              </span>
              <div className="d-flex align-items-baseline gap-1">
                <span style={{ fontSize: fontSizes.price, fontWeight: "800", color: "var(--primary)" }}>
                  {product.perPiecePrice ? `₹${product.perPiecePrice}` : "N/A"}
                </span>
                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>/pc</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button 
            className="btn-pill w-100"
            style={{ 
              backgroundColor: "var(--primary)", 
              color: "white",
              border: "none"
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleProductClick();
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>shopping_cart</span>
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;