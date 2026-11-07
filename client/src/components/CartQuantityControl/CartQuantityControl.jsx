import { Minus, Plus, ShoppingCart } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import useCartStore from "../../store/cart.store";
import "./CartQuantityControl.css";

/**
 * "Add to Cart" button that becomes a  [ − qty + ]  stepper.
 *
 * Bound to the shared cart store, so the quantity is identical on every
 * product card, the product page, the cart page and the header badge.
 * Same rules as the product page: unitSet steps, stock limit, instant UI,
 * debounced server sync.
 */
const CartQuantityControl = ({ product, size = "md", className = "" }) => {
  const navigate = useNavigate();
  const productId = product?._id;
  const quantity = useCartStore((state) => {
    const item = (state.cart || []).find((i) => (i.product?._id || i.product) === productId);
    return item ? item.quantity : 0;
  });

  const stock = Number(product?.stock ?? 0);
  const unitSet = Math.max(1, Number(product?.unitSet) || 1);
  const outOfStock = !productId || stock <= 0 || unitSet > stock;

  // Plain onClick: one event per tap (touch-action: manipulation removes the
  // mobile tap delay), so no touch/click double-fire is possible.
  const change = (increase, event) => {
    event.preventDefault();
    event.stopPropagation(); // don't open the product page

    if (!navigator.onLine) {
      toast.error("No internet connection. Please check your network.");
      return;
    }
    const result = useCartStore.getState().stepProductQuantity(product, increase);
    if (result === "notLoggedIn") {
      toast.error("Please login to add items to cart");
      navigate("/login");
    } else if (result === "exceedsStock") {
      toast.error(`Only ${stock} in stock`, { id: `stock-${productId}` });
    }
  };

  const handlers = (increase) => ({
    onClick: (e) => change(increase, e),
  });

  const sizeClass = `cqc-${size}`;

  if (quantity <= 0) {
    return (
      <button
        type="button"
        className={`cqc-add ${sizeClass} ${className}`}
        disabled={outOfStock}
        aria-label={outOfStock ? "Out of stock" : `Add ${product?.name || "product"} to cart`}
        {...(outOfStock ? { onClick: (e) => e.stopPropagation() } : handlers(true))}
      >
        <ShoppingCart size={size === "sm" ? 16 : 18} aria-hidden="true" />
        <span>{outOfStock ? "Out of stock" : "Add to Cart"}</span>
      </button>
    );
  }

  const atMax = quantity + unitSet > stock;
  return (
    <div
      className={`cqc-stepper ${sizeClass} ${className}`}
      role="group"
      aria-label={`Quantity of ${product?.name || "product"} in cart`}
      onClick={(e) => e.stopPropagation()}
    >
      <button type="button" className="cqc-btn" aria-label="Decrease quantity" {...handlers(false)}>
        <Minus size={16} aria-hidden="true" />
      </button>
      <span className="cqc-qty" aria-live="polite">{quantity}</span>
      <button
        type="button"
        className={`cqc-btn ${atMax ? "is-dimmed" : ""}`}
        aria-label="Increase quantity"
        {...handlers(true)}
      >
        <Plus size={16} aria-hidden="true" />
      </button>
    </div>
  );
};

export default CartQuantityControl;
