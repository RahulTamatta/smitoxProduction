import React from "react";
import { Row, Col, Form } from "react-bootstrap";

export default function OrdersToolbar({
  searchTerm,
  onSearch,
  sortBy,
  sortOrder,
  onSortChange,
  paymentFilter,
  onPaymentFilterChange,
}) {
  return (
    <div className="mb-4">
      <Row>
        <Col md={6}>
          <input
            type="text"
            className="form-control"
            placeholder="Search orders by ID, buyer name..."
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
          />
        </Col>
        <Col md={3}>
          <div className="d-flex align-items-center">
            <span className="me-2">Sort By:</span>
            <Form.Select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
            >
              <option value="createdAt">Date {sortOrder === "desc" ? "(New → Old)" : "(Old → New)"}</option>
              <option value="total">Total Amount {sortOrder === "desc" ? "(High → Low)" : "(Low → High)"}</option>
              <option value="orderId">Order Id</option>
            </Form.Select>
          </div>
        </Col>
        <Col md={3}>
          <div className="d-flex align-items-center">
            <span className="me-2">Payment:</span>
            <Form.Select
              value={paymentFilter}
              onChange={(e) => onPaymentFilterChange(e.target.value)}
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
}
