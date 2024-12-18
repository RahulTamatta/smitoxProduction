import React, { useState } from 'react';
import { Modal, Button, Form, InputGroup, ListGroup } from 'react-bootstrap';
import { message } from 'antd';
import axios from 'axios';

const SearchModal = ({ show, handleClose, handleAddToOrder }) => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Function to get price display
  const getPriceDisplay = (product) => {
    if (product.bulkProducts && product.bulkProducts.length > 0) {
      const sortedBulkProducts = [...product.bulkProducts]
        .filter(bp => bp && bp.minimum)
        .sort((a, b) => a.minimum - b.minimum);

      // Show the lowest and highest bulk pricing
      if (sortedBulkProducts.length > 0) {
        const lowestBulk = sortedBulkProducts[0];
        const highestBulk = sortedBulkProducts[sortedBulkProducts.length - 1];
        
        return `₹${lowestBulk.selling_price_set.toFixed(2)} - ₹${highestBulk.selling_price_set.toFixed(2)}`;
      }
    }
    
    // Fallback to per piece or default price
    return `₹${(product.perPiecePrice || product.price).toFixed(2)}`;
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.get(`/api/v1/product/search/${searchKeyword}`);
      setSearchResults(data);
    } catch (error) {
      console.log(error);
      message.error("Error searching products");
    }
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Search Products</Modal.Title>
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
              <div>
                <div>{product.name}</div>
                <div className="text-muted">Price: {getPriceDisplay(product)}</div>
                {product.bulkProducts && product.bulkProducts.length > 0 && (
                  <small className="text-info">
                    Bulk pricing available
                  </small>
                )}
              </div>
              <Button 
                variant="success" 
                size="sm" 
                onClick={() => handleAddToOrder(product)}
              >
                Add to Order
              </Button>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Modal.Body>
    </Modal>
  );
};
export default SearchModal;