import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MessageCircle, Edit } from 'lucide-react';
import Layout from "../../components/Layout/Layout";
import AdminMenu from "../../components/Layout/AdminMenu";
import CartSearchModal from "./addTocartModal.jsx";
import { useNavigate, useLocation } from 'react-router-dom';
import AddToCartPage from "./userCart.jsx";

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeStatusFilter, setActiveStatusFilter] = useState('all');
  const [activeOrderTypeFilter, setActiveOrderTypeFilter] = useState('all');
  const [editingUser, setEditingUser] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(20);
  const [activeRegularFilter, setActiveRegularFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState("");
  const [totalUsers, setTotalUsers] = useState(0);

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  const location = useLocation();
  const navigate = useNavigate();

  // Initialize states from URL params
  const urlParams = new URLSearchParams(location.search);
  const pageFromUrl = parseInt(urlParams.get('page')) || 1;
  const searchFromUrl = urlParams.get('search') || '';

  // Handle browser history changes
  useEffect(() => {
    const handleLocationChange = () => {
      const params = new URLSearchParams(location.search);
      const page = parseInt(params.get('page')) || 1;
      const search = params.get('search') || '';
      setCurrentPage(page);
      setSearchTerm(search);
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, [location]);

  // Debounce the search term
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms delay

    return () => clearTimeout(debounceTimer); // Cleanup on unmount or re-render
  }, [searchTerm]);

  // Fetch users when debouncedSearchTerm changes
  useEffect(() => {
    fetchUsers(currentPage, debouncedSearchTerm);
  }, [debouncedSearchTerm, currentPage]);

  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to the first page when searching
  };

  const fetchUsers = async (page = currentPage, search = searchTerm) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/v1/usersLists/users`, {
        params: {
          page,
          limit: usersPerPage,
          search, // Pass the search term as-is
        },
      });
      const usersList = response.data.list || [];
      setUsers(usersList);
      setTotalUsers(response.data.total || usersList.length);
      filterUsers(usersList);

      // Update URL with search and page params only when necessary
      const params = new URLSearchParams();
      if (page > 1) params.set('page', page);
      if (search) params.set('search', search);
      const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
      if (newUrl !== window.location.href) {
        window.history.replaceState({}, '', newUrl);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    filterUsers();
  }, [users, activeStatusFilter, activeOrderTypeFilter, activeRegularFilter]);
  
  const filterUsers = (usersList = users) => {
    let result = usersList;
  
    if (activeStatusFilter !== 'all') {
      result = result.filter(user => user.status === activeStatusFilter);
    }
    if (activeOrderTypeFilter !== 'all') {
      result = result.filter(user => getOrderType(user.order_type) === activeOrderTypeFilter.toLowerCase());
    }
    if (activeRegularFilter !== 'all') {
      result = result.filter(user => user.regular === activeRegularFilter);
    }
  
    setFilteredUsers(result);
  };
  const handlePageChange = (newPage) => {
    if (newPage >= 1) {
      setCurrentPage(newPage);
      fetchUsers(newPage, searchTerm);
    }
  };

  useEffect(() => {
    // Initialize search term from URL if present
    const params = new URLSearchParams(location.search);
    const searchFromUrl = params.get('search') || "";
    setSearchTerm(searchFromUrl);
    fetchUsers(searchFromUrl);
  }, [location]);

  const renderSearchSection = () => (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by name, email, phone, or address..."
          style={{
            padding: '0.5rem',
            border: '1px solid #e0e0e0',
            borderRadius: '0.25rem',
            width: '300px',
            fontSize: '1rem'
          }}
          autoFocus // Ensures the input field remains focused
        />
        <span style={{ color: '#666', fontSize: '0.875rem' }}>
          Showing {filteredUsers.length} of {totalUsers} users
        </span>
      </div>
    </div>
  );

  const styles = {
    headerText: { color: '#1a237e' },
    errorText: { color: '#d32f2f' },
    tableHeader: { backgroundColor: '#f5f5f5', color: '#2c3e50' },
    tableBorder: { borderColor: '#e0e0e0' },
    statusBadge: {
      active: { backgroundColor: '#4caf50', color: 'white' },
      blocked: { backgroundColor: '#f44336', color: 'white' },
      pending: { backgroundColor: '#ff9800', color: 'white' }
    },
    orderTypeLabel: { color: '#455a64' },
    actionButton: {
      primary: { backgroundColor: '#1976d2', color: 'white' },
      danger: { backgroundColor: '#d32f2f', color: 'white' },
      success: { backgroundColor: '#388e3c', color: 'white' }
    },
    modal: {
      overlay: { backgroundColor: 'rgba(0, 0, 0, 0.6)' },
      content: { backgroundColor: 'white', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, activeStatusFilter, activeOrderTypeFilter, activeRegularFilter]);

  const handleOpenSearchModal = (userId, user_fullname) => {
    const encodedName = encodeURIComponent(user_fullname);
    navigate(`/add-to-cart/${userId}/${encodedName}`);
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 1 ? 0 : 1;
      await axios.put(`/api/v1/usersLists/users/${id}/status`, { status: newStatus });
      fetchUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      setError('Failed to update user status. Please try again.');
    }
  };

  const toggleRegular = async (id, currentRegular) => {
    try {
      const newRegular = currentRegular === 1 ? 0 : 1;
      await axios.put(`/api/v1/usersLists/users/${id}/regular`, { regular: newRegular });
      fetchUsers();
    } catch (error) {
      console.error('Error toggling user regular status:', error);
      setError('Failed to update user regular status. Please try again.');
    }
  };

  const updateOrderType = async (id, orderType) => {
    try {
      await axios.put(`/api/v1/usersLists/users/${id}/order-type`, { order_type: orderType });
      setUsers(users.map(user =>
        user._id === id ? { ...user, order_type: orderType } : user
      ));
    } catch (error) {
      console.error('Error updating order type:', error);
      setError('Failed to update order type. Please try again.');
    }
  };

  const getOrderType = (orderType) => {
    if (!orderType || orderType === "0") return "";
    return orderType.toLowerCase();
  };
  const redirectToWhatsApp = (phoneNumber) => {
    if (!phoneNumber) {
        console.error('Phone number is undefined or null');
        return;
    }
    const cleanNumber = String(phoneNumber).replace(/\D/g, ''); // Convert to string and remove non-digits
    if (!cleanNumber) {
        console.error('Phone number is invalid or empty');
        return;
    }
    const whatsappUrl = `https://wa.me/${cleanNumber}`;
    window.open(whatsappUrl, '_blank');
};

const openEditModal = (user) => {
  console.log("Opening edit modal for user:", user); // Debugging
  setEditingUser({
    ...user,
    pincode: user.pincode || '', // Initialize pincode if it exists
  });
  setIsEditModalOpen(true);
};

const handleEditUser = async (e) => {
  e.preventDefault();
  try {
    await axios.put(`/api/v1/usersLists/users/${editingUser._id}`, {
      ...editingUser,
      pincode: editingUser.pincode || null, // Ensure pincode is sent to the API
    });
    fetchUsers(); // Refresh the user list
    closeEditModal(); // Close the modal
  } catch (error) {
    console.error('Error updating user:', error);
    setError('Failed to update user. Please try again.');
  }
};

  const closeEditModal = () => {
    setEditingUser(null);
    setIsEditModalOpen(false);
  };

 
  const TabButton = ({ label, isActive, onClick }) => (
    <button
      onClick={onClick}
      style={{
        ...styles.actionButton.primary,
        backgroundColor: isActive ? '#1976d2' : '#e0e0e0',
        color: isActive ? 'white' : '#455a64',
        marginRight: '0.5rem',
        padding: '0.5rem 1rem',
        borderRadius: '0.25rem',
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.3s ease'
      }}
    >
      {label}
    </button>
  );

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const renderPagination = () => {
    const totalPages = Math.ceil(totalUsers / usersPerPage);
    
    // Don't render pagination if there's only one page
    if (totalPages <= 1) return null;
    
    const pageButtonStyle = {
      padding: '0.5rem 1rem',
      borderRadius: '0.25rem',
      border: 'none',
      backgroundColor: '#e0e0e0',
      color: '#455a64',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      margin: '0 0.25rem'
    };
    
    const activeButtonStyle = {
      ...pageButtonStyle,
      backgroundColor: '#1976d2',
      color: 'white',
    };
    
    // Calculate which page numbers to show
    let pagesToShow = [];
    const siblingCount = 2; // Increased from 1 to 2 to show more pages
    
    // Always include first and last page
    const firstPage = 1;
    const lastPage = totalPages;
    
    // Calculate range around current page
    let startPage = Math.max(currentPage - siblingCount, 1);
    let endPage = Math.min(currentPage + siblingCount, totalPages);
    
    // Adjust range to ensure we show at least 4 pages if possible
    if (endPage - startPage + 1 < 4 && totalPages >= 4) {
      if (startPage === 1) {
        endPage = Math.min(startPage + 3, totalPages);
      } else if (endPage === totalPages) {
        startPage = Math.max(endPage - 3, 1);
      }
    }
    
    // Add page numbers
    for (let i = startPage; i <= endPage; i++) {
      pagesToShow.push(i);
    }
    
    // Add first page if not included
    if (!pagesToShow.includes(1)) {
      pagesToShow = [1, '...', ...pagesToShow];
    }
    
    // Add last page if not included
    if (!pagesToShow.includes(totalPages) && totalPages > 1) {
      pagesToShow = [...pagesToShow, '...', totalPages];
    }

    return (
      <nav aria-label="Pagination" style={{ margin: '1.5rem 0' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          {/* Previous button */}
          <button 
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            style={{
              ...pageButtonStyle,
              opacity: currentPage === 1 ? 0.5 : 1,
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            Previous
          </button>
          
          {/* Page numbers */}
          {pagesToShow.map((page, index) => 
            typeof page === 'number' ? (
              <button
                key={index}
                onClick={() => handlePageChange(page)}
                style={currentPage === page ? activeButtonStyle : pageButtonStyle}
              >
                {page}
              </button>
            ) : (
              <span key={index} style={{ margin: '0 0.25rem' }}>{page}</span>
            )
          )}
          
          {/* Next button */}
          <button 
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={{
              ...pageButtonStyle,
              opacity: currentPage === totalPages ? 0.5 : 1,
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
            }}
          >
            Next
          </button>
        </div>
      </nav>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return <div style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>Loading...</div>;
    }

    if (error) {
      return (
        <div style={{
          border: '1px solid #d32f2f',
          padding: '1rem',
          margin: '1rem',
          color: '#d32f2f',
          backgroundColor: '#ffebee',
          borderRadius: '0.25rem'
        }}>
          {error}
        </div>
      );
    }

    return (
      <>
        <h1 style={{ ...styles.headerText, fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          User List
        </h1>

        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ ...styles.headerText, fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            Status Filter:
          </h3>
          <div>
            <TabButton label="All" isActive={activeStatusFilter === 'all'} onClick={() => setActiveStatusFilter('all')} />
            <TabButton label="Active" isActive={activeStatusFilter === 'active'} onClick={() => setActiveStatusFilter('active')} />
            <TabButton label="Blocked" isActive={activeStatusFilter === 'blocked'} onClick={() => setActiveStatusFilter('blocked')} />
            <TabButton label="Pending" isActive={activeStatusFilter === 'pending'} onClick={() => setActiveStatusFilter('pending')} />
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ ...styles.headerText, fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            Order Type Filter:
          </h3>
          <div>
            <TabButton label="All" isActive={activeOrderTypeFilter === 'all'} onClick={() => setActiveOrderTypeFilter('all')} />
            <TabButton label="COD" isActive={activeOrderTypeFilter === 'COD'} onClick={() => setActiveOrderTypeFilter('COD')} />
            <TabButton label="Advance" isActive={activeOrderTypeFilter === 'Advance'} onClick={() => setActiveOrderTypeFilter('Advance')} />
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ ...styles.headerText, fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            Regular Filter:
          </h3>
          <div>
            <TabButton label="All" isActive={activeRegularFilter === 'all'} onClick={() => setActiveRegularFilter('all')} />
            <TabButton label="Regular" isActive={activeRegularFilter === 1} onClick={() => setActiveRegularFilter(1)} />
            <TabButton label="Non-regular" isActive={activeRegularFilter === 0} onClick={() => setActiveRegularFilter(0)} />
          </div>
        </div>

        {renderSearchSection()}

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', ...styles.tableBorder }}>
            <thead>
              <tr>
                {['Name', 'Email', 'Phone', 'Address', 'Pincode','Status', 'Order Type', 'Actions'].map(header => (
                  <th
                    key={header}
                    style={{
                      ...styles.tableHeader,
                      padding: '0.75rem',
                      textAlign: 'left',
                      borderBottom: '2px solid #e0e0e0'
                    }}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentUsers.map((user) => (
                <tr key={user._id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                  <td style={{ padding: '0.75rem' }}>{user.user_fullname}</td>
                  <td style={{ padding: '0.75rem' }}>{user.email_id}</td>
                  <td style={{ padding: '0.75rem' }}>
                    {user.mobile_no && (
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        {user.mobile_no}
                        <MessageCircle
                          onClick={() => redirectToWhatsApp(user.mobile_no)}
                          style={{ cursor: 'pointer', marginLeft: '0.5rem', color: '#25D366' }}
                          size={18}
                        />
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem' }}>{user.address || 'N/A'}</td>
                  <td style={{ padding: '0.75rem' }}>{user.pincode || 'N/A'}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <button
                      onClick={() => toggleRegular(user._id, user.regular)}
                      style={{
                        ...(user.regular === 1 ? styles.actionButton.success : styles.actionButton.danger),
                        marginRight: '0.5rem',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '0.25rem',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {user.regular === 1 ? 'Regular' : 'Non-regular'}
                    </button>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {['COD', 'Advance'].map((type) => (
                        <label key={type} style={{
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'pointer',
                          color: styles.orderTypeLabel.color
                        }}>
                          <input
                            type="radio"
                            name={`orderType-${user._id}`}
                            value={type}
                            checked={getOrderType(user.order_type) === type.toLowerCase()}
                            onChange={() => updateOrderType(user._id, type)}
                            style={{ marginRight: '0.25rem' }}
                          />
                          {type}
                        </label>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => toggleStatus(user._id, user.status)}
                        style={{
                          ...(user.status === 1 ? styles.actionButton.danger : styles.actionButton.success),
                          marginRight: '0.5rem',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '0.25rem',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {user.status === 1 ? 'Block' : 'Activate'}
                      </button>
                      <button
                        onClick={() => openEditModal(user)}
                        style={{
                          ...styles.actionButton.primary,
                          padding: '0.25rem 0.75rem',
                          borderRadius: '0.25rem',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          display: 'inline-flex',
                          alignItems: 'center'
                        }}
                      >
                        <Edit size={16} style={{ marginRight: '0.25rem' }} /> Edit
                      </button>
                      <button
                        onClick={() => handleOpenSearchModal(user._id, user.user_fullname)}
                        style={{
                          backgroundColor: '#007bff',
                          color: '#ffffff',
                          padding: '0.5rem 1rem',
                          borderRadius: '0.25rem',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        Cart
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {renderPagination()}

        {isEditModalOpen && (
  <div style={{
    position: 'fixed',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 1000
  }}>
    <div style={{
      backgroundColor: 'white',
      padding: '1.5rem',
      borderRadius: '0.5rem',
      width: '90%',
      maxWidth: '500px'
    }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        Edit User
      </h2>
      <form onSubmit={handleEditUser}>
        <div style={{ marginBottom: '1rem' }}>
          <label>User Full Name</label>
          <input
            type="text"
            value={editingUser?.user_fullname || ''}
            onChange={(e) => setEditingUser({ ...editingUser, user_fullname: e.target.value })}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #e0e0e0' }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Mobile Number</label>
          <input
            type="text"
            value={editingUser?.mobile_no || ''}
            onChange={(e) => setEditingUser({ ...editingUser, mobile_no: e.target.value })}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #e0e0e0' }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Address</label>
          <input
            type="text"
            value={editingUser?.address || ''}
            onChange={(e) => setEditingUser({ ...editingUser, address: e.target.value })}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #e0e0e0' }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={closeEditModal}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.25rem',
              border: 'none',
              backgroundColor: '#e0e0e0',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.25rem',
              border: 'none',
              backgroundColor: '#1976d2',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            Save changes
          </button>
        </div>
      </form>
    </div>
  </div>
)}
      </>
    );
  };

  return (
    <Layout title="User List">
      <div style={{
        margin: '1rem',
        paddingTop: '5rem',
        backgroundColor: '#ffffff',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ flex: '0 0 250px' }}>
            <AdminMenu />
          </div>
          <div style={{ flex: '1', minWidth: '0' }}>
            {renderContent()}
          </div>
        </div>
      </div>

      {isEditModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            width: '90%',
            maxWidth: '500px'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              Edit User
            </h2>
            <form onSubmit={handleEditUser}>
              <div style={{ marginBottom: '1rem' }}>
                <label>User Full Name</label>
                <input
                  type="text"
                  value={editingUser?.user_fullname || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, user_fullname: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #e0e0e0' }}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label>Mobile Number</label>
                <input
                  type="text"
                  value={editingUser?.mobile_no || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, mobile_no: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #e0e0e0' }}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label>Address</label>
                <input
                  type="text"
                  value={editingUser?.address || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, address: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #e0e0e0' }}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label>Pincode</label>
                <input
                  type="text"
                  value={editingUser?.pincode || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, pincode: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #e0e0e0' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={closeEditModal}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.25rem',
                    border: 'none',
                    backgroundColor: '#e0e0e0',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.25rem',
                    border: 'none',
                    backgroundColor: '#1976d2',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default UserList;