import { message } from "antd";
import axios from "axios";
import moment from "moment";
import { useEffect, useState } from "react";
import AdminMenu from "../../components/Layout/AdminMenu";
import Layout from "../../components/Layout/Layout";
import { useAuth } from "../../context/auth";
import { useSearch } from "../../context/search";
import OrderModal from "./Admin order/components/orderModal";
import "./adminOrdersNew.css";

const AdminOrdersNew = () => {
  const [status] = useState([
    "Pending",
    "Confirmed",
    "Accepted",
    "Cancelled",
    "Rejected",
    "Dispatched",
    "Delivered",
    "Returned",
  ]);
  const [orders, setOrders] = useState([]);
  const [auth] = useAuth();
  const [show, setShow] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderType, setOrderType] = useState("all-orders");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [values, setValues] = useSearch();
  const [addProductError, setAddProductError] = useState("");
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingInfo, setTrackingInfo] = useState({ company: "", id: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalOrders, setTotalOrders] = useState(0);
  const [sortBy, setSortBy] = useState("newest"); // Default sort by newest

  useEffect(() => {
    if (auth?.token) getOrders(orderType, currentPage, searchTerm);
  }, [auth?.token, orderType, currentPage, sortBy]); // Add sortBy dependency

  const getOrders = async (type = "all-orders", page = 1, search = "") => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await axios.get(`/api/v1/auth/all-orders`, {
        headers: { Authorization: auth?.token },
        params: {
          status: type,
          page,
          limit: itemsPerPage,
          search,
          sortBy // Pass sort parameter
        },
      });
      setOrders(Array.isArray(data.orders) ? data.orders : []);
      setTotalOrders(data.total);
    } catch (error) {
      console.log(error);
      setError("Error fetching orders. Please try again.");
      message.error("Error fetching orders");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
    getOrders(orderType, 1, value);
  };

  const handlePageChange = (newPage) => {
    const totalPages = Math.ceil(totalOrders / itemsPerPage);
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const totalPages = Math.ceil(totalOrders / itemsPerPage);

  const handleShow = (order) => {
    setSelectedOrder(order);
    setShow(true);
  };

  const handleClose = () => {
    setShow(false);
    setValues({ ...values, keyword: "", results: [] });
  };

  const handleInputChange = (field, value) => {
    setSelectedOrder((prevOrder) => ({
      ...prevOrder,
      [field]: field === "status" || field === "payment" ? value : Number(value),
    }));
  };

  const handleProductChange = (index, field, value) => {
    setSelectedOrder((prevOrder) => {
      const updatedProducts = [...prevOrder.products];
      const product = updatedProducts[index];
      updatedProducts[index] = { ...product, [field]: value };

      if (field === "price") {
        const quantity = product.quantity || 0;
        const unitPrice = parseFloat(value) || 0;
        const gst = parseFloat(product.gst || product.product?.gst) || 0;
        const netAmount = parseFloat((unitPrice * quantity).toFixed(2));
        const taxAmount = parseFloat(((netAmount * gst) / 100).toFixed(2));
        const totalAmount = parseFloat((netAmount + taxAmount).toFixed(2));

        updatedProducts[index] = {
          ...updatedProducts[index],
          unitPrice: unitPrice,
          netAmount: netAmount,
          taxAmount: taxAmount,
          totalAmount: totalAmount,
        };
      }

      return { ...prevOrder, products: updatedProducts };
    });
  };

  const handleQuantityChangeWithUnitSet = (index, increment, customQuantity = null) => {
    setSelectedOrder((prevOrder) => {
      if (!prevOrder?.products) return prevOrder;

      const product = prevOrder.products[index];
      const currentQuantity = product.quantity || 0;

      let newQuantity;
      if (customQuantity !== null) {
        newQuantity = customQuantity;
      } else {
        newQuantity = increment ? currentQuantity + 1 : currentQuantity - 1;
      }

      const updatedQuantity = Math.max(0, newQuantity);

      if (updatedQuantity === 0) {
        const updatedProducts = prevOrder.products.filter((_, i) => i !== index);
        return { ...prevOrder, products: updatedProducts };
      }

      const unitPrice = parseFloat(product.unitPrice || product.price) || 0;
      const gst = parseFloat(product.gst || product.product?.gst) || 0;
      const netAmount = parseFloat((unitPrice * updatedQuantity).toFixed(2));
      const taxAmount = parseFloat(((netAmount * gst) / 100).toFixed(2));
      const totalAmount = parseFloat((netAmount + taxAmount).toFixed(2));

      const updatedProducts = [...prevOrder.products];
      updatedProducts[index] = {
        ...updatedProducts[index],
        quantity: updatedQuantity,
        netAmount: netAmount,
        taxAmount: taxAmount,
        totalAmount: totalAmount,
      };

      return { ...prevOrder, products: updatedProducts };
    });
  };

  const calculateTotals = () => {
    if (!selectedOrder || !selectedOrder.products)
      return { subtotal: 0, gst: 0, total: 0 };

    const subtotal = selectedOrder.products.reduce((acc, product) => {
      const quantity = Number(product.quantity) || 0;
      const unitPrice = Number(product.unitPrice || product.price) || 0;
      return acc + unitPrice * quantity;
    }, 0);

    const gst = selectedOrder.products.reduce((acc, product) => {
      const quantity = Number(product.quantity) || 0;
      const unitPrice = Number(product.unitPrice || product.price) || 0;
      const productGst = Number(product.gst || product.product?.gst) || 0;
      return acc + (unitPrice * quantity * productGst) / 100;
    }, 0);

    const total =
      subtotal +
      gst +
      (Number(selectedOrder.deliveryCharges) || 0) +
      (Number(selectedOrder.codCharges) || 0) -
      (Number(selectedOrder.discount) || 0);

    return { subtotal, gst, total };
  };

  const calculateTotalsad = (order) => {
    if (!order || !order.products) return { subtotal: 0, gst: 0, total: 0 };

    const subtotal = order.products.reduce(
      (acc, product) => acc + Number(product.price) * Number(product.quantity),
      0
    );

    const gst = order.products.reduce((acc, product) => {
      return (
        acc +
        (Number(product.price) *
          Number(product.quantity) *
          (Number(product.gst) || 0)) /
        100
      );
    }, 0);

    const total =
      subtotal +
      gst +
      Number(order.deliveryCharges || 0) +
      Number(order.codCharges || 0) -
      Number(order.discount || 0);

    return { subtotal, gst, total };
  };

  const handleAddToOrder = async (product) => {
    try {
      if (product.isActive === "0" || product.stock <= 0) {
        let errorMessage = "Cannot add product: ";
        if (product.isActive === "0") errorMessage += "Product is inactive";
        if (product.stock <= 0) errorMessage += "Product is out of stock";
        message.error(errorMessage);
        return;
      }

      const originalAmount = selectedOrder.amount;

      const addResponse = await axios.put(
        `/api/v1/auth/order/${selectedOrder._id}/add`,
        { productId: product._id, quantity: product.unitSet || 1 },
        { headers: { Authorization: auth?.token } }
      );

      if (!addResponse.data.success) {
        throw new Error(addResponse.data.message);
      }

      const updatedOrder = {
        ...addResponse.data.order,
        amount: originalAmount,
      };

      setSelectedOrder(updatedOrder);
      message.success("Product added successfully");
      getOrders(orderType, currentPage, searchTerm);
    } catch (error) {
      console.error("Add to order error:", error);
      setAddProductError(error.response?.data?.message || "Error adding product to order");
    }
  };

  const handleUpdateOrder = async () => {
    try {
      const {
        _id,
        status,
        codCharges,
        deliveryCharges,
        discount,
        amount,
        products,
      } = selectedOrder;

      const numericCodCharges = Number(codCharges) || 0;
      const numericDeliveryCharges = Number(deliveryCharges) || 0;
      const numericDiscount = Number(discount) || 0;
      const numericAmount = Number(amount) || 0;

      const response = await axios.put(
        `/api/v1/auth/order/${_id}`,
        {
          status,
          codCharges: numericCodCharges,
          deliveryCharges: numericDeliveryCharges,
          discount: numericDiscount,
          amount: numericAmount,
          products: products.map((p) => ({
            _id: p._id,
            quantity: Number(p.quantity) || 0,
            price: Number(p.price) || 0,
          })),
        },
        { headers: { Authorization: auth?.token } }
      );

      if (response.data.success) {
        setSelectedOrder(response.data.order);
        setShow(false);
        getOrders(orderType, currentPage, searchTerm);
        message.success("Order updated successfully");
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      console.log("Error details:", error);
      message.error("Error updating order");
    }
  };

  const handleDeleteProduct = async (index) => {
    if (index >= 0 && index < selectedOrder.products.length) {
      try {
        const productToRemove = selectedOrder.products[index];
        const updatedProducts = selectedOrder.products.filter((_, i) => i !== index);
        const updatedOrder = { ...selectedOrder, products: updatedProducts };
        setSelectedOrder(updatedOrder);

        const response = await axios.delete(
          `/api/v1/auth/order/${selectedOrder._id}/remove-product/${productToRemove._id}`,
          { headers: { Authorization: auth?.token } }
        );

        if (response.data.success) {
          getOrders(orderType, currentPage, searchTerm);
          message.success("Product removed from order successfully");
        } else {
          message.error(response.data.message);
        }
      } catch (error) {
        console.log(error);
        message.error("Error removing product from order");
      }
    } else {
      message.error("Product index is out of range");
    }
  };

  const handleDelivered = async () => {
    try {
      await axios.put(
        `/api/v1/auth/order-status/${selectedOrder._id}`,
        { status: "Delivered" },
        { headers: { Authorization: auth?.token } }
      );
      setShow(false);
      getOrders(orderType, currentPage, searchTerm);
      message.success("Order status updated to Delivered");
    } catch (error) {
      console.log(error);
      message.error("Error updating order status to Delivered");
    }
  };

  const handleReturned = async () => {
    try {
      await axios.put(
        `/api/v1/auth/order-status/${selectedOrder._id}`,
        { status: "Returned" },
        { headers: { Authorization: auth?.token } }
      );
      setShow(false);
      getOrders(orderType, currentPage, searchTerm);
      message.success("Order status updated to Returned");
    } catch (error) {
      console.log(error);
      message.error("Error updating order status to Returned");
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await axios.get(
        `/api/v1/auth/order/${selectedOrder._id}/invoice`,
        { responseType: "blob" }
      );

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `invoice-${selectedOrder._id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.log(error);
      message.error("Error downloading order invoice");
    }
  };

  const handleTrackingModalShow = (order) => {
    setSelectedOrder(order);
    setShowTrackingModal(true);
  };

  const handleTrackingModalClose = () => {
    setShowTrackingModal(false);
    setTrackingInfo({ company: "", id: "" });
  };

  const handleTrackingInfoChange = (e) => {
    setTrackingInfo({ ...trackingInfo, [e.target.name]: e.target.value });
  };

  const handleAddTracking = async () => {
    try {
      await axios.put(
        `/api/v1/auth/order/${selectedOrder._id}/tracking`,
        trackingInfo,
        { headers: { Authorization: auth?.token } }
      );
      message.success("Tracking information added successfully");
      getOrders(orderType);
      handleTrackingModalClose();
    } catch (error) {
      console.log(error);
      message.error("Error adding tracking information");
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Delivered":
      case "Accepted":
      case "Confirmed":
        return "status-badge status-badge--success";
      case "Pending":
        return "status-badge status-badge--warning";
      case "Cancelled":
      case "Rejected":
      case "Returned":
        return "status-badge status-badge--danger";
      case "Dispatched":
      default:
        return "status-badge status-badge--info";
    }
  };

  return (
    <Layout title={"All Orders Data"}>
      <AdminMenu />
      <div className="orders-container">
        <div className="orders-header">
          <div>
            <h1 className="orders-title">Orders</h1>
            <p className="orders-subtitle">View and manage all customer orders.</p>
          </div>
        </div>

        {/* Status Filter Buttons */}
        <div className="status-filters">
          <button
            className={`filter-btn ${orderType === "all-orders" ? "active" : ""}`}
            onClick={() => setOrderType("all-orders")}
          >
            All orders
          </button>
          {status.map((s, index) => (
            <button
              key={index}
              className={`filter-btn ${orderType === s ? "active" : ""}`}
              onClick={() => setOrderType(s)}
            >
              {s} orders
            </button>
          ))}
        </div>

        {/* Search Input and Sort */}
        <div className="search-wrapper" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Search orders by ID, buyer name..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          <div className="sort-wrapper">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="form-select"
              style={{
                padding: '0.6rem 1rem',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                outline: 'none',
                minWidth: '150px'
              }}
            >
              <option value="newest">Latest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading orders...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <p>No orders found</p>
          </div>
        ) : (
          <>
            <div className="orders-table-wrapper">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Order Info</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, index) => {
                    const totals = calculateTotalsad(order);
                    return (
                      <tr key={order._id}>
                        <td className="row-number">
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </td>
                        <td className="order-info-cell">
                          <div className="buyer-name">{order.buyer?.user_fullname || "N/A"}</div>
                          <div className="buyer-phone">{order.buyer?.mobile_no || "N/A"}</div>
                          <div className="order-id-badge">{order._id.substring(0, 10)}</div>
                          {order.tracking ? (
                            <div className="tracking-info">
                              {order.tracking.company}: {order.tracking.id}
                            </div>
                          ) : (
                            <button
                              className="add-tracking-btn"
                              onClick={() => handleTrackingModalShow(order)}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                              </svg>
                              Add Tracking ID
                            </button>
                          )}
                        </td>
                        <td className="total-cell">${totals.total.toFixed(2)}</td>
                        <td className="payment-cell">{order.payment?.paymentMethod || "COD"}</td>
                        <td className="status-cell">
                          <span className={getStatusBadgeClass(order.status)}>
                            {order.status}
                          </span>
                        </td>
                        <td className="date-cell">
                          {moment(order.createdAt).format("DD-MM-YYYY")}
                        </td>
                        <td className="action-cell">
                          <button
                            className="view-btn"
                            onClick={() => handleShow(order)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="pagination-wrapper">
              <span className="pagination-info">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, totalOrders)} of{" "}
                {totalOrders} orders
              </span>
              <div className="pagination-controls">
                <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                >
                  Previous
                </button>

                {[...Array(totalPages)].map((_, index) => {
                  const pageNumber = index + 1;
                  return (
                    <button
                      key={pageNumber}
                      className={`pagination-btn ${currentPage === pageNumber ? "active" : ""}`}
                      onClick={() => handlePageChange(pageNumber)}
                      disabled={loading}
                    >
                      {pageNumber}
                    </button>
                  );
                })}

                <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || loading}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {selectedOrder && (
        <OrderModal
          show={show}
          handleClose={handleClose}
          selectedOrder={selectedOrder}
          status={status}
          handleInputChange={handleInputChange}
          handleProductChange={handleProductChange}
          handleQuantityChangeWithUnitSet={handleQuantityChangeWithUnitSet}
          calculateTotals={calculateTotals}
          handleDeleteProduct={handleDeleteProduct}
          handleDownloadPDF={handleDownloadPDF}
          handleUpdateOrder={handleUpdateOrder}
          handleDelivered={handleDelivered}
          handleReturned={handleReturned}
          getOrders={getOrders}
          orderType={orderType}
          onOrderUpdate={(updatedOrder) => {
            setSelectedOrder(updatedOrder);
            getOrders(orderType, currentPage, searchTerm);
          }}
          handleAddToOrder={(product) =>
            handleAddToOrder(product).catch((error) => {
              setAddProductError(error.message);
            })
          }
        />
      )}

      {/* Tracking Modal */}
      <div className={`modal-overlay ${showTrackingModal ? "active" : ""}`} onClick={handleTrackingModalClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Add Tracking Information</h2>
            <button className="modal-close" onClick={handleTrackingModalClose}>
              ✕
            </button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label>Tracking Company</label>
              <input
                type="text"
                name="company"
                value={trackingInfo.company}
                onChange={handleTrackingInfoChange}
                placeholder="Enter tracking company name"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Tracking ID</label>
              <input
                type="text"
                name="id"
                value={trackingInfo.id}
                onChange={handleTrackingInfoChange}
                placeholder="Enter tracking ID"
                className="form-input"
              />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn-secondary" onClick={handleTrackingModalClose}>
              Close
            </button>
            <button className="btn-primary" onClick={handleAddTracking}>
              Add Tracking
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminOrdersNew;
