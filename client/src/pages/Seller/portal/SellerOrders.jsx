import axios from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import SellerMenu from "../../../components/Layout/SellerMenu";
import Layout from "../../../components/Layout/Layout";

const SellerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filter, setFilter] = useState('');

  // Responsive check
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch orders
  const getOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());
      if (filter) params.append('status', filter);
      
      const { data } = await axios.get(`/api/v1/seller-portal/orders?${params.toString()}`);
      
      if (data.success) {
        setOrders(data.orders);
        setTotalOrders(data.total);
        setTotalPages(data.pages);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    getOrders();
  }, [currentPage, filter]);

  // Filter change handler
  const handleFilterChange = (status) => {
    setFilter(status);
    setCurrentPage(1);
  };

  // Pagination handler
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Order card component for mobile
  const OrderCard = ({ order }) => {
    const orderId = order._id.slice(-8).toUpperCase();
    const date = new Date(order.createdAt);
    
    return (
      <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Order ID</div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{orderId}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Date</div>
            <div style={{ fontSize: '14px', color: '#0f172a' }}>{date.toLocaleDateString()}</div>
          </div>
        </div>
        
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Status</div>
          <span style={{ 
            padding: '4px 8px', 
            borderRadius: '4px', 
            fontSize: '12px', 
            fontWeight: '500',
            backgroundColor: order.status === 'Delivered' ? '#dcfce7' : order.status === 'Shipped' ? '#e0f2fe' : order.status === 'Confirmed' ? '#fef3c7' : order.status === 'Cancelled' ? '#fee2e2' : '#f3f4f6',
            color: order.status === 'Delivered' ? '#166534' : order.status === 'Shipped' ? '#0369a1' : order.status === 'Confirmed' ? '#d97706' : order.status === 'Cancelled' ? '#dc2626' : '#374151'
          }}>
            {order.status}
          </span>
        </div>
        
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Buyer</div>
          <div style={{ fontSize: '14px', color: '#0f172a' }}>{order.buyerName}, {order.buyerCity}, {order.buyerState}</div>
        </div>
        
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>Your Items</div>
          {order.items.map((item, index) => (
            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: index < order.items.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', color: '#0f172a', fontWeight: '500' }}>{item.name}</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>{item.quantity} unit{item.quantity > 1 ? 's' : ''} x ₹{item.unitPrice}</div>
              </div>
              <div style={{ fontSize: '13px', color: '#0f172a', fontWeight: '500' }}>₹{item.total}</div>
            </div>
          ))}
        </div>
        
        <div style={{ paddingTop: '12px', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>Your Total</div>
          <div style={{ fontSize: '16px', color: '#0f172a', fontWeight: '600' }}>₹{order.vendorTotal.toLocaleString('en-IN')}</div>
        </div>
      </div>
    );
  };

  // Order row component for desktop
  const OrderRow = ({ order }) => {
    const orderId = order._id.slice(-8).toUpperCase();
    const date = new Date(order.createdAt);
    
    return (
      <tr style={{ borderBottom: '1px solid #e4e7eb', transition: 'background-color 0.15s ease' }}>
        <td style={{ padding: '16px', fontSize: '14px', color: '#0f172a' }}>{orderId}</td>
        <td style={{ padding: '16px', fontSize: '14px', color: '#0f172a' }}>{date.toLocaleDateString()}</td>
        <td style={{ padding: '16px' }}>
          <span style={{ 
            padding: '4px 12px', 
            borderRadius: '20px', 
            fontSize: '12px', 
            fontWeight: '500',
            backgroundColor: order.status === 'Delivered' ? '#dcfce7' : order.status === 'Shipped' ? '#e0f2fe' : order.status === 'Confirmed' ? '#fef3c7' : order.status === 'Cancelled' ? '#fee2e2' : '#f3f4f6',
            color: order.status === 'Delivered' ? '#166534' : order.status === 'Shipped' ? '#0369a1' : order.status === 'Confirmed' ? '#d97706' : order.status === 'Cancelled' ? '#dc2626' : '#374151'
          }}>
            {order.status}
          </span>
        </td>
        <td style={{ padding: '16px', fontSize: '14px', color: '#0f172a' }}>{order.buyerName}</td>
        <td style={{ padding: '16px', fontSize: '14px', color: '#0f172a' }}>{order.buyerCity}, {order.buyerState}</td>
        <td style={{ padding: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {order.items.map((item, index) => (
              <div key={index} style={{ fontSize: '13px', color: '#0f172a' }}>
                {item.name} x {item.quantity} (₹{item.total})
              </div>
            ))}
          </div>
        </td>
        <td style={{ padding: '16px', fontSize: '14px', color: '#0f172a', fontWeight: '500' }}>₹{order.vendorTotal.toLocaleString('en-IN')}</td>
      </tr>
    );
  };

  return (
    <Layout title="My Orders">
      <SellerMenu />
      <div className="container-fluid dashboard">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h1 style={{ fontSize: isMobile ? '20px' : '28px', fontWeight: '600', marginBottom: '4px', color: '#0f172a' }}>
              My Orders
            </h1>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: '0' }}>
              View your orders and track shipments.
            </p>
          </div>

          {/* Filter */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label style={{ fontSize: '14px', color: '#64748b', whiteSpace: 'nowrap' }}>Filter by status:</label>
              <select 
                value={filter} 
                onChange={(e) => handleFilterChange(e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', backgroundColor: 'white', cursor: 'pointer' }}
              >
                <option value="">All</option>
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Orders Display */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>Loading...</div>
          ) : orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e4e7eb' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
              <div style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>No orders for your listings yet.</div>
              <div style={{ fontSize: '14px' }}>Orders will appear here once customers place them.</div>
            </div>
          ) : isMobile ? (
            <div style={{ padding: '0 8px' }}>
              {orders.map((order) => (
                <OrderCard key={order._id} order={order} />
              ))}
            </div>
          ) : (
            <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e4e7eb', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)', overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: '900px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e4e7eb', backgroundColor: '#f9fafb' }}>
                    {['Order ID', 'Date', 'Status', 'Buyer', 'Location', 'Items', 'Your Total'].map((header) => (
                      <th key={header} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b7280' }}>
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <OrderRow key={order._id} order={order} />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <nav style={{ marginTop: '24px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '16px', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', borderTop: '1px solid #e4e7eb', paddingTop: '16px' }}
              aria-label="Pagination"
            >
              <span style={{ fontSize: '13px', color: '#6b7280' }}>
                Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                {Math.min(currentPage * itemsPerPage, totalOrders)} of{' '}
                {totalOrders} orders
              </span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: isMobile ? 'center' : 'flex-end' }}>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{ backgroundColor: 'white', border: '1px solid #e4e7eb', padding: '8px 12px', borderRadius: '6px', opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '500', color: '#0f172a', transition: 'all 0.2s ease', minHeight: '36px' }}
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    style={{ backgroundColor: page === currentPage ? '#137fec' : 'white', color: page === currentPage ? 'white' : '#0f172a', border: page === currentPage ? '1px solid #137fec' : '1px solid #e4e7eb', padding: '8px 10px', borderRadius: '6px', cursor: page === currentPage ? 'default' : 'pointer', minWidth: '36px', minHeight: '36px', fontSize: '13px', fontWeight: page === currentPage ? '600' : '500', transition: 'all 0.2s ease' }}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={{ backgroundColor: 'white', border: '1px solid #e4e7eb', padding: '8px 12px', borderRadius: '6px', opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '500', color: '#0f172a', transition: 'all 0.2s ease', minHeight: '36px' }}
                >
                  Next
                </button>
              </div>
            </nav>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SellerOrders;