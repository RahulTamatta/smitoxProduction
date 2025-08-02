import React from 'react';
import { Row, Col, Form, Button, ButtonGroup } from 'react-bootstrap';

const OrdersFilters = ({
  searchTerm,
  sortBy,
  sortOrder,
  paymentFilter,
  onSearchChange,
  onSortChange,
  onPaymentFilterChange
}) => {
  const handleSortClick = (field) => {
    onSortChange(field);
  };

  return (
    <div className="mb-4">
      <Row>
        <Col md={4}>
          <Form.Control
            type="text"
            className="form-control"
            placeholder="Search orders by ID, buyer name..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </Col>
        <Col md={4}>
          <div className="d-flex align-items-center gap-2">
            <span className="me-2" style={{ minWidth: '60px' }}>Sort By:</span>
            <ButtonGroup>
              <Button
                variant={sortBy === 'createdAt' ? 'primary' : 'outline-primary'}
                size="sm"
                onClick={() => handleSortClick('createdAt')}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px',
                  fontSize: '0.8rem',
                  padding: '4px 8px'
                }}
              >
                Date
                <span style={{ fontSize: '0.7rem' }}>
                  {sortBy === 'createdAt' ? (
                    sortOrder === 'asc' ? '↑' : '↓'
                  ) : (
                    '↕'
                  )}
                </span>
              </Button>
              <Button
                variant={sortBy === 'total' ? 'primary' : 'outline-primary'}
                size="sm"
                onClick={() => handleSortClick('total')}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px',
                  fontSize: '0.8rem',
                  padding: '4px 8px'
                }}
              >
                Amount
                <span style={{ fontSize: '0.7rem' }}>
                  {sortBy === 'total' ? (
                    sortOrder === 'asc' ? '↑' : '↓'
                  ) : (
                    '↕'
                  )}
                </span>
              </Button>
            </ButtonGroup>
          </div>
        </Col>
        <Col md={4}>
          <div className="d-flex align-items-center">
            <span className="me-2">Payment:</span>
            <Form.Select
              value={paymentFilter}
              onChange={(e) => onPaymentFilterChange(e.target.value)}
              size="sm"
            >
              <option value="all">All Payment Types</option>
              <option value="cod">Cash on Delivery</option>
              <option value="razorpay">Razorpay</option>
            </Form.Select>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default OrdersFilters;
