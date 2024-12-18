import React from "react";
import { Modal, Button, Table, Form } from "react-bootstrap";
import moment from "moment";
import jsPDF from 'jspdf';
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

  const convertToWords = (num) => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    if ((num = num.toString()).length > 9) return 'Overflow';
    let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return;
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'only' : '';
    return str;
  };

  const generatePDF = () => {
    if (!selectedOrder) {
      alert('No order selected');
      return;
    }

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Page setup
      const pageWidth = 210; // A4 width
      const pageHeight = 297; // A4 height
      const margin = 10;
      const contentWidth = pageWidth - (2 * margin);

      // Font and styling
      doc.setFont('helvetica');
      doc.setFontSize(10);

      // Column definitions with precise widths
      const columns = {
        product: { width: 70, align: 'left' },
        unitPrice: { width: 25, align: 'right' },
        quantity: { width: 20, align: 'right' },
        netAmount: { width: 25, align: 'right' },
        tax: { width: 25, align: 'right' },
        total: { width: 25, align: 'right' }
      };

      // Calculate total column width to ensure it fits
      const totalColumnWidth = Object.values(columns).reduce((sum, col) => sum + col.width, 0);
      const startX = (pageWidth - totalColumnWidth) / 2;

      // Helper function for precise text rendering
      const safeText = (text, x, y, options = {}) => {
        try {
          doc.text(text.toString(), x, y, {
            ...options,
            maxWidth: contentWidth,
            lineHeightFactor: 1.2
          });
        } catch (error) {
          console.error('Text rendering error:', error);
        }
      };

      // Header
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      safeText('TAX INVOICE', pageWidth / 2, margin + 10, { align: 'center' });

      // Company Details
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      safeText('Smitox B2b', margin + 10, margin + 20);
      safeText('GST No: 27AGEPJ1490K1Z9', margin + 10, margin + 25);

      // Invoice Details
      const currentDate = new Date().toISOString().split('T')[0];
      safeText(`Invoice No: ${selectedOrder.orderNumber || 'N/A'}`, pageWidth - margin - 50, margin + 20);
      safeText(`Date: ${currentDate}`, pageWidth - margin - 50, margin + 25);

      // Table Header
      let currentY = margin + 40;
      doc.setFillColor(230, 230, 230);
      doc.rect(startX, currentY, totalColumnWidth, 10, 'F');

      // Header Columns
      const headers = ['Product', 'Unit Price', 'Qty', 'Net Amount', 'Tax', 'Total'];
      headers.forEach((header, index) => {
        const columnKeys = Object.keys(columns);
        const columnKey = columnKeys[index];
        const column = columns[columnKey];

        const x = startX + Object.keys(columns)
          .slice(0, index)
          .reduce((sum, key) => sum + columns[key].width, 0);

        safeText(header, x + (column.align === 'right' ? column.width : 2), currentY + 7, {
          align: column.align
        });
      });

      // Table Data
      currentY += 10;
      let totalAmount = 0;

      // Safely handle products array
      const productsList = Array.isArray(selectedOrder.products) ? selectedOrder.products : [];

      productsList.forEach((product) => {
        const productName = product.product.name || 'Unknown Product';
        const unitPrice = Number(product.price) || 0;
        const quantity = Number(product.quantity) || 0;
        const netAmount = unitPrice * quantity;
        const gst = product.product.gst;
        // Draw row
        doc.rect(startX, currentY, totalColumnWidth, 10);

        // Render each column
        let currentX = startX;

        // Product Name
        safeText(productName, currentX + 2, currentY + 7, {
          align: columns.product.align,
          maxWidth: columns.product.width - 4
        });
        currentX += columns.product.width;

        // Unit Price
        safeText(`₹ ${unitPrice.toFixed(2)}`, currentX + columns.unitPrice.width - 2, currentY + 7, {
          align: columns.unitPrice.align
        });
        currentX += columns.unitPrice.width;

        // Quantity
        safeText(quantity.toString(), currentX + columns.quantity.width - 2, currentY + 7, {
          align: columns.quantity.align
        });
        currentX += columns.quantity.width;

        // Net Amount
        safeText(`₹ ${netAmount.toFixed(2)}`, currentX + columns.netAmount.width - 2, currentY + 7, {
          align: columns.netAmount.align
        });
        currentX += columns.netAmount.width;

        // Tax
        safeText(`${gst.toFixed(2)}%`, currentX + columns.tax.width - 2, currentY + 7, {
          align: columns.tax.align
        });
        currentX += columns.tax.width;

        // Total
        safeText(`₹ ${netAmount.toFixed(2)}`, currentX + columns.total.width - 2, currentY + 7, {
          align: columns.total.align
        });

        totalAmount += netAmount;
        currentY += 10;
      });

      // Totals Section
      currentY += 5;
      const totals = [
        { label: 'Subtotal', value: totalAmount.toFixed(2) },
        { label: 'Delivery Charges', value: '360.00' },
        { label: 'Total Amount', value: (totalAmount + 360).toFixed(2) },
        { label: 'Amount Paid', value: '0.00' },
        { label: 'Amount Pending', value: (totalAmount + 360).toFixed(2) }
      ];

      totals.forEach((total) => {
        doc.rect(startX, currentY, totalColumnWidth, 7);
        safeText(total.label, startX + 2, currentY + 5);
        safeText(`₹ ${total.value}`, startX + totalColumnWidth - 2, currentY + 5, { align: 'right' });
        currentY += 7;
      });

      // Amount in Words
      currentY += 5;
      const totalInvoiceAmount = totalAmount + 360;
      safeText(`Amount in Words: ${convertToWords(Math.round(totalInvoiceAmount))}`, startX, currentY);

      // Footer
      currentY = pageHeight - 20;
      safeText('For Smitox B2b', startX, currentY);
      safeText('Authorized Signature', pageWidth - margin - 40, currentY);

      // Page number
      safeText('Page 1/1', pageWidth / 2, pageHeight - 10, { align: 'center' });

      // Save PDF
      doc.save(`Invoice_${selectedOrder.orderNumber || 'Order'}.pdf`);

    } catch (error) {
      console.error('PDF Generation Error:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };


  // ... rest of the component remains the same




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
                          style={{ width: "100px" }} // Adjust the width as needed
                        />
                      </td>

                      <td>₹{(Number(product.price) * Number(product.quantity)).toFixed(2)}</td>
                      <td>₹{((Number(product.price) * Number(product.quantity)) * product.product.gst).toFixed(2)}</td>
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

          {selectedOrder && (selectedOrder.status === "Delivered" || selectedOrder.status === "Returned") && (
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

        <div className="d-flex justify-content-end mt-3 gap-2">
          <Button variant="primary" onClick={generatePDF}>
            Download PDF
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default OrderModal;

