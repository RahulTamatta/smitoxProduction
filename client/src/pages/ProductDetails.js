import React, { useState, useEffect } from "react";
import Layout from "./../components/Layout/Layout";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useCart } from "../context/cart";
import { useAuth } from "../context/auth";
import toast from "react-hot-toast";
import ProductCard from "./ProductCard";

const ProductDetails = () => {
  const params = useParams();
  const navigate = useNavigate();
  const [auth] = useAuth();
  const [product, setProduct] = useState({});
  const [productsForYou, setProductsForYou] = useState([]);
  const [selectedQuantity, setSelectedQuantity] = useState(0);
  const [selectedBulk, setSelectedBulk] = useState(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [isPincodeAvailable, setIsPincodeAvailable] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [cart, setCart] = useCart();
  const [unitSet, setUnitSet] = useState(1);
  const [quantity, setQuantity] = useState(1);
  const [displayQuantity, setDisplayQuantity] = useState(0);
  const [showQuantitySelector, setShowQuantitySelector] = useState(false);
  const [productIds, setProductId] = useState();
  const [categoryId, setCategoryId] = useState();
  const [subcategoryId, setSubcategoryId] = useState();
  
  useEffect(() => {
    window.scrollTo(0, 0);
    if (params?.slug) {
      if (auth?.user?.pincode) {
        checkPincode(auth.user.pincode);
      }
      getProduct();
    }
  }, [params?.slug, auth?.user?.pincode]);

  useEffect(() => {
    if (product._id && auth?.user?._id) {
      checkWishlistStatus(product._id);
      fetchInitialQuantity(product._id);
    }
  }, [product._id, auth?.user?._id]);

  // New useEffect to handle Products For You fetching
  useEffect(() => {
    if (categoryId && subcategoryId) {
      getProductsForYou();
    }
  }, [categoryId, subcategoryId,productsForYou]);
  const getProduct = async () => {
    try {
      const { data } = await axios.get(
        `/api/v1/product/get-product/${params.slug}`
      );

      if (data.success === true) {
        // Update product state with image URL
        const productData = {
          ...data.product,
          photoUrl: data.product?._id ? `/api/v1/product/product-photo/${data.product._id}` : '/placeholder-image.jpg'
        };
        setProduct(productData);
        setCategoryId(data?.product?.category._id);
        setSubcategoryId(data?.product?.subcategory._id || {});
      }
      console.log("PProduct", data);
      getProductsForYou();
      setUnitSet(data?.product?.unitSet || 1);
      setQuantity(data?.product?.quantity || 1);
    } catch (error) {
      console.error(error);
      toast.error("Error fetching product details");
    }
  };

  const getProductsForYou = async () => {
    try {
      const { data } = await axios.get(`/api/v1/productForYou/products/${categoryId}/${subcategoryId}`);
      
      // Log the response data for debugging
      console.log('Response Data:', data);
  
      if (data?.success) {
        setProductsForYou(data.products || []);
        console.log("Ha",data.products);
      }
    } catch (error) {
      console.error('Error fetching products for you:', error);
      toast.error("Failed to fetch products for you");
    }
  };
  

  const getApplicableBulkProduct = (quantity) => {
    if (!product.bulkProducts || product.bulkProducts.length === 0) return null;

    const sortedBulkProducts = [...product.bulkProducts]
      .filter((bulk) => bulk && bulk.minimum)
      .sort((a, b) => b.minimum - a.minimum);

    for (let i = 0; i < sortedBulkProducts.length; i++) {
      const bulk = sortedBulkProducts[i];
      if (quantity >= bulk.minimum * unitSet) {
        return bulk;
      }
    }

    return null;
  };

  const calculateTotalPrice = (bulk, quantity) => {
    if (bulk) {
      setTotalPrice(quantity * parseFloat(bulk.selling_price_set));
    } else {
      setTotalPrice(quantity * parseFloat(product.perPiecePrice || 0));
    }
  };

  const addToCart = async () => {
    if (!auth.user) {
      toast.error("Please log in to add items to cart");
      return;
    }

    // if (!isPincodeAvailable) {
    //   toast.error("Delivery not available for your pincode");
    //   return;
    // }

    try {
      const initialQuantity = unitSet*quantity;
      const applicableBulk = getApplicableBulkProduct(initialQuantity);

      const response = await axios.post(
        `/api/v1/carts/users/${auth.user._id}/cart`,
        {
          productId: product._id,
          quantity: initialQuantity,
          price: applicableBulk
            ? parseFloat(applicableBulk.selling_price_set)
            : parseFloat(product.price),
          bulkProductDetails: applicableBulk,
        }
      );

      if (response.data.status === "success") {
        setCart(response.data.cart);
        setDisplayQuantity(initialQuantity);
        setSelectedBulk(applicableBulk);
        calculateTotalPrice(applicableBulk, initialQuantity);
        setShowQuantitySelector(true);
        toast.success("Item added to cart");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error adding item to cart");
    }
  };

  const checkPincode = async (pincode) => {
    try {
      const { data } = await axios.get("/api/v1/pincodes/get-pincodes");
      if (data.success) {
        const availablePincodes = data.pincodes.map((pin) => pin.code);
        if (availablePincodes.includes(pincode.toString())) {
          setIsPincodeAvailable(true);
          toast.success("Delivery available for your pincode");
        } else {
          setIsPincodeAvailable(false);
          toast.error("Delivery not available for your pincode");
        }
      }
    } catch (error) {
      console.log(error);
      setIsPincodeAvailable(false);
      toast.error("Error checking pincode");
    }
  };

  const handleQuantityChange = async (increment) => {
    const newQuantity = displayQuantity + (increment ? 1 : -1) * unitSet;
    const updatedQuantity = Math.max(0, newQuantity);

    if (updatedQuantity === 0) {
      await removeFromCart(product._id);
      setShowQuantitySelector(false);
      setDisplayQuantity(0);
      setSelectedBulk(null);
      setTotalPrice(0);
      return;
    }

    try {
      await updateQuantity(updatedQuantity);
      setDisplayQuantity(updatedQuantity);
      const applicableBulk = getApplicableBulkProduct(updatedQuantity);
      setSelectedBulk(applicableBulk);
      calculateTotalPrice(applicableBulk, updatedQuantity);
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast.error("Failed to update quantity");
    }
  };

  const updateQuantity = async (quantity) => {
    if (!auth?.user?._id) {
      toast.error("Please log in to update quantity");
      return;
    }

    try {
      const response = await axios.post(
        `/api/v1/carts/users/${auth.user._id}/cartq/${product._id}`,
        { quantity },
        {
          headers: {
            Authorization: `Bearer ${auth.user.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        toast.success("Quantity updated successfully");
      }
    } catch (error) {
      console.error("Quantity update error:", error);
      toast.error("Failed to update quantity");
    }
  };

  const removeFromCart = async (productId) => {
    if (!auth.user._id) return;

    try {
      const response = await axios.delete(
        `/api/v1/carts/users/${auth.user._id}/cart/${productId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${auth.user.token}`,
          },
        }
      );

      if (response.status === 200) {
        toast.success("Item removed from cart");
      } else {
        const responseBody = await response.text();
        console.error("Error removing item:", responseBody);
        toast.error("Failed to remove item from cart");
      }
    } catch (error) {
      console.error("Remove from cart failed:", error.message);
      toast.error("Failed to remove item from cart");
    }
  };

  const fetchInitialQuantity = async (productId) => {
    if (!auth?.user?._id) return;

    try {
      const { data } = await axios.get(
        `/api/v1/carts/users/${auth.user._id}/products/${productId}/quantity`,
        {
          headers: {
            Authorization: `Bearer ${auth.user.token}`,
          },
        }
      );

      if (data.quantity) {
        const quantity = data.quantity;
        setDisplayQuantity(quantity);
        setShowQuantitySelector(quantity > 0);

        const applicableBulk = getApplicableBulkProduct(quantity);
        setSelectedBulk(applicableBulk);
        calculateTotalPrice(applicableBulk, quantity);
      }
    } catch (error) {
      console.error("Error fetching quantity:", error);
    }
  };

  // Rest of your code including toggleWishlist, checkWishlistStatus, and return statement...
  // Copy the styles and return statement from your original code
  const toggleWishlist = async () => {
    if (!auth.user) {
      toast.error("Please log in to manage your wishlist");
      return;
    }

    try {
      if (isInWishlist) {
        await axios.delete(
          `/api/v1/carts/users/${auth.user._id}/wishlist/${product._id}`
        );
        setIsInWishlist(false);
        toast.success("Removed from wishlist");
      } else {
        await axios.post(`/api/v1/carts/users/${auth.user._id}/wishlist`, {
          productId: product._id,
        });
        setIsInWishlist(true);
        toast.success("Added to wishlist");
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);
      toast.error("Error updating wishlist");
    }
  };

  const checkWishlistStatus = async (productId) => {
    if (!auth.user) return;

    try {
      const { data } = await axios.get(
        `/api/v1/carts/users/${auth.user._id}/wishlist/check/${productId}`
      );
      setIsInWishlist(data.exists);
    } catch (error) {
      console.error(error);
      setIsInWishlist(false);
    }
  };

  // Styles
  const containerStyle = {
    maxWidth: "1200px",
    // margin: "0 auto",
    paddingTop: "8rem" ,
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#f5f5f5",
    borderRadius: "8px",
    boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
  };

  const productDetailStyle = {
    display: "flex",
    flexWrap: "wrap",
    gap: "20px",
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    padding: "20px",
    marginBottom: "20px",
  };

  const imageStyle = {
    flex: "1 1 300px",
    maxWidth: "500px",
  };

  const infoStyle = {
    flex: "1 1 300px",
    minWidth: "300px",
  };

  const headingStyle = {
    fontSize: "28px",
    fontWeight: "bold",
    color: "#333",
    marginBottom: "15px",
  };

  const priceStyle = {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#e47911",
    marginBottom: "20px",
  };

  const strikeThroughStyle = {
    textDecoration: "line-through",
    color: "#888",
    marginRight: "10px",
  };

  const descriptionStyle = {
    fontSize: "16px",
    lineHeight: "1.6",
    color: "#555",
    marginBottom: "20px",
    padding: "15px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    backgroundColor: "#f9f9f9",
  };

  const quantitySelectorStyle = {
    display: "flex",
    alignItems: "center",
    marginBottom: "20px",
  };

  const buttonStyle = {
    padding: "10px 20px",
    fontSize: "16px",
    cursor: "pointer",
    backgroundColor: "red",  // Complementary blue for wishlist
    color: isInWishlist ? "#ffffff" : "#111111", 
    border: "none",
    borderRadius: "20px",
    transition: "background-color 0.3s",
  };

  const addToCartButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#ffa41c",
    color: "#000000",
    fontWeight: "bold",
    width: "100%",
    marginTop: "20px",
  };

  const inputStyle = {
    width: "50px",
    textAlign: "center",
    margin: "0 10px",
    padding: "5px",
    border: "1px solid #ddd",
    borderRadius: "4px",
  };

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "20px",
  };

  const thTdStyle = {
    border: "1px solid #ddd",
    padding: "4px",
    textAlign: "left",
    fontSize: "14px",
  };

  if (!product || Object.keys(product).length === 0) {
    return (
      <Layout>
        <div style={containerStyle}>
          <p>Loading product details...</p>
        </div>
      </Layout>
    );
  }
  return (
    <Layout>
      <div style={containerStyle}>
        <div style={productDetailStyle}>
          {/* Copy your existing JSX structure here */}
          {/* Replace the quantity selector and add to cart button section with: */}
          <div style={imageStyle}>
            {product._id ? (
                   <img
                   src={product.photoUrl}
                   alt={product.name}
                   style={{ 
                     width: "100%", 
                     height: "auto", 
                     borderRadius: "8px",
                     objectFit: "cover"
                   }}
                   onError={(e) => {
                     e.target.src = '/placeholder-image.jpg';
                   }}
                 />
               
            ) : (
              <p>Loading product image...</p>
            )}
          </div>
          <div style={infoStyle}>
            <h1 style={headingStyle}>{product.name}</h1>
            <div style={priceStyle}>
              <span style={strikeThroughStyle}>₹{product.mrp}</span>
              <span style={{ color: 'red' }}>₹{product.perPiecePrice}</span>
            </div>
            <p
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>Total Price: ₹{totalPrice.toFixed(2)}</span>

              <div style={quantitySelectorStyle}>
                <button
                  onClick={() => handleQuantityChange(false)}
                  style={buttonStyle}
                >
                  -
                </button>
                <input
                  type="number"
                  value={displayQuantity}
                  readOnly
                  style={inputStyle}
                />
                <button
                  onClick={() => {
                    if (displayQuantity != 0) {
                      handleQuantityChange(true);
                    }
                    if (displayQuantity == 0) {
                      addToCart();
                    } // Replace with your second function
                  }}
                  style={buttonStyle}
                >
                  +
                </button>
              </div>
            </p>

            {
           <button
           onClick={toggleWishlist}
           style={{
             ...buttonStyle,
             backgroundColor: isInWishlist ? "#1157e4" : "red",  // Set background color to red when not in wishlist
             color: isInWishlist ? "#ffffff" : "#ffffff",  // Keep text color white for contrast
             marginTop: "10px",
             width: "100%",
           }}
         >
           {isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
         </button>
         
            }

            {!isPincodeAvailable && (
              <div style={{ textAlign: "center", marginTop: "10px" }}>
                <p
                  style={{
                    color: "red",
                    fontSize: "16px",
                    marginBottom: "10px",
                  }}
                >
                  Service is not available in your area or pincode.
                </p>
                <a
                  href="https://wa.me/918291541168"
                  target="_blank"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textDecoration: "none",
                  }}
                >
                  <i
                    className="fab fa-whatsapp"
                    style={{
                      fontSize: "30px",
                      marginRight: "8px",
                      color: "#25D366",
                    }}
                  ></i>
                  <span style={{ color: "#007bff", fontSize: "16px" }}>
                    Contact Support via WhatsApp
                  </span>
                </a>
              </div>
            )}

            <h3
              style={{ ...headingStyle, fontSize: "20px", marginTop: "20px" }}
            >
              Bulk Pricing
            </h3>
            {product.bulkProducts && product.bulkProducts.length > 0 ? (
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thTdStyle}>Min Qty</th>
                    <th style={thTdStyle}>Max Qty</th>
                    <th style={thTdStyle}>Price/set</th>
                    <th style={thTdStyle}>Total Price</th>
                    <th style={thTdStyle}>Select</th>
                  </tr>
                </thead>
                <tbody>
                  {product.bulkProducts.map((bulk, index) => {
                    if (!bulk || !bulk.minimum || !bulk.selling_price_set) {
                      return null;
                    }

                    const minQty = bulk.minimum * unitSet;
                    const maxQty = bulk.maximum
                      ? bulk.maximum * unitSet
                      : "No limit";

                    // Automatic selection logic
                    const autoSelectCondition =
                      selectedBulk && selectedBulk._id === bulk._id;

                    return (
                      <tr
                        key={index}
                        style={{
                          backgroundColor: autoSelectCondition
                            ? "#e6f7ff"
                            : "transparent",
                        }}
                      >
                        <td style={thTdStyle}>{minQty}</td>
                        <td style={thTdStyle}>{maxQty}</td>
                        <td style={thTdStyle}>
                          ₹{parseFloat(bulk.selling_price_set).toFixed(2)}
                        </td>
                        <td style={thTdStyle}>
                          {autoSelectCondition
                            ? `₹${totalPrice.toFixed(2)}`
                            : "-"}
                        </td>
                        <td style={thTdStyle}>
                          <input
                            type="checkbox"
                            checked={autoSelectCondition}
                            readOnly
                            disabled
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p>No bulk pricing available for this product.</p>
            )}
            {
              //  showQuantitySelector ?
              //  (
              //   <button
              //     onClick={addToCart}
              //     disabled={!isPincodeAvailable}
              //     style={{
              //       ...addToCartButtonStyle,
              //       backgroundColor: isPincodeAvailable ? '#ffa41c' : '#ccc',
              //       cursor: isPincodeAvailable ? 'pointer' : 'not-allowed',
              //     }}
              //   >
              //     ADD TO CART
              //   </button>
              // )
              // :
              // (
              // )
            }

            <h3
              style={{ ...headingStyle, fontSize: "20px", marginTop: "20px" }}
            >
              Description{" "}
            </h3>

            <p style={{ ...headingStyle, fontSize: "18px", marginTop: "20px" }}>
              {product.description}
            </p>
          </div>
        </div>
      </div>

      <div className="container mt-5">
        <h2 className="text-center mb-4">Products For You</h2>
        <div className="row">
        {     console.log("Id",productsForYou.productId)}
        {productsForYou.map((item) => (
  <div key={item.productId?._id} className="col-lg-4 col-md-4 col-sm-4 col-6 mb-3">
    <div className="col-md-10 col-sm-6 col-12 mb-3">
      { (
     <div
     className="card product-card h-100"
     style={{ cursor: 'pointer', position: 'relative' }}
     onClick={() => window.location.href = `/product/${item.productId.slug}`} // Full reload
   >
   
      
          <img
            src={item.productId.photoUrl}
            className="card-img-top product-image img-fluid"
            alt={item.productId.name}
            style={{ height: '200px', objectFit: 'fill' }}
          />
          <div className="p-4 flex flex-col h-full">
            <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              {item.productId.name}
            </h5>
            <div className="mt-auto">
              <h5 className="text-base font-bold text-gray-900 dark:text-white">
                {item.productId.perPiecePrice?.toLocaleString("en-US", {
                  style: "currency",
                  currency: "INR",
                }) || "Price not available"}
              </h5>
              {item.productId.perPiecePrice && (
                <h6
                  className="text-xs text-red-500"
                  style={{ textDecoration: "line-through" }}
                >
            
                </h6>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
))}

        </div>

        {productsForYou.length > 10 && (
          <div className="text-center mt-3">
            {/* Optional button for viewing more products */}
            {/* <button 
        className="btn btn-primary"
        onClick={() => navigate('/products-for-you')}
      >
        View More
      </button> */}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProductDetails;
