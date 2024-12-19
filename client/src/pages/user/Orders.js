import React, { useState, useEffect } from "react";
import UserMenu from "../../components/Layout/UserMenu";
import Layout from "../../components/Layout/Layout";
import axios from "axios";
import { useAuth } from "../../context/auth";
import moment from "moment";
const OrderDetailsModal = ({ selectedOrder, onUpdateOrder, onClose }) => {
  const [order, setOrder] = useState(selectedOrder);

  const calculateSubtotal = () => {
    const subtotal = order.products.reduce((total, product) => {
      console.log(`Product: ${product.name}, Price: ${product.price}, Quantity: ${product.quantity}`);
      return total + product.price * product.quantity;
    }, 0);
  
    console.log(`Calculated Subtotal: ₹${subtotal}`);
    return subtotal;
};
  

  const calculateGST = () => {
    return order.products.reduce(
      (total, product) =>
        total + (product.price * product.quantity * (product.gst || 0)) / 100,
      0
    );
  };

  const calculateTotal = () => {
    const deliveryCharges = order.deliveryCharges || 0.0;
    const codCharges = order.codCharges || 0.0;
    const discount = order.discount || 0.0;

    return (
      calculateSubtotal() +
      calculateGST() +
      deliveryCharges +
      codCharges -
      discount
    );
  };

  const calculateAmountPending = () => {
    const total = calculateTotal();
    const amountPaid = order.amountPaid || 0;
    return Math.max(total - amountPaid, 0);
  };

  const updateProductQuantity = (index, quantity) => {
    const updatedProducts = [...order.products];
    updatedProducts[index].quantity = quantity;
    setOrder({ ...order, products: updatedProducts });
  };

  const updateProductPrice = (index, price) => {
    const updatedProducts = [...order.products];
    updatedProducts[index].price = price;
    setOrder({ ...order, products: updatedProducts });
  };

  const updateOrderStatus = (newStatus) => {
    setOrder({ ...order, status: newStatus });
  };

  const handleSave = () => {
    onUpdateOrder(order);
    onClose();
  };

  return (
    <div className="modal" tabIndex="-1" style={{ display: "block" }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Order Details</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="row mb-3">
              <div className="col-md-6">
                <p>Order ID: {order._id}</p>
                {/* <p>Buyer: {order.buyer.name}</p> */}
                <p>Created At: {moment(order.createdAt).format("ll")}</p>
              </div>
            </div>

            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
  {order.products.map((product, index) => (
    <tr key={product.id}>
      <td>
        <div className="d-flex align-items-center">
          <img
            src={`/api/v1/product/product-photo/${product.product._id}`}
            alt={product.name}
            style={{
              width: "40px",
              height: "40px",
              objectFit: "cover",
              marginRight: "10px",
            }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/path/to/default-image.jpg";
            }}
          />
          {product.product.name}
        </div>
      </td>
      <td>
        <span>{product.quantity}</span>
      </td>
      <td>
        <span>₹{product.price}</span>
      </td>
      <td>
        ₹{(product.price * product.quantity).toFixed(2)}
      </td>
    </tr>
  ))}
</tbody>

            </table>

            <div className="row mt-3">
              <div className="col-md-6">
                <p>
                  <strong>Subtotal:</strong> ₹{calculateSubtotal().toFixed(2)}
                </p>
                <p>
                  <strong>GST:</strong> ₹{calculateGST().toFixed(2)}
                </p>
                <p>
                  <strong>Delivery Charges:</strong> ₹
                  {(order.deliveryCharges || 0).toFixed(2)}
                </p>
                <p>
                  <strong>COD Charges:</strong> ₹{(order.codCharges || 0).toFixed(2)}
                </p>
                <p>
                  <strong>Discount:</strong> ₹{(order.discount || 0).toFixed(2)}
                </p>
                <p>
                  <strong>Total:</strong> ₹{calculateTotal().toFixed(2)}
                </p>
                <p>
                  <strong>Amount Paid:</strong> ₹{(order.amountPaid || 0).toFixed(2)}
                </p>
                <p>
                  <strong>Amount Pending:</strong> ₹
                  {calculateAmountPending().toFixed(2)}
                </p>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            {/* {renderStatusButtons()} */}
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
            {/* <button type="button" className="btn btn-primary" onClick={handleSave}>
              Save Changes
            </button> */}
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

  useEffect(() => {
    // Fetch orders only when auth.user._id is available
    if (auth?.user?._id) {
      getOrders();
    } else {
      console.warn("auth.user._id is not available yet");
    }
  }, [auth?.user?._id]); // Watch for changes in user ID

  const getOrders = async () => {
    try {
      if (!auth?.user?._id) {
        console.warn("Cannot fetch orders, user ID is undefined.");
        return;
      }
      console.log("Fetching orders for user ID:", auth.user._id);

      const { data } = await axios.get(`/api/v1/auth/orders/${auth.user._id}`);
      console.log("Received orders:", data);
      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };
  
  const calculateTotalsad = (order) => {
    if (!order || !order.products) return { subtotal: 0, gst: 0, total: 0 };
  
    const subtotal = order.products.reduce(
      (acc, product) => acc + Number(product.price) * Number(product.quantity),
      0
    );
  
    const gst = order.products.reduce((acc, product) => {
      return acc + (Number(product.price) * Number(product.quantity) * (Number(product.gst) || 0)) / 100;
    }, 0);
  
    const total =
      subtotal +
      gst +
      Number(order.deliveryCharges || 0) +
      Number(order.codCharges || 0) -
      Number(order.discount || 0);
  
    return { subtotal, gst, total };
  };
  const navigateToOrderDetails = (order) => {
    setSelectedOrder(order);
  };

  const handleUpdateOrder = (updatedOrder) => {
    // Update the order in your orders list
    const updatedOrders = orders.map(o => 
      o._id === updatedOrder._id ? updatedOrder : o
    );
    setOrders(updatedOrders);
  };

  const closeOrderModal = () => {
    setSelectedOrder(null);
  };

  return (
    <Layout title={"Your Orders"}>
      <div className="container-fluid p-3 m-3 dashboard">
        <div className="row">
          <div className="col-md-3">
            <UserMenu />
          </div>
          <div className="col-md-9">
            <h1 className="text-center">All Orders</h1>
            {orders?.length === 0 ? (
              <p className="text-center">No orders found.</p>
            ) : (
              orders
                ?.filter((o) => o && o._id) // Ensure valid orders
                .map((o, i) => (
                  <div 
                  className="border shadow cursor-pointer" 
                  key={o._id}
                  onClick={() => navigateToOrderDetails(o)}
                >
                    <table className="table">
                      <thead>
                        <tr>
                          <th scope="col">#</th>
                          <th scope="col">Status</th>
                          <th scope="col">Order Id</th>
                          <th scope="col">Date</th>
                          <th scope="col">Payment Method</th>
                            
                  <th>Total</th>
                          <th scope="col">Tracking Id</th>
                     
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>{i + 1}</td>
                          <td>{o?.status || "Unknown"}</td>
                          <td>{o?._id || "N/A"}</td>
                          <td>{o?.createdAt ? moment(o.createdAt).format("YYYY-MM-DD") : "N/A"}</td>
                          <td>{o?.payment?.paymentMethod || "Unknown"}</td>
                          <td>{calculateTotalsad(o).total.toFixed(2)}</td> 
                          
                          <td>  {o.tracking ? (
                        `${o.tracking.company}: ${o.tracking.id}`
                      ) : "nothing"}</td>
                        </tr>
                      </tbody>
                    </table>
                   
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
      {selectedOrder && (
        <OrderDetailsModal 
          selectedOrder={selectedOrder}
          onUpdateOrder={handleUpdateOrder}
          onClose={closeOrderModal}
        />
      )}
    </Layout>
  );
  
};


export default Orders;
