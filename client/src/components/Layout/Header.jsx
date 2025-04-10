import axios from "axios";
import React, { useEffect, useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../../context/auth";
import toast from "react-hot-toast";
import SearchInput from "../Form/SearchInput";
import { Badge } from "antd";
import { HeartOutlined, UserOutlined,ShoppingCartOutlined, HomeOutlined, LoginOutlined } from '@ant-design/icons';
import logo from "../../../src/assets/images/logo.png";

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

  return (
    <nav className="navbar navbar-expand bg-body-tertiary fixed-top">
      <div className="container-fluid d-flex align-items-center">
        {/* Logo */}
        <div className="d-flex align-items-center me-4">
          <Link to="/" className="navbar-brand" onClick={handleHomeClick}>
            <img
              src={logo}  // Using imported logo
              alt="Company Logo"
              style={{
                height: "80px",
                maxWidth: "100%",
                objectFit: "contain",
              }}
            />
          </Link>
        </div>

        {/* For Mobile: Hide the search input */}
        <div className={`flex-grow-1 me-4 ${isMobile ? 'd-none' : 'd-block'}`}>
          <SearchInput />
        </div>

        {/* Navbar items (will show only on desktop, not mobile) */}
        <div className={`d-flex ${isMobile ? 'd-none' : 'd-block'}`}>
          <ul
            className="navbar-nav ms-auto mb-2 mb-lg-0"
            style={{ fontSize: isMobile ? "0.875rem" : "1rem" }}
          >
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

        {/* For Mobile: Display only the logo, login, wishlist, and cart */}
  {/* For Mobile: Display home, login, wishlist, and cart */}
<div className={`d-flex ${isMobile ? 'd-block' : 'd-none'} ms-auto`}>
  <ul className="navbar-nav mb-2 mb-lg-0">
    <li className="nav-item">
      <NavLink to="/" className="nav-link" onClick={handleHomeClick}>
        <HomeOutlined style={{ marginRight: "5px", color: "white" }} />
        Home
      </NavLink>
    </li>

    {!auth?.user ? (
      <li className="nav-item">
        <NavLink to="/login" className="nav-link">
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
          {auth?.user?.user_fullname.slice(0, 5)}
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
      <NavLink to="/wishlist" className="nav-link">
        <Badge count={wishlistCount} showZero offset={[10, -5]}>
          <HeartOutlined style={{ marginRight: "5px", color: "white", fontSize: "15px" }} />
        </Badge>
        Wishlist
      </NavLink>
    </li>
    <li className="nav-item">
      <NavLink to="/cart" className="nav-link">
        <Badge count={cartCount} showZero offset={[10, -5]}>
          <ShoppingCartOutlined style={{ marginRight: "5px", color: "white", fontSize: "15px" }} />
        </Badge>
        Cart
      </NavLink>
    </li>
  </ul>
</div>
        
      </div>
    </nav>
  );
};


export default Header;