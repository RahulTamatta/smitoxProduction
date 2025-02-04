import React, { useState, useEffect } from "react";
import Layout from "./../components/Layout/Layout";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useCart } from "../context/cart";
import { useAuth } from "../context/auth";
import toast from "react-hot-toast";
import ProductCard from './ProductCard';


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

  // Initial setup and data fetching
  useEffect(() => {
    window.scrollTo(0, 0);
    if (params?.slug) getProduct();
    getProductsForYou();
    if (auth?.user?.pincode) {
      checkPincode(auth.user.pincode);
    }
  }, [params?.slug, auth?.user?.pincode]);

  // Check wishlist status when product or user changes
  useEffect(() => {
    if (product._id && auth?.user?._id) {
      checkWishlistStatus(product._id);
    }
  }, [product._id, auth?.user?._id]);

  // Initialize quantity from cart
  useEffect(() => {
    window.scrollTo(0, 0);
    if (params?.slug) {
      getProduct();
      initializeQuantityFromCart();
    }
  }, [params?.slug]);

  const getProduct = async () => {
    try {
      const { data } = await axios.get(`/api/v1/product/get-product/${params.slug}`);
      
      if (!data?.product?._id) {
        console.error("Product ID not found in API response");
        return;
      }
      
      setProduct(data?.product || {});
      setUnitSet(data?.product?.unitSet || 1);
  
      // Only fetch product quantity if we have both product ID and user ID
      if (data?.product._id && auth?.user?._id) {
        await fetchProductQuantity(data.product._id);
      }
    } catch (error) {
      console.error("Error fetching product details:", error);
      ////toast.error("Error fetching product details");
    }
  };

  const fetchProductQuantity = async (productId) => {
    try {
      var temp=auth?.user?._id;
      // First verify we have both required IDs
      console.log("required IDs",temp);
      if (!productId || !auth?.user?._id) {
        console.log("Missing required IDs for quantity fetch");
        setSelectedQuantity(0);
        return;
      }

      const response = await axios.get(`/api/v1/carts/users/${auth.user._id}/cart/products/${productId}/quantity`);
      
      if (response.data && typeof response.data.quantity === 'number') {
        setSelectedQuantity(response.data.quantity);
      } else {
        setSelectedQuantity(0);
      }
    } catch (error) {
      console.error("Error fetching product quantity:", error);
      setSelectedQuantity(0);
    }
  };

  const initializeQuantityFromCart = async () => {
    // Verify user authentication first
    if (!auth?.user?._id) {
      console.log("User not authenticated, skipping cart initialization");
      return;
    }

    try {
      const { data } = await axios.get(`/api/v1/carts/users/${auth.user._id}/cart`);
      
      const cartProduct = data.cart?.find(item => item.product?.slug === params.slug);
      
      const initialQuantity = cartProduct
        ? cartProduct.quantity
        : (product.minimumQuantity || 0) * unitSet;

      setSelectedQuantity(initialQuantity);

      const bulk = getApplicableBulkProduct(initialQuantity);
      setSelectedBulk(bulk);
      calculateTotalPrice(bulk, initialQuantity);
    } catch (error) {
      console.error("Error fetching cart data:", error);
      ////toast.error("Failed to initialize cart quantity");
    }
  };
    const getProductsForYou = async () => {
      try {
        const { data } = await axios.get("/api/v1/productForYou/get-products");
        if (data?.success) {
          setProductsForYou(data.banners || []);
        }
      } catch (error) {
        console.error(error);
        ////toast.error("Failed to fetch products for you");
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
            ////toast.error("Delivery not available for your pincode");
          }
        } else {
          setIsPincodeAvailable(false);
          ////toast.error("Error fetching pincodes");
        }
      } catch (error) {
        console.log(error);
        setIsPincodeAvailable(false);
        ////toast.error("Error checking pincode");
      }
    };
  
    
    
  
    const getApplicableBulkProduct = (quantity) => {
      if (!product.bulkProducts || product.bulkProducts.length === 0) return null;
  
      const sortedBulkProducts = [...product.bulkProducts]
        .filter(bulk => bulk && bulk.minimum)
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
        setTotalPrice(quantity * parseFloat(product.price || 0));
      }
    };
  
    const handleQuantityChange = async (increment) => {
      // Guard clause for unauthenticated users
      if (!auth?.user?._id) {
        ////toast.error("Please log in to modify quantity");
        return;
      }
  
      const newQuantity = selectedQuantity + (increment ? 1 : -1) * unitSet;
      const updatedQuantity = Math.max((product.minimumQuantity || 0) * unitSet, newQuantity);
  
      try {
        const response = await axios.patch(`/api/v1/carts/users/${auth.user._id}/cart/${product._id}`, {
          quantity: updatedQuantity,
        });
  
        if (response.data.status === "success") {
          setCart(response.data.cart);
          setSelectedQuantity(updatedQuantity);
  
          const bulk = getApplicableBulkProduct(updatedQuantity);
          setSelectedBulk(bulk);
          calculateTotalPrice(bulk, updatedQuantity);
  
          toast.success("Cart updated successfully");
        }
      } catch (error) {
        console.error("Error updating quantity in cart:", error);
        ////toast.error("Error updating quantity");
      }
    };
  
    const addToCart = async () => {
      if (!auth.user) {
        ////toast.error("Please log in to add items to your cart");
        return;
      }
  
      if (selectedQuantity < (product.minimumQuantity || 0) * unitSet) {
        //toast.error(`Minimum quantity required: ${(product.minimumQuantity || 0) * unitSet}`);
        return;
      }
  
      try {
        const response = await axios.post(`/api/v1/carts/users/${auth.user._id}/cart`, {
          productId: product._id,
          quantity: selectedQuantity,
          price: selectedBulk
            ? parseFloat(selectedBulk.selling_price_set)
            : parseFloat(product.price || 0),
        });
  
        if (response.data.status === "success") {
          setCart(response.data.cart);
          toast.success("Item added to cart");
        }
      } catch (error) {
        console.error("Error adding item to cart:", error);
        ////toast.error("Error adding item to cart");
      }
    };
  
  
  
   
  
  const toggleWishlist = async () => {
    if (!auth.user) {
      ////toast.error("Please log in to manage your wishlist");
      return;
    }

    try {
      if (isInWishlist) {
        await axios.delete(`/api/v1/carts/users/${auth.user._id}/wishlist/${product._id}`);
        setIsInWishlist(false);
        toast.success("Removed from wishlist");
      } else {
        await axios.post(`/api/v1/carts/users/${auth.user._id}/wishlist`, {
          productId: product._id
        });
        setIsInWishlist(true);
        toast.success("Added to wishlist");
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);
      ////toast.error("Error updating wishlist");
    }
  };

  const checkWishlistStatus = async (productId) => {
    if (!auth.user) return;

    try {
      const { data } = await axios.get(`/api/v1/carts/users/${auth.user._id}/wishlist/check/${productId}`);
      setIsInWishlist(data.exists);
    } catch (error) {
      console.error(error);
      setIsInWishlist(false);
    }
  };

   // Styles
   const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '50px',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
  };

  const productDetailStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '20px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
  };

  const imageStyle = {
    flex: '1 1 300px',
    maxWidth: '500px',
  };

  const infoStyle = {
    flex: '1 1 300px',
    minWidth: '300px',
  };

  const headingStyle = {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '15px',
  };

  const priceStyle = {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#e47911',
    marginBottom: '20px',
  };

  const strikeThroughStyle = {
    textDecoration: 'line-through',
    color: '#888',
    marginRight: '10px',
  };

  const descriptionStyle = {
    fontSize: '16px',
    lineHeight: '1.6',
    color: '#555',
    marginBottom: '20px',
    padding: '15px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    backgroundColor: '#f9f9f9',
  };

  const quantitySelectorStyle = {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '20px',
  };

  const buttonStyle = {
    padding: '10px 20px',
    fontSize: '16px',
    cursor: 'pointer',
    backgroundColor: '#ffd814',
    border: 'none',
    borderRadius: '20px',
    transition: 'background-color 0.3s',
  };

  const addToCartButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#ffa41c',
    color: '#000000',
    fontWeight: 'bold',
    width: '100%',
    marginTop: '20px',
  };

  const inputStyle = {
    width: '50px',
    textAlign: 'center',
    margin: '0 10px',
    padding: '5px',
    border: '1px solid #ddd',
    borderRadius: '4px',
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '20px',
  };

  const thTdStyle = {
    border: '1px solid #ddd',
    padding: '4px',
    textAlign: 'left',
    fontSize: '14px',
  };
  return (
    <Layout>
      <div style={containerStyle}>
        <div style={productDetailStyle}>
          <div style={imageStyle}>
            {product._id ? (
              <img
                src={product.photos}
                alt={product.name}
                style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
              />
            ) : (
              <p>Loading product image...</p>
            )}
          </div>
          <div style={infoStyle}>
            <h1 style={headingStyle}>{product.name}</h1>
            <div style={priceStyle}>
              <span style={strikeThroughStyle}>₹{product.mrp}</span>
              ₹{product.price}
            </div>
            <p>Total Price: ₹{totalPrice.toFixed(2)}</p>
            <p style={descriptionStyle}>{product.description}</p>

            <div style={quantitySelectorStyle}>
              <button onClick={() => handleQuantityChange(false)} style={buttonStyle}>-</button>
              <span>{selectedQuantity}</span>
              <button onClick={() => handleQuantityChange(true)} style={buttonStyle}>+</button>
            </div>
            {auth?.user?.pincode && (
              <p>Your Pincode: {auth.user.pincode}</p>
            )}
            <div>
              <h3 style={{ ...headingStyle, fontSize: '20px', marginTop: '20px' }}>Bulk Pricing</h3>
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
                      const maxQty = bulk.maximum ? bulk.maximum * unitSet : 'No limit';
                      const isSelected = selectedBulk && selectedBulk._id === bulk._id;
                      return (
                        <tr key={index} style={{ backgroundColor: isSelected ? '#e6f7ff' : 'transparent' }}>
                          <td style={thTdStyle}>{minQty}</td>
                          <td style={thTdStyle}>{maxQty}</td>
                          <td style={thTdStyle}>₹{parseFloat(bulk.selling_price_set).toFixed(2)}</td>
                          <td style={thTdStyle}>
                            {isSelected ? `₹${totalPrice.toFixed(2)}` : '-'}
                          </td>
                          <td style={thTdStyle}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              readOnly
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
            </div>
            <button
              onClick={addToCart}
              // disabled={!isPincodeAvailable || !selectedBulk}
              disabled={ !selectedBulk}
              style={{
                ...addToCartButtonStyle,
                // backgroundColor: (isPincodeAvailable && selectedBulk) ? '#ffa41c' : '#ccc',
                // cursor: (isPincodeAvailable && selectedBulk) ? 'pointer' : 'not-allowed',
                backgroundColor: (selectedBulk) ? '#ffa41c' : '#ccc',
                cursor: (  selectedBulk) ? 'pointer' : 'not-allowed',

              }}
            >
              ADD TO CART
            </button>

            <button
              onClick={toggleWishlist}
              style={{
                ...buttonStyle,
                backgroundColor: isInWishlist ? '#e47911' : '#f0c14b',
                color: isInWishlist ? '#ffffff' : '#111111',
                marginTop: '10px',
                width: '100%'
              }}
            >
              {isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
            </button>
          </div>
        </div>


        <div className="container mt-5">
  <h2 className="text-center mb-4">Products For You</h2>
  <div className="row g-3"> {/* Added gutter spacing */}
    {productsForYou
      .slice(0, 6)
      .filter(item => item.productId)
      .map(item => (
        <div 
          key={item.productId?._id} 
          className="col-lg-4 col-md-4 col-sm-6 col-6 mb-3" // Adjusted column sizing
        >
          <div className="card h-100 shadow-sm"> {/* Added card container */}
            <div className="ratio ratio-1x1"> {/* Fixed aspect ratio for images */}
              <img
                src={item.productId.photos[0]}
                className="card-img-top img-fluid p-2 object-fit-cover"
                alt={item.productId.name}
                style={{ maxHeight: '250px' }}
              />
            </div>
            <div className="card-body">
              <h6 className="card-title text-truncate">{item.productId.name}</h6>
              <div className="d-flex justify-content-between align-items-center">
                <div className="text-danger fw-bold">
                  ${item.productId.price.toFixed(2)}
                </div>
                {/* <button className="btn btn-sm btn-outline-primary">
                  <i className="bi bi-cart-plus"></i>
                </button> */}
              </div>
            </div>
          </div>
        </div>
      ))}
  </div>  </div>
</div>
    </Layout>
  );
}

export default ProductDetails;
