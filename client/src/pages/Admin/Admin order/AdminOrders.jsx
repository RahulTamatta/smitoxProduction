import { message } from "antd";
import axios from "axios";
import moment from "moment";
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Col,
  Form,
  Modal,
  Nav,
  Row,
  Spinner,
  Table
} from "react-bootstrap";
import { useAuth } from "../../../context/authContext";
import { useSearch } from "../../../context/search";
import AdminLayout from "../../../features/admin/components/layout/AdminLayout";
import OrderModal from "./components/orderModal";
import SearchModal from "./components/searchModal";

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
  const [orderType, setOrderType] = useState("all-orders");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [values, setValues] = useSearch();
const [addProductError, setAddProductError] = useState("");

  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingInfo, setTrackingInfo] = useState({ company: "", id: "" });

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalOrders, setTotalOrders] = useState(0);
  
  // Sorting and filtering states
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [paymentFilter, setPaymentFilter] = useState("all");

  useEffect(() => {
    if (auth?.token) getOrders(orderType, currentPage, searchTerm);
  }, [auth?.token, orderType, currentPage]);

  const getOrders = async (type = "all", page = 1, search = "") => {
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
          sortBy, // Send sorting field
          sortOrder, // Send sorting order
          paymentFilter, // Send payment filter
        },
      });
      setOrders(Array.isArray(data.orders) ? data.orders : []);
      setTotalOrders(data.total);
      
      // Debug logging - remove in production
      if (data.orders && data.orders.length > 0) {
        console.log('Order data structure:', data.orders[0]);
        if (data.orders[0].products && data.orders[0].products.length > 0) {
          console.log('Product structure:', data.orders[0].products[0]);
        }
      }
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
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const totalPages = Math.ceil(totalOrders / itemsPerPage);

  useEffect(() => {
    if (auth?.token) getOrders(orderType, currentPage, searchTerm);
  }, [auth?.token, orderType, sortBy, sortOrder, paymentFilter]);

  const handleStatusChange = async (orderId, value) => {
    try {
      await axios.put(`/api/v1/auth/order-status/${orderId}`, 
        { status: value },
        {
          headers: {
            Authorization: auth?.token
          }
        });
      getOrders(orderType, currentPage, searchTerm);
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
      if (!prevOrder?.products) return prevOrder;
      const updatedProducts = [...prevOrder.products];
      updatedProducts[index] = {
        ...updatedProducts[index],
        [field]: Number(value),
      };
      return { ...prevOrder, products: updatedProducts };
    });
  };

  const calculateTotals = () => {
    if (!selectedOrder || !selectedOrder.products)
      return { subtotal: 0, gst: 0, total: 0 };

    const subtotal = selectedOrder.products.reduce(
      (acc, product) => acc + Number(product.price) * Number(product.quantity),
      0
    );

    const gst = selectedOrder.products.reduce((acc, product) => {
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
      (Number(selectedOrder.deliveryCharges) || 0) +
      (Number(selectedOrder.codCharges) || 0) -
      (Number(selectedOrder.discount) || 0);

    return { subtotal, gst, total };
  };

  const handleAddClick = () => {
    setShowSearchModal(true);
  };

  const handleCloseSearchModal = () => {
    setShowSearchModal(false);
    // Removed setSearchKeyword and setSearchResults as they are not defined

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

      // Set the fresh order data from the API response
      // The backend now properly populates buyer information
      setSelectedOrder(addResponse.data.order);
      message.success("Product added successfully");
      handleCloseSearchModal();
      
      // Refresh the orders list
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

        // Use the product ObjectId for deletion
        const productId = typeof productToRemove.product === 'object' 
          ? productToRemove.product._id 
          : productToRemove.product;
          
        const response = await axios.delete(
          `/api/v1/auth/order/${selectedOrder._id}/remove-product/${productId}`,
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

  const handleDownloadPDF = () => {
    try {
      // Open PDF in new tab instead of downloading
      window.open(`/api/v1/auth/order/${selectedOrder._id}/invoice`, '_blank');
    } catch (error) {
      console.log(error);
      message.error("Error opening order invoice");
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
        {
          headers: {
            Authorization: auth?.token
          }
        }
      );
      message.success("Tracking information added successfully");
      getOrders(orderType);
      handleTrackingModalClose();
    } catch (error) {
      console.log(error);
      message.error("Error adding tracking information");
    }
  };

  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setSortOrder("desc");
    }
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  return (
    <AdminLayout title={"All Orders Data"}>
      <div className="row dashboard">
        <div className="col-md-12">
          <Nav variant="pills" className="mb-3">
            <Nav.Item>
              <Nav.Link
                active={orderType === "all-orders"}
                onClick={() => setOrderType("all-orders")}
                style={{
                  backgroundColor: orderType === "all-orders" ? "blue" : "red",
                  color: orderType === "all-orders" ? "white" : "red",
                }}
              >
                All orders
              </Nav.Link>
            </Nav.Item>
            {status.map((s, index) => (
              <Nav.Item key={index}>
                <Nav.Link
                  active={orderType === s}
                  onClick={() => setOrderType(s)}
                  style={{
                    backgroundColor: orderType === s ? "blue" : "red",
                    color: orderType === s ? "white" : "red",
                  }}
                >
                  {s} orders
                </Nav.Link>
              </Nav.Item>
            ))}
          </Nav>

          <div className="mb-4">
            <Row>
              <Col md={6}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search orders by ID, buyer name..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </Col>
              <Col md={3}>
                <div className="d-flex align-items-center">
                  <span className="me-2">Sort By:</span>
                  <Form.Select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                  >
                    <option value="createdAt">Date {sortOrder === "desc" ? "(New → Old)" : "(Old → New)"}</option>
                    <option value="total">Total Amount {sortOrder === "desc" ? "(High → Low)" : "(Low → High)"}</option>
                  </Form.Select>
                </div>
              </Col>
              <Col md={3}>
                <div className="d-flex align-items-center">
                  <span className="me-2">Payment:</span>
                  <Form.Select
                    value={paymentFilter}
                    onChange={(e) => setPaymentFilter(e.target.value)}
                  >
                    <option value="all">All Payment Types</option>
                    <option value="cod">Cash on Delivery</option>
                    <option value="razorpay">Razorpay</option>
                  </Form.Select>
                </div>
              </Col>
            </Row>
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
       <Table 
  striped 
  bordered 
  hover 
  style={{ width: '100%', fontSize: '1rem', borderSpacing: '0px', borderCollapse: 'collapse' }} 
  cellSpacing="0" 
  cellPadding="0"
>
  <thead>
    <tr>
      <th style={{ fontSize: '0.8rem', padding: '4px' }}>#</th>
<th 
  style={{ fontSize: '0.8rem', padding: '4px', cursor: 'pointer' }}
  onClick={() => handleSortChange('orderId')}
>
  Order Id <span style={{ fontWeight: 'bold' }}>{sortBy === 'orderId' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}</span>
</th>
      {/* <th style={{ fontSize: '0.8rem', padding: '4px' }}>Tracking Information</th> */}
<th 
  style={{ fontSize: '0.8rem', padding: '4px', cursor: 'pointer' }}
  onClick={() => handleSortChange('total')}
>
  Total <span style={{ fontWeight: 'bold' }}>{sortBy === 'total' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}</span>
</th>
      <th style={{ fontSize: '0.8rem', padding: '4px' }}>Payment</th>
      <th style={{ fontSize: '0.8rem', padding: '4px' }}>Status</th>
<th 
  style={{ fontSize: '0.8rem', padding: '4px', cursor: 'pointer' }}
  onClick={() => handleSortChange('createdAt')}
>
  Created <span style={{ fontWeight: 'bold' }}>{sortBy === 'createdAt' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}</span>
</th>
      <th style={{ fontSize: '0.8rem', padding: '4px' }}>Actions</th>
    </tr>
  </thead>

  <tbody>
    {orders.map((o, index) => {
      const totals = calculateTotalsad(o);
      return (
        <tr key={o._id} style={{ fontSize: '0.7rem', padding: '2px' }}>
          <td style={{ fontSize: '0.7rem', padding: '2px' }}>
            {(currentPage - 1) * itemsPerPage + index + 1}
          </td>
          <td style={{ fontSize: '0.7rem', padding: '2px' }}>
            <table style={{ width: '100%' }}>
            <td style={{ fontSize: '0.7rem', padding: '2px' }}>
  {o.buyer?.user_fullname || 'N/A'}
</td>
              <tr>
      <td style={{ fontSize: '0.7rem', padding: '2px' }}>
  <div
    style={{
      display: 'inline-block', // Makes the box inline
      padding: '4px 8px', // Add some padding for better readability
      border: '1px solid #007bff', // Blue border to match button theme
      borderRadius: '4px', // Rounded corners
      backgroundColor: '#e7f1ff', // Light blue background
      fontWeight: 'bold', // Make the text bold
      color: '#007bff', // Blue text for contrast
      textAlign: 'center', // Center align the text
      cursor: 'pointer', // Pointer cursor for clickable appearance
      width: 'fit-content', // Adjust width dynamically
      transition: 'background-color 0.2s ease', // Smooth hover effect
    }}
    onMouseEnter={(e) =>
      (e.target.style.backgroundColor = '#cfe2ff') // Highlight on hover
    }
    onMouseLeave={(e) =>
      (e.target.style.backgroundColor = '#e7f1ff') // Reset on mouse leave
    }
    onClick={() => handleShow(o)} // Opens the modal
  >
    {o._id.substring(0, 10)}
  </div>
</td>

              </tr>
              <td style={{ fontSize: '0.7rem', padding: '2px' }}>
  {o.buyer?.mobile_no || 'N/A'}
</td>
            </table>
            {o.tracking ? (
              `${o.tracking.company}: ${o.tracking.id}`
            ) : (
              <Button
                variant="primary"
                style={{
                  fontSize: '0.6rem',
                  padding: '2px 4px',
                  borderRadius: '3px',
                  margin: '2px 0',
                  backgroundColor: '#007bff',
                  color: '#fff',
                  border: 'none',
                }}
                onClick={() => handleTrackingModalShow(o)}
              >
                Add Tracking ID
              </Button>
            )}
          </td>
          <td style={{ fontSize: '0.7rem', padding: '2px' }}>{totals.total.toFixed(2)}</td>
          <td style={{ fontSize: '0.7rem', padding: '2px' }}>{o.payment.paymentMethod}</td>
          <td style={{ fontSize: '0.7rem', padding: '2px' }}>{o.status}</td>
          <td style={{ fontSize: '0.7rem', padding: '2px' }}>
            {moment(o.createdAt).format('DD-MM-YYYY')}
          </td>
          <td style={{ fontSize: '0.7rem', padding: '2px' }}>
            <Button
              variant="info"
              style={{
                fontSize: '0.6rem',
                padding: '2px 4px',
                borderRadius: '3px',
                margin: '2px 0',
                backgroundColor: '#17a2b8',
                color: '#fff',
                border: 'none',
              }}
              onClick={() => handleShow(o)}
            >
              View
            </Button>
          </td>
        </tr>
      );
    })}
  </tbody>
</Table>


              <div className="d-flex justify-content-between align-items-center mt-4">
                <div className="d-flex gap-2">
                  <Button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                    variant="secondary"
                  >
                    Previous
                  </Button>

                  {[...Array(totalPages)].map((_, index) => {
                    const pageNumber = index + 1;
                    if (
                      pageNumber === 1 ||
                      pageNumber === totalPages ||
                      (pageNumber >= currentPage - 1 &&
                        pageNumber <= currentPage + 1)
                    ) {
                      return (
                        <Button
                          key={pageNumber}
                          onClick={() => handlePageChange(pageNumber)}
                          variant={
                            currentPage === pageNumber ? "primary" : "light"
                          }
                          disabled={loading}
                        >
                          {pageNumber}
                        </Button>
                      );
                    }
                    if (
                      pageNumber === currentPage - 2 ||
                      pageNumber === currentPage + 2
                    ) {
                      return (
                        <span key={pageNumber} className="px-2">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}

                  <Button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || loading}
                    variant="secondary"
                  >
                    Next
                  </Button>
                </div>
                <span className="text-muted">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, totalOrders)} of{" "}
                  {totalOrders} orders
                </span>
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
          calculateTotals={calculateTotals}
          handleDeleteProduct={handleDeleteProduct}
          handleAddClick={handleAddClick}
          handleDownloadPDF={handleDownloadPDF}
          handleStatusChange={handleStatusChange}
          handleUpdateOrder={handleUpdateOrder}
          handleDelivered={handleDelivered}
          handleReturned={handleReturned}
          getOrders={getOrders}
          orderType={orderType}
          onOrderUpdate={(updatedOrder) => setSelectedOrder(updatedOrder)}
          handleAddToOrder={(product) => handleAddToOrder(product).catch(error => {
            setAddProductError(error.message);
          })}
        />
      )}

      <Modal show={showTrackingModal} onHide={handleTrackingModalClose}>
        <Modal.Header closeButton>
          <Modal.Title>Add Tracking Information</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Tracking Company</Form.Label>
              <Form.Control
                type="text"
                name="company"
                value={trackingInfo.company}
                onChange={handleTrackingInfoChange}
                placeholder="Enter tracking company name"
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Tracking ID</Form.Label>
              <Form.Control
                type="text"
                name="id"
                value={trackingInfo.id}
                onChange={handleTrackingInfoChange}
                placeholder="Enter tracking ID"
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

      <SearchModal
        show={showSearchModal}
        handleClose={handleCloseSearchModal}
        handleAddToOrder={handleAddToOrder}
      />
    </AdminLayout>
  );
};

export default AdminOrders;
