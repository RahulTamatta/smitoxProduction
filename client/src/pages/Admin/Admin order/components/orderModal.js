import React from "react";
import { Modal, Button, Table, Form } from "react-bootstrap";
import moment from "moment";

const OrderModal = ({
  show,
  handleClose,
  selectedOrder,
  status,
  handleInputChange,
  handleProductChange,
  calculateTotals,
  handleDeleteProduct,
  handleAddClick,
  handleDownloadPDF,
  handleStatusChange,
  handleUpdateOrder,
  handleDelivered,
  handleReturned,
}) => {
  const orderId = selectedOrder?._id;
  const products = selectedOrder?.products || [];

 // Update the getProductPhotoUrl function in OrderModal.js:

const getProductPhotoUrl = (product) => {
  if (!product) return null;
  
  // If the product is populated and has images
  if (product.product && product.product.images && product.product.images.length > 0) {
    return product.product.images[0].thumbnailLink;
  }
  
  // If we have direct access to images (from search results)
  if (product.images && product.images.length > 0) {
    return product.images[0].thumbnailLink;
  }
  
  // If product has an ID and photo buffer
  if (product.product && product.product._id) {
    return `/api/v1/product/product-photo/${product.product._id}`;
  }
  
  // If we have direct product ID
  if (product._id) {
    return `/api/v1/product/product-photo/${product._id}`;
  }
  
  return null;
};

// Update the getProductName function in OrderModal.js:

const getProductName = (product) => {
  if (!product) return "Unknown Product";
  
  // First, check populated product name
  if (product.product && product.product.name) {
    return product.product.name;
  }
  
  // Fallback to direct name 
  if (product.name) {
    return product.name;
  }
  
  // If no name, use SKU
  if (product.product && product.product.sku) {
    return `Product (${product.product.sku})`;
  }
  
  if (product.sku) {
    return `Product (${product.sku})`;
  }
  
  return "Unknown Product";
};


  
  return (
      <Modal show={show} onHide={handleClose} size="lg">
          <Modal.Header closeButton>
              <Modal.Title>Edit Order</Modal.Title>
          </Modal.Header>
          <Modal.Body>
              {selectedOrder ? (
                  <div>
                      <h2>Order ID: {orderId}</h2>
                      <p>Buyer: {selectedOrder.buyer?.name}</p>
                      <p>Email: {selectedOrder.buyer?.email}</p>
                      <p>Created At: {moment(selectedOrder.createdAt).format("LLLL")}</p>

                      <h3>Order Details:</h3>
                      <Table responsive striped bordered hover>
                          <thead>
                              <tr>
                                  <th>Product Photo</th>
                                  <th>Product</th>
                                  <th>Quantity</th>
                                  <th>Unit Price</th>
                                  <th>Net Amount</th>
                                  <th>Tax Amount</th>
                                  <th>Total</th>
                                  <th>Delete</th>
                              </tr>
                          </thead>
                          <tbody>
                              {products.length > 0 ? (
                                  products.map((product, index) => (
                                      <tr key={product._id || index}>
                                          <td>
                                              {getProductPhotoUrl(product) ? (
                                                  <img
                                                      src={getProductPhotoUrl(product)}
                                                      alt={getProductName(product)}
                                                      width="50"
                                                      className="img-fluid"
                                                  />
                                              ) : (
                                                  <div className="text-center">No Image</div>
                                              )}
                                          </td>
                                          <td>{getProductName(product)}</td>
                                          <td>
                                              <Form.Control
                                                  type="number"
                                                  value={product.quantity}
                                                  onChange={(e) => handleProductChange(index, "quantity", e.target.value)}
                                              />
                                          </td>
                                     
                                            <td>
                                                <Form.Control
                                                    type="number"
                                                    value={product.price}
                                                    onChange={(e) => handleProductChange(index, "price", e.target.value)}
                                                />
                                            </td>
                                            <td>₹{(Number(product.price) * Number(product.quantity)).toFixed(2)}</td>
                                            <td>₹{((Number(product.price) * Number(product.quantity)) *product.product.gst).toFixed(2)}</td>
                                            <td>₹{((Number(product.price) * Number(product.quantity)) + ((Number(product.price) * Number(product.quantity)) * product.product.gst)).toFixed(2)}</td>
                                            <td>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={() => handleDeleteProduct(index)}
                                                >
                                                    Delete
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8">No products in this order</td>
                                    </tr>
                                )}
                                <tr>
                                    <td colSpan="7">
                                        <Button onClick={handleAddClick}>Add Product</Button>
                                    </td>
                                </tr>
                                <tr>
                                    <td colSpan="4"></td>
                                    <td>Subtotal:</td>
                                    <td>₹{calculateTotals().subtotal.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td colSpan="4"></td>
                                    <td>GST:</td>
                                    <td>₹{calculateTotals().gst.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td colSpan="4"></td>
                                    <td>Delivery Charges:</td>
                                    <td>
                                        <Form.Control
                                            type="number"
                                            value={selectedOrder.deliveryCharges || 0}
                                            onChange={(e) => handleInputChange("deliveryCharges", e.target.value)}
                                        />
                                    </td>
                                    <td>₹{Number(selectedOrder.deliveryCharges || 0).toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td colSpan="4"></td>
                                    <td>COD Charges:</td>
                                    <td>
                                        <Form.Control
                                            type="number"
                                            value={selectedOrder.codCharges || 0}
                                            onChange={(e) => handleInputChange("codCharges", e.target.value)}
                                        />
                                    </td>
                                    <td>₹{Number(selectedOrder.codCharges || 0).toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td colSpan="4"></td>
                                    <td>Discount:</td>
                                    <td>
                                        <Form.Control
                                            type="number"
                                            value={selectedOrder.discount || 0}
                                            onChange={(e) => handleInputChange("discount", e.target.value)}
                                        />
                                    </td>
                                    <td>₹{Number(selectedOrder.discount || 0).toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td colSpan="4"></td>
                                    <td><strong>Total:</strong></td>
                                    <td><strong>₹{calculateTotals().total.toFixed(2)}</strong></td>
                                </tr>
                                <tr>
                                    <td colSpan="4"></td>
                                    <td>Amount Paid:</td>
                                    <td>
                                        <Form.Control
                                            type="number"
                                            value={selectedOrder.amount || 0}
                                            onChange={(e) => handleInputChange("amount", e.target.value)}
                                        />
                                    </td>
                                    <td>₹{Number(selectedOrder.amount || 0).toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td colSpan="4"></td>
                                    <td>Amount Pending:</td>
                                    <td>₹{(calculateTotals().total - Number(selectedOrder.amount || 0)).toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </Table>
                        <div className="d-flex justify-content-end mt-3">
                <Button variant="primary" onClick={handleDownloadPDF}>
                  Download Invoice
                </Button>
              </div>
                    </div>
                ) : (
                    <p>No order selected</p>
                )}
            </Modal.Body>
            <Modal.Footer>
          <div>
            {selectedOrder && selectedOrder.status === "Pending" && (
              <div>
                <Button
                  variant="success"
                  onClick={() => handleStatusChange(selectedOrder._id, "Confirmed")}
                >
                  Confirm
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleStatusChange(selectedOrder._id, "Cancelled")}
                >
                  Cancel
                </Button>
                <Button
                  variant="warning"
                  onClick={() => handleStatusChange(selectedOrder._id, "Rejected")}
                >
                  Reject
                </Button>
              </div>
            )}
            
            {selectedOrder && selectedOrder.status === "Confirmed" && (
              <div>
                <Button
                  variant="success"
                  onClick={() => handleStatusChange(selectedOrder._id, "Accepted")}
                >
                  Accept
                </Button>
              </div>
            )}
            
            {selectedOrder && selectedOrder.status === "Dispatched" && (
              <div>
                <Button
                  variant="success"
                  onClick={() => handleStatusChange(selectedOrder._id, "Delivered")}
                >
                  Delivered
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleStatusChange(selectedOrder._id, "Returned")}
                >
                  RTO
                </Button>
              </div>
            )}
            
            {selectedOrder && (selectedOrder.status === "Cancelled" || selectedOrder.status === "Rejected") && (
              <div>
                <Button
                  variant="primary"
                  onClick={() => handleStatusChange(selectedOrder._id, "Pending")}
                >
                  Set to Pending
                </Button>
              </div>
            )}
            
            {selectedOrder && selectedOrder.status === "Accepted" && (
              <div>
                <Button
                  variant="primary"
                  onClick={() => handleStatusChange(selectedOrder._id, "Dispatched")}
                >
                  Dispatched
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleStatusChange(selectedOrder._id, "Rejected")}
                >
                  Reject
                </Button>
              </div>
            )}
            
            {selectedOrder && selectedOrder.status === "Delivered" && (
              <div>
                <Button variant="success" onClick={handleDelivered}>
                  Delivered
                </Button>
                <Button variant="danger" onClick={handleReturned}>
                  Returned
                </Button>
              </div>
            )}
          </div>

          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>

          <Button variant="primary" onClick={handleUpdateOrder}>
            Update Order
          </Button>
        </Modal.Footer>
        </Modal>
    );
};

export default OrderModal;

