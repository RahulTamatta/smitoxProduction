import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, LayoutGrid, Heart, ShoppingCart, User, LogIn } from "lucide-react";
import { useAuth } from "../../context/auth";
import useCartStore from "../../store/cart.store";
import "./Header.css";

const BottomNav = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const location = useLocation();
  const { user } = useAuth();
  const cartCount = useCartStore((state) => state.cart.length);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!isMobile) return null;

  const navItems = [
    { label: "Home", icon: Home, path: "/" },
    { label: "Categories", icon: LayoutGrid, path: "/categories" },
    { label: "Wishlist", icon: Heart, path: "/wishlist" },
    { label: "Cart", icon: ShoppingCart, path: "/cart", badge: cartCount },
    {
      label: "Account",
      icon: user ? User : LogIn,
      path: user ? "/dashboard/user" : "/login",
    },
  ];

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <nav
      className="sx-bottomnav"
      role="navigation"
      aria-label="Mobile bottom navigation"
    >
      <div className="sx-bottomnav-inner">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.label}
              to={item.path}
              className={`sx-bottomnav-item ${active ? "sx-bottomnav-item--active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <span className="sx-bottomnav-icon" aria-hidden="true">
                <item.icon size={24} strokeWidth={active ? 2.5 : 2} />
                {item.badge > 0 && (
                  <span className="sx-bottomnav-badge">{item.badge}</span>
                )}
              </span>
              <span className="sx-bottomnav-label">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;