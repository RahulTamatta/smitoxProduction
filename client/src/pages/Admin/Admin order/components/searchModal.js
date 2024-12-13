import React, { useState } from 'react';
import { Modal, Button, Form, InputGroup, ListGroup } from 'react-bootstrap';
import { message } from 'antd';
import axios from 'axios';

const SearchModal = ({ show, handleClose, handleAddToOrder }) => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);

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
            <ListGroup.Item key={product._id} className="d-flex justify-content-between align-items-center">
                    <img
                src={`/api/v1/product/product-photo/${product._id}`}
                alt={product.name}
                width="50"
                className="me-2"
              />
              {product.name} - ${product.price}
              <Button variant="success" size="sm" onClick={() => handleAddToOrder(product)}>
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