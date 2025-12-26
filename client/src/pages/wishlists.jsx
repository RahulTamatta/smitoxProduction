import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout/Layout";
import { useAuth } from "../context/auth";
import useCart from "../hooks/useCart";
import useWishlist from "../hooks/useWishlist";
import ProductCard from "../pages/ProductCard";

const WishlistPage = () => {
  const navigate = useNavigate();
  const [auth] = useAuth();

  // Use new hooks
  const { wishlist, isLoading, syncWishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  useEffect(() => {
    if (!auth?.token) {
      navigate("/login");
      return;
    }

    if (auth?.user?._id) {
      syncWishlist();
    }
  }, [auth?.user?._id, auth?.token, navigate, syncWishlist]);

  const handleRemoveFromWishlist = async (productId) => {
    await removeFromWishlist(productId);
  };

  const handleAddToCart = async (product) => {
    if (!product) return;
    const success = await addToCart(product, 1);
    if (success) {
      // Optionally remove from wishlist after adding to cart
      // await removeFromWishlist(product._id);
    }
  };

  if (isLoading) {
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