import { useEffect, useState, useRef } from "react";
import { Link, NavLink } from "react-router-dom";
import { Badge } from "antd";
import { Heart, ShoppingCart, User, LogIn, LogOut, LayoutDashboard } from "lucide-react";
import logo from "../../../src/assets/images/logo.png";
import { useAuth } from "../../context/auth";
import useCartStore from "../../store/cart.store";
import useWishlistStore from "../../store/wishlist.store";
import SearchInput from "../Form/SearchInput";
import "./Header.css";

const Header = () => {
  const [auth, setAuth] = useAuth();
  const cartCount = useCartStore((state) => state.cart.length);
  const wishlistCount = useWishlistStore((state) => state.wishlist.length);
  const syncCart = useCartStore((state) => state.syncCart);
  const syncWishlist = useWishlistStore((state) => state.syncWishlist);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const accountRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setShowAccountMenu(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Sync once on mount / auth change (not on every breakpoint crossing)
  useEffect(() => {
    if (auth?.user?._id) {
      syncCart();
      syncWishlist();
    }
  }, [auth?.user?._id, syncCart, syncWishlist]);

  const handleLogout = () => {
    setAuth({
      ...auth,
      user: null,
      token: "",
    });
    localStorage.removeItem("auth");
    useCartStore.getState().resetLocal();
    useWishlistStore.getState().clearWishlist();
    setShowAccountMenu(false);
  };

  const handleHomeClick = () => {
    sessionStorage.removeItem("homepageScrollPosition");
  };

  const isAdminLike =
    auth?.user?.role === 1 ||
    auth?.user?.role === 3 ||
    auth?.user?.roleString === "admin" ||
    auth?.user?.roleString === "super_admin";

  const dashboardPath = isAdminLike ? "/dashboard/admin" : "/dashboard/user";

  return (
    <>
      {/* Top Strip - Desktop only */}
      <div className="sx-hdr-top-strip" aria-hidden="true">
        <div className="sx-container">
          <span className="sx-hdr-top-text">India's B2B wholesale marketplace</span>
          <div className="sx-hdr-top-links">
            <Link to="/seller-wizard" className="sx-hdr-top-link">
              Sell on Smitox
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <header className="sx-hdr-main" role="banner">
        <div className="sx-container sx-hdr-main-inner">
          {/* Logo */}
          <Link to="/" className="sx-hdr-logo" onClick={handleHomeClick} aria-label="Smitox Home">
            <img src={logo} alt="Smitox B2B" />
          </Link>

          {/* Search Input - centered, flex:1, max-width 640px */}
          <div className="sx-hdr-search">
            <SearchInput />
          </div>

          {/* Right-side actions */}
          <div className="sx-hdr-actions">
            {auth?.user ? (
              <>
                {/* Wishlist */}
                <Link to="/wishlist" className="sx-hdr-action-btn" aria-label="Wishlist">
                  <div className="sx-hdr-action-icon">
                    <Heart size={20} />
                    <Badge count={wishlistCount} showZero className="sx-hdr-badge" />
                  </div>
                  <span className="sx-hdr-action-label">Wishlist</span>
                </Link>

                {/* Cart */}
                <Link to="/cart" className="sx-hdr-action-btn" aria-label="Cart">
                  <div className="sx-hdr-action-icon">
                    <ShoppingCart size={20} />
                    <Badge count={cartCount} showZero className="sx-hdr-badge" />
                  </div>
                  <span className="sx-hdr-action-label">Cart</span>
                </Link>

                {/* Account Dropdown */}
                <div className="sx-hdr-account" ref={accountRef}>
                  <button
                    type="button"
                    className="sx-hdr-action-btn sx-hdr-account-trigger"
                    data-bs-toggle="dropdown"
                    aria-expanded={showAccountMenu}
                    aria-haspopup="true"
                    onClick={() => setShowAccountMenu(!showAccountMenu)}
                  >
                    <div className="sx-hdr-action-icon">
                      <User size={20} />
                    </div>
                    <span className="sx-hdr-action-label">Account</span>
                  </button>
                  <ul className="dropdown-menu sx-hdr-dropdown" role="menu">
                    <li>
                      <NavLink
                        to={dashboardPath}
                        className="dropdown-item sx-hdr-dropdown-item"
                        onClick={() => setShowAccountMenu(false)}
                      >
                        <LayoutDashboard size={16} className="sx-hdr-dropdown-icon" />
                        Dashboard
                      </NavLink>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <NavLink
                        to="/login"
                        className="dropdown-item sx-hdr-dropdown-item sx-hdr-logout"
                        onClick={() => {
                          setShowAccountMenu(false);
                          handleLogout();
                        }}
                      >
                        <LogOut size={16} className="sx-hdr-dropdown-icon" />
                        Logout
                      </NavLink>
                    </li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                {/* Logged out - Login link with icon */}
                <Link to="/login" className="sx-hdr-action-btn sx-hdr-login" aria-label="Login">
                  <div className="sx-hdr-action-icon">
                    <LogIn size={20} />
                  </div>
                  <span className="sx-hdr-action-label">Login</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Search Bar - Separate row below main header */}
      <div className="sx-hdr-mobile-search" aria-hidden={!isMobile}>
        <div className="sx-container">
          <SearchInput />
        </div>
      </div>
    </>
  );
};

export default Header;