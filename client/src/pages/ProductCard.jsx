import { Heart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CartQuantityControl from '../components/CartQuantityControl/CartQuantityControl';
import OptimizedImage from '../components/OptimizedImage';
import useWishlist from '../hooks/useWishlist';
import '../styles/ProductCard.css';

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
      <div className="sx-pcard">
        <div className="sx-pcard-body">
          <h5 className="sx-pcard-name">Product not available</h5>
        </div>
      </div>
    );
  }

  const mrp = Number(product.mrp);
  const perPiecePrice = Number(product.perPiecePrice);
  const hasDiscount = mrp > perPiecePrice && perPiecePrice > 0;
  const discountPct = hasDiscount
    ? Math.round(((mrp - perPiecePrice) / mrp) * 100)
    : 0;
  const isOutOfStock = typeof product.stock === 'number' && product.stock <= 0;

  // ─── MOBILE: Horizontal card layout ───
  if (isMobile) {
    return (
      <div className="sx-pcard sx-pcard--row" onClick={handleProductClick}>
        <div className="sx-pcard-media">
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
          {isOutOfStock && (
            <div className="sx-pcard-oos">
              <span>Out of Stock</span>
            </div>
          )}
        </div>

        {hasDiscount && (
          <div className="sx-pcard-discount">-{discountPct}%</div>
        )}

        <button
          type="button"
          className="sx-pcard-wish"
          onClick={handleToggleWishlist}
          aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            size={22}
            fill={inWishlist ? "var(--primary)" : "none"}
            color={inWishlist ? "var(--primary)" : "#ccc"}
            strokeWidth={1.5}
          />
        </button>

        <div className="sx-pcard-body">
          <h3 className="sx-pcard-name">{product.name}</h3>

          <div className="sx-pcard-pricing">
            <span className="sx-pcard-bulk">Bulk Price</span>
            <div className="sx-pcard-prices">
              <span className="sx-pcard-price">
                {product.perPiecePrice ? `₹${product.perPiecePrice}` : "N/A"}
              </span>
              <span className="sx-pcard-unit">/pc</span>
              {hasDiscount && (
                <span className="sx-pcard-mrp">₹{product.mrp}</span>
              )}
            </div>
          </div>

          {/* Quantity controller — shared with the product page via the cart store */}
          <div className="sx-pcard-cart">
            <CartQuantityControl product={product} size="sm" />
          </div>
        </div>
      </div>
    );
  }

  // ─── DESKTOP: Vertical card layout ───
  return (
    <div className="sx-pcard" onClick={handleProductClick}>
      {hasDiscount && (
        <div className="sx-pcard-discount">-{discountPct}%</div>
      )}

      <button
        type="button"
        className="sx-pcard-wish"
        onClick={handleToggleWishlist}
        aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
      >
        <Heart
          size={20}
          fill={inWishlist ? "var(--primary)" : "none"}
          color={inWishlist ? "var(--primary)" : "#ccc"}
        />
      </button>

      {/* Image container */}
      <div className="sx-pcard-media">
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
        {isOutOfStock && (
          <div className="sx-pcard-oos">
            <span>Out of Stock</span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="sx-pcard-body">
        <h3 className="sx-pcard-name">{product.name}</h3>

        {/* B2B pricing */}
        <div className="sx-pcard-pricing">
          <span className="sx-pcard-bulk">Bulk Price</span>
          <div className="sx-pcard-prices">
            <span className="sx-pcard-price">
              {product.perPiecePrice ? `₹${product.perPiecePrice}` : "N/A"}
            </span>
            <span className="sx-pcard-unit">/pc</span>
            {hasDiscount && (
              <span className="sx-pcard-mrp">₹{product.mrp}</span>
            )}
          </div>
        </div>

        {/* Quantity controller — shared with the product page via the cart store */}
        <div className="sx-pcard-cart">
          <CartQuantityControl product={product} />
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
