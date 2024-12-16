import axios from "axios";
import React, { useEffect, useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../../context/auth";
import toast from "react-hot-toast";
import SearchInput from "../Form/SearchInput";
import { Badge } from "antd";
import { HeartOutlined, ShoppingCartOutlined, HomeOutlined, LoginOutlined } from '@ant-design/icons';

const Header = () => {
  const [auth, setAuth] = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Fetch cart count from the server
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

  // Fetch wishlist count from the server
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
        <div className="d-flex align-items-center me-4">
          <Link to="/" className="navbar-brand">
            <img 
              src="https://smitox.com/img/logo.png" 
              alt="Smitox Logo" 
              style={{ 
                height: "80px", 
                maxWidth: "100%",
                objectFit: "contain"
              }} 
            />
          </Link>
        </div>
        
        <div className="flex-grow-1 me-4">
          <SearchInput />
        </div>
        
        <div className="d-flex">
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
                  <HeartOutlined style={{ marginRight: "5px", color: "white", fontSize: "18px" }} />
                </Badge>
                Wishlist
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/cart" className="nav-link d-flex align-items-center">
                <Badge count={cartCount} showZero offset={[10, -5]}>
                  <ShoppingCartOutlined style={{ marginRight: "5px", color: "white", fontSize: "18px" }} />
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
