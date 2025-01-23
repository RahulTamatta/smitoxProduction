import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import Layout from "../components/Layout/Layout";
import { useCart } from "../context/cart";
import { useAuth } from "../context/auth";
import ProductCard from "../pages/ProductCard"; // Ensure this path is correct

const WishlistPage = () => {
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [auth] = useAuth();
  const { addToCart } = useCart();

  useEffect(() => {
    if (!auth?.token) {
      //toast.error("Please login to view wishlist");
      navigate("/login");
      return;
    }

    if (auth?.user?._id) {
      getWishlist();
    }
  }, [auth?.user?._id, auth?.token, navigate]);

  const getWishlist = async () => {
    try {
      setLoading(true);
      if (!auth?.user?._id) {
        throw new Error("User ID not found");
      }

      const { data } = await axios.get(`/api/v1/carts/users/${auth.user._id}/wishlist`);
      
      if (data.status === "success") {
        const validWishlistItems = data.wishlist.filter(item => item?.product != null);
        setWishlist(validWishlistItems);
      } else {
        //toast.error("Failed to fetch wishlist");
      }
    } catch (error) {
      console.error("Error fetching wishlist", error);
      //toast.error("Error fetching wishlist");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWishlist = async (productId) => {
    try {
      if (!auth?.user?._id) {
        throw new Error("User ID not found");
      }

      const { data } = await axios.delete(`/api/v1/carts/users/${auth.user._id}/wishlist/${productId}`);
      if (data.status === "success") {
        toast.success("Product removed from wishlist");
        setWishlist(wishlist.filter((item) => item?.product?._id !== productId));
      } else {
        //toast.error("Failed to remove product from wishlist");
      }
    } catch (error) {
      console.error("Error removing product from wishlist", error);
      //toast.error("Error removing product from wishlist");
    }
  };

  const handleAddToCart = (product) => {
    if (!product) {
      //toast.error("Invalid product");
      return;
    }
    addToCart(product);
    toast.success(`${product.name} added to cart!`);
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-8">Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
<div className="container mx-auto px-4 py-8" style={{ paddingTop: "8rem" }}>
  <h2 className="text-center text-2xl sm:text-3xl font-bold mb-6 md:mb-8">My Wishlist</h2>

  {!wishlist || wishlist.length === 0 ? (
    <div className="text-center py-8">
      <p>Your wishlist is empty</p>
    </div>
  ) : (
    <div className="row">
      {wishlist.map((item) => (
        item?.product && (
          <div
            key={item.product._id}
            className="col-lg-4 col-md-6 col-sm-12 mb-3"
          >
            <ProductCard
              product={item.product}
              handleRemoveFromWishlist={handleRemoveFromWishlist}
              handleAddToCart={handleAddToCart}
              isWishlistItem={true}
            />
          </div>
        )
      ))}
    </div>
  )}
</div>

    </Layout>
  );
};

export default WishlistPage;