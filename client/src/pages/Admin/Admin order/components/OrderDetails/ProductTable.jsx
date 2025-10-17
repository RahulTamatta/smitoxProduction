import React from "react";
import { Table, Button, Form } from "react-bootstrap";

const ProductTable = ({
  products,
  handleProductChange,
  handleQuantityChangeWithUnitSet,
  handleDeleteProduct,
  handleAddClick,
  calculateTotals,
  selectedOrder,
  handleInputChange,
}) => {
  // Get unit price from snapshot data (no bulk pricing calculation)
  const getUnitPrice = (product) => {
    // Use snapshot unitPrice if available, otherwise fall back to price
    return parseFloat(product.unitPrice || product.price || 0);
  };

  return (
    <div>
      <Table responsive striped bordered hover>
        <thead>
          <tr>
            <th>Images</th>
            <th>Product </th>
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
          products.map((product, index) => {
            const productData = product.product || {};
            const quantity = product.quantity || 0;
            
            // Use snapshot data if available, otherwise calculate
            const unitPrice = getUnitPrice(product);
            const gst = product.gst || parseFloat(productData.gst) || 0;
            
            // Use snapshot values if available, otherwise calculate
            const netAmount = product.netAmount 
              ? product.netAmount.toFixed(2) 
              : (unitPrice * quantity).toFixed(2);
            
            const taxAmount = product.taxAmount 
              ? product.taxAmount.toFixed(2) 
              : ((unitPrice * quantity) * (gst / 100)).toFixed(2);
            
            const total = product.totalAmount 
              ? product.totalAmount.toFixed(2) 
              : (gst !== 0
                  ? ((unitPrice * quantity) * (1 + gst / 100)).toFixed(2)
                  : (unitPrice * quantity).toFixed(2));

            return (
              <tr key={product._id || index}>
                <td>
                  <img
                    src={product.productImage || productData.photos || "https://via.placeholder.com/50"}
                    alt={product.productName || productData.name || "Product image"}
                    width="50"
                    className="img-fluid"
                  />
                </td>
                <td>
                  <div>
                    <strong>{product.productName || productData.name || "Unnamed Product"}</strong>
                  </div>
                </td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuantityChangeWithUnitSet(index, false);
                      }}
                      disabled={quantity <= 0}
                      title="Decrease quantity"
                    >
                      -
                    </Button>
                    <Form.Control
                      type="number"
                      value={quantity}
                      onChange={(e) => {
                        const newQuantity = parseInt(e.target.value) || 0;
                        if (newQuantity >= 0) {
                          handleQuantityChangeWithUnitSet(index, null, newQuantity);
                        }
                      }}
                      onWheel={(e) => e.target.blur()}
                      onKeyDown={(e) => {
                        // Allow: backspace, delete, tab, escape, enter, home, end, left, right, down, up
                        if ([46, 8, 9, 27, 13, 110, 190].indexOf(e.keyCode) !== -1 ||
                            // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z
                            (e.keyCode === 65 && e.ctrlKey === true) ||
                            (e.keyCode === 67 && e.ctrlKey === true) ||
                            (e.keyCode === 86 && e.ctrlKey === true) ||
                            (e.keyCode === 88 && e.ctrlKey === true) ||
                            (e.keyCode === 90 && e.ctrlKey === true) ||
                            // Allow: home, end, left, right, down, up
                            (e.keyCode >= 35 && e.keyCode <= 40)) {
                          return;
                        }
                        // Ensure that it is a number and stop the keypress
                        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                          e.preventDefault();
                        }
                      }}
                      min="0"
                      style={{ width: "70px", textAlign: "center" }}
                      title="Enter quantity"
                    />
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuantityChangeWithUnitSet(index, true);
                      }}
                    >
                      +
                    </Button>
                    <small className="text-muted">
                      (Unit: {product.unitSet || productData.unitSet || 1})
                    </small>
                  </div>
                </td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <span style={{ fontSize: "14px", fontWeight: "bold" }}>₹</span>
                    <Form.Control
                      type="number"
                      value={unitPrice.toFixed(2)}
                      onChange={(e) => {
                        const newPrice = parseFloat(e.target.value) || 0;
                        if (newPrice >= 0) {
                          handleProductChange(index, 'price', newPrice);
                        }
                      }}
                      onWheel={(e) => e.target.blur()}
                      onKeyDown={(e) => {
                        // Allow: backspace, delete, tab, escape, enter, home, end, left, right, down, up, decimal point
                        if ([46, 8, 9, 27, 13, 110, 190].indexOf(e.keyCode) !== -1 ||
                            // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z
                            (e.keyCode === 65 && e.ctrlKey === true) ||
                            (e.keyCode === 67 && e.ctrlKey === true) ||
                            (e.keyCode === 86 && e.ctrlKey === true) ||
                            (e.keyCode === 88 && e.ctrlKey === true) ||
                            (e.keyCode === 90 && e.ctrlKey === true) ||
                            // Allow: home, end, left, right, down, up
                            (e.keyCode >= 35 && e.keyCode <= 40) ||
                            // Allow: decimal point
                            e.keyCode === 190 || e.keyCode === 110) {
                          return;
                        }
                        // Ensure that it is a number and stop the keypress
                        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                          e.preventDefault();
                        }
                      }}
                      min="0"
                      step="0.01"
                      style={{ width: "80px", textAlign: "center", fontSize: "14px" }}
                      title="Unit price - editable"
                    />
                  </div>
                </td>
                <td>₹{netAmount}</td>
                <td>₹{taxAmount}</td>
                <td>₹{total}</td>
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
            );
          })
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
              onWheel={(e) => e.target.blur()}
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
              onWheel={(e) => e.target.blur()}
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
              onWheel={(e) => e.target.blur()}
            />
          </td>
          <td>₹{Number(selectedOrder.discount || 0).toFixed(2)}</td>
        </tr>
        <tr>
          <td colSpan="4"></td>
          <td>
            <strong>Total:</strong>
          </td>
          <td>
            <strong>₹{calculateTotals().total.toFixed(2)}</strong>
          </td>
        </tr>
        <tr>
          <td colSpan="4"></td>
          <td>Amount Paid:</td>
          <td>
            <Form.Control
              type="number"
              value={selectedOrder.amount || 0}
              onChange={(e) => handleInputChange("amount", e.target.value)}
              onWheel={(e) => e.target.blur()}
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
    </div>
  );
};

export default ProductTable;
