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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  const location = useLocation();
  const navigate = useNavigate();

  // Initialize states from URL params
  const urlParams = new URLSearchParams(location.search);
  const pageFromUrl = parseInt(urlParams.get('page')) || 1;
  const searchFromUrl = urlParams.get('search') || '';

  // Debounce the search term
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms delay

    return () => clearTimeout(debounceTimer); // Cleanup on unmount or re-render
  }, [searchTerm]);

  // --- Fix: Always fetch users when currentPage or debouncedSearchTerm changes ---
  useEffect(() => {
    fetchUsers(currentPage, debouncedSearchTerm);
    // eslint-disable-next-line
  }, [currentPage, debouncedSearchTerm]);

  // --- Fix: When searchTerm changes, reset to page 1 and update URL ---
  useEffect(() => {
    setCurrentPage(1);
    // Update URL with search param only
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    window.history.replaceState({}, '', `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`);
    // Debounce handled separately
    // eslint-disable-next-line
  }, [searchTerm]);

  // --- Fix: When currentPage changes, update URL with both page and search ---
  useEffect(() => {
    const params = new URLSearchParams();
    if (currentPage > 1) params.set('page', currentPage);
    if (searchTerm) params.set('search', searchTerm);
    window.history.replaceState({}, '', `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`);
    // eslint-disable-next-line
  }, [currentPage]);

  // --- Fix: When currentPage changes, fetch users for that page and current search ---
  useEffect(() => {
    fetchUsers(currentPage, debouncedSearchTerm);
    // eslint-disable-next-line
  }, [currentPage, debouncedSearchTerm]);

  // --- Fix: When users or filters change, filter users ---
  useEffect(() => {
    filterUsers(users);
    // eslint-disable-next-line
  }, [users, activeStatusFilter, activeOrderTypeFilter, activeRegularFilter]);

  // --- Fix: Remove duplicate fetchUsers on mount ---
  useEffect(() => {
    // On mount, initialize from URL
    const params = new URLSearchParams(location.search);
    const page = parseInt(params.get('page')) || 1;
    const search = params.get('search') || '';
    setCurrentPage(page);
    setSearchTerm(search);
    setDebouncedSearchTerm(search);
    // eslint-disable-next-line
  }, []);

  // Add window resize listener
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSearch = async (value) => {
    setSearchTerm(value);
    // Call backend for every character typed (including single char)
    try {
      const { data } = await axios.get(`/users?search=${encodeURIComponent(value)}`);
      setFilteredUsers((data.list || []).map(user => user)); // Ensure filteredUsers is an array
      setTotalUsers(data.total || 0);
    } catch (error) {
      // handle error
    }
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
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const filterUsers = (usersList = users) => {
    let result = usersList;

    if (activeStatusFilter !== 'all') {
      // Map filter values to the correct enum values
      const statusMap = {
        'pending': 0,
        'active': 1,
        'blocked': 2
      };
      const statusValue = statusMap[activeStatusFilter];
      result = result.filter(user => user.status === statusValue);
    }
    if (activeOrderTypeFilter !== 'all') {
      result = result.filter(user => getOrderType(user.order_type) === activeOrderTypeFilter.toLowerCase());
    }
    if (activeRegularFilter !== 'all') {
      // Ensure we're comparing numbers
      const filterValue = parseInt(activeRegularFilter);
      result = result.filter(user => {
        const userRegular = parseInt(user.regular) || 0;
        return userRegular === filterValue;
      });
    }

    setFilteredUsers(result);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1) {
      setCurrentPage(newPage);
      // Do NOT call fetchUsers here; useEffect will handle it
    }
  };

  const styles = {
    headerText: { color: '#1a237e' },
    errorText: { color: '#d32f2f' },
    tableHeader: { 
      backgroundColor: '#f5f5f5', 
      color: '#2c3e50',
      '@media (max-width: 768px)': {
        fontSize: '0.9rem',
        padding: '0.5rem'
      }
    },
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
    },
    responsiveContainer: {
      margin: '1rem',
      paddingTop: '5rem',
      backgroundColor: '#ffffff',
      borderRadius: '0.5rem',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      '@media (max-width: 768px)': {
        margin: '0.5rem',
        paddingTop: '3rem'
      }
    },
    filterSection: {
      marginBottom: '1.5rem',
      '@media (max-width: 768px)': {
        marginBottom: '1rem'
      }
    },
    filterButtons: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '0.5rem',
      '@media (max-width: 768px)': {
        gap: '0.25rem'
      }
    },
    searchSection: {
      marginBottom: '1.5rem',
      '@media (max-width: 768px)': {
        marginBottom: '1rem'
      }
    },
    searchInput: {
      padding: '0.5rem',
      border: '1px solid #e0e0e0',
      borderRadius: '0.25rem',
      width: '300px',
      fontSize: '1rem',
      '@media (max-width: 768px)': {
        width: '100%',
        fontSize: '0.9rem'
      }
    },
    tableContainer: {
      position: 'relative',
      overflowX: 'auto',
      '@media (max-width: 768px)': {
        marginLeft: '-0.5rem',
        marginRight: '-0.5rem'
      }
    },
    tableCell: {
      padding: '0.75rem',
      '@media (max-width: 768px)': {
        padding: '0.5rem',
        fontSize: '0.9rem'
      }
    },
    actionButtonsContainer: {
      display: 'flex',
      gap: '0.5rem',
      '@media (max-width: 768px)': {
        flexDirection: 'column',
        gap: '0.25rem'
      }
    }
  };

  const renderSearchSection = () => (
    <div style={styles.searchSection}>
      <form onSubmit={e => e.preventDefault()} style={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'center', 
        gap: '1rem' 
      }}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by name, email, phone, or address..."
          style={styles.searchInput}
          autoFocus
        />
        <span style={{ 
          color: '#666', 
          fontSize: isMobile ? '0.8rem' : '0.875rem',
          textAlign: isMobile ? 'center' : 'left'
        }}>
          Showing {((filteredUsers || []).length || 0)} of {(totalUsers || 0)} users
        </span>
      </form>
    </div>
  );

  const handleOpenSearchModal = (userId, user_fullname) => {
    const encodedName = encodeURIComponent(user_fullname);
    navigate(`/add-to-cart/${userId}/${encodedName}`);
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      // Toggle between Active (1) and Blocked (2)
      const newStatus = currentStatus === 1 ? 2 : 1;
      await axios.put(`/api/v1/usersLists/users/${id}/status`, { status: newStatus });
      fetchUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      setError('Failed to update user status. Please try again.');
    }
  };

  const toggleRegular = async (id, currentRegular) => {
    try {
      setIsLoading(true);
      // Ensure we're working with numbers
      const current = parseInt(currentRegular) || 0;
      const newRegular = current === 1 ? 0 : 1;
      
      const response = await axios.put(`/api/v1/usersLists/users/${id}/regular`, { 
        regular: newRegular 
      });

      if (response.data && response.data.status === 'success') {
        // Since the API response doesn't include the regular field, we'll use our newRegular value
        const updatedUser = {
          ...response.data.user,
          regular: newRegular // Explicitly set the regular status
        };

        // Update both users and filtered users with the correct regular status
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user._id === id ? { ...user, ...updatedUser, regular: newRegular } : user
          )
        );

        setFilteredUsers(prevFiltered => 
          prevFiltered.map(user => 
            user._id === id ? { ...user, ...updatedUser, regular: newRegular } : user
          )
        );

        // Clear any previous errors
        setError(null);
      } else {
        throw new Error(response.data?.message || 'Failed to update regular status');
      }
    } catch (error) {
      console.error('Error toggling user regular status:', error);
      setError(error.message || 'Failed to update user regular status. Please try again.');
      // Revert optimistic update by fetching fresh data
      await fetchUsers();
    } finally {
      setIsLoading(false);
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
    // Handle numeric values from backend
    if (typeof orderType === 'number') {
      switch (orderType) {
        case 0: return 'cod';
        case 1: return 'advance';
        case 2: return 'advance'; // Handle old value for backward compatibility
        default: return 'cod'; // Default to COD
      }
    }
    
    // Handle string values
    if (typeof orderType === 'string') {
      return orderType.toLowerCase();
    }
    
    // Default to COD if orderType is undefined or null
    return 'cod';
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

  const currentUsers = (filteredUsers || []);

  const renderPagination = () => {
    const totalPages = Math.ceil(totalUsers / usersPerPage);

    // Don't render pagination if there's only one page
    if (totalPages <= 1) return null;

    const pageButtonStyle = {
      padding: isMobile ? '0.35rem 0.75rem' : '0.5rem 1rem',
      borderRadius: '0.25rem',
      border: 'none',
      backgroundColor: '#e0e0e0',
      color: '#455a64',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      margin: '0 0.25rem',
      fontSize: isMobile ? '0.85rem' : '1rem'
    };

    const activeButtonStyle = {
      ...pageButtonStyle,
      backgroundColor: '#1976d2',
      color: 'white',
    };

    // Calculate which page numbers to show
    let pagesToShow = [];
    const siblingCount = isMobile ? 1 : 2; // Show fewer pages on mobile

    // Always include first and last page
    const firstPage = 1;
    const lastPage = totalPages;

    // Calculate range around current page
    let startPage = Math.max(currentPage - siblingCount, 1);
    let endPage = Math.min(currentPage + siblingCount, totalPages);

    // Adjust range to ensure we show at least 3 pages if possible
    if (endPage - startPage + 1 < 3 && totalPages >= 3) {
      if (startPage === 1) {
        endPage = Math.min(startPage + 2, totalPages);
      } else if (endPage === totalPages) {
        startPage = Math.max(endPage - 2, 1);
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
      <nav aria-label="Pagination" style={{ margin: isMobile ? '1rem 0' : '1.5rem 0' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: isMobile ? '0.25rem' : '0.5rem'
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
            {isMobile ? '←' : 'Previous'}
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
              <span key={index} style={{ 
                margin: '0 0.25rem',
                fontSize: isMobile ? '0.85rem' : '1rem'
              }}>
                {page}
              </span>
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
            {isMobile ? '→' : 'Next'}
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

        <div style={styles.filterSection}>
          <h3 style={{ ...styles.headerText, fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            Status Filter:
          </h3>
          <div style={styles.filterButtons}>
            <TabButton label="All" isActive={activeStatusFilter === 'all'} onClick={() => setActiveStatusFilter('all')} />
            <TabButton label="Active" isActive={activeStatusFilter === 'active'} onClick={() => setActiveStatusFilter('active')} />
            <TabButton label="Blocked" isActive={activeStatusFilter === 'blocked'} onClick={() => setActiveStatusFilter('blocked')} />
            <TabButton label="Pending" isActive={activeStatusFilter === 'pending'} onClick={() => setActiveStatusFilter('pending')} />
          </div>
        </div>

        <div style={styles.filterSection}>
          <h3 style={{ ...styles.headerText, fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            Regular Filter:
          </h3>
          <div style={styles.filterButtons}>
            <TabButton label="All" isActive={activeRegularFilter === 'all'} onClick={() => setActiveRegularFilter('all')} />
            <TabButton label="Regular" isActive={activeRegularFilter === 1} onClick={() => setActiveRegularFilter(1)} />
            <TabButton label="Non-regular" isActive={activeRegularFilter === 0} onClick={() => setActiveRegularFilter(0)} />
          </div>
        </div>

        {renderSearchSection()}

        <div style={styles.tableContainer}>
          <table style={{ width: '100%', borderCollapse: 'collapse', ...styles.tableBorder }}>
            <thead>
              <tr>
                {['Name', 'Email', 'Phone', 'Address', 'Pincode', 'Status', 'Order Type', 'Actions'].map(header => (
                  <th
                    key={header}
                    style={{
                      ...styles.tableHeader,
                      padding: isMobile ? '0.5rem' : '0.75rem',
                      textAlign: 'left',
                      borderBottom: '2px solid #e0e0e0',
                      fontSize: isMobile ? '0.85rem' : '1rem',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                    Loading...
                  </td>
                </tr>
              ) : currentUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                    No users found.
                  </td>
                </tr>
              ) : (
                currentUsers.map((user) => (
                  <tr key={user._id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                    <td style={styles.tableCell}>{user.user_fullname}</td>
                    <td style={styles.tableCell}>{user.email_id}</td>
                    <td style={styles.tableCell}>
                      {user.mobile_no && (
                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'nowrap' }}>
                          <span style={{ 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: isMobile ? '100px' : '150px'
                          }}>
                            {user.mobile_no}
                          </span>
                          <MessageCircle
                            onClick={() => !isLoading && redirectToWhatsApp(user.mobile_no)}
                            style={{ 
                              cursor: isLoading ? 'not-allowed' : 'pointer', 
                              marginLeft: '0.5rem', 
                              color: '#25D366', 
                              opacity: isLoading ? 0.5 : 1,
                              flexShrink: 0
                            }}
                            size={isMobile ? 16 : 18}
                          />
                        </div>
                      )}
                    </td>
                    <td style={{
                      ...styles.tableCell,
                      maxWidth: isMobile ? '150px' : '200px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {user.address || 'N/A'}
                    </td>
                    <td style={styles.tableCell}>{user.pincode || 'N/A'}</td>
                    <td style={styles.tableCell}>
                      {renderRegularButton(user)}
                    </td>
                    <td style={styles.tableCell}>
                      <div style={styles.actionButtonsContainer}>
                        {['COD', 'Advance'].map((type) => (
                          <label key={type} style={{
                            display: 'flex',
                            alignItems: 'center',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            color: styles.orderTypeLabel.color,
                            opacity: isLoading ? 0.6 : 1,
                            fontSize: isMobile ? '0.8rem' : '0.9rem'
                          }}>
                            <input
                              type="radio"
                              name={`orderType-${user._id}`}
                              value={type}
                              checked={getOrderType(user.order_type) === type.toLowerCase()}
                              onChange={() => !isLoading && updateOrderType(user._id, type)}
                              style={{ marginRight: '0.25rem' }}
                              disabled={isLoading}
                            />
                            {type}
                          </label>
                        ))}
                      </div>
                    </td>
                    <td style={styles.tableCell}>
                      <div style={styles.actionButtonsContainer}>
                        <button
                          onClick={() => !isLoading && toggleStatus(user._id, user.status)}
                          style={{
                            ...(user.status === 1 ? styles.actionButton.danger : styles.actionButton.success),
                            padding: isMobile ? '0.15rem 0.5rem' : '0.25rem 0.75rem',
                            borderRadius: '0.25rem',
                            border: 'none',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.3s ease',
                            opacity: isLoading ? 0.6 : 1,
                            fontSize: isMobile ? '0.8rem' : '0.9rem',
                            width: '100%'
                          }}
                          disabled={isLoading}
                        >
                          {user.status === 1 ? 'Block' : 'Activate'}
                        </button>
                        <button
                          onClick={() => !isLoading && openEditModal(user)}
                          style={{
                            ...styles.actionButton.primary,
                            padding: isMobile ? '0.15rem 0.5rem' : '0.25rem 0.75rem',
                            borderRadius: '0.25rem',
                            border: 'none',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.3s ease',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: isLoading ? 0.6 : 1,
                            fontSize: isMobile ? '0.8rem' : '0.9rem',
                            width: '100%'
                          }}
                          disabled={isLoading}
                        >
                          <Edit size={isMobile ? 14 : 16} style={{ marginRight: '0.25rem' }} /> Edit
                        </button>
                        <button
                          onClick={() => !isLoading && handleOpenSearchModal(user._id, user.user_fullname)}
                          style={{
                            backgroundColor: '#007bff',
                            color: '#ffffff',
                            padding: isMobile ? '0.15rem 0.5rem' : '0.25rem 0.75rem',
                            borderRadius: '0.25rem',
                            border: 'none',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            opacity: isLoading ? 0.6 : 1,
                            fontSize: isMobile ? '0.8rem' : '0.9rem',
                            width: '100%'
                          }}
                          disabled={isLoading}
                        >
                          Cart
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {renderPagination()}
      </>
    );
  };

  const renderEditModal = () => {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        zIndex: 1000,
        padding: isMobile ? '1rem' : 0
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: isMobile ? '1rem' : '1.5rem',
          borderRadius: '0.5rem',
          width: '90%',
          maxWidth: '500px',
          maxHeight: isMobile ? '90vh' : '80vh',
          overflowY: 'auto'
        }}>
          <h2 style={{ 
            fontSize: isMobile ? '1.1rem' : '1.25rem', 
            fontWeight: 'bold', 
            marginBottom: '1rem' 
          }}>
            Edit User
          </h2>
          <form onSubmit={handleEditUser}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: isMobile ? '0.9rem' : '1rem' }}>User Full Name</label>
              <input
                type="text"
                value={editingUser?.user_fullname || ''}
                onChange={(e) => setEditingUser({ ...editingUser, user_fullname: e.target.value })}
                style={{ 
                  width: '100%', 
                  padding: isMobile ? '0.4rem' : '0.5rem', 
                  borderRadius: '0.25rem', 
                  border: '1px solid #e0e0e0',
                  fontSize: isMobile ? '0.9rem' : '1rem'
                }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: isMobile ? '0.9rem' : '1rem' }}>Mobile Number</label>
              <input
                type="text"
                value={editingUser?.mobile_no || ''}
                onChange={(e) => setEditingUser({ ...editingUser, mobile_no: e.target.value })}
                style={{ 
                  width: '100%', 
                  padding: isMobile ? '0.4rem' : '0.5rem', 
                  borderRadius: '0.25rem', 
                  border: '1px solid #e0e0e0',
                  fontSize: isMobile ? '0.9rem' : '1rem'
                }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: isMobile ? '0.9rem' : '1rem' }}>Address</label>
              <input
                type="text"
                value={editingUser?.address || ''}
                onChange={(e) => setEditingUser({ ...editingUser, address: e.target.value })}
                style={{ 
                  width: '100%', 
                  padding: isMobile ? '0.4rem' : '0.5rem', 
                  borderRadius: '0.25rem', 
                  border: '1px solid #e0e0e0',
                  fontSize: isMobile ? '0.9rem' : '1rem'
                }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: isMobile ? '0.9rem' : '1rem' }}>Pincode</label>
              <input
                type="text"
                value={editingUser?.pincode || ''}
                onChange={(e) => setEditingUser({ ...editingUser, pincode: e.target.value })}
                style={{ 
                  width: '100%', 
                  padding: isMobile ? '0.4rem' : '0.5rem', 
                  borderRadius: '0.25rem', 
                  border: '1px solid #e0e0e0',
                  fontSize: isMobile ? '0.9rem' : '1rem'
                }}
              />
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: isMobile ? '0.5rem' : '0.75rem',
              marginTop: isMobile ? '1rem' : '1.5rem'
            }}>
              <button
                type="button"
                onClick={closeEditModal}
                style={{
                  padding: isMobile ? '0.4rem 0.8rem' : '0.5rem 1rem',
                  borderRadius: '0.25rem',
                  border: 'none',
                  backgroundColor: '#e0e0e0',
                  cursor: 'pointer',
                  fontSize: isMobile ? '0.9rem' : '1rem'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: isMobile ? '0.4rem 0.8rem' : '0.5rem 1rem',
                  borderRadius: '0.25rem',
                  border: 'none',
                  backgroundColor: '#1976d2',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: isMobile ? '0.9rem' : '1rem'
                }}
              >
                Save changes
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderRegularButton = (user) => {
    const isRegular = Number(user.regular) === 1;
    return (
      <button
        onClick={() => !isLoading && toggleRegular(user._id, Number(user.regular))}
        style={{
          ...(isRegular ? styles.actionButton.success : styles.actionButton.danger),
          marginRight: '0.5rem',
          padding: isMobile ? '0.15rem 0.5rem' : '0.25rem 0.75rem',
          borderRadius: '0.25rem',
          border: 'none',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s ease',
          opacity: isLoading ? 0.6 : 1,
          fontSize: isMobile ? '0.8rem' : '0.9rem'
        }}
        disabled={isLoading}
      >
        {isRegular ? 'Regular' : 'Non-regular'}
      </button>
    );
  };

  return (
    <Layout title="User List">
      <div style={styles.responsiveContainer}>
        <div style={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          gap: '1rem' 
        }}>
          <div style={{ 
            flex: isMobile ? 'none' : '0 0 250px',
            marginBottom: isMobile ? '1rem' : '0'
          }}>
            <AdminMenu />
          </div>
          <div style={{ flex: '1', minWidth: '0' }}>
            {renderContent()}
          </div>
        </div>
      </div>
      {isEditModalOpen && renderEditModal()}
    </Layout>
  );
};

export default UserList;