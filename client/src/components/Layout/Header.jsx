import { HeartOutlined, HomeOutlined, LoginOutlined, ShoppingCartOutlined, UserOutlined } from '@ant-design/icons';
import { Badge } from "antd";
import axios from "axios";
import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import logo from "../../../src/assets/images/logo.png";
import { useAuth } from "../../context/auth";
import SearchInput from "../Form/SearchInput";

const Header = () => {
  const [auth, setAuth] = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [dataFetched, setDataFetched] = useState(false); // To track if data is fetched
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const fetchCounts = async () => {
    try {
      if (auth?.user) {
        const cartResponse = await axios.get(`/api/v1/carts/users/${auth.user._id}/cart`);
        const wishlistResponse = await axios.get(`/api/v1/carts/users/${auth.user._id}/wishlist`);
        setCartCount(cartResponse.data.cart.length);
        setWishlistCount(wishlistResponse.data.wishlist.length);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const fetchCartCount = async () => {
    try {
      if (auth?.user) {
        const { data } = await axios.get(`/api/v1/carts/users/${auth.user._id}/cart`);
        setCartCount(data.cart.length);
      }
    } catch (error) {
      console.error("Error fetching cart count:", error);
    }
  };

  const fetchWishlistCount = async () => {
    try {
      if (auth?.user) {
        const { data } = await axios.get(`/api/v1/carts/users/${auth.user._id}/wishlist`);
        setWishlistCount(data.wishlist.length);
      }
    } catch (error) {
      console.error("Error fetching wishlist count:", error);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);

    if (auth?.user) {
      fetchCartCount();
      fetchWishlistCount();

      const cartInterval = setInterval(fetchCartCount, 5000);
      const wishlistInterval = setInterval(fetchWishlistCount, 5000);

      return () => {
        window.removeEventListener("resize", handleResize);
        clearInterval(cartInterval);
        clearInterval(wishlistInterval);
      };
    }

    return () => window.removeEventListener("resize", handleResize);
  }, [auth?.user]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // Add event listener for window resize
    window.addEventListener("resize", handleResize);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleToggle = (section) => {
    if (section === "cart" || section === "wishlist") {
      fetchCounts(); // Fetch updated counts only when toggled
    }
  };

  const handleLogout = () => {
    setAuth({
      ...auth,
      user: null,
      token: "",
    });
    localStorage.removeItem("auth");
    //toast.success("Logout Successfully");
    setCartCount(0);
    setWishlistCount(0);
  };

  // Save scroll position when navigating to home
  const handleHomeClick = () => {
    // For other pages to home navigation, clear any saved position
    sessionStorage.removeItem('homepageScrollPosition');
  };

  const logoStyles = {
    height: isMobile ? "50px" : "60px", // Smaller logo on mobile
    maxWidth: "100%",
    objectFit: "contain",
    transition: "height 0.3s ease"
  };

  const navbarStyles = {
    backgroundColor: "#d32f2f",
    borderBottom: "none",
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
    height: isMobile ? "60px" : "70px", // Fixed height instead of minHeight
    minHeight: isMobile ? "60px" : "70px",
    maxHeight: isMobile ? "60px" : "70px", // Ensure height doesn't exceed
    padding: isMobile ? "0.25rem 0.75rem" : "0.75rem 1.5rem", // Reduced mobile padding
    display: "flex",
    alignItems: "center"
  };

  const containerStyles = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: "100%",
    margin: "0 auto",
    padding: "0"
  };

  const logoContainerStyles = {
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
    marginRight: isMobile ? "0.25rem" : "1rem" // Reduced margin for mobile
  };

  const searchContainerStyles = {
    flex: isMobile ? "1" : "1",
    display: "flex",
    maxWidth: isMobile ? "150px" : "600px", // Further reduced for mobile
    minWidth: isMobile ? "120px" : "200px", // Ensure minimum width
    margin: isMobile ? "0 0.25rem" : "0 1rem", // Reduced margin for mobile
    overflow: "hidden" // Prevent overflow
  };

  const navItemsStyles = {
    display: "flex",
    alignItems: "center",
    gap: isMobile ? "0.5rem" : "1rem",
    margin: "0",
    padding: "0",
    listStyle: "none"
  };

  const mobileNavStyles = {
    display: isMobile ? "flex" : "none",
    alignItems: "center",
    gap: "0.25rem", // Reduced gap for mobile
    flexShrink: 0 // Prevent shrinking
  };

  const desktopNavStyles = {
    display: isMobile ? "none" : "flex",
    alignItems: "center",
    gap: "1rem"
  };

  return (
    <nav className="navbar navbar-expand" style={navbarStyles}>
      <div className="container-fluid" style={containerStyles}>
        {/* Logo */}
        <div style={logoContainerStyles}>
          <Link to="/" className="navbar-brand" onClick={handleHomeClick} style={{ margin: 0, padding: 0 }}>
            <img
              src={logo}
              alt="Smitox Logo"
              style={logoStyles}
            />
          </Link>
        </div>

        {/* Search - Now visible on both desktop and mobile */}
        <div style={searchContainerStyles}>
          <SearchInput />
        </div>

        {/* Desktop Navigation */}
        <div style={desktopNavStyles}>
          <ul className="navbar-nav" style={navItemsStyles}>
            <li className="nav-item">
              <NavLink to="/" className="nav-link d-flex align-items-center" onClick={handleHomeClick}>
                <HomeOutlined style={{ marginRight: "5px", color: "white" }} />
                Home
              </NavLink>
            </li>

            {!auth?.user ? (
              <li className="nav-item">
                <NavLink to="/login" className="nav-link d-flex align-items-center">
                  <LoginOutlined style={{ marginRight: "5px", color: "white" }} />
                  Login
                </NavLink>
              </li>
            ) : (
              <li className="nav-item dropdown">
                <NavLink
                  className="nav-link dropdown-toggle"
                  href="#"
                  role="button"
                  data-bs-toggle="dropdown"
                  style={{ border: "none", color: "white" }}
                >
                  <UserOutlined style={{ marginRight: "5px", color: "white" }} />
                  {auth?.user?.user_fullname}
                </NavLink>
                <ul className="dropdown-menu">
                  <li>
                    <NavLink
                      to={`/dashboard/${auth?.user?.role === 1 ? "admin" : "user"}`}
                      className="dropdown-item"
                    >
                      Dashboard
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      onClick={handleLogout}
                      to="/login"
                      className="dropdown-item"
                    >
                      Logout
                    </NavLink>
                  </li>
                </ul>
              </li>
            )}
            <li className="nav-item">
              <NavLink to="/wishlist" className="nav-link d-flex align-items-center">
                <Badge count={wishlistCount} showZero offset={[10, -5]}>
                  <HeartOutlined style={{ marginRight: "5px", color: "white", fontSize: "15px" }} />
                </Badge>
                Wishlist
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/cart" className="nav-link d-flex align-items-center">
                <Badge count={cartCount} showZero offset={[10, -5]}>
                  <ShoppingCartOutlined style={{ marginRight: "5px", color: "white", fontSize: "15px" }} />
                </Badge>
                Cart
              </NavLink>
            </li>
          </ul>
        </div>

        {/* Mobile Navigation */}
        <div style={mobileNavStyles}>
          <ul className="navbar-nav" style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "0.25rem",
            margin: 0,
            padding: 0,
            listStyle: "none",
            fontSize: "0.75rem"
          }}>
            <li className="nav-item">
              <NavLink to="/" className="nav-link p-1" onClick={handleHomeClick} style={{ color: "white", padding: "0.25rem 0.5rem" }}>
                <HomeOutlined style={{ color: "white", fontSize: "14px" }} />
              </NavLink>
            </li>

            {!auth?.user ? (
              <li className="nav-item">
                <NavLink to="/login" className="nav-link p-1" style={{ color: "white", padding: "0.25rem 0.5rem" }}>
                  <LoginOutlined style={{ color: "white", fontSize: "14px" }} />
                </NavLink>
              </li>
            ) : (
              <li className="nav-item dropdown">
                <NavLink
                  className="nav-link dropdown-toggle p-1"
                  href="#"
                  role="button"
                  data-bs-toggle="dropdown"
                  style={{ border: "none", color: "white", padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                >
                  <UserOutlined style={{ color: "white", fontSize: "14px" }} />
                </NavLink>
                <ul className="dropdown-menu">
                  <li>
                    <NavLink
                      to={`/dashboard/${auth?.user?.role === 1 ? "admin" : "user"}`}
                      className="dropdown-item"
                      style={{ fontSize: "0.8rem" }}
                    >
                      Dashboard
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      onClick={handleLogout}
                      to="/login"
                      className="dropdown-item"
                      style={{ fontSize: "0.8rem" }}
                    >
                      Logout
                    </NavLink>
                  </li>
                </ul>
              </li>
            )}

            <li className="nav-item">
              <NavLink to="/wishlist" className="nav-link p-1" style={{ color: "white", padding: "0.25rem 0.5rem" }}>
                <Badge count={wishlistCount} showZero offset={[8, -3]} size="small">
                  <HeartOutlined style={{ color: "white", fontSize: "14px" }} />
                </Badge>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/cart" className="nav-link p-1" style={{ color: "white", padding: "0.25rem 0.5rem" }}>
                <Badge count={cartCount} showZero offset={[8, -3]} size="small">
                  <ShoppingCartOutlined style={{ color: "white", fontSize: "14px" }} />
                </Badge>
              </NavLink>
            </li>
          </ul>
        </div>
        
      </div>
    </nav>
  );
};

export default Header;