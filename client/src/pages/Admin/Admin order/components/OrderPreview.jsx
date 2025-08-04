import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';
import './OrderPreview.css';

const OrderPreview = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/v1/auth/order/${orderId}/preview`);
      if (response.data.success) {
        setOrder(response.data.order);
      } else {
        setError('Order not found');
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      setError('Error fetching order details');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    if (!order || !order.products) return { subtotal: 0, gst: 0, total: 0 };

    const subtotal = order.products.reduce(
      (acc, product) => acc + Number(product.price) * Number(product.quantity),
      0
    );

    const gst = order.products.reduce((acc, product) => {
      const productData = typeof product.product === 'object' ? product.product : {};
      return (
        acc +
        (Number(product.price) *
          Number(product.quantity) *
          (Number(productData.gst) || 0)) /
          100
      );
    }, 0);

    const total =
      subtotal +
      gst +
      (Number(order.deliveryCharges) || 0) +
      (Number(order.codCharges) || 0) -
      (Number(order.discount) || 0);

    return { subtotal, gst, total };
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="preview-container">
        <div className="loading">Loading order details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="preview-container">
        <div className="error">{error}</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="preview-container">
        <div className="error">Order not found</div>
      </div>
    );
  }

  const totals = calculateTotals();

  return (
    <div className="preview-container">
      <div className="no-print">
        <div className="preview-controls">
          <button onClick={handlePrint} className="print-btn">
            Print / Save as PDF
          </button>
          <button onClick={() => window.close()} className="close-btn">
            Close
          </button>
        </div>
      </div>

      <div className="invoice">
        <div className="invoice-header">
          <div className="company-info">
            <img 
              src="https://smitox.com/img/logo.png" 
              alt="Smitox Logo" 
              className="company-logo"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <h1>TAX INVOICE</h1>
            <div className="company-details">
              <h2>Smitox B2B</h2>
              <p>Address: Mumbai, Maharashtra</p>
            </div>
          </div>
          <div className="invoice-info">
            <p><strong>Invoice No:</strong> {order._id}</p>
            <p><strong>Date:</strong> {moment().format('DD/MM/YYYY')}</p>
          </div>
        </div>

        <div className="customer-info">
          <h3>Bill To:</h3>
          <div className="customer-details">
            <p><strong>Name:</strong> {order.buyer?.user_fullname || 'N/A'}</p>
            <p><strong>Mobile:</strong> {order.buyer?.mobile_no || 'N/A'}</p>
            <p><strong>Address:</strong> {order.buyer?.address || 'N/A'}</p>
            <p><strong>City:</strong> {order.buyer?.city || 'N/A'}</p>
            {order.buyer?.landmark && <p><strong>Landmark:</strong> {order.buyer.landmark}</p>}
            <p><strong>State:</strong> {order.buyer?.state || 'N/A'}</p>
            <p><strong>Pincode:</strong> {order.buyer?.pincode || 'N/A'}</p>
          </div>
        </div>

        <div className="order-details">
          <table className="order-table">
            <thead>
              <tr>
                <th>Sr. No</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>GST%</th>
                <th>Net Amount</th>
                <th>Tax Amount</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.products.map((product, index) => {
                const productData = typeof product.product === 'object' ? product.product : {};
                const quantity = Number(product.quantity) || 0;
                const price = Number(product.price) || 0;
                const gst = Number(productData.gst) || 0;
                const netAmount = price * quantity;
                const taxAmount = (netAmount * gst) / 100;
                const total = netAmount + taxAmount;

                return (
                  <tr key={product._id || index}>
                    <td>{index + 1}</td>
                    <td>{productData.name || 'Unnamed Product'}</td>
                    <td>{quantity}</td>
                    <td>₹{price.toFixed(2)}</td>
                    <td>{gst}%</td>
                    <td>₹{netAmount.toFixed(2)}</td>
                    <td>₹{taxAmount.toFixed(2)}</td>
                    <td>₹{total.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="order-summary">
          <div className="summary-row">
            <span>Subtotal:</span>
            <span>₹{totals.subtotal.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>GST:</span>
            <span>₹{totals.gst.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Delivery Charges:</span>
            <span>₹{Number(order.deliveryCharges || 0).toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>COD Charges:</span>
            <span>₹{Number(order.codCharges || 0).toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Discount:</span>
            <span>-₹{Number(order.discount || 0).toFixed(2)}</span>
          </div>
          <div className="summary-row total-row">
            <span><strong>Total Amount:</strong></span>
            <span><strong>₹{totals.total.toFixed(2)}</strong></span>
          </div>
          <div className="summary-row">
            <span>Amount Paid:</span>
            <span>₹{Number(order.amount || 0).toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Amount Pending:</span>
            <span>₹{(totals.total - Number(order.amount || 0)).toFixed(2)}</span>
          </div>
        </div>

        {order.tracking && (
          <div className="tracking-info">
            <p><strong>Tracking Information:</strong> {order.tracking.company}: {order.tracking.id}</p>
          </div>
        )}

        <div className="order-info">
          <p><strong>Order Created:</strong> {moment(order.createdAt).format('DD/MM/YYYY hh:mm A')}</p>
          <p><strong>Payment Method:</strong> {order.payment?.paymentMethod || 'N/A'}</p>
          <p><strong>Order Status:</strong> {order.status}</p>
          {order.payment?.paymentMethod === 'Razorpay' && order.payment?.transactionId && (
            <p><strong>Transaction ID:</strong> {order.payment.transactionId}</p>
          )}
        </div>

        <div className="disclaimer">
          <h4>Terms & Conditions:</h4>
          <ul>
            <li>Check Bill 2-3 Times Before Making Payment</li>
            <li>Once Payment Received It Will Not Refundable</li>
            <li>There Is No Any Warranty Or Guarantee On Any Products</li>
            <li>Don't Ask For Replacement Or Warranty</li>
          </ul>
        </div>

        <div className="invoice-footer">
          <div className="footer-left">
            <p>From Smitox B2B</p>
          </div>
          <div className="footer-right">
            <p>Authorized Signature</p>
            <div className="signature-line"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderPreview;
