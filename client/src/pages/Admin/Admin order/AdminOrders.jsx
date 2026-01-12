import { message } from "antd";
import axios from "axios";
import moment from "moment";
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Form,
  Modal,
  Spinner,
  Table
} from "react-bootstrap";
import AdminMenu from "../../../components/Layout/AdminMenu";
import Layout from "../../../components/Layout/Layout";
import { useAuth } from "../../../context/auth";
import { useSearch } from "../../../context/search";
import OrderModal from "./components/orderModal";

const AdminOrders = () => {
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
  const [orderType, setOrderType] = useState("Pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("newest");

  const [values, setValues] = useSearch();
  const [addProductError, setAddProductError] = useState("");

  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingInfo, setTrackingInfo] = useState({ company: "", id: "" });

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalOrders, setTotalOrders] = useState(0);

  useEffect(() => {
    if (auth?.token) getOrders(orderType, currentPage, searchTerm, sortBy);
  }, [auth?.token, orderType, currentPage, sortBy]);

  const getOrders = async (type = "all", page = 1, search = "", sort = "newest") => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await axios.get(`/api/v1/auth/all-orders`, {
        headers: {
          Authorization: auth?.token
        },
        params: {
          status: type,
          page,
          limit: itemsPerPage,
          search, // Send search query to backend
          sortBy: sort, // Send sort parameter to backend
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
    getOrders(orderType, 1, value, sortBy);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const totalPages = Math.ceil(totalOrders / itemsPerPage);

  useEffect(() => {
    if (auth?.token) getOrders(orderType, currentPage, searchTerm, sortBy);
  }, [auth?.token, orderType, sortBy]);

  const handleStatusChange = async (orderId, value) => {
    try {
      await axios.put(`/api/v1/auth/order-status/${orderId}`,
        { status: value },
        {
          headers: {
            Authorization: auth?.token
          }
        });
      getOrders(orderType, currentPage, searchTerm, sortBy);
      message.success("Order status updated successfully");
    } catch (error) {
      console.log(error);
      message.error("Error updating order status");
    }
  };

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
      [field]:
        field === "status" || field === "payment" ? value : Number(value),
    }));
  };

  const handleProductChange = (index, field, value) => {
    setSelectedOrder((prevOrder) => {
      const updatedProducts = [...prevOrder.products];
      const product = updatedProducts[index];

      // Update the field
      updatedProducts[index] = { ...product, [field]: value };

      // If price is changed, recalculate snapshot data
      if (field === 'price') {
        const quantity = product.quantity || 0;
        const unitPrice = parseFloat(value) || 0;
        const gst = parseFloat(product.gst || product.product?.gst) || 0;

        // Recalculate amounts
        const netAmount = parseFloat((unitPrice * quantity).toFixed(2));
        const taxAmount = parseFloat(((netAmount * gst) / 100).toFixed(2));
        const totalAmount = parseFloat((netAmount + taxAmount).toFixed(2));

        // Update all snapshot fields
        updatedProducts[index] = {
          ...updatedProducts[index],
          unitPrice: unitPrice,
          netAmount: netAmount,
          taxAmount: taxAmount,
          totalAmount: totalAmount
        };
      }

      return { ...prevOrder, products: updatedProducts };
    });
  };

  // Handle quantity change - simple increment/decrement by 1
  const handleQuantityChangeWithUnitSet = (index, increment, customQuantity = null) => {
    setSelectedOrder((prevOrder) => {
      if (!prevOrder?.products) return prevOrder;

      const product = prevOrder.products[index];
      const currentQuantity = product.quantity || 0;

      // Handle custom quantity input or simple increments
      let newQuantity;
      if (customQuantity !== null) {
        // Custom quantity entered manually
        newQuantity = customQuantity;
      } else {
        // Simple increment/decrement by 1
        newQuantity = increment
          ? currentQuantity + 1  // Add 1 for increment
          : currentQuantity - 1; // Subtract 1 for decrement
      }

      // Don't allow negative quantities
      const updatedQuantity = Math.max(0, newQuantity);

      // If quantity becomes 0, remove the product from the order
      if (updatedQuantity === 0) {
        const updatedProducts = prevOrder.products.filter((_, i) => i !== index);
        return { ...prevOrder, products: updatedProducts };
      }

      // Recalculate snapshot data when quantity changes
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
        totalAmount: totalAmount
      };

      return { ...prevOrder, products: updatedProducts };
    });
  };

  const calculateTotals = () => {
    if (!selectedOrder || !selectedOrder.products)
      return { subtotal: 0, gst: 0, total: 0 };

    // Use snapshot price data (unitPrice or price)
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


  const handleAddToOrder = async (product) => {
    try {
      if (product.isActive === "0" || product.stock <= 0) {
        let errorMessage = "Cannot add product: ";
        if (product.isActive === "0") errorMessage += "Product is inactive";
        if (product.stock <= 0) errorMessage += "Product is out of stock";

        message.error(errorMessage);
        return;
      }

      // Capture current paid amount before adding product
      const originalAmount = selectedOrder.amount;

      // Send only essential data to server
      const addResponse = await axios.put(
        `/api/v1/auth/order/${selectedOrder._id}/add`,
        {
          productId: product._id,
          quantity: product.unitSet || 1 // Ensure minimum quantity
        },
        {
          headers: {
            Authorization: auth?.token
          }
        }
      );

      if (!addResponse.data.success) {
        throw new Error(addResponse.data.message);
      }

      // Preserve original amount in the updated order data
      const updatedOrder = {
        ...addResponse.data.order,
        amount: originalAmount // Maintain the original paid amount
      };

      // Update local state with preserved amount
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

      const response = await axios.put(`/api/v1/auth/order/${_id}`, {
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
        {
          headers: {
            Authorization: auth?.token
          }
        });

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

  const handleDeleteProduct = async (index) => {
    if (index >= 0 && index < selectedOrder.products.length) {
      try {
        const productToRemove = selectedOrder.products[index];
        const updatedProducts = selectedOrder.products.filter(
          (_, i) => i !== index
        );
        const updatedOrder = { ...selectedOrder, products: updatedProducts };
        setSelectedOrder(updatedOrder);

        const response = await axios.delete(
          `/api/v1/auth/order/${selectedOrder._id}/remove-product/${productToRemove._id}`,
          {
            headers: {
              Authorization: auth?.token
            }
          }
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
      await axios.put(`/api/v1/auth/order-status/${selectedOrder._id}`, {
        status: "Delivered",
      },
        {
          headers: {
            Authorization: auth?.token
          }
        });
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
      await axios.put(`/api/v1/auth/order-status/${selectedOrder._id}`, {
        status: "Returned",
      },
        {
          headers: {
            Authorization: auth?.token
          }
        });
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
        {
          responseType: "blob",
        }
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

  const getStatusPillClass = (status) => {
    switch (status) {
      case "Completed":
      case "Delivered":
      case "Accepted":
      case "Confirmed":
        return "status-pill status-pill--success";
      case "Pending":
        return "status-pill status-pill--warning";
      case "Cancelled":
      case "Rejected":
      case "Returned":
        return "status-pill status-pill--danger";
      case "Cash on Delivery":
      case "Dispatched":
      default:
        return "status-pill status-pill--info";
    }
  };

  const handleAddTracking = async () => {
    try {
      if (!trackingInfo.company.trim() || !trackingInfo.id.trim()) {
        message.error("Please enter both tracking company and tracking ID");
        return;
      }

      const response = await axios.put(
        `/api/v1/auth/order/${selectedOrder._id}/tracking`,
        trackingInfo,
        {
          headers: {
            Authorization: auth?.token
          }
        }
      );

      if (response.data.success) {
        message.success("Tracking information added successfully");
        setTrackingInfo({ company: "", id: "" });
        handleTrackingModalClose();
        getOrders(orderType, currentPage, searchTerm);
      } else {
        message.error(response.data.message || "Error adding tracking information");
      }
    } catch (error) {
      console.log("Error adding tracking:", error);
      message.error(error.response?.data?.message || "Error adding tracking information");
    }
  };

  return (
    <Layout title={"All Orders Data"}>
      <AdminMenu />
      <div className="container-fluid dashboard">
        <div className="orders-container">
          <div className="admin-page-header">
            <div>
              <h1 className="admin-page-title">Orders</h1>
              <p className="admin-page-subtitle">View and manage all customer orders.</p>
            </div>
          </div>

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

          <div className="search-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: '1.5rem', maxWidth: '450px' }}>
            <svg
              className="search-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              style={{
                position: 'absolute',
                left: '12px',
                width: '18px',
                height: '18px',
                color: '#64748b',
                pointerEvents: 'none',
                zIndex: 1
              }}
            >
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Search orders by ID, buyer name..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 40px',
                fontSize: '14px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                outline: 'none'
              }}
            />
            {/* Commented out Sort By option per user request */}
            {/* <div className="sort-dropdown ms-3">
              <select
                className="form-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  width: "180px",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  fontSize: "14px",
                  border: "1px solid #e2e8f0",
                  backgroundColor: "#fff",
                  cursor: "pointer",
                }}
              >
                <option value="newest">Latest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div> */}
          </div>

          {loading ? (
            <Spinner animation="border" role="status">
              <span className="sr-only">Loading...</span>
            </Spinner>
          ) : error ? (
            <Alert variant="danger">{error}</Alert>
          ) : orders.length === 0 ? (
            <Alert variant="info">No orders found</Alert>
          ) : (
            <>
              <div className="admin-table-wrapper table-responsive">
                <Table
                  striped
                  hover
                  className="admin-table"
                  cellSpacing="0"
                  cellPadding="0"
                >
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
                    {orders.map((o, index) => {
                      const totals = calculateTotalsad(o);
                      return (
                        <tr key={o._id}>
                          <td>
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </td>
                          <td className="order-info-cell">
                            <div className="buyer-name">{o.buyer?.user_fullname || 'N/A'}</div>
                            <div className="buyer-phone">{o.buyer?.mobile_no || 'N/A'}</div>
                            <div className="order-id-badge" onClick={() => handleShow(o)}>
                              {o._id.substring(0, 10)}
                            </div>
                            {(() => {
                              const trackingId = o?.shipment?.trackingId ?? o?.tracking?.id ?? o?.trackingId ?? "";
                              const hasTracking = Boolean(trackingId && String(trackingId).trim().length);
                              return hasTracking ? (
                                <div className="mt-1 text-xs text-slate-600">
                                  <span className="uppercase tracking-wide font-semibold">Tracking ID:</span>
                                  <span className="ml-1 font-mono break-all">{trackingId}</span>
                                </div>
                              ) : null;
                            })()}
                          </td>
                          <td className="total-cell">Rs {totals.total.toFixed(2)}</td>
                          <td className="payment-cell">{o.payment?.paymentMethod || 'COD'}</td>
                          <td className="status-cell">
                            <span className={`status-badge status-${o.status.toLowerCase()}`}>
                              {o.status}
                            </span>
                          </td>
                          <td className="date-cell">
                            {moment(o.createdAt).format('DD-MM-YYYY')}
                          </td>
                          <td className="action-cell">
                            <div className="action-buttons-stack">
                              <Button
                                className="view-btn"
                                onClick={() => handleShow(o)}
                              >
                                View
                              </Button>
                              {(() => {
                                const trackingId = o?.shipment?.trackingId ?? o?.tracking?.id ?? o?.trackingId ?? "";
                                const hasTracking = Boolean(trackingId && String(trackingId).trim().length);
                                return !hasTracking ? (
                                  <Button
                                    className="track-btn"
                                    onClick={() => handleTrackingModalShow(o)}
                                    aria-label="Add tracking"
                                  >
                                    + Track
                                  </Button>
                                ) : null;
                              })()}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>

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

                  {(() => {
                    const pages = [];
                    const firstPages = 4;
                    const lastPages = 4;
                    const totalPagesToShow = firstPages + lastPages;

                    if (totalPages <= totalPagesToShow) {
                      // Show all pages if total is less than or equal to 8
                      for (let i = 1; i <= totalPages; i++) {
                        pages.push(i);
                      }
                    } else {
                      // Show first 4 pages
                      for (let i = 1; i <= firstPages; i++) {
                        pages.push(i);
                      }

                      // Add dots if there's a gap
                      if (firstPages < totalPages - lastPages) {
                        pages.push("...");
                      }

                      // Show last 4 pages
                      for (let i = totalPages - lastPages + 1; i <= totalPages; i++) {
                        pages.push(i);
                      }
                    }

                    return pages.map((pageNumber, index) => {
                      if (pageNumber === "...") {
                        return (
                          <span key={`dots-${index}`} className="pagination-dots">
                            ...
                          </span>
                        );
                      }
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
                    });
                  })()}

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
          handleStatusChange={handleStatusChange}
          handleUpdateOrder={handleUpdateOrder}
          handleDelivered={handleDelivered}
          handleReturned={handleReturned}
          getOrders={getOrders}
          orderType={orderType}
          onOrderUpdate={(updatedOrder) => {
            setSelectedOrder(updatedOrder);
            getOrders(orderType, currentPage, searchTerm);
          }}
          handleAddToOrder={(product) => handleAddToOrder(product).catch(error => {
            setAddProductError(error.message);
          })}
        />
      )}

      <Modal
        show={showTrackingModal}
        onHide={handleTrackingModalClose}
        className="tracking-modal"
        size="sm"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Add Tracking Information</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Tracking Company</Form.Label>
              <Form.Control
                type="text"
                name="company"
                value={trackingInfo.company}
                onChange={handleTrackingInfoChange}
                placeholder="e.g., FedEx, DHL, Courier"
                autoFocus
              />
            </Form.Group>
            <Form.Group className="mb-0">
              <Form.Label>Tracking ID</Form.Label>
              <Form.Control
                type="text"
                name="id"
                value={trackingInfo.id}
                onChange={handleTrackingInfoChange}
                placeholder="e.g., 1234567890"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleTrackingModalClose}>
            Close
          </Button>
          <Button variant="primary" onClick={handleAddTracking}>
            Add Tracking
          </Button>
        </Modal.Footer>
      </Modal>

    </Layout>
  );
};

export default AdminOrders;
