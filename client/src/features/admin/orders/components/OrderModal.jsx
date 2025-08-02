import React from "react";
import { Modal, Button, Table, Form } from "react-bootstrap";

const OrderModal = ({
  show,
  handleClose,
  selectedOrder,
  onOrderUpdate,
  calculateTotals,
  handleAddToOrder,
  handleInputChange,
}) =e {
  const orderId = selectedOrder?._id;
  const products = selectedOrder?.products || [];

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Edit Order</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {selectedOrder ? (
          <div>
            <h2>Order ID: {orderId}</h2>
            <p>Name: {selectedOrder.buyer?.user_fullname}</p>
            <p>Mobile No: {selectedOrder.buyer?.mobile_no}</p>
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
                </tr>
              </thead>
              <tbody>
                {products.length > 0 ? (
                  products.map((product, index) => {
                    const productData =
                      typeof product.product === 'object' ? product.product : {};
                    const quantity = product.quantity || 0;
                    const price = product.price || 0;

                    return (
                      <tr key={product._id || index}>
                        <td><img src={productData.photos || product.photos} alt={productData.name || "Product image"} width="50" className="img-fluid"/></td>
                        <td>{productData.name || "Unnamed Product"}</td>
                        <td>{quantity}</td>
                        <td>{price}</td>
                        <td>₹{(price * quantity).toFixed(2)}</td>
                        <td>₹{((price * quantity) * (productData.gst || 0) / 100).toFixed(2)}</td>
                        <td>₹{(price * quantity * (1 + (productData.gst || 0) / 100)).toFixed(2)}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7">No products in this order</td>
                  </tr>
                )}
              </tbody>
            </Table>
            <Button onClick={handleAddToOrder}>Add Product</Button>
          </div>
        ) : (
          <p>No order selected</p>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
        <Button variant="primary" onClick={onOrderUpdate}>
          Update Order
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default OrderModal;

