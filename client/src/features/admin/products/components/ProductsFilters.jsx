import React from 'react';
import { Row, Col, Form, InputGroup } from 'react-bootstrap';

const ProductsFilters = ({
  searchTerm,
  categoryFilter,
  statusFilter,
  categories,
  onSearchChange,
  onCategoryFilterChange,
  onStatusFilterChange
}) => {
  return (
    <div className="mb-4">
      <Row>
        <Col md={4}>
          <InputGroup>
            <InputGroup.Text>
              <i className="fas fa-search"></i>
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search products by name, SKU..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </InputGroup>
        </Col>
        <Col md={3}>
          <div className="d-flex align-items-center">
            <span className="me-2">Category:</span>
            <Form.Select
              value={categoryFilter}
              onChange={(e) => onCategoryFilterChange(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </Form.Select>
          </div>
        </Col>
        <Col md={3}>
          <div className="d-flex align-items-center">
            <span className="me-2">Status:</span>
            <Form.Select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="outOfStock">Out of Stock</option>
              <option value="lowStock">Low Stock</option>
            </Form.Select>
          </div>
        </Col>
        <Col md={2}>
          <div className="d-flex align-items-center">
            <span className="me-2 text-muted" style={{ fontSize: '0.8rem' }}>
              Click column headers to sort
            </span>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default ProductsFilters;
