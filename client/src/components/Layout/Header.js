import axios from "axios";
import React, { useEffect, useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../../context/auth";
import toast from "react-hot-toast";
import SearchInput from "../Form/SearchInput";
import { Badge } from "antd";
import { HeartOutlined, UserOutlined,ShoppingCartOutlined, HomeOutlined, LoginOutlined } from '@ant-design/icons';


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
    toast.success("Logout Successfully");
    setCartCount(0);
    setWishlistCount(0);
  };

  return (
    <nav className="navbar navbar-expand bg-body-tertiary fixed-top">
      <div className="container-fluid d-flex align-items-center">
        {/* Logo */}
        <div className="d-flex align-items-center me-4">
          <Link to="/" className="navbar-brand">
            <img
              src="https://smitox.com/img/logo.png"
              alt="Smitox Logo"
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
              <NavLink to="/" className="nav-link d-flex align-items-center">
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
        <div className={`d-flex ${isMobile ? 'd-block' : 'd-none'} ms-auto`}>
          <ul className="navbar-nav mb-2 mb-lg-0">
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
                  {auth?.user?.user_fullname.slice(0, 5)} {/* Display only first 5 characters of the user's name */}
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
                <HeartOutlined style={{ marginRight: "5px", color: "white", fontSize: "15px" }} />
                Wishlist
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/cart" className="nav-link">
                <ShoppingCartOutlined style={{ marginRight: "5px", color: "white", fontSize: "15px" }} />
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