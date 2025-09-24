import React from "react";
import { Table, Button, Form } from "react-bootstrap";

const ProductTable = ({
  products,
  handleProductChange,
  handleQuantityChangeWithUnitSet,
  getApplicableBulkProduct,
  handleDeleteProduct,
  handleAddClick,
  calculateTotals,
  selectedOrder,
  handleInputChange,
}) => {
  // Get price for product based on quantity (same logic as CartPage)
  const getPriceForProduct = (product, quantity) => {
    const productData = product.product || {};
    if (!productData) return 0;
    
    // If custom price is set, use it instead of bulk pricing
    if (product.customPrice && product.price !== undefined) {
      return parseFloat(product.price);
    }
    
    const unitSet = productData.unitSet || 1;
  
    if (productData.bulkProducts && productData.bulkProducts.length > 0) {
      // Sort bulk products based on minimum quantity in descending order
      const sortedBulkProducts = [...productData.bulkProducts]
        .filter(bp => bp && bp.minimum)
        .sort((a, b) => b.minimum - a.minimum);
  
      // If quantity is greater than the maximum quantity of the first bulk price
      // (which is the highest one due to descending sort), use that price
      if (
        sortedBulkProducts.length > 0 && 
        quantity >= (sortedBulkProducts[0].minimum * unitSet)
      ) {
        return parseFloat(sortedBulkProducts[0].selling_price_set);
      }
  
      // Find the bulk price that applies to the current quantity
      const applicableBulk = sortedBulkProducts.find(
        (bp) =>
          quantity >= (bp.minimum * unitSet) && 
          (!bp.maximum || quantity <= (bp.maximum * unitSet))
      );
  
      // Return the selling price from the applicable bulk price
      if (applicableBulk) {
        return parseFloat(applicableBulk.selling_price_set);
      }
    }
  
    // Fallback: return the regular price
    return parseFloat(productData.perPiecePrice || productData.price || 0);
  };

  // Render bulk pricing info for a product
  const renderBulkPricingInfo = (product) => {
    const productData = product.product || {};
    const unitSet = productData.unitSet || 1;
    
    if (!productData.bulkProducts || productData.bulkProducts.length === 0) {
      return <small className="text-muted">No bulk pricing available</small>;
    }

    return (
      <div style={{ fontSize: "11px", marginTop: "5px" }}>
        <strong>Bulk Pricing:</strong>
        {productData.bulkProducts.map((bulk, idx) => (
          <div key={idx} style={{ color: "#666" }}>
            {bulk.minimum * unitSet}+ units: ₹{bulk.selling_price_set}/unit
          </div>
        ))}
      </div>
    );
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
            const unitPrice = getPriceForProduct(product, quantity); // Use calculated price
            const gst = productData.gst || 0;

            const netAmount = (unitPrice * quantity).toFixed(2);
            const taxAmount = ((unitPrice * quantity) * (gst / 100)).toFixed(2);
            const total =
              gst !== 0
                ? ((unitPrice * quantity) * (1 + gst / 100)).toFixed(2)
                : (unitPrice * quantity).toFixed(2);

            return (
              <tr key={product._id || index}>
                <td>
                  <img
                    src={productData.photos || "https://via.placeholder.com/50"}
                    alt={productData.name || "Product image"}
                    width="50"
                    className="img-fluid"
                  />
                </td>
                <td>
                  <div>
                    <strong>{productData.name || "Unnamed Product"}</strong>
                    {renderBulkPricingInfo(product)}
                  </div>
                </td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log(`Minus clicked: index=${index}, current quantity=${quantity}, unitSet=${productData.unitSet || 1}`);
                        handleQuantityChangeWithUnitSet(index, false);
                      }}
                      disabled={quantity <= 0}
                      title={quantity <= (productData.unitSet || 1) ? "This will remove the product from order" : "Decrease quantity"}
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
                      title="Enter custom quantity or use +/- buttons"
                    />
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log(`Plus clicked: index=${index}, current quantity=${quantity}, unitSet=${productData.unitSet || 1}`);
                        handleQuantityChangeWithUnitSet(index, true);
                      }}
                    >
                      +
                    </Button>
                    <small className="text-muted">
                      (Unit: {productData.unitSet || 1})
                    </small>
                  </div>
                </td>
                <td>
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      <span style={{ fontSize: "14px", fontWeight: "bold" }}>₹</span>
                      <Form.Control
                        type="number"
                        value={unitPrice.toFixed(2)}
                        onChange={(e) => {
                          const newPrice = parseFloat(e.target.value) || 0;
                          if (newPrice >= 0) {
                            handleProductChange(index, 'customPrice', newPrice);
                          }
                        }}
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
                        title="Enter custom unit price"
                      />
                    </div>
                    {(() => {
                      // Check if bulk pricing is applied
                      const productData = product.product || {};
                      const regularPrice = parseFloat(productData.perPiecePrice || productData.price || 0);
                      const isBulkPrice = unitPrice !== regularPrice;
                      
                      return isBulkPrice ? (
                        <small className="text-success">
                          Bulk Price Applied
                        </small>
                      ) : (
                        <small className="text-muted">
                          Regular Price
                        </small>
                      );
                    })()}
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
