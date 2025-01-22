
import { Modal, Form, Button, ListGroup, InputGroup } from 'react-bootstrap';
import axios from 'axios';
import { useAuth } from '../../context/auth';
import { toast } from 'react-hot-toast';
import React, { useState, useEffect } from 'react';

const CartSearchModal = ({ show, handleClose, userId }) => {
  const [auth] = useAuth();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState({});
  const [displayQuantities, setDisplayQuantities] = useState({});
  const [selectedBulks, setSelectedBulks] = useState({});
  const [totalPrices, setTotalPrices] = useState({});

  useEffect(() => {
      if (userId) {
        const fetchCartData = async () => {
          try {
            const response = await axios.get(`/api/v1/carts/users/${userId}/cart`);
            console.log('Cart data:', response.data);
          } catch (error) {
            console.error('Error fetching cart data:', error);
          }
        };
  
        fetchCartData();
      }
  }, [userId]);

  const updateQuantity = async (product, quantity) => {
      if (!auth?.user?._id) {
          //toast.error("Please log in to update quantity");
          return;
      }

      try {
          const applicableBulk = getApplicableBulkProduct(product, quantity);
          
          const response = await axios.post(
              `/api/v1/carts/users/${userId}/cartq/${product._id}`,
              {
                  quantity,
                  bulkProductDetails: applicableBulk ? {
                      price: applicableBulk.selling_price_set,
                      minimum: applicableBulk.minimum,
                      maximum: applicableBulk.maximum
                  } : null
              },
              {
                  headers: {
                      Authorization: `Bearer ${auth.user.token}`,
                      "Content-Type": "application/json",
                  },
              }
          );

          if (response.status === 200) {
              toast.success("Quantity updated successfully");
              return response.data;
          }
      } catch (error) {
          console.error("Quantity update error:", error);
          //toast.error("Failed to update quantity");
          throw error;
      }
  };

  const calculateTotalPrice = (product, bulk, quantity) => {
      if (bulk) {
          return quantity * parseFloat(bulk.selling_price_set);
      } else {
          return quantity * parseFloat(product.perPiecePrice || 0);
      }
  };

  const getApplicableBulkProduct = (product, quantity) => {
      if (!product.bulkProducts || product.bulkProducts.length === 0) return null;

      const sortedBulkProducts = [...product.bulkProducts]
          .filter((bulk) => bulk && bulk.minimum)
          .sort((a, b) => b.minimum - a.minimum);

      for (let i = 0; i < sortedBulkProducts.length; i++) {
          const bulk = sortedBulkProducts[i];
          if (quantity >= bulk.minimum * (product.unitSet || 1)) {
              return bulk;
          }
      }

      return null;
  };

  const handleQuantityChange = async (product, increment) => {
      const unitSet = product.unitSet || 1;
      const currentQuantity = displayQuantities[product._id] || 0;
      const newQuantity = currentQuantity + (increment ? 1 : -1) * unitSet;
      const updatedQuantity = Math.max(0, newQuantity);

      if (updatedQuantity === 0) {
          try {
              await axios.delete(`/api/v1/carts/users/${auth.user._id}/cart/${product._id}`);
              
              // Update states
              setDisplayQuantities(prev => {
                  const updated = { ...prev };
                  delete updated[product._id];
                  return updated;
              });
              setSelectedBulks(prev => {
                  const updated = { ...prev };
                  delete updated[product._id];
                  return updated;
              });
              setTotalPrices(prev => {
                  const updated = { ...prev };
                  delete updated[product._id];
                  return updated;
              });
              
              toast.success('Product removed from cart');
          } catch (error) {
              console.error('Error removing product:', error);
              toast.error('Failed to remove product');
          }
          return;
      }

      try {
          const applicableBulk = getApplicableBulkProduct(product, updatedQuantity);
          const newTotalPrice = calculateTotalPrice(product, applicableBulk, updatedQuantity);

          await updateQuantity(product, updatedQuantity);

          // Update states
          setDisplayQuantities(prev => ({
              ...prev,
              [product._id]: updatedQuantity
          }));
          setSelectedBulks(prev => ({
              ...prev,
              [product._id]: applicableBulk
          }));
          setTotalPrices(prev => ({
              ...prev,
              [product._id]: newTotalPrice
          }));

      } catch (error) {
          console.error('Error updating quantity:', error);
          toast.error('Failed to update quantity');
      }
  };

  const addToCart = async (product) => {
      if (!auth.user) {
          //toast.error("Please log in to add items to cart");
          return;
      }

      try {
          const initialQuantity = (product.unitSet || 1) * (product.quantity || 1);
          const applicableBulk = getApplicableBulkProduct(product, initialQuantity);
          const initialTotalPrice = calculateTotalPrice(product, applicableBulk, initialQuantity);

          const response = await axios.post(
              `/api/v1/carts/users/${userId}/cart`,
              {
                  productId: product._id,
                  quantity: initialQuantity,
                  price: applicableBulk
                      ? parseFloat(applicableBulk.selling_price_set)
                      : parseFloat(product.perPiecePrice || product.price),
                  bulkProductDetails: applicableBulk,
              }
          );

          if (response.data.status === "success") {
              setDisplayQuantities(prev => ({
                  ...prev,
                  [product._id]: initialQuantity
              }));
              setSelectedBulks(prev => ({
                  ...prev,
                  [product._id]: applicableBulk
              }));
              setTotalPrices(prev => ({
                  ...prev,
                  [product._id]: initialTotalPrice
              }));
              toast.success("Item added to cart");
          }
      } catch (error) {
          console.error(error);
          //toast.error("Error adding item to cart");
      }
  };

  const handleSearch = async (e) => {
      e.preventDefault();
      try {
          const { data } = await axios.get(`/api/v1/product/search/${searchKeyword}`);
          setSearchResults(data);
          
          // Initialize quantities and prices for new search results
          const cartResponse = await axios.get(`/api/v1/carts/users/${auth.user._id}/cart`);
          const initialQuantities = {};
          const initialBulks = {};
          const initialPrices = {};
          
          data.forEach(product => {
              const cartItem = cartResponse.data.cart?.products.find(
                  item => item.product._id === product._id
              );
              if (cartItem) {
                  initialQuantities[product._id] = cartItem.quantity;
                  const bulk = getApplicableBulkProduct(product, cartItem.quantity);
                  initialBulks[product._id] = bulk;
                  initialPrices[product._id] = calculateTotalPrice(product, bulk, cartItem.quantity);
              }
          });

          setDisplayQuantities(initialQuantities);
          setSelectedBulks(initialBulks);
          setTotalPrices(initialPrices);
          
      } catch (error) {
          console.error(error);
          toast.error('Error searching products');
      }
  };

  const buttonStyle = {
      padding: "8px 16px",
      fontSize: "14px",
      cursor: "pointer",
      backgroundColor: "#ffa41c",
      color: "#000000",
      border: "none",
      borderRadius: "20px",
      transition: "background-color 0.3s",
  };

  const quantitySelectorStyle = {
      display: "flex",
      alignItems: "center",
      gap: "8px",
  };

  const inputStyle = {
      width: "40px",
      textAlign: "center",
      padding: "4px",
      border: "1px solid #ddd",
      borderRadius: "4px",
  };

  return (
      <Modal show={show} onHide={handleClose} size="lg">
          <Modal.Header closeButton>
              <Modal.Title>Add Products to Cart</Modal.Title>
          </Modal.Header>
          <Modal.Body>
              <Form onSubmit={handleSearch}>
                  <InputGroup className="mb-3">
                      <Form.Control
                          type="text"
                          placeholder="Search for products"
                          value={searchKeyword}
                          onChange={(e) => setSearchKeyword(e.target.value)}
                      />
                      <Button variant="outline-secondary" type="submit">
                          Search
                      </Button>
                  </InputGroup>
              </Form>
              <ListGroup>
                  {searchResults.map((product) => (
                      <ListGroup.Item 
                          key={product._id} 
                          className="d-flex justify-content-between align-items-center"
                      >
                          <img
                              src={`/api/v1/product/product-photo/${product._id}`}
                              alt={product.name}
                              width="50"
                              className="me-2"
                          />
                          <div className="flex-grow-1">
                              <div>{product.name}</div>
                              <div>Price: ₹{product.perPiecePrice}</div>
                              {totalPrices[product._id] > 0 && (
                                  <div>Total: ₹{totalPrices[product._id]?.toFixed(2)}</div>
                              )}
                          </div>
                          <div>
                              {displayQuantities[product._id] > 0 ? (
                                  <div style={quantitySelectorStyle}>
                                      <button
                                          onClick={() => handleQuantityChange(product, false)}
                                          style={buttonStyle}
                                      >
                                          -
                                      </button>
                                      <input
                                          type="number"
                                          value={displayQuantities[product._id]}
                                          readOnly
                                          style={inputStyle}
                                      />
                                      <button
                                          onClick={() => handleQuantityChange(product, true)}
                                          style={buttonStyle}
                                      >
                                          +
                                      </button>
                                  </div>
                              ) : (
                                  <button
                                      onClick={() => addToCart(product)}
                                      style={{
                                          ...buttonStyle,
                                          width: "120px",
                                      }}
                                  >
                                      Add to Cart
                                  </button>
                              )}
                          </div>
                      </ListGroup.Item>
                  ))}
              </ListGroup>
          </Modal.Body>
      </Modal>
  );
};

export default CartSearchModal;