import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const OrdersList = () => {
  const [orders, setOrders] = useState([]);
  const [type, setType] = useState('all');
  const [modalData, setModalData] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [type]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`/api/orders/${type}`);
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const handleOrderTypeChange = (newType) => {
    setType(newType);
  };

  const openModal = (order) => {
    setModalData(order);
  };

  const closeModal = () => {
    setModalData(null);
  };

  return (
    <main>
      <div className="container-fluid site-width">
        <div className="row">
          <div className="col-12 align-self-center">
            <div className="sub-header mt-3 py-3 align-self-center d-sm-flex w-100 rounded">
              <div className="w-sm-100 mr-auto"><h4 className="mb-0">Users List</h4></div>
              <ol className="breadcrumb bg-transparent align-self-center m-0 p-0">
                <li className="breadcrumb-item">Orders</li>
                <li className="breadcrumb-item">Order List</li>
              </ol>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-12 mt-3">
            <div className="card">
              <div className="card-header justify-content-between align-items-center">
                <Link to="/orders/all" onClick={() => handleOrderTypeChange('all')}>
                  <button type="button" className={`btn btn-${type === 'all' ? 'primary' : 'danger'} btn-sm rounded-btn`}>All orders</button>
                </Link>
                {/* Add similar buttons for other order types */}
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table id="orderlist" className="table layout-danger">
                    <thead>
                      <tr>
                        <th>Sr.No</th>
                        <th>Buyer Name</th>
                        <th>Order id</th>
                        <th>Order date</th>
                        <th>Order Amount</th>
                        <th>PYMT</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order, index) => (
                        <tr key={order._id}>
                          <td>{index + 1}</td>
                          <td>{order.buyerName}</td>
                          <td>{order.orderId}</td>
                          <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                          <td>{order.orderAmount}</td>
                          <td>{order.paymentMethod}</td>
                          <td>{order.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal components would go here */}
    </main>
  );
};

export default OrdersList;