import { Button, Form, Table } from "react-bootstrap";

// Get the API base URL from environment or use relative path
const API_BASE_URL = process.env.REACT_APP_API_URL || "";

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
  // Helper function to get proper image URL
  const getImageUrl = (product) => {
    // Try multiple sources for the image
    const imagePath =
      product.productImage ||
      product.product?.photos ||
      product.photos ||
      (product.product && typeof product.product === 'object' ? product.product.photos : null);

    if (!imagePath) {
      return "https://via.placeholder.com/50?text=No+Image";
    }

    // If it's already an absolute URL (http/https), use it directly
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    // If it's a relative path (like "uploads/products/..."), prepend the API base URL
    // Remove leading slash if present to avoid double slashes
    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${API_BASE_URL}${cleanPath}`;
  };

  // Get unit price from snapshot data (no bulk pricing calculation)
  const getUnitPrice = (product) => {
    // Use snapshot unitPrice if available, otherwise fall back to price
    return parseFloat(product.unitPrice || product.price || 0);
  };

  // Format price - remove .00 if whole number
  const formatPrice = (price) => {
    const num = parseFloat(price);
    return num % 1 === 0 ? num.toFixed(0) : num.toFixed(2);
  };

  return (
    <div>
      <Table responsive striped bordered hover>
        <thead>
          <tr>
            <th style={{ width: "50px" }}>SR</th>
            <th>Images</th>
            <th style={{ minWidth: "260px", width: "40%" }}>Product</th>
            <th>Unit Price</th>
            <th>Net & Tax</th>
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
                  <td style={{ textAlign: "center", fontWeight: "bold" }}>
                    {index + 1}
                  </td>
                  <td>
                    <img
                      src={getImageUrl(product)}
                      alt={product.productName || product.product?.name || product.name || productData.name || "Product image"}
                      width="50"
                      className="img-fluid"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/50?text=No+Image";
                      }}
                    />
                  </td>
                  <td style={{ minWidth: "260px", maxWidth: "480px" }}>
                    <div>
                      <div className="product-name">
                        <strong>{product.productName || product.product?.name || product.name || productData.name || "Unnamed Product"}</strong>
                      </div>
                      <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          style={{ minWidth: 28, height: 28, lineHeight: "26px", padding: 0 }}
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
                          value={quantity.toString()}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '') {
                              // Handle empty input if desired, or set to 0
                              return;
                            }
                            const newQuantity = parseInt(val);
                            if (!isNaN(newQuantity) && newQuantity >= 0) {
                              handleQuantityChangeWithUnitSet(index, null, newQuantity);
                            }
                          }}
                          onWheel={(e) => e.target.blur()}
                          style={{ width: 90, textAlign: "center", fontSize: 13, height: 28, padding: "2px 6px" }}
                          title="Enter quantity. Use Delete button to remove item."
                        />
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          style={{ minWidth: 28, height: 28, lineHeight: "26px", padding: 0 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuantityChangeWithUnitSet(index, true);
                          }}
                        >
                          +
                        </Button>
                        <small className="text-muted">(Unit: {product.unitSet || productData.unitSet || 1})</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      <span style={{ fontSize: "14px", fontWeight: "bold" }}>₹</span>
                      <Form.Control
                        type="number"
                        step="0.01"
                        min="0"
                        value={unitPrice.toString()}
                        onChange={(e) => {
                          const val = e.target.value;
                          const newPrice = parseFloat(val);
                          if (!isNaN(newPrice) && newPrice >= 0) {
                            handleProductChange(index, 'price', newPrice);
                          } else if (val === '') {
                            handleProductChange(index, 'price', 0);
                          }
                        }}
                        onWheel={(e) => e.target.blur()}
                        style={{ width: "110px", textAlign: "center", fontSize: "14px" }}
                        title="Unit price"
                      />
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                      <span>₹{formatPrice(netAmount)}</span>
                      <small className="text-muted">net</small>
                      <span>₹{formatPrice(taxAmount)}</span>
                      <small className="text-muted">tax</small>
                    </div>
                  </td>
                  <td>₹{formatPrice(total)}</td>
                  <td>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteProduct(index)}
                      style={{ padding: "4px 8px", fontSize: "12px", minWidth: "60px" }}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="7">No products in this order</td>
            </tr>
          )}
          <tr>
            <td colSpan="7">
              <Button onClick={handleAddClick}>Add Product</Button>
            </td>
          </tr>

          <tr>
            <td colSpan="5"></td>
            <td>Subtotal:</td>
            <td>₹{formatPrice(calculateTotals().subtotal)}</td>
          </tr>
          <tr>
            <td colSpan="5"></td>
            <td>GST:</td>
            <td>₹{formatPrice(calculateTotals().gst)}</td>
          </tr>
          <tr>
            <td colSpan="4"></td>
            <td>Delivery Charges:</td>
            <td>
              <Form.Control
                type="number"
                step="0.01"
                value={selectedOrder.deliveryCharges || 0}
                onChange={(e) => handleInputChange("deliveryCharges", e.target.value)}
                onWheel={(e) => e.target.blur()}
              />
            </td>
            <td>₹{formatPrice(selectedOrder.deliveryCharges || 0)}</td>
          </tr>
          <tr>
            <td colSpan="4"></td>
            <td>COD Charges:</td>
            <td>
              <Form.Control
                type="number"
                step="0.01"
                value={selectedOrder.codCharges || 0}
                onChange={(e) => handleInputChange("codCharges", e.target.value)}
                onWheel={(e) => e.target.blur()}
              />
            </td>
            <td>₹{formatPrice(selectedOrder.codCharges || 0)}</td>
          </tr>
          <tr>
            <td colSpan="4"></td>
            <td>Discount:</td>
            <td>
              <Form.Control
                type="number"
                step="0.01"
                value={selectedOrder.discount || 0}
                onChange={(e) => handleInputChange("discount", e.target.value)}
                onWheel={(e) => e.target.blur()}
              />
            </td>
            <td>₹{formatPrice(selectedOrder.discount || 0)}</td>
          </tr>
          <tr>
            <td colSpan="5"></td>
            <td>
              <strong>Total:</strong>
            </td>
            <td>
              <strong>₹{formatPrice(calculateTotals().total)}</strong>
            </td>
          </tr>
          <tr>
            <td colSpan="4"></td>
            <td>Amount Paid:</td>
            <td>
              <Form.Control
                type="number"
                step="0.01"
                value={selectedOrder.amount || 0}
                onChange={(e) => handleInputChange("amount", e.target.value)}
                onWheel={(e) => e.target.blur()}
              />
            </td>
            <td>₹{formatPrice(selectedOrder.amount || 0)}</td>
          </tr>
          <tr>
            <td colSpan="5"></td>
            <td>Amount Pending:</td>
            <td>₹{formatPrice(calculateTotals().total - Number(selectedOrder.amount || 0))}</td>
          </tr>
        </tbody>
      </Table>
    </div>
  );
};

export default ProductTable;
