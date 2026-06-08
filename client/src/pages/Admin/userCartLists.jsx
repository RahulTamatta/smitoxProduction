import axios from 'axios';
import { Edit, MessageCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AdminMenu from "../../components/Layout/AdminMenu";
import Layout from "../../components/Layout/Layout";

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
  const [activeCartFilter, setActiveCartFilter] = useState('all');
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
    fetchUsers(currentPage, debouncedSearchTerm, activeOrderTypeFilter, activeCartFilter);
    // eslint-disable-next-line
  }, [currentPage, debouncedSearchTerm, activeOrderTypeFilter, activeCartFilter]);

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

  // Reset to first page whenever order type filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeOrderTypeFilter]);

  // Ensure current page never exceeds total pages (e.g., when filters shrink results)
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil((totalUsers || 0) / usersPerPage));
    if (totalUsers === 0) {
      if (currentPage !== 1) {
        setCurrentPage(1);
      }
      return;
    }

    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalUsers, currentPage, usersPerPage]);

  // --- Fix: When users or filters change, filter users ---
  useEffect(() => {
    filterUsers(users);
    // eslint-disable-next-line
  }, [users, activeStatusFilter, activeOrderTypeFilter, activeRegularFilter, activeCartFilter]);

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
      const { data } = await axios.get(`/api/v1/usersLists/users`, {
        params: {
          page: 1,
          limit: usersPerPage,
          search: value,
          orderType: activeOrderTypeFilter,
          hasCart: activeCartFilter === 'withCart',
        }
      });
      setFilteredUsers((data.list || []).map(user => user)); // Ensure filteredUsers is an array
      setTotalUsers(data.total || 0);
    } catch (error) {
      // handle error
    }
  };

  const fetchUsers = async (page = currentPage, search = searchTerm, orderType = activeOrderTypeFilter, cartFilter = activeCartFilter) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/v1/usersLists/users`, {
        params: {
          page,
          limit: usersPerPage,
          search, // Pass the search term as-is
          orderType,
          hasCart: cartFilter === 'withCart',
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
      result = result.filter(user => user.status === activeStatusFilter);
    }
    if (activeOrderTypeFilter !== 'all') {
      result = result.filter(user => {
        const userOrderTypeLabel = getOrderTypeLabel(user.order_type);
        return userOrderTypeLabel.toLowerCase() === activeOrderTypeFilter.toLowerCase();
      });
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

      // Update the users state
      const updatedUsers = users.map(user =>
        user._id === id ? { ...user, order_type: orderType } : user
      );
      setUsers(updatedUsers);

      // Immediately filter the updated users to reflect changes
      filterUsers(updatedUsers);

    } catch (error) {
      console.error('Error updating order type:', error);
      setError('Failed to update order type. Please try again.');
    }
  };

  const getOrderType = (orderType) => {
    if (!orderType || orderType === "0") return "";
    if (typeof orderType === "string") return orderType.toLowerCase();
    if (typeof orderType === "number") return String(orderType);
    return "";
  };

  // Map numeric order_type to display labels
  const getOrderTypeLabel = (orderType) => {
    const numericType = typeof orderType === 'string' ? parseInt(orderType) : orderType;
    switch (numericType) {
      case 0: return 'COD';
      case 1: return 'Prepared';
      case 2: return 'Advance';
      default: return 'COD';
    }
  };

  // Map label to numeric value
  const getOrderTypeValue = (label) => {
    switch (label.toLowerCase()) {
      case 'cod': return 0;
      case 'prepared': return 1;
      case 'advance': return 2;
      default: return 0;
    }
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
                className={currentPage === page ? 'active' : ''}
                style={currentPage === page ? activeButtonStyle : pageButtonStyle}
              >
                {page}
              </button>
            ) : (
              <span key={index}>
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

  const FiltersRedesign = () => (
    <>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #ddd', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => setActiveCartFilter('all')} 
          style={{ background: 'none', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer', borderBottom: activeCartFilter === 'all' ? '2px solid #1a237e' : 'none', fontWeight: activeCartFilter === 'all' ? 'bold' : 'normal', color: activeCartFilter === 'all' ? '#1a237e' : '#666' }}
        >
          All Users
        </button>
        <button 
          onClick={() => setActiveCartFilter('withCart')} 
          style={{ background: 'none', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer', borderBottom: activeCartFilter === 'withCart' ? '2px solid #1a237e' : 'none', fontWeight: activeCartFilter === 'withCart' ? 'bold' : 'normal', color: activeCartFilter === 'withCart' ? '#1a237e' : '#666' }}
        >
          Users with Cart Items
        </button>
      </div>
    <div style={{
      backgroundColor: '#fff',
      padding: '1.25rem',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
      marginBottom: '1.5rem',
      border: '1px solid #eee'
    }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'flex-start' }}>
        {/* Status */}
        <div style={{ minWidth: '200px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', textTransform: 'uppercase', color: '#888', marginBottom: '0.5rem', fontWeight: '600' }}>User Status</label>
          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
            {['all', 'active', 'blocked'].map(stat => (
              <button
                key={stat}
                onClick={() => setActiveStatusFilter(stat)}
                style={{
                  padding: '0.4rem 0.8rem',
                  fontSize: '0.85rem',
                  borderRadius: '4px',
                  border: activeStatusFilter === stat ? '1px solid #1a237e' : '1px solid #ddd',
                  backgroundColor: activeStatusFilter === stat ? '#e8eaf6' : '#fff',
                  color: activeStatusFilter === stat ? '#1a237e' : '#555',
                  cursor: 'pointer',
                  fontWeight: activeStatusFilter === stat ? '600' : '400'
                }}
              >
                {stat.charAt(0).toUpperCase() + stat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Regularity */}
        <div style={{ minWidth: '200px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', textTransform: 'uppercase', color: '#888', marginBottom: '0.5rem', fontWeight: '600' }}>Customer Type</label>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button onClick={() => setActiveRegularFilter('all')} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', borderRadius: '4px', border: activeRegularFilter === 'all' ? '1px solid #1a237e' : '1px solid #ddd', backgroundColor: activeRegularFilter === 'all' ? '#e8eaf6' : '#fff', color: activeRegularFilter === 'all' ? '#1a237e' : '#555', cursor: 'pointer' }}>All</button>
            <button onClick={() => setActiveRegularFilter(1)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', borderRadius: '4px', border: activeRegularFilter === 1 ? '1px solid #1a237e' : '1px solid #ddd', backgroundColor: activeRegularFilter === 1 ? '#e8eaf6' : '#fff', color: activeRegularFilter === 1 ? '#1a237e' : '#555', cursor: 'pointer' }}>Regular</button>
            <button onClick={() => setActiveRegularFilter(0)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', borderRadius: '4px', border: activeRegularFilter === 0 ? '1px solid #1a237e' : '1px solid #ddd', backgroundColor: activeRegularFilter === 0 ? '#e8eaf6' : '#fff', color: activeRegularFilter === 0 ? '#1a237e' : '#555', cursor: 'pointer' }}>New</button>
          </div>
        </div>

        {/* Order Type */}
        <div style={{ minWidth: '200px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', textTransform: 'uppercase', color: '#888', marginBottom: '0.5rem', fontWeight: '600' }}>Payment Policy</label>
          <select
            value={activeOrderTypeFilter}
            onChange={(e) => setActiveOrderTypeFilter(e.target.value)}
            style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #ddd', minWidth: '150px' }}
          >
            <option value="all">All Payment Types</option>
            <option value="cod">COD only</option>
            <option value="advance">Advance only</option>
          </select>
        </div>

        {/* Search */}
        <div style={{ flex: 1, minWidth: '250px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', textTransform: 'uppercase', color: '#888', marginBottom: '0.5rem', fontWeight: '600' }}>Quick Search</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search name, phone, email..."
            style={{ width: '100%', padding: '0.4rem 0.8rem', borderRadius: '4px', border: '1px solid #ddd', fontSize: '0.9rem' }}
          />
        </div>
      </div>
    </div>
    </>
  );

  const renderContent = () => {
    if (isLoading && users.length === 0) {
      return <div style={{ color: '#666', textAlign: 'center', padding: '10rem' }}>
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-3">Loading users database...</p>
      </div>;
    }

    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ ...styles.headerText, fontSize: '1.75rem', fontWeight: 'bold', margin: 0 }}>
            User Management
          </h1>
          <div style={{ color: '#666', fontSize: '0.9rem' }}>
            Total Users: <span style={{ fontWeight: 'bold', color: '#1a237e' }}>{totalUsers}</span>
          </div>
        </div>

        <FiltersRedesign />
        <div style={{ marginBottom: '1.5rem' }}>
          {renderSearchSection()}
        </div>

        <div style={styles.tableContainer}>
          <table style={{ width: '100%', borderCollapse: 'collapse', ...styles.tableBorder }}>
            <thead>
              <tr>
                {(activeCartFilter === 'withCart' 
                  ? ['Sr No', 'Name', 'Contact', 'Address', 'Product Count', 'Order Value', 'Actions'] 
                  : ['Name', 'Contact', 'Address', 'Status', 'Payment Mode', 'Actions']
                ).map(header => (
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
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                    Loading...
                  </td>
                </tr>
              ) : currentUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                    No users found.
                  </td>
                </tr>
              ) : (
                currentUsers.map((user, index) => (
                  <tr key={user._id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                    {activeCartFilter === 'withCart' && (
                      <td style={styles.tableCell}>
                        {index + 1 + (currentPage - 1) * usersPerPage}
                      </td>
                    )}
                    <td style={styles.tableCell}>
                      <strong>{user.user_fullname}</strong>
                    </td>
                    <td style={styles.tableCell}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {user.email_id && (
                          <div style={{ fontSize: '0.9rem', color: '#555' }}>
                            <i className="fas fa-envelope me-1"></i> {user.email_id}
                          </div>
                        )}
                        {user.mobile_no && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                              <i className="fas fa-phone me-1"></i> {user.mobile_no}
                            </span>
                            <MessageCircle
                              onClick={() => !isLoading && redirectToWhatsApp(user.mobile_no)}
                              style={{
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                color: '#25D366',
                                opacity: isLoading ? 0.5 : 1,
                              }}
                              size={16}
                            />
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ ...styles.tableCell, maxWidth: '250px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span title={user.address || ''}>
                          {user.address ? (user.address.length > 10 ? user.address.substring(0, 10) + '...' : user.address) : 'N/A'}
                        </span>
                        {user.pincode && (
                          <span style={{ fontSize: '0.85rem', color: '#666', marginTop: '2px' }}>
                            Pin: <strong>{user.pincode}</strong>
                          </span>
                        )}
                      </div>
                    </td>
                    
                    {activeCartFilter === 'withCart' ? (
                      <>
                        <td style={{ ...styles.tableCell, fontWeight: 'bold' }}>
                          {user.cartStats?.productCount || 0}
                        </td>
                        <td style={{ ...styles.tableCell, fontWeight: 'bold', color: '#1a237e' }}>
                          ₹{user.cartStats?.totalAmount?.toFixed(2) || '0.00'}
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={styles.tableCell}>
                          {renderRegularButton(user)}
                        </td>
                        <td style={styles.tableCell}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            {['COD', 'Advance'].map((type) => (
                              <label key={type} style={{
                                display: 'flex',
                                alignItems: 'center',
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                color: styles.orderTypeLabel.color,
                                opacity: isLoading ? 0.6 : 1,
                                fontSize: isMobile ? '0.8rem' : '0.85rem', // Slightly smaller font
                                marginBottom: '2px'
                              }}>
                                <input
                                  type="radio"
                                  name={`orderType-${user._id}`}
                                  value={type}
                                  checked={getOrderTypeLabel(user.order_type) === type}
                                  onChange={() => !isLoading && updateOrderType(user._id, getOrderTypeValue(type))}
                                  style={{ marginRight: '0.25rem' }}
                                  disabled={isLoading}
                                />
                                {type}
                              </label>
                            ))}
                          </div>
                        </td>
                      </>
                    )}
                    
                    <td style={styles.tableCell}>
                      <div style={styles.actionButtonsContainer}>
                        <button
                          onClick={() => !isLoading && toggleStatus(user._id, user.status)}
                          style={{
                            ...(user.status === 1 ? styles.actionButton.danger : styles.actionButton.success),
                            padding: isMobile ? '0.1rem 0.4rem' : '0.15rem 0.5rem', // Reduced padding
                            borderRadius: '0.25rem',
                            border: 'none',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.3s ease',
                            opacity: isLoading ? 0.6 : 1,
                            fontSize: isMobile ? '0.75rem' : '0.8rem', // Smaller font
                            width: '100%',
                            minHeight: '28px' // Maintain clickability
                          }}
                          disabled={isLoading}
                        >
                          {user.status === 1 ? 'Block' : 'Activate'}
                        </button>
                        <button
                          onClick={() => !isLoading && openEditModal(user)}
                          style={{
                            ...styles.actionButton.primary,
                            padding: isMobile ? '0.1rem 0.4rem' : '0.15rem 0.5rem', // Reduced padding
                            borderRadius: '0.25rem',
                            border: 'none',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.3s ease',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: isLoading ? 0.6 : 1,
                            fontSize: isMobile ? '0.75rem' : '0.8rem', // Smaller font
                            width: '100%',
                            minHeight: '28px'
                          }}
                          disabled={isLoading}
                        >
                          <Edit size={isMobile ? 12 : 14} style={{ marginRight: '0.25rem' }} /> Edit
                        </button>
                        <button
                          onClick={() => !isLoading && handleOpenSearchModal(user._id, user.user_fullname)}
                          style={{
                            backgroundColor: '#007bff',
                            color: '#ffffff',
                            padding: isMobile ? '0.1rem 0.4rem' : '0.15rem 0.5rem', // Reduced padding
                            borderRadius: '0.25rem',
                            border: 'none',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            opacity: isLoading ? 0.6 : 1,
                            fontSize: isMobile ? '0.75rem' : '0.8rem', // Smaller font
                            width: '100%',
                            minHeight: '28px'
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
        zIndex: 2000,
        padding: isMobile ? '1rem' : 0
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: isMobile ? '1rem' : '1.5rem',
          borderRadius: '0.5rem',
          width: '95%',
          maxWidth: '800px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #f0f0f0', paddingBottom: '0.75rem' }}>
            <h2 style={{ fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: 'bold', margin: 0, color: '#1a237e' }}>
              Edit User Details
            </h2>
            <button onClick={closeEditModal} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#666' }}>&times;</button>
          </div>

          <form onSubmit={handleEditUser}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
              {/* Basic Info */}
              <div style={{ gridColumn: isMobile ? 'auto' : 'span 2', marginTop: '0.5rem' }}>
                <h6 style={{ color: '#d32f2f', fontWeight: '600', borderBottom: '1px' }}>Basic Information</h6>
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '500', color: '#555' }}>User Full Name</label>
                <input
                  type="text"
                  value={editingUser?.user_fullname || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, user_fullname: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ddd' }}
                />
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '500', color: '#555' }}>Email ID</label>
                <input
                  type="email"
                  value={editingUser?.email_id || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, email_id: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ddd' }}
                />
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '500', color: '#555' }}>Mobile Number</label>
                <input
                  type="text"
                  value={editingUser?.mobile_no || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, mobile_no: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ddd' }}
                />
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '500', color: '#555' }}>Secondary Mobile</label>
                <input
                  type="text"
                  value={editingUser?.b_mobile_no || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, b_mobile_no: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ddd' }}
                />
              </div>

              {/* Business Info */}
              <div style={{ gridColumn: isMobile ? 'auto' : 'span 2', marginTop: '1rem' }}>
                <h6 style={{ color: '#d32f2f', fontWeight: '600' }}>Business & Tax Details</h6>
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '500', color: '#555' }}>Entity/Company Name</label>
                <input
                  type="text"
                  value={editingUser?.entity_name || editingUser?.company || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, entity_name: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ddd' }}
                />
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '500', color: '#555' }}>GST Number</label>
                <input
                  type="text"
                  value={editingUser?.gst_no || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, gst_no: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ddd' }}
                />
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '500', color: '#555' }}>PAN Number</label>
                <input
                  type="text"
                  value={editingUser?.pan_no || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, pan_no: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ddd' }}
                />
              </div>

              {/* Address Info */}
              <div style={{ gridColumn: isMobile ? 'auto' : 'span 2', marginTop: '1rem' }}>
                <h6 style={{ color: '#d32f2f', fontWeight: '600' }}>Address Details</h6>
              </div>

              <div style={{ gridColumn: isMobile ? 'auto' : 'span 2', marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '500', color: '#555' }}>Full Address</label>
                <textarea
                  value={editingUser?.address || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, address: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ddd', minHeight: '60px' }}
                />
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '500', color: '#555' }}>City</label>
                <input
                  type="text"
                  value={editingUser?.city || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, city: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ddd' }}
                />
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '500', color: '#555' }}>State</label>
                <input
                  type="text"
                  value={editingUser?.state || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, state: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ddd' }}
                />
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '500', color: '#555' }}>Pincode</label>
                <input
                  type="text"
                  value={editingUser?.pincode || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, pincode: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ddd' }}
                />
              </div>

              {/* Bank Details */}
              <div style={{ gridColumn: isMobile ? 'auto' : 'span 2', marginTop: '1rem' }}>
                <h6 style={{ color: '#d32f2f', fontWeight: '600' }}>Bank Account Information</h6>
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '500', color: '#555' }}>Account Name</label>
                <input
                  type="text"
                  value={editingUser?.account_name || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, account_name: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ddd' }}
                />
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '500', color: '#555' }}>Account Number</label>
                <input
                  type="text"
                  value={editingUser?.account_no || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, account_no: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ddd' }}
                />
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '500', color: '#555' }}>IFSC Code</label>
                <input
                  type="text"
                  value={editingUser?.ifsccode || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, ifsccode: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ddd' }}
                />
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '1rem',
              marginTop: '2rem',
              borderTop: '1px solid #f0f0f0',
              paddingTop: '1rem'
            }}>
              <button
                type="button"
                onClick={closeEditModal}
                style={{
                  padding: '0.6rem 1.5rem',
                  borderRadius: '0.25rem',
                  border: '1px solid #ddd',
                  backgroundColor: '#f8f9fa',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: '0.6rem 1.5rem',
                  borderRadius: '0.25rem',
                  border: 'none',
                  backgroundColor: '#1a237e',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: '500',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                Save All Changes
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
      <AdminMenu />
      <div className="container-fluid dashboard">
        <div className="row">
          <div className="col-md-12">
            <div style={styles.responsiveContainer}>
              <div
                style={{
                  display: "flex",
                  flexDirection: isMobile ? "column" : "row",
                  gap: "1rem",
                }}
              >
                <div style={{ flex: "1", minWidth: "0" }}>{renderContent()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {isEditModalOpen && renderEditModal()}
    </Layout>
  );
};

export default UserList;