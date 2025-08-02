import React from 'react';
import { Table, Button, Spinner, Alert } from 'react-bootstrap';
import moment from 'moment';

const OrdersTable = ({
  orders,
  loading,
  error,
  currentPage,
  itemsPerPage,
  sortBy,
  sortOrder,
  onOrderSelect,
  onTrackingAdd,
  onSortChange,
  calculateOrderTotals
}) => {
  if (loading) {
    return (
      <div className="text-center p-4">
        <Spinner animation="border" role="status">
          <span className="sr-only">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (orders.length === 0) {
    return <Alert variant="info">No orders found</Alert>;
  }

  return (
    <Table 
      striped 
      bordered 
      hover 
      style={{ 
        width: '100%', 
        fontSize: '1rem', 
        borderSpacing: '0px', 
        borderCollapse: 'collapse' 
      }} 
      cellSpacing="0" 
      cellPadding="0"
    >
      <thead>
        <tr>
          <th style={{ fontSize: '0.8rem', padding: '4px' }}>#</th>
          <th style={{ fontSize: '0.8rem', padding: '4px' }}>Order Info</th>
          <th 
            style={{ 
              fontSize: '0.8rem', 
              padding: '4px', 
              cursor: 'pointer',
              userSelect: 'none',
              backgroundColor: sortBy === 'total' ? '#e3f2fd' : 'transparent',
              transition: 'background-color 0.2s ease',
              borderBottom: sortBy === 'total' ? '2px solid #1976d2' : '1px solid #dee2e6'
            }}
            onClick={() => onSortChange('total')}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#e9ecef';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = sortBy === 'total' ? '#e3f2fd' : 'transparent';
            }}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              gap: '4px'
            }}>
              <span>Total</span>
              <span style={{
                fontSize: '18px',
                color: '#000',
                fontWeight: 'bold',
                marginLeft: '8px'
              }}>
                {sortBy === 'total' ? (
                  sortOrder === 'asc' ? '↑' : '↓'
                ) : '↕'}
              </span>
            </div>
          </th>
          <th style={{ fontSize: '0.8rem', padding: '4px' }}>Payment</th>
          <th style={{ fontSize: '0.8rem', padding: '4px' }}>Status</th>
          <th 
            style={{ 
              fontSize: '0.8rem', 
              padding: '4px', 
              cursor: 'pointer',
              userSelect: 'none',
              backgroundColor: sortBy === 'createdAt' ? '#e3f2fd' : 'transparent',
              transition: 'background-color 0.2s ease',
              borderBottom: sortBy === 'createdAt' ? '2px solid #1976d2' : '1px solid #dee2e6'
            }}
            onClick={() => onSortChange('createdAt')}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#e9ecef';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = sortBy === 'createdAt' ? '#e3f2fd' : 'transparent';
            }}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              gap: '4px'
            }}>
              <span>Created</span>
              <span style={{
                fontSize: '18px',
                color: '#000',
                fontWeight: 'bold',
                marginLeft: '8px'
              }}>
                {sortBy === 'createdAt' ? (
                  sortOrder === 'asc' ? '↑' : '↓'
                ) : '↕'}
              </span>
            </div>
          </th>
          <th style={{ fontSize: '0.8rem', padding: '4px' }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((order, index) => {
          const totals = calculateOrderTotals(order);
          return (
            <tr key={order._id} style={{ fontSize: '0.7rem', padding: '2px' }}>
              <td style={{ fontSize: '0.7rem', padding: '2px' }}>
                {(currentPage - 1) * itemsPerPage + index + 1}
              </td>
              <td style={{ fontSize: '0.7rem', padding: '2px' }}>
                <div style={{ minWidth: '200px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                    {order.buyer?.user_fullname || 'N/A'}
                  </div>
                  <div
                    style={{
                      display: 'inline-block',
                      padding: '4px 8px',
                      border: '1px solid #007bff',
                      borderRadius: '4px',
                      backgroundColor: '#e7f1ff',
                      fontWeight: 'bold',
                      color: '#007bff',
                      textAlign: 'center',
                      cursor: 'pointer',
                      width: 'fit-content',
                      transition: 'background-color 0.2s ease',
                      marginBottom: '2px'
                    }}
                    onMouseEnter={(e) =>
                      (e.target.style.backgroundColor = '#cfe2ff')
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.backgroundColor = '#e7f1ff')
                    }
                    onClick={() => onOrderSelect(order)}
                  >
                    {order._id.substring(0, 10)}
                  </div>
                  <div>{order.buyer?.mobile_no || 'N/A'}</div>
                  {order.tracking ? (
                    <div style={{ fontSize: '0.6rem', color: '#666' }}>
                      {order.tracking.company}: {order.tracking.id}
                    </div>
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
                      onClick={() => onTrackingAdd(order)}
                    >
                      Add Tracking ID
                    </Button>
                  )}
                </div>
              </td>
              <td style={{ fontSize: '0.7rem', padding: '2px' }}>
                ₹{totals.total.toFixed(2)}
              </td>
              <td style={{ fontSize: '0.7rem', padding: '2px' }}>
                {order.payment?.paymentMethod || 'N/A'}
              </td>
              <td style={{ fontSize: '0.7rem', padding: '2px' }}>
                <span className={`badge bg-${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </td>
              <td style={{ fontSize: '0.7rem', padding: '2px' }}>
                {moment(order.createdAt).format('DD-MM-YYYY')}
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
                  onClick={() => onOrderSelect(order)}
                >
                  View
                </Button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
};

// Helper function to get status color
const getStatusColor = (status) => {
  const statusColors = {
    'Pending': 'warning',
    'Confirmed': 'primary',
    'Accepted': 'info',
    'Cancelled': 'danger',
    'Rejected': 'danger',
    'Dispatched': 'success',
    'Delivered': 'success',
    'Returned': 'secondary'
  };
  return statusColors[status] || 'secondary';
};

export default OrdersTable;
