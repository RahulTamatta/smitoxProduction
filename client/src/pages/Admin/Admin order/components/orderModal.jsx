import React, { useState, useEffect } from "react";
import { Modal, Button, Table, Form } from "react-bootstrap";
import axios from "axios";
import moment from "moment";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { useAuth } from "../../../../context/authContext";

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
  getOrders,
  orderType,
  onOrderUpdate,
}) => {
  const orderId = selectedOrder?._id;
  const products = selectedOrder?.products || [];
  const [localOrder, setLocalOrder] = useState(selectedOrder);
  const [addProductError, setAddProductError] = useState(null);

  // Update local state when selectedOrder changes
  useEffect(() => {
    setLocalOrder(selectedOrder);
  }, [selectedOrder]);

  // Refresh data when modal is shown
  useEffect(() => {
    if (show && orderId) {
      refreshOrderData();
    }
  }, [show, orderId]);

  const convertToWords = (num) => {
    const a = [
      "",
      "One ",
      "Two ",
      "Three ",
      "Four ",
      "Five ",
      "Six ",
      "Seven ",
      "Eight ",
      "Nine ",
      "Ten ",
      "Eleven ",
      "Twelve ",
      "Thirteen ",
      "Fourteen ",
      "Fifteen ",
      "Sixteen ",
      "Seventeen ",
      "Eighteen ",
      "Nineteen ",
    ];
    const b = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];

    if ((num = num.toString()).length > 9) return "Overflow";
    let n = ("000000000" + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return;
    let str = "";
    str += n[1] != 0 ? (a[Number(n[1])] || b[n[1][0]] + " " + a[n[1][1]]) + "Crore " : "";
    str += n[2] != 0 ? (a[Number(n[2])] || b[n[2][0]] + " " + a[n[2][1]]) + "Lakh " : "";
    str += n[3] != 0 ? (a[Number(n[3])] || b[n[3][0]] + " " + a[n[3][1]]) + "Thousand " : "";
    str += n[4] != 0 ? (a[Number(n[4])] || b[n[4][0]] + " " + a[n[4][1]]) + "Hundred " : "";
    str += n[5] != 0 ? ((str != "") ? "and " : "") + (a[Number(n[5])] || b[n[5][0]] + " " + a[n[5][1]]) + "only" : "";
    return str;
  };
  const generatePDF = () => {
    if (!selectedOrder) {
      alert("No order selected");
      return;
    }
  
    const generatePDFWithLogo = async () => {
      try {
        const doc = new jsPDF();
        const totals = calculateTotals();
  
        // PDF configuration
        const margin = { top: 40, left: 20, right: 20 };
        let currentY = margin.top;
  
        // Add logo
        try {
          const logoData = await loadImage("https://smitox.com/img/logo.png");
          doc.addImage(logoData, "PNG", 20, 10, 40, 15);
        } catch (imageError) {
          console.warn("Failed to load logo:", imageError);
        }
  
        // Header Section (only on first page)
        doc.setFontSize(20);
        doc.text("TAX INVOICE", 105, 20, { align: "center" });
        doc.setFontSize(12);
        doc.text("Smitox B2b", 20, 30);
        doc.text(`Address: Mumbai, Maharashtra`, 20, 35);
  
        // Invoice Details
        doc.text(`Invoice No: ${selectedOrder._id || "N/A"}`, 130, 30);
        doc.text(`Date: ${moment().format("DD/MM/YYYY")}`, 130, 35);
  
        // Customer Details
        doc.text("Bill To:", 20, 50);
        doc.text(`Name: ${selectedOrder.buyer?.user_fullname || "N/A"}`, 20, 55);
        const address = selectedOrder.buyer?.address || "N/A";
        const addressLines = doc.splitTextToSize(address, 150);
        doc.text(`Address:`, 20, 60);
        doc.text(addressLines, 30, 65);
  
        // Calculate Y position after address
        const addressY = 65 + (addressLines.length - 1) * 5;
        doc.text(`Pincode: ${selectedOrder.buyer?.pincode || "N/A"}`, 20, addressY + 5);
  
        // Create product table with serial numbers
        const tableColumns = [
          "Sr. No", // Serial number column
          "Product",
          "Qty",
          "Price",
          "GST%",
          "Net Amount",
          "Tax Amount",
          "Total",
        ];
  
        const tableRows = products.map((product, index) => {
          const productData = product.product || {};
          return [
            (index + 1).toString(), // Serial number
            productData.name || "Unnamed Product",
            product.quantity || 0,
            Number(product.price || 0).toFixed(2),
            `${productData.gst || 0}%`,
            Number((product.price || 0) * (product.quantity || 0)).toFixed(2),
            Number((product.price || 0) * (product.quantity || 0) * ((productData.gst || 0) / 100)).toFixed(2),
            ((productData.gst || 0) !== 0
              ? (Number(product.price || 0) * Number(product.quantity || 0) * (1 + (productData.gst || 0) / 100)).toFixed(2)
              : (Number(product.price || 0) * Number(product.quantity || 0)).toFixed(2)),
          ];
        });
  
        // AutoTable configuration for multi-page support
        doc.autoTable({
          head: [tableColumns],
          body: tableRows,
          startY: addressY + 15,
          margin: { top: 20 },
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [66, 139, 202] },
          bodyStyles: { minCellHeight: 10 },
          pageBreak: "auto",
          rowPageBreak: "auto",
          didDrawPage: (data) => {
            // Add header only on the first page
            if (data.pageNumber === 1) {
              doc.setFontSize(20);
              doc.text("TAX INVOICE", 105, 20, { align: "center" });
            }
          },
        });
  
        // Get final Y position after table
        let finalY = doc.lastAutoTable.finalY;
  
        // Add totals section
        if (finalY > doc.internal.pageSize.height - 100) {
          doc.addPage();
          finalY = margin.top;
        }
  
        // Add totals with proper formatting
        doc.setFontSize(10);
        doc.text(`Subtotal: Rs. ${Number(totals.subtotal).toFixed(2)}`, 20, finalY + 10);
        doc.text(`GST: Rs. ${Number(totals.gst).toFixed(2)}`, 20, finalY + 15);
        doc.text(`Delivery Charges: Rs. ${Number(selectedOrder.deliveryCharges || 0).toFixed(2)}`, 20, finalY + 20);
        doc.text(`COD Charges: Rs. ${Number(selectedOrder.codCharges || 0).toFixed(2)}`, 20, finalY + 25);
        doc.text(`Discount: Rs. ${Number(selectedOrder.discount || 0).toFixed(2)}`, 20, finalY + 30);
        doc.text(`Total Amount: Rs. ${Number(totals.total).toFixed(2)}`, 20, finalY + 35);
        doc.text(`Amount Paid: Rs. ${Number(selectedOrder.amount || 0).toFixed(2)}`, 20, finalY + 40);
        doc.text(`Amount Pending: Rs. ${Number(totals.total - (selectedOrder.amount || 0)).toFixed(2)}`, 20, finalY + 45);
  
        // Add amount in words
        doc.text(`Amount in Words: ${convertToWords(Math.round(totals.total))}`, 20, finalY + 60);
  
        // Add tracking information
        if (selectedOrder.tracking) {
          doc.text(`Tracking Company: ${selectedOrder.tracking.company}: ${selectedOrder.tracking.id}`, 20, finalY + 65);
        } else {
          doc.text("Tracking Id is not assigned", 20, finalY + 65);
        }
  
        // Add disclaimer text
        const disclaimerText = [
          "Check Bill 2-3 Times Before Making Payment",
          "Once Payment Received It Will Not Refundable",
          "There Is No Any Warranty Or Guarantee On Any Products",
          "Don't Ask For Replacement Or Warranty",
        ];
        disclaimerText.forEach((line, index) => {
          doc.text(line, 20, finalY + 75 + index * 5);
        });
  
        // Add footer
        doc.text("From Smitox B2B", 20, finalY + 100);
        doc.text("Authorized Signature", 150, finalY + 100);
  
        // Save PDF
        doc.save(`Invoice_${selectedOrder.orderNumber || "Order"}.pdf`);
      } catch (error) {
        console.error("PDF Generation Error:", error);
        alert("Failed to generate PDF. Please try again.");
      }
    };
  
    generatePDFWithLogo();
  };

  const loadImage = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = url;
    });
  };

  const shareToWhatsApp = () => {
    if (!selectedOrder) {
      alert("No order selected");
      return;
    }

    if (!selectedOrder.buyer?.mobile_no) {
      alert("Customer mobile number not available");
      return;
    }

    const phoneNumber = String(selectedOrder.buyer.mobile_no)
      .replace(/\D/g, "")
      .replace(/^0+/, "");

    if (!phoneNumber) {
      alert("Invalid mobile number format");
      return;
    }

    const formattedNumber = phoneNumber.startsWith("+") ? phoneNumber : `91${phoneNumber}`;
    const totals = calculateTotals();

    const message = `
*Order Details from Smitox B2b*
---------------------------
Order ID: ${selectedOrder._id}
Customer: ${selectedOrder.buyer?.user_fullname}
Date: ${moment().format("DD/MM/YYYY")}

*Order Summary*
Subtotal: Rs. ${totals.subtotal.toFixed(2)}
GST: Rs. ${totals.gst.toFixed(2)}
Delivery Charges: Rs. ${Number(selectedOrder.deliveryCharges || 0).toFixed(2)}
COD Charges: Rs. ${Number(selectedOrder.codCharges || 0).toFixed(2)}
Discount: Rs. ${Number(selectedOrder.discount || 0).toFixed(2)}
*Total Amount: Rs. ${totals.total.toFixed(2)}*
Amount Paid: Rs. ${Number(selectedOrder.amount || 0).toFixed(2)}
Amount Pending: Rs. ${(totals.total - Number(selectedOrder.amount || 0)).toFixed(2)}

Thank you for your business!
`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappLink = `https://wa.me/${formattedNumber}?text=${encodedMessage}`;
    window.open(whatsappLink, "_blank");
  };

  const refreshOrderData = async () => {
    try {
      const response = await axios.get(`/api/v1/auth/order/${orderId}`);
      if (response.data.success) {
        console.log('Refreshed order data:', response.data.order);
        onOrderUpdate(response.data.order);
        setLocalOrder(response.data.order);
      }
    } catch (error) {
      console.error("Error refreshing order data:", error);
    }
  };

  const handleOrderUpdate = async () => {
    await handleUpdateOrder();
    await refreshOrderData();
    await getOrders(orderType);
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal show={!!addProductError} onHide={() => setAddProductError(null)}>
        <Modal.Header closeButton>
          <Modal.Title>Cannot Add Product</Modal.Title>
        </Modal.Header>
        <Modal.Body>{addProductError}</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setAddProductError(null)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal.Header closeButton>
        <Modal.Title>Edit Order</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {selectedOrder ? (
          <div>
            <h2>Order ID: {orderId}</h2>
            <p>
              Name: {selectedOrder.buyer?.user_fullname}{" "}
              {selectedOrder.payment?.paymentMethod === "Razorpay" && (
                <span style={{ marginLeft: "300px" }}>
                  Razorpay ID: {selectedOrder.payment.transactionId}
                </span>
              )}
            </p>
            <p>Mobile No: {selectedOrder.buyer?.mobile_no}</p>
            <p>{selectedOrder.buyer?.address}</p>
            <p>{selectedOrder.buyer?.city}</p>
            <p>{selectedOrder.buyer?.landmark}</p>
            <p>{selectedOrder.buyer?.state}</p>
            <p>Pincode: {selectedOrder.buyer?.pincode}</p>
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
                  products.map((product, index) => {
                    // Enhanced product data extraction with fallbacks
                    const productData = typeof product.product === 'object' ? product.product : product;
                    const quantity = Number(product.quantity) || 0;
                    const price = Number(product.price) || Number(productData.price) || Number(productData.perPiecePrice) || 0;
                    const gst = Number(productData.gst) || 0;

                    // Enhanced product name and image extraction
                    const productName = productData.name || product.name || "Unnamed Product";
                    const productImage = productData.photos || 
                                       product.photos || 
                                       (productData.multipleimages && productData.multipleimages[0]) ||
                                       (product.multipleimages && product.multipleimages[0]) ||
                                       "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNSAzNUM5MS4xIDI1IDI1IDkuMSAyNSAyNVMzOS4xIDI1IDI1IDI1WiIgZmlsbD0iI0NCQ0JDQiIvPgo8L3N2Zz4K";

                    const netAmount = (price * quantity).toFixed(2);
                    const taxAmount = ((price * quantity) * (gst / 100)).toFixed(2);
                    const total =
                      gst !== 0
                        ? ((price * quantity) * (1 + gst / 100)).toFixed(2)
                        : (price * quantity).toFixed(2);

                    // Debug logging (remove in production)
                    console.log('Product debug:', {
                      index,
                      productName,
                      price,
                      quantity,
                      gst,
                      productData,
                      originalProduct: product
                    });

                    return (
                      <tr key={product._id || index}>
                        <td>
                          <img
                            src={productImage}
                            alt={productName}
                            width="50"
                            className="img-fluid"
                            onError={(e) => {
                              if (e.target.src !== "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNSAzNUM5MS4xIDI1IDI1IDkuMSAyNSAyNVMzOS4xIDI1IDI1IDI1WiIgZmlsbD0iI0NCQ0JDQiIvPgo8L3N2Zz4K") {
                                e.target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNSAzNUM5MS4xIDI1IDI1IDkuMSAyNSAyNVMzOS4xIDI1IDI1IDI1WiIgZmlsbD0iI0NCQ0JDQiIvPgo8L3N2Zz4K";
                              }
                            }}
                          />
                        </td>
                        <td>{productName}</td>
                        <td>
                          <Form.Control
                            type="number"
                            value={quantity}
                            onChange={(e) => handleProductChange(index, "quantity", e.target.value)}
                            onWheel={(e) => e.currentTarget.blur()}
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="number"
                            value={price}
                            onChange={(e) => handleProductChange(index, "price", e.target.value)}
                            onWheel={(e) => e.currentTarget.blur()}
                            style={{ width: "100px" }}
                          />
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
                      onWheel={(e) => e.currentTarget.blur()}
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
                      onWheel={(e) => e.currentTarget.blur()}
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
                      onWheel={(e) => e.currentTarget.blur()}
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
                      onWheel={(e) => e.currentTarget.blur()}
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
          style={{ backgroundColor: "#25D366", borderColor: "#25D366" }}
        >
          Share to WhatsApp
        </Button>
        <Button
          variant="info"
          onClick={() => {
            window.open(`/preview-order/${selectedOrder._id}`, '_blank');
          }} 
        >
          Preview Order
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default OrderModal;