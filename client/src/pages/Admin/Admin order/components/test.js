// import React, { useState, useEffect } from 'react';
// import { Table, Button, Modal, Form, Nav, Spinner, Alert, InputGroup } from 'react-bootstrap';
// import axios from 'axios';
// import moment from 'moment';
// import { message } from 'antd';
// import AdminMenu from "../../../components/Layout/AdminMenu";
// import Layout from "../../../components/Layout/Layout";
// import { useAuth } from "../../../context/auth";
// import { useSearch } from "../../../context/search";
// import OrderModal from "./components/orderModal";
// const AdminOrders = () => {
//   const [status] = useState([
//     "Pending", "Confirmed", "Accepted", "Cancelled", "Rejected", "Dispatched", "Delivered", "Returned"
//   ]);
//   const [orders, setOrders] = useState([]);
//   const [auth] = useAuth();
//   const [show, setShow] = useState(false);
//   const [selectedOrder, setSelectedOrder] = useState(null);
//   const [orderType, setOrderType] = useState('all-orders');
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [showSearch, setShowSearch] = useState(false);
//   const [values, setValues] = useSearch();
//   const [searchKeyword, setSearchKeyword] = useState('');
//   const [searchResults, setSearchResults] = useState([]);
//   const [showSearchModal, setShowSearchModal] = useState(false);

//   useEffect(() => {
//     if (auth?.token) getOrders(orderType);
//   }, [auth?.token, orderType]);

//   const getOrders = async (type = 'all') => {
//     try {
//       setLoading(true);
//       setError(null);
//       const { data } = await axios.get(`/api/v1/auth/all-orders`, {
//         params: { status: type }
//       });
//       setOrders(Array.isArray(data) ? data : []);
//     } catch (error) {
//       console.log(error);
//       setError("Error fetching orders. Please try again.");
//       message.error("Error fetching orders");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleStatusChange = async (orderId, value) => {
//     try {
//       await axios.put(`/api/v1/auth/order-status/${orderId}`, {
//         status: value,
//       });
//       getOrders(orderType);
//       message.success("Order status updated successfully");
//     } catch (error) {
//       console.log(error);
//       message.error("Error updating order status");
//     }
//   };

//   const handleShow = (order) => {
//     setSelectedOrder(order);
//     setShow(true);
//   };

//   const handleClose = () => {
//     setShow(false);
//     setShowSearch(false);
//     setValues({ ...values, keyword: '', results: [] });
//   };

//   const handleInputChange = (field, value) => {
//     setSelectedOrder((prevOrder) => ({
//       ...prevOrder,
//       [field]: field === 'status' || field === 'payment' ? value : Number(value),
//     }));
//   };

//   const handleProductChange = (index, field, value) => {
//     setSelectedOrder((prevOrder) => {
//       const updatedProducts = [...prevOrder.products];
//       updatedProducts[index] = {
//         ...updatedProducts[index],
//         [field]: Number(value),
//       };
//       return { ...prevOrder, products: updatedProducts };
//     });
//   };

//   const calculateTotals = () => {
//     if (!selectedOrder || !selectedOrder.products) return { subtotal: 0, gst: 0, total: 0 };

//     const subtotal = selectedOrder.products.reduce(
//       (acc, product) => acc + Number(product.price) * Number(product.quantity),
//       0
//     );
//     const gst = subtotal * 0.18; // Assuming 18% GST
//     const total = subtotal + gst + Number(selectedOrder.deliveryCharges || 0) + Number(selectedOrder.codCharges || 0) - Number(selectedOrder.discount || 0);

//     return { subtotal, gst, total };
//   };

//   const handleAddClick = () => {
//     setShowSearchModal(true);
//   };

//   const handleCloseSearchModal = () => {
//     setShowSearchModal(false);
//     setSearchKeyword('');
//     setSearchResults([]);
//   };

//   const handleSearch = async (e) => {
//     e.preventDefault();
//     try {
//       const { data } = await axios.get(`/api/v1/product/search/${searchKeyword}`);
//       setSearchResults(data);
//     } catch (error) {
//       console.log(error);
//       message.error("Error searching products");
//     }
//   };

//   const handleAddToOrder = async (product) => {
//     try {
//       const updatedOrder = {
//         ...selectedOrder,
//         products: [
//           ...selectedOrder.products,
//           {
//             ...product,
//             quantity: 1,
//           },
//         ],
//       };
//       setSelectedOrder(updatedOrder);
      
//       // Optionally, you can still make the API call to update the order on the server
//       const response = await axios.post(`/api/v1/auth/order/${selectedOrder._id}/add-product`, {
//         productId: product._id,
//         quantity: 1,
//         price: product.price,
//       });

//       if (response.data.success) {
//         message.success("Product added to order successfully");
//       } else {
//         message.error(response.data.message);
//       }
//     } catch (error) {
//       console.log(error);
//       message.error("Error adding product to order");
//     }
//     handleCloseSearchModal();
//   };

//   const handleUpdateOrder = async () => {
//     try {
//       const { _id, status, codCharges, deliveryCharges, discount, products } = selectedOrder;
//       const response = await axios.put(`/api/v1/auth/order/${_id}`, {
//         status,
//         codCharges,
//         deliveryCharges,
//         discount,
//         products: products.map(p => ({ _id: p._id, quantity: p.quantity, price: p.price }))
//       });

//       if (response.data.success) {
//         setSelectedOrder(response.data.order);
//         setShow(false);
//         getOrders(orderType);
//         message.success("Order updated successfully");
//       } else {
//         message.error(response.data.message);
//       }
//     } catch (error) {
//       console.log(error);
//       message.error("Error updating order");
//     }
//   };

//   const handleDeleteProduct = async (index) => {
//     try {
//       const updatedProducts = selectedOrder.products.filter((_, i) => i !== index);
//       const updatedOrder = { ...selectedOrder, products: updatedProducts };
//       setSelectedOrder(updatedOrder);

//       const { _id } = selectedOrder.products[index];
//       const response = await axios.delete(`/api/v1/auth/order/${selectedOrder._id}/remove-product/${_id}`);

//       if (response.data.success) {
//         message.success("Product removed from order successfully");
//       } else {
//         message.error(response.data.message);
//       }
//     } catch (error) {
//       console.log(error);
//       message.error("Error removing product from order");
//     }
//   };

//   const handleDelivered = async () => {
//     try {
//       await axios.put(`/api/v1/auth/order-status/${selectedOrder._id}`, {
//         status: "Delivered",
//       });
//       setShow(false);
//       getOrders(orderType);
//       message.success("Order status updated to Delivered");
//     } catch (error) {
//       console.log(error);
//       message.error("Error updating order status to Delivered");
//     }
//   };

//   const handleReturned = async () => {
//     try {
//       await axios.put(`/api/v1/auth/order-status/${selectedOrder._id}`, {
//         status: "Returned",
//       });
//       setShow(false);
//       getOrders(orderType);
//       message.success("Order status updated to Returned");
//     } catch (error) {
//       console.log(error);
//       message.error("Error updating order status to Returned");
//     }
//   };

//   const handleDownloadPDF = async () => {
//     try {
//       const response = await axios.get(`/api/v1/auth/order/${selectedOrder._id}/invoice`, {
//         responseType: 'blob',
//       });

//       const url = window.URL.createObjectURL(new Blob([response.data]));
//       const link = document.createElement('a');
//       link.href = url;
//       link.setAttribute('download', `order_${selectedOrder._id}.pdf`);
//       document.body.appendChild(link);
//       link.click();
//     } catch (error) {
//       console.log(error);
//       message.error("Error downloading order invoice");
//     }
//   };

//   return (
//     <Layout title={"All Orders Data"}>
//       <div className="row dashboard">
//         <div className="col-md-3">
//           <AdminMenu />
//         </div>
//         <div className="col-md-9">
//           <h1 className="text-center">All Orders</h1>
//           <Nav variant="pills" className="mb-3">
//             <Nav.Item>
//               <Nav.Link active={orderType === 'all-orders'} onClick={() => setOrderType('all-orders')}>All orders</Nav.Link>
//             </Nav.Item>
//             {status.map((s, index) => (
//               <Nav.Item key={index}>
//                 <Nav.Link active={orderType === s} onClick={() => setOrderType(s)}>{s} orders</Nav.Link>
//               </Nav.Item>
//             ))}
//           </Nav>

//           {loading ? (
//             <Spinner animation="border" role="status">
//               <span className="sr-only">Loading...</span>
//             </Spinner>
//           ) : error ? (
//             <Alert variant="danger">{error}</Alert>
//           ) : orders.length === 0 ? (
//             <Alert variant="info">No orders found.</Alert>
//           ) : (
//             <Table responsive>
//               <thead>
//                 <tr>
//                   <th>Product Photo</th>
//                   <th>Sr.No</th>
//                   <th>Buyer Name</th>
//                   <th>Order id</th>
//                   <th>Order date</th>
//                   <th>Order Amount</th>
//                   <th>PYMT</th>
//                   <th>Status</th>
//                   <th>Action</th>
//                   <th>Delete</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {orders.map((o, i) => (
//                   <tr key={o._id}>
//                     <td>
//                       <img
//                         src={`/api/v1/product/product-photo/${o.products[0]._id}`}
//                         alt={o.products[0].name}
//                         width="50"
//                       />
//                     </td>
//                     <td>{i + 1}</td>
//                     <td>
//                       <td>{o?.buyer?.name}</td>
//                       <tr>{o?.buyer?._id}</tr>
//                     </td>
//                     <td>{o?.buyer?._id}</td>
//                     <td>{moment(o?.createdAt).fromNow()}</td>
//                     <td>{o?.payment?.success ? "Success" : "Failed"}</td>
//                     <td>{o?.products?.length}</td>
//                     <td>{o.status}</td>
//                     <td>
//                       <Button variant="primary" size="sm" onClick={() => handleShow(o)}>
//                         Edit
//                       </Button>
//                     </td>
//                     <td>
//                       <Button variant="danger" size="sm" onClick={() => handleDeleteProduct(i)}>
//                         Delete
//                       </Button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </Table>
//           )}
//         </div>
//       </div>
//       <OrderModal
//   show={show}
//   handleClose={handleClose}
//   selectedOrder={selectedOrder}
//   status={status}
//   handleInputChange={handleInputChange}
//   handleProductChange={handleProductChange}
//   calculateTotals={calculateTotals}
//   handleDeleteProduct={handleDeleteProduct}
//   handleAddClick={handleAddClick}
//   handleDownloadPDF={handleDownloadPDF}
//   handleStatusChange={handleStatusChange}
//   handleUpdateOrder={handleUpdateOrder}
//   handleDelivered={handleDelivered}
//   handleReturned={handleReturned}
// />

//       <Modal show={show} onHide={handleClose} size="lg">
//         <Modal.Header closeButton>
//           <Modal.Title>Edit Order</Modal.Title>
//         </Modal.Header>
//         <Modal.Body>
//           {selectedOrder && (
//             <div>
//               <h2>Order ID: {selectedOrder._id}</h2>
//               <p>Buyer: {selectedOrder.buyer?.name}</p>
//               <p>Email: {selectedOrder.buyer?.email}</p>
//               <p>Created At: {moment(selectedOrder.createdAt).format("LLLL")}</p>

//               <Table responsive striped bordered hover>
//                 <thead>
//                   <tr>
//                     <th>Sold by</th>
//                     <th>Ship To</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   <tr>
//                     <td>
//                       Smitox B2B<br />
//                       Sector 37, 1st floor, Manish Market, Mumbai-400003, 560034<br />
//                       Telephone: 7021632115<br />
//                       PAN No: BBVPJ8642Q<br />
//                       GST: 27AGEPJ1490K1Z9
//                     </td>
//                     <td>
//                       Name: Prince Mobile<br />
//                       Prince Mobile, 64A Work Shop Road, Maninagaram Raju Thaver Mahall,<br />
//                       Madurai 625001, Tamil Nadu, 625001<br />
//                       Contact: 9894775787<br />
//                       Order ID: SB7957232567<br />
//                       Payment Method: Cash on Delivery
//                     </td>
//                   </tr>
//                 </tbody>
//               </Table>

//               <Form.Group className="mb-3">
//                 <Form.Label>Payment Status</Form.Label>
//                 <Form.Select
//                   value={selectedOrder.payment.success ? "Success" : "Failed"}
//                   onChange={(e) =>
//                     handleInputChange("payment", {
//                       ...selectedOrder.payment,
//                       success: e.target.value === "Success",
//                     })
//                   }
//                 >
//                   <option value="Success">Success</option>
//                   <option value="Failed">Failed</option>
//                 </Form.Select>
//               </Form.Group>

//               <Form.Group className="mb-3">
//                 <Form.Label>Order Status</Form.Label>
//                 <Form.Select
//                   value={selectedOrder.status}
//                   onChange={(e) => handleInputChange("status", e.target.value)}
//                 >
//                   {status.map((s, index) => (
//                     <option key={index} value={s}>{s}</option>
//                   ))}
//                 </Form.Select>
//               </Form.Group>

//               <h3>Order Details:</h3>
//               <Table responsive striped bordered hover>
//                 <thead>
//                   <tr>
//                     <th>Product Photo</th>
//                     <th>Product</th>
//                     <th>Quantity</th>
//                     <th>Unit Price</th>
//                     <th>Net Amount</th>
//                     <th>Tax Amount</th>
//                     <th>Total</th>
//                     <th>Delete</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {selectedOrder.products?.map((product, index) => (
//                     <tr key={index}>
//                       <td>
//                         <img
//                           src={`/api/v1/product/product-photo/${product._id}`}
//                           alt={product.name}
//                           width="50"
//                         />
//                       </td>
//                       <td>{product.name}</td>
//                       <td>
//                         <Form.Control
//                           type="number"
//                           value={product.quantity}
//                           onChange={(e) =>
//                             handleProductChange(index, "quantity", e.target.value)
//                           }
//                         />
//                       </td>
//                       <td>
//                         <Form.Control
//                           type="number"
//                           value={product.price}
//                           onChange={(e) =>
//                             handleProductChange(index, "price", e.target.value)
//                           }
//                         />
//                       </td>
//                       <td>₹{(Number(product.price) * Number(product.quantity)).toFixed(2)}</td>
//                       <td>₹{((Number(product.price) * Number(product.quantity)) * 0.18).toFixed(2)}</td>
//                       <td>₹{((Number(product.price) * Number(product.quantity)) + ((Number(product.price) * Number(product.quantity)) * 0.18)).toFixed(2)}</td>
//                       <td>
//                         <Button
//                           variant="danger"
//                           size="sm"
//                           onClick={() => handleDeleteProduct(index)}
//                         >
//                           Delete
//                         </Button>
//                       </td>
//                     </tr>
//                   ))}
//                   <tr>
//                     <td colSpan="7">
//                       <Button onClick={handleAddClick}>Add Product</Button>
//                     </td>
//                   </tr>
//                   <tr>
//                     <td colSpan="4"></td>
//                     <td>Subtotal:</td>
//                     <td>₹{calculateTotals().subtotal.toFixed(2)}</td>
//                   </tr>
//                   <tr>
//                     <td colSpan="4"></td>
//                     <td>GST:</td>
//                     <td>₹{calculateTotals().gst.toFixed(2)}</td>
//                   </tr>
//                   <tr>
//                     <td colSpan="4"></td>
//                     <td>
//                       <Form.Label>Delivery Charges:</Form.Label>
//                       <Form.Control
//                         type="number"
//                         value={selectedOrder.deliveryCharges || 0}
//                         onChange={(e) => handleInputChange("deliveryCharges", e.target.value)}
//                       />
//                     </td>
//                     <td>₹{Number(selectedOrder.deliveryCharges || 0).toFixed(2)}</td>
//                   </tr>
//                   <tr>
//                     <td colSpan="4"></td>
//                     <td>
//                       <Form.Label>COD Charges:</Form.Label>
//                       <Form.Control
//                         type="number"
//                         value={selectedOrder.codCharges || 0}
//                         onChange={(e) => handleInputChange("codCharges", e.target.value)}
//                       />
//                     </td>
//                     <td>₹{Number(selectedOrder.codCharges || 0).toFixed(2)}</td>
//                   </tr>
//                   <tr>
//                     <td colSpan="4"></td>
//                     <td>
//                       <Form.Label>Discount:</Form.Label>
//                       <Form.Control
//                         type="number"
//                         value={selectedOrder.discount || 0}
//                         onChange={(e) => handleInputChange("discount", e.target.value)}
//                       />
//                     </td>
//                     <td>₹{Number(selectedOrder.discount || 0).toFixed(2)}</td>
//                   </tr>
//                   <tr>
//                     <td colSpan="4"></td>
//                     <td><strong>Total:</strong></td>
//                     <td><strong>₹{calculateTotals().total.toFixed(2)}</strong></td>
//                   </tr>
//                   <tr>
//                     <td colSpan="4"></td>
//                     <td>Amount Paid:</td>
//                     <td>₹{Number(selectedOrder.amountPaid || 0).toFixed(2)}</td>
//                   </tr>
//                   <tr>
//                     <td colSpan="4"></td>
//                     <td>Amount Pending:</td>
//                     <td>₹{(calculateTotals().total - Number(selectedOrder.amountPaid || 0)).toFixed(2)}</td>
//                   </tr>
//                 </tbody>
//               </Table>
//               <div className="d-flex justify-content-end mt-3">
//                 <Button variant="primary" onClick={handleDownloadPDF}>
//                   Download Invoice
//                 </Button>
//               </div>
//             </div>
//           )}
//         </Modal.Body>
//         <Modal.Footer>
//           <div>
//             {selectedOrder && selectedOrder.status === "Pending" && (
//               <div>
//                 <Button
//                   variant="success"
//                   onClick={() => handleStatusChange(selectedOrder._id, "Confirmed")}
//                 >
//                   Confirm
//                 </Button>
//                 <Button
//                   variant="danger"
//                   onClick={() => handleStatusChange(selectedOrder._id, "Cancelled")}
//                 >
//                   Cancel
//                 </Button>
//                 <Button
//                   variant="warning"
//                   onClick={() => handleStatusChange(selectedOrder._id, "Rejected")}
//                 >
//                   Reject
//                 </Button>
//               </div>
//             )}
            
//             {selectedOrder && selectedOrder.status === "Confirmed" && (
//               <div>
//                 <Button
//                   variant="success"
//                   onClick={() => handleStatusChange(selectedOrder._id, "Accepted")}
//                 >
//                   Accept
//                 </Button>
//               </div>
//             )}
            
//             {selectedOrder && selectedOrder.status === "Dispatched" && (
//               <div>
//                 <Button
//                   variant="success"
//                   onClick={() => handleStatusChange(selectedOrder._id, "Delivered")}
//                 >
//                   Delivered
//                 </Button>
//                 <Button
//                   variant="danger"
//                   onClick={() => handleStatusChange(selectedOrder._id, "Returned")}
//                 >
//                   RTO
//                 </Button>
//               </div>
//             )}
            
//             {selectedOrder && (selectedOrder.status === "Cancelled" || selectedOrder.status === "Rejected") && (
//               <div>
//                 <Button
//                   variant="primary"
//                   onClick={() => handleStatusChange(selectedOrder._id, "Pending")}
//                 >
//                   Set to Pending
//                 </Button>
//               </div>
//             )}
            
//             {selectedOrder && selectedOrder.status === "Accepted" && (
//               <div>
//                 <Button
//                   variant="primary"
//                   onClick={() => handleStatusChange(selectedOrder._id, "Dispatched")}
//                 >
//                   Dispatched
//                 </Button>
//                 <Button
//                   variant="primary"
//                   onClick={() => handleStatusChange(selectedOrder._id, "Rejected")}
//                 >
//                   Reject
//                 </Button>
//               </div>
//             )}
            
//             {selectedOrder && selectedOrder.status === "Delivered" && (
//               <div>
//                 <Button variant="success" onClick={handleDelivered}>
//                   Delivered
//                 </Button>
//                 <Button variant="danger" onClick={handleReturned}>
//                   Returned
//                 </Button>
//               </div>
//             )}
//           </div>

//           <Button variant="secondary" onClick={handleClose}>
//             Close
//           </Button>

//           <Button variant="primary" onClick={handleUpdateOrder}>
//             Update Order
//           </Button>
//         </Modal.Footer>
//       </Modal>

//       <Modal show={showSearchModal} onHide={handleCloseSearchModal}>
//         <Modal.Header closeButton>
//           <Modal.Title>Search Products</Modal.Title>
//         </Modal.Header>
//         <Modal.Body>
//           <Form onSubmit={handleSearch}>
//             <InputGroup className="mb-3">
//               <Form.Control
//                 type="text"
//                 placeholder="Search products"
//                 value={searchKeyword}
//                 onChange={(e) => setSearchKeyword(e.target.value)}
//               />
//               <Button variant="outline-secondary" type="submit">
//                 Search
//               </Button>
//             </InputGroup>
//           </Form>
//           {searchResults.map((product) => (
//             <div key={product._id} className="d-flex align-items-center mb-2">
//               <img
//                 src={`/api/v1/product/product-photo/${product._id}`}
//                 alt={product.name}
//                 width="50"
//                 className="me-2"
//               />
//               <span className="flex-grow-1">{product.name}</span>
//               <Button
//                 variant="primary"
//                 size="sm"
//                 onClick={() => handleAddToOrder(product)}
//               >
//                 Add
//               </Button>
//             </div>
//           ))}
//         </Modal.Body>
//       </Modal>
//     </Layout>
//   );
// };

// export default AdminOrders;

                          