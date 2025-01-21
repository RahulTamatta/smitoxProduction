import React from 'react';
import { Modal, Button, Table, Form } from 'react-bootstrap';
import moment from 'moment';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable'; // Add this import for better table handling
import { useEffect,useState } from 'react';
import axios from 'axios';

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
  getOrders, // Add this prop
  orderType ,
  onOrderUpdate 
}) => {
  const orderId = selectedOrder?._id;
  const products = selectedOrder?.products || [];
  const [localOrder, setLocalOrder] = useState(selectedOrder);

  // Update local state when selectedOrder changes
  useEffect(() => {
    setLocalOrder(selectedOrder);
  }, [selectedOrder]);

  // Add useEffect to refresh data when modal is shown
  useEffect(() => {
    if (show && orderId) {
      refreshOrderData();
    }
  }, [show, orderId]);



  // const getProductName = (product) => {
  //   if (!product) return "Unknown Product";
    
  //   if (product.product && product.product.name) {
  //     return product.product.name;
  //   }
    
  //   if (product.name) {
  //     return product.name;
  //   }
    
  //   if (product.product && product.product.sku) {
  //     return `Product (${product.product.sku})`;
  //   }
    
  //   if (product.sku) {
  //     return `Product (${product.sku})`;
  //   }
    
  //   return "Unknown Product";
  // };

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
  
    // Create a function to load the image and return a promise
    const loadImage = (url) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';  // Handle CORS
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = url;
      });
    };
  
    // Main PDF generation with image handling
    const generatePDFWithLogo = async () => {
      try {
        const doc = new jsPDF();
        const totals = calculateTotals();
  
        // Define PDF dimensions
        const pageWidth = doc.internal.pageSize.width;
        const marginLeft = 10;
        const marginRight = 10;
        const maxTextWidth = pageWidth - marginLeft - marginRight;
  
        try {
          // Load and add logo
          const logoData = await loadImage('https://smitox.com/img/logo.png');
          // Add logo with proper scaling (80px height equivalent)
          doc.addImage(logoData, 'PNG', 20, 10, 40, 15); // Adjust dimensions as needed
        } catch (imageError) {
          console.warn('Failed to load logo:', imageError);
          // Continue PDF generation without logo
        }
  
        // Add company header
        doc.setFontSize(20);
        doc.text('TAX INVOICE', 105, 20, { align: 'center' });
  
        doc.setFontSize(12);
        doc.text('Smitox B2b', 20, 30);
        doc.text(`Address : ${selectedOrder.buyer?.address}`, 20, 35);
  
        // Add invoice details with text width check
        const invoiceText = `Invoice No: ${selectedOrder._id || 'N/A'}`;
        let textWidth = doc.getTextWidth(invoiceText);
  
        if (textWidth > maxTextWidth) {
          let lines = doc.splitTextToSize(invoiceText, maxTextWidth);
          doc.text(lines, 130, 30);
        } else {
          doc.text(invoiceText, 130, 30);
        }
  
        doc.text(`Date: ${moment().format('DD/MM/YYYY')}`, 130, 35);
  
        // Add customer details
        doc.text('Bill To:', 20, 50);
        doc.text(`Name: ${selectedOrder.buyer.user_fullname || 'N/A'}`, 20, 55);
  
        // Create table for products
        const tableColumn = ['Product', 'Qty', 'Price', 'GST%', 'Net Amount', 'Tax Amount', 'Total'];
        const tableRows = products.map(product => [
      product.product.name,
          product.quantity,
          Number(product.price).toFixed(2),
          `${product.product.gst}%`,
          Number(product.price * product.quantity).toFixed(2),
          Number((product.price * product.quantity) * product.product.gst).toFixed(2),
          Number((product.price * product.quantity) * (1 + product.product.gst)).toFixed(2)
        ]);
  
        doc.autoTable({
          head: [tableColumn],
          body: tableRows,
          startY: 70,
          theme: 'grid',
          styles: { fontSize: 8 },
          headStyles: { fillColor: [66, 139, 202] }
        });
  
        const finalY = doc.lastAutoTable.finalY + 10;
  
        // Add totals
        doc.text(`Subtotal: ${Number(totals.subtotal).toFixed(2)}`, 20, finalY + 10);
        doc.text(`GST: ${Number(totals.gst).toFixed(2)}`, 20, finalY + 15);
        doc.text(`Delivery Charges: ${Number(selectedOrder.deliveryCharges || 0).toFixed(2)}`, 20, finalY + 20);
        doc.text(`COD Charges: ${Number(selectedOrder.codCharges || 0).toFixed(2)}`, 20, finalY + 25);
        doc.text(`Discount: ${Number(selectedOrder.discount || 0).toFixed(2)}`, 20, finalY + 30);
        doc.text(`Total Amount: ${Number(totals.total).toFixed(2)}`, 20, finalY + 35);
        doc.text(`Amount Paid: ${Number(selectedOrder.amount || 0).toFixed(2)}`, 20, finalY + 40);
        doc.text(`Amount Pending: ${Number(totals.total - (selectedOrder.amount || 0)).toFixed(2)}`, 20, finalY + 45);
  
        // Add amount in words
        doc.text(`Amount in Words: ${convertToWords(Math.round(totals.total))}`, 20, finalY + 60);
  
        // Add footer
        doc.text('For Smitox B2b', 20, finalY + 80);
        doc.text('Authorized Signature', 150, finalY + 80);
  
        // Save PDF
        doc.save(`Invoice_${selectedOrder.orderNumber || 'Order'}.pdf`);
  
      } catch (error) {
        console.error('PDF Generation Error:', error);
        alert('Failed to generate PDF. Please try again.');
      }
    };
  
    // Call the async function
    generatePDFWithLogo();
  };

  const shareToWhatsApp = () => {
    if (!selectedOrder) {
      alert('No order selected');
      return;
    }
  
    // Validate buyer and mobile number
    if (!selectedOrder.buyer?.mobile_no) {
      alert('Customer mobile number not available');
      return;
    }
  
    // Convert to string and clean the phone number
    const phoneNumber = String(selectedOrder.buyer.mobile_no)
      .replace(/\D/g, '') // Remove all non-digit characters
      .replace(/^0+/, ''); // Remove leading zeros
  
    if (!phoneNumber) {
      alert('Invalid mobile number format');
      return;
    }
  
    // Ensure country code is present (default to India +91 if missing)
    const formattedNumber = phoneNumber.startsWith('+') 
      ? phoneNumber 
      : `91${phoneNumber}`; // Default to India country code
  
    const totals = calculateTotals();
    
    // Create message content
    const message = `
  *Order Details from Smitox B2b*
  ---------------------------
  Order ID: ${selectedOrder._id}
  Customer: ${selectedOrder.buyer?.user_fullname}
  Date: ${moment().format('DD/MM/YYYY')}
  
  *Order Summary*
  Subtotal: ₹${totals.subtotal.toFixed(2)}
  GST: ₹${totals.gst.toFixed(2)}
  Delivery Charges: ₹${Number(selectedOrder.deliveryCharges || 0).toFixed(2)}
  COD Charges: ₹${Number(selectedOrder.codCharges || 0).toFixed(2)}
  Discount: ₹${Number(selectedOrder.discount || 0).toFixed(2)}
  *Total Amount: ₹${totals.total.toFixed(2)}*
  Amount Paid: ₹${Number(selectedOrder.amount || 0).toFixed(2)}
  Amount Pending: ₹${(totals.total - Number(selectedOrder.amount || 0)).toFixed(2)}
  
  Thank you for your business!
  `;
  
    // Encode the message for URL
    const encodedMessage = encodeURIComponent(message);
    
    // Create WhatsApp link
    const whatsappLink = `https://wa.me/${formattedNumber}?text=${encodedMessage}`;
    
    // Open in new tab
    window.open(whatsappLink, '_blank');
  };

  const refreshOrderData = async () => {
    try {
      const response = await axios.get(`/api/v1/auth/order/${orderId}`);
      if (response.data.success) {
        onOrderUpdate(response.data.order); // Update parent state
        setLocalOrder(response.data.order); 
      }
    } catch (error) {
      console.error('Error refreshing order data:', error);
    }
  };

  // Modify handleUpdateOrder to refresh data after update
  const handleOrderUpdate = async () => {
    await handleUpdateOrder();
    await refreshOrderData();
    await getOrders(orderType);
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
            <p>Buyer: {selectedOrder.buyer?.user_fullname}</p>
            <p>Email: {selectedOrder.buyer?.email_id}</p>
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
                        {
                          <img
                            src={product.product.photos}
                            alt={product.photos}
                            width="50"
                            className="img-fluid"
                          />
                         }
                      </td>
                      <td>{product.product.name}</td>
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
                          style={{ width: "100px" }}
                        />
                      </td>
                      <td>₹{(Number(product.price) * Number(product.quantity)).toFixed(2)}</td>
                      <td>₹{((Number(product.price) * Number(product.quantity)) * product.product.gst).toFixed(2)}</td>
                      <td>
  ₹{
    product.product.gst !== "0"
      ? ((Number(product.price) * Number(product.quantity)) * (1 + product.product.gst)).toFixed(2)
      : ((Number(product.price) * Number(product.quantity)) ).toFixed(2)
  }
</td>

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
  
          <Button variant="primary" onClick={generatePDF}>
            Download PDF
          </Button>
          <Button 
          variant="success" 
          onClick={shareToWhatsApp}
          style={{ backgroundColor: '#25D366', borderColor: '#25D366' }}
        >
          Share to WhatsApp
        </Button>
        </Modal.Footer>
      </Modal>
    );
  };
  
  export default OrderModal;