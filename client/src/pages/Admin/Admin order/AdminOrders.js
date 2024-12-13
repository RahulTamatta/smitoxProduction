import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Nav, Spinner, Alert, InputGroup } from 'react-bootstrap';
import axios from 'axios';
import moment from 'moment';
import { message } from 'antd';
import AdminMenu from "../../../components/Layout/AdminMenu";
import Layout from "../../../components/Layout/Layout";
import { useAuth } from "../../../context/auth";
import { useSearch } from "../../../context/search";
import OrderModal from "./components/orderModal";
import SearchModal from "./components/searchModal";


const AdminOrders = () => {
  const [status] = useState([
    "Pending", "Confirmed", "Accepted", "Cancelled", "Rejected", "Dispatched", "Delivered", "Returned"
  ]);
  const [orders, setOrders] = useState([]);
  const [auth] = useAuth();
  const [show, setShow] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderType, setOrderType] = useState('all-orders');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [values, setValues] = useSearch();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingInfo, setTrackingInfo] = useState({ company: '', id: '' });

  useEffect(() => {
    if (auth?.token) getOrders(orderType);
  }, [auth?.token, orderType]);

  const getOrders = async (type = 'all') => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await axios.get(`/api/v1/auth/all-orders`, {
        params: { status: type }
      });
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log(error);
      setError("Error fetching orders. Please try again.");
      message.error("Error fetching orders");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, value) => {
    try {
      await axios.put(`/api/v1/auth/order-status/${orderId}`, {
        status: value,
      });
      getOrders(orderType);
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
    setShowSearch(false);
    setValues({ ...values, keyword: '', results: [] });
  };

  const handleInputChange = (field, value) => {
    setSelectedOrder((prevOrder) => ({
      ...prevOrder,
      [field]: field === 'status' || field === 'payment' ? value : Number(value),
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
    if (!selectedOrder || !selectedOrder.products) return { subtotal: 0, gst: 0, total: 0 };

    const subtotal = selectedOrder.products.reduce(
      (acc, product) => acc + Number(product.price) * Number(product.quantity),
      0
    );
    const gst = subtotal * 0.18; // Assuming 18% GST
    const total = subtotal + gst + Number(selectedOrder.deliveryCharges || 0) + Number(selectedOrder.codCharges || 0) - Number(selectedOrder.discount || 0);

    return { subtotal, gst, total };
  };

  const handleAddClick = () => {
    setShowSearchModal(true);
  };

  const handleCloseSearchModal = () => {
    setShowSearchModal(false);
    setSearchKeyword('');
    setSearchResults([]);
  };

  const handleAddToOrder = async (product) => {
    try {
      const updatedOrder = {
        ...selectedOrder,
        products: [
          ...selectedOrder.products,
          {
            ...product,
            quantity: 1,
          },
        ],
      };
      setSelectedOrder(updatedOrder);
      
      const response = await axios.post(`/api/v1/auth/orders/${selectedOrder._id}`, {
        productId: product._id,
        quantity: 1,
        price: product.price,
      });

      if (response.data.success) {
        message.success("Product added to order successfully");
        handleCloseSearchModal();
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      message.error("Error adding product to order");
    }
  };

  // const handleCloseSearchModal = () => {
  //   setShowSearchModal(false);
  //   setSearchKeyword('');
  //   setSearchResults([]);
  // };

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.get(`/api/v1/product/search/${searchKeyword}`);
      setSearchResults(data);
    } catch (error) {
      console.log(error);
      message.error("Error searching products");
    }
  };


  const handleUpdateOrder = async () => {
    try {
      // Log the values to debug
      console.log('Updating order with:', selectedOrder);
  
      const { _id, status, codCharges, deliveryCharges, discount, amount, products } = selectedOrder;
  
      // Ensure all numeric values are properly converted to numbers
      const numericCodCharges = Number(codCharges) || 0;
      const numericDeliveryCharges = Number(deliveryCharges) || 0;
      const numericDiscount = Number(discount) || 0;
      const numericAmount = Number(amount) || 0;
  
      console.log('Prepared data:', {
        status,
        codCharges: numericCodCharges,
        deliveryCharges: numericDeliveryCharges,
        discount: numericDiscount,
        amount: numericAmount,
        products: products.map(p => ({
          _id: p._id,
          quantity: Number(p.quantity) || 0,
          price: Number(p.price) || 0,
        })),
      });
  
      const response = await axios.put(`/api/v1/auth/order/${_id}`, {
        status,
        codCharges: numericCodCharges,
        deliveryCharges: numericDeliveryCharges,
        discount: numericDiscount,
        amount: numericAmount,
        products: products.map(p => ({
          _id: p._id,
          quantity: Number(p.quantity) || 0,
          price: Number(p.price) || 0,
        })),
      });
  
      if (response.data.success) {
        setSelectedOrder(response.data.order);
        setShow(false);
        getOrders(orderType);
        message.success("Order updated successfully");
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      console.log('Error details:', error);
      message.error("Error updating order");
    }
  };
  

  // const calculateTotals = () => {
  //   if (!selectedOrder || !selectedOrder.products) return { subtotal: 0, gst: 0, total: 0 };

  //   const subtotal = selectedOrder.products.reduce(
  //     (acc, product) => acc + Number(product.price) * Number(product.quantity),
  //     0
  //   );
  //   const gst = subtotal * 0.18; // Assuming 18% GST
  //   const total = subtotal + gst + Number(selectedOrder.deliveryCharges || 0) + Number(selectedOrder.codCharges || 0) - Number(selectedOrder.discount || 0);

  //   return { subtotal, gst, total };
  // };
  const handleDeleteProduct = async (index) => {
    if (index >= 0 && index < selectedOrder.products.length) {
      try {
        const productToRemove = selectedOrder.products[index];
        const updatedProducts = selectedOrder.products.filter((_, i) => i !== index);
        const updatedOrder = { ...selectedOrder, products: updatedProducts };
        setSelectedOrder(updatedOrder);

        const response = await axios.delete(`/api/v1/auth/order/${selectedOrder._id}/remove-product/${productToRemove._id}`);

        if (response.data.success) {
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
      });
      setShow(false);
      getOrders(orderType);
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
      });
      setShow(false);
      getOrders(orderType);
      message.success("Order status updated to Returned");
    } catch (error) {
      console.log(error);
      message.error("Error updating order status to Returned");
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await axios.get(`/api/v1/auth/order/${selectedOrder._id}/invoice`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${selectedOrder._id}.pdf`);
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
    setTrackingInfo({ company: '', id: '' });
  };

  const handleTrackingInfoChange = (e) => {
    setTrackingInfo({ ...trackingInfo, [e.target.name]: e.target.value });
  };

  const handleAddTracking = async () => {
    try {
      await axios.put(`/api/v1/auth/order/${selectedOrder._id}/tracking`, trackingInfo);
      message.success("Tracking information added successfully");
      getOrders(orderType);
      handleTrackingModalClose();
    } catch (error) {
      console.log(error);
      message.error("Error adding tracking information");
    }
  };

  return (
    <Layout title={"All Orders Data"}>
      <div className="row dashboard">
        <div className="col-md-3">
          <AdminMenu />
        </div>
        <div className="col-md-9">
          <h1 className="text-center">All Orders</h1>
          <Nav variant="pills" className="mb-3">
            <Nav.Item>
              <Nav.Link active={orderType === 'all-orders'} onClick={() => setOrderType('all-orders')}>All orders</Nav.Link>
            </Nav.Item>
            {status.map((s, index) => (
              <Nav.Item key={index}>
                <Nav.Link active={orderType === s} onClick={() => setOrderType(s)}>{s} orders</Nav.Link>
              </Nav.Item>
            ))}
          </Nav>

          {loading ? (
            <Spinner animation="border" role="status">
              <span className="sr-only">Loading...</span>
            </Spinner>
          ) : error ? (
            <Alert variant="danger">{error}</Alert>
          ) : orders.length === 0 ? (
            <Alert variant="info">No orders found</Alert>
          ) : (
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Order Id</th>
                  <th>Trackin Information</th>
                 
                  <th>Items</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o, index) => (
                  <tr key={o._id}>
                    <td>{index + 1}</td>
                    <td>{o._id}</td>
                    <td>
                      {o.tracking ? (
                        `${o.tracking.company}: ${o.tracking.id}`
                      ) : (
                        <Button variant="primary" onClick={() => handleTrackingModalShow(o)}>
                          Add Tracking ID
                        </Button>
                      )}
                    </td>
                
                    <td>{o?.products?.length}</td>
                    <td>{o.status}</td>
                    <td>{moment(o.createdAt).format('DD-MM-YYYY')}</td>
                    <td>
                      <Button variant="info" onClick={() => handleShow(o)}>View</Button>
                  
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
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
          handleAddToOrder={handleAddToOrder} 
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
    </Layout>
  );
};

export default AdminOrders;