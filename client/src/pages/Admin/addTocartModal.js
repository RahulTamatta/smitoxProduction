
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
    useEffect(() => {
        if (userId) {
          // Fetch cart data for the selected user
          const fetchCartData = async () => {
            try {
              const response = await axios.get(`/api/v1/carts/users/${userId}/cart`);
              // Handle response logic here
              console.log('Cart data:', response.data);
            } catch (error) {
              console.error('Error fetching cart data:', error);
            }
          };
    
          fetchCartData();
        }
      }, [userId]);
      
  // Calculate price based on quantity and bulk rules
  const getPriceDisplay = (product) => {
    if (product.bulkProducts?.length > 0) {
      const sortedBulkProducts = [...product.bulkProducts]
        .filter(bp => bp && bp.minimum)
        .sort((a, b) => a.minimum - b.minimum);

      if (sortedBulkProducts.length > 0) {
        const lowestBulk = sortedBulkProducts[0];
        const highestBulk = sortedBulkProducts[sortedBulkProducts.length - 1];
        return `₹${lowestBulk.selling_price_set.toFixed(2)} - ₹${highestBulk.selling_price_set.toFixed(2)}`;
      }
    }
    return `₹${(product.perPiecePrice || product.price).toFixed(2)}`;
  };

  // Get applicable bulk price based on quantity
  const getApplicableBulkProduct = (product, quantity) => {
    if (product.bulkProducts?.length > 0) {
      const sortedBulkProducts = [...product.bulkProducts]
        .filter(bp => bp && bp.minimum)
        .sort((a, b) => b.minimum - a.minimum);

      return sortedBulkProducts.find(
        (bp) => quantity >= bp.minimum && (!bp.maximum || quantity <= bp.maximum)
      );
    }
    return null;
  };

  // Handle quantity changes
  const handleQuantityChange = async (product, increment) => {
    const unitSet = product.unitSet || 1;
    const currentQuantity = loading[product._id]?.quantity || 0;
    const newQuantity = currentQuantity + (increment ? 1 : -1) * unitSet;
    const updatedQuantity = Math.max(0, newQuantity);
  
    // Update loading state
    setLoading((prev) => ({
      ...prev,
      [product._id]: { ...prev[product._id], quantity: updatedQuantity },
    }));
  
    if (updatedQuantity === 0) {
      try {
        await axios.delete(`/api/v1/carts/users/${auth.user._id}/cart/${product._id}`);
        toast.success('Product removed from cart');
        setLoading((prev) => ({ ...prev, [product._id]: null }));
      } catch (error) {
        console.error('Error removing product:', error);
        toast.error('Failed to remove product');
      }
      return;
    }
  
    try {
      const bulkProduct = getApplicableBulkProduct(product, updatedQuantity);
      const payload = {
        productId: product._id,
        quantity: updatedQuantity,
        bulkProductDetails: bulkProduct
          ? {
              price: bulkProduct.selling_price_set,
              minimum: bulkProduct.minimum,
              maximum: bulkProduct.maximum,
            }
          : null,
      };
  
      // Call the updateQuantity function
      await updateQuantity(product, updatedQuantity);
  
      await axios.post(`/api/v1/carts/users/${userId}/cartq/${product._id}`, payload);
      toast.success('Cart updated successfully');
    } catch (error) {
      console.error('Error updating cart:', error);
      toast.error('Failed to update cart');
      // Revert loading state on error
      setLoading((prev) => ({
        ...prev,
        [product._id]: { ...prev[product._id], quantity: currentQuantity },
      }));
    }
  };
  
  const updateQuantity = async (product, quantity) => {
    if (!auth?.user?._id) {
      toast.error("Please log in to update quantity");
      return;
    }
  
    try {
      const response = await axios.post(
        `/api/v1/carts/users/${userId}/cartq/${product._id}`,
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
  

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.get(`/api/v1/product/search/${searchKeyword}`);
      setSearchResults(data);
      
      // Initialize loading state for new search results
      const initialLoadingState = {};
      for (const product of data) {
        const cartResponse = await axios.get(`/api/v1/carts/users/${auth.user._id}/cart`);
        const cartItem = cartResponse.data.cart?.products.find(
          item => item.product._id === product._id
        );
        initialLoadingState[product._id] = {
          quantity: cartItem?.quantity || 0
        };
      }
      setLoading(initialLoadingState);
    } catch (error) {
      console.error(error);
      toast.error('Error searching products');
    }
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
                <div className="text-muted">Price: {getPriceDisplay(product)}</div>
                {product.bulkProducts?.length > 0 && (
                  <small className="text-info">Bulk pricing available</small>
                )}
              </div>
              <div className="d-flex align-items-center">
                {loading[product._id]?.quantity > 0 ? (
                  <div className="d-flex align-items-center">
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      onClick={() => handleQuantityChange(product, false)}
                    >
                      -
                    </Button>
                    <span className="mx-2">{loading[product._id]?.quantity}</span>
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      onClick={() => handleQuantityChange(product, true)}
                    >
                      +
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="success" 
                    size="sm"
                    onClick={() => handleQuantityChange(product, true)}
                  >
                    Add to Cart
                  </Button>
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