import React, { useState, useEffect } from "react";
import UserMenu from "../../components/Layout/UserMenu";
import Layout from "../../components/Layout/Layout";
import axios from "axios";
import { useAuth } from "../../context/auth";
import moment from "moment";

const OrderDetailsModal = ({ selectedOrder, onUpdateOrder, onClose }) => {
  const [order, setOrder] = useState(selectedOrder);

  // Calculation functions
  const calculateSubtotal = () => {
    return order.products.reduce((total, product) => 
      total + product.price * product.quantity, 0);
  };

  const calculateGST = () => {
    return order.products.reduce((total, product) =>
      total + (product.price * product.quantity * (product.gst || 0)) / 100, 0);
  };

  const calculateTotal = () => {
    const deliveryCharges = order.deliveryCharges || 0;
    const codCharges = order.codCharges || 0;
    const discount = order.discount || 0;
    return calculateSubtotal() + calculateGST() + deliveryCharges + codCharges - discount;
  };

  const calculateAmountPending = () => {
    const total = calculateTotal();
    const amountPaid = order.amount || 0;
    return Math.max(total - amountPaid, 0);
  };

  // Order status handling
  const handleCancelOrder = async () => {
    try {
      const updatedOrder = { ...order, status: 'Cancelled' };
      await axios.put(
        `https://www.smitox.com/api/v1/auth/order-status/${order._id}`,
        { status: 'Cancelled' }
      );
      setOrder(updatedOrder);
      onUpdateOrder(updatedOrder);
      onClose();
    } catch (error) {
      console.error('Error cancelling order:', error);
    }
  };

  // Status buttons render logic
  const renderStatusButtons = () => {
    switch (order.status) {
      case 'Pending':
        return (
          <button className="btn btn-danger" onClick={handleCancelOrder}>
            Cancel Order
          </button>
        );
      case 'Confirmed':
        return (
          <button className="btn btn-success" onClick={() => updateOrderStatus('Accepted')}>
            Accept Order
          </button>
        );
      case 'Dispatched':
        return (
          <>
            <button className="btn btn-primary" onClick={() => updateOrderStatus('Delivered')}>
              Mark Delivered
            </button>
            <button className="btn btn-warning" onClick={() => updateOrderStatus('Returned')}>
              Mark RTO
            </button>
          </>
        );
      default:
        return null;
    }
  };

  const updateOrderStatus = async (newStatus) => {
    try {
      const updatedOrder = { ...order, status: newStatus };
      await axios.put(
        `https://www.smitox.com/api/v1/auth/order-status/${order._id}`,
        { status: newStatus }
      );
      setOrder(updatedOrder);
      onUpdateOrder(updatedOrder);
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  return (
    <div className="modal" tabIndex="-1" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Order Details - #{order._id}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          <div className="modal-body">
            <div className="row mb-4">
              <div className="col-md-6">
                <p><strong>Name:</strong> {order.buyer?.user_fullname}</p>
                <p><strong>Address:</strong> {order.buyer?.address}</p>
                <p><strong>Mobile:</strong> {order.buyer?.mobile_no}</p>
              </div>
              <div className="col-md-6">
                <p><strong>Order Date:</strong> {moment(order.createdAt).format('LLL')}</p>
                <p><strong>Status:</strong> <span className="badge bg-primary">{order.status}</span></p>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table table-bordered table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Product</th>
                    <th className="text-center">Qty</th>
                    <th className="text-end">Price</th>
                    <th className="text-end">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.products.map((product, index) => (
                    <tr key={index}>
                      <td>
                        <div className="d-flex align-items-center">
                          <img
                            src={product.product?.photos || '/default-product.jpg'}
                            alt={product.product?.name}
                            className="img-thumbnail me-2"
                            style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                            onError={(e) => {
                              e.target.src = '/default-product.jpg';
                            }}
                          />
                          <div>
                            <div className="fw-medium">{product.product?.name}</div>
                            <small className="text-muted">SKU: {product.sku || 'N/A'}</small>
                          </div>
                        </div>
                      </td>
                      <td className="text-center">{product.quantity}</td>
                      <td className="text-end">₹{product.price.toFixed(2)}</td>
                      <td className="text-end">₹{(product.price * product.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="row mt-4">
              <div className="col-md-6 ">
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <tbody>
                      <tr>
                        <td><strong>Subtotal</strong></td>
                        <td className="text-end">₹{calculateSubtotal().toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td><strong>GST</strong></td>
                        <td className="text-end">₹{calculateGST().toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td><strong>Delivery Charges</strong></td>
                        <td className="text-end">₹{(order.deliveryCharges || 0).toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td><strong>COD Charges</strong></td>
                        <td className="text-end">₹{(order.codCharges || 0).toFixed(2)}</td>
                      </tr>
                     
                      <tr className="table-active">
                        <td><strong>Total Amount</strong></td>
                        <td className="text-end">₹{calculateTotal().toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td><strong>Discount</strong></td>
                        <td className="text-end">₹{(order.discount || 0).toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td><strong>Amount Paid</strong></td>
                        <td className="text-end">₹{(order.amount || 0).toFixed(2)}</td>
                      </tr>
                      <tr className={calculateAmountPending() > 0 ? 'table-warning' : ''}>
                        <td><strong>Amount Pending</strong></td>
                        <td className="text-end">₹{calculateAmountPending().toFixed(2)}</td>
                      </tr>
                    </tbody>
                    
                  </table>
                  <p className="text-danger">
  <ul>
   
    <li>Courier charge will be added (depends on weight and COD amount).</li>
    <li>10% advance payment is required to confirm the order.</li>
  </ul>
</p>

                </div>
              </div>
            </div>

            {calculateTotal() < 500 && (
              <div className="alert alert-warning mt-3">
                <i className="bi bi-exclamation-triangle me-2"></i>
                Order total is below minimum order amount. Courier charges may apply based on weight and COD amount.
              </div>
            )}
          </div>

          <div className="modal-footer">
            {renderStatusButtons()}
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [auth] = useAuth();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [loading, setLoading] = useState(true);
  
  const statuses = [
    "All",
    "Pending",
    "Confirmed",
    "Accepted",
    "Cancelled",
    "Rejected",
    "Dispatched",
    "Delivered",
    "Returned"
  ];

  useEffect(() => {
    if (auth?.user?._id) {
      fetchOrders();
    }
  }, [auth?.user?._id]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/v1/auth/orders/${auth.user._id}`);
      const sortedOrders = data.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      setOrders(sortedOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredOrders = () => {
    if (selectedStatus === "All") return orders;
    return orders.filter(order => order.status === selectedStatus);
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Delivered': return 'success';
      case 'Cancelled': return 'danger';
      case 'Pending': return 'warning';
      case 'Dispatched': return 'primary';
      default: return 'secondary';
    }
  };

  const handleUpdateOrder = (updatedOrder) => {
    const updatedOrders = orders.map(o => 
      o._id === updatedOrder._id ? updatedOrder : o
    );
    setOrders(updatedOrders.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    ));
  };
  const calculateTotals = (order) => {
    // Handle null/undefined cases
    if (!order || !order.products || !Array.isArray(order.products)) {
      return { 
        subtotal: 0, 
        gst: 0, 
        total: 0 
      };
    }
  
    let subtotal = 0;
    let gst = 0;
  
    // Calculate product totals with safe number conversions
    order.products.forEach(product => {
      // Safely parse numerical values with fallbacks
      const price = Number(product?.price) || 0;
      const quantity = Number(product?.quantity) || 0;
      const productGst = Number(product?.gst) || 0;
  
      // Calculate product contributions
      const productTotal = price * quantity;
      subtotal += productTotal;
      gst += (productTotal * productGst) / 100;
    });
  
    // Parse additional charges with fallbacks
    const deliveryCharges = Number(order.deliveryCharges) || 0;
    const codCharges = Number(order.codCharges) || 0;
    const discount = Number(order.discount) || 0;
  
    // Calculate final total
    const total = subtotal + gst + deliveryCharges + codCharges - discount;
  
    // Return values with consistent 2 decimal places
    return {
      subtotal: Number(subtotal.toFixed(2)),
      gst: Number(gst.toFixed(2)),
      total: Number(total.toFixed(2))
    };
  };
  return (
    <Layout title={"Your Orders"}>
      <div className="container-fluid p-3 dashboard">
        <div className="row">
          <div className="col-md-3">
            <UserMenu />
          </div>
          <div className="col-md-9">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h1>Your Orders</h1>
              <button 
                className="btn btn-sm btn-outline-secondary"
                onClick={fetchOrders}
              >
                <i className="bi bi-arrow-clockwise"></i> Refresh
              </button>
            </div>

            {/* Status Filter */}
            <div className="mb-4" style={{ overflowX: 'auto' }}>
              <div className="d-flex gap-2 pb-2">
                {statuses.map(status => (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={`btn btn-sm ${
                      selectedStatus === status 
                        ? 'btn-primary' 
                        : 'btn-outline-secondary'
                    }`}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="text-center my-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : getFilteredOrders().length === 0 ? (
              <div className="text-center my-5">
                <p className="text-muted">No orders found for this status</p>
              </div>
            ) : (
              <div className="row g-3">
                {getFilteredOrders().map((order, index) => {
                  const totals = calculateTotals(order);
                  return (
                    <div className="col-12" key={order._id}>
                      <div 
                        className="card shadow-sm cursor-pointer"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <h5 className="card-title mb-0">
                              Order #{order._id.substring(0, 8).toUpperCase()}
                            </h5>
                            <span className={`badge bg-${getStatusBadgeColor(order.status)}`}>
                              {order.status}
                            </span>
                          </div>

                          <div className="row text-muted small mb-2">
                            <div className="col-6">
                              <i className="bi bi-calendar me-1"></i>
                              {moment(order.createdAt).format("DD MMM YYYY")}
                            </div>
                            <div className="col-6 text-end">
                              {order.payment?.paymentMethod || 'Unknown'}
                            </div>
                          </div>

                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <span className="fw-medium">Total:</span>{' '}
                              ₹{totals.total.toFixed(2)}
                            </div>
                            <div className="text-muted small">
                              {order.tracking?.id ? (
                                <>
                                  <i className="bi bi-truck me-1"></i>
                                  {order.tracking.company}: {order.tracking.id}
                                </>
                              ) : 'Tracking not available'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedOrder && (
        <OrderDetailsModal
          selectedOrder={selectedOrder}
          onUpdateOrder={handleUpdateOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </Layout>
  );
};
export default Orders;


