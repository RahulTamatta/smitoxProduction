import React, { useState } from 'react';
import { Modal, Button, Form, InputGroup, ListGroup } from 'react-bootstrap';
import { message } from 'antd';
import axios from 'axios';

const SearchModal = ({ show, handleClose, handleAddToOrder }) => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Function to get price display - enhanced for unit-based pricing
  const getPriceDisplay = (product) => {
    const unitSet = product.unitSet || 1;
    const initialQuantity = unitSet * 1; // 1 set
    
    if (product.bulkProducts && product.bulkProducts.length > 0) {
      const sortedBulkProducts = [...product.bulkProducts]
        .filter(bp => bp && bp.minimum)
        .sort((a, b) => a.minimum - b.minimum);

      // Check if initial quantity qualifies for bulk pricing
      const applicableBulk = sortedBulkProducts.find(bulk => {
        return initialQuantity >= bulk.minimum * unitSet &&
               (!bulk.maximum || initialQuantity <= bulk.maximum * unitSet);
      });

      if (applicableBulk) {
        const unitPrice = parseFloat(applicableBulk.selling_price_set) / unitSet;
        return `₹${unitPrice.toFixed(2)} per unit (Bulk Applied)`;
      }
      
      // Show bulk pricing range if available but not applicable to initial quantity
      if (sortedBulkProducts.length > 0) {
        const lowestBulk = sortedBulkProducts[0];
        const highestBulk = sortedBulkProducts[sortedBulkProducts.length - 1];
        const lowestUnitPrice = parseFloat(lowestBulk.selling_price_set) / unitSet;
        const highestUnitPrice = parseFloat(highestBulk.selling_price_set) / unitSet;
        const regularUnitPrice = parseFloat(product.price || (product.perPiecePrice * unitSet) || 0) / unitSet;
        return `₹${regularUnitPrice.toFixed(2)} per unit (Bulk: ₹${lowestUnitPrice.toFixed(2)} - ₹${highestUnitPrice.toFixed(2)})`;
      }
    }
    
    // Fallback to unit price calculation
    const perPiecePrice = parseFloat(product.perPiecePrice || 0);
    const setPrice = parseFloat(product.price || (perPiecePrice * unitSet) || 0);
    const unitPrice = setPrice / unitSet;
    return `₹${unitPrice.toFixed(2)} per unit`;
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
                src={product.photos || `/api/v1/product/product-photo/${product._id}`}
                alt={product.name}
                width="50"
                className="me-2"
                onError={(e) => {
                  if (e.target.src !== "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNSAzNUM5MS4xIDI1IDI1IDkuMSAyNSAyNVMzOS4xIDI1IDI1IDI1WiIgZmlsbD0iI0NCQ0JDQiIvPgo8L3N2Zz4K") {
                    e.target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNSAzNUM5MS4xIDI1IDI1IDkuMSAyNSAyNVMzOS4xIDI1IDI1IDI1WiIgZmlsbD0iI0NCQ0JDQiIvPgo8L3N2Zz4K";
                  }
                }}
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