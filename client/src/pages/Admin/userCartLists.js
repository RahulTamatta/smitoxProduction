import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MessageCircle, Edit } from 'lucide-react';
import Layout from "../../components/Layout/Layout";
import AdminMenu from "../../components/Layout/AdminMenu";

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
  }, [users, activeStatusFilter, activeOrderTypeFilter]);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/v1/usersLists/users');
      setUsers(response.data.list || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const filterUsers = () => {
    let result = users;
    if (activeStatusFilter !== 'all') {
      result = result.filter(user => user.status === activeStatusFilter);
    }
    if (activeOrderTypeFilter !== 'all') {
      result = result.filter(user => getOrderType(user.order_type) === activeOrderTypeFilter.toLowerCase());
    }
    setFilteredUsers(result);
    setCurrentPage(1);
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === '1' ? '0' : '1';
      await axios.put(`/api/v1/usersLists/users/${id}/status`, { status: newStatus });
      fetchUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      setError('Failed to update user status. Please try again.');
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
    const whatsappUrl = `https://wa.me/${phoneNumber.replace(/\D/g, '')}`;
    window.open(whatsappUrl, '_blank');
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditingUser(null);
    setIsEditModalOpen(false);
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/v1/usersLists/users/${editingUser._id}`, editingUser);
      fetchUsers();
      closeEditModal();
    } catch (error) {
      console.error('Error updating user:', error);
      setError('Failed to update user. Please try again.');
    }
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
    const pageNumbers = [];
    for (let i = 1; i <= Math.ceil(filteredUsers.length / usersPerPage); i++) {
      pageNumbers.push(i);
    }

    return (
      <nav>
        <ul style={{ display: 'flex', justifyContent: 'center', listStyle: 'none', padding: 0, margin: '1rem 0' }}>
          {pageNumbers.map(number => (
            <li key={number} style={{ margin: '0 0.25rem' }}>
              <button
                onClick={() => paginate(number)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.25rem',
                  border: 'none',
                  backgroundColor: currentPage === number ? '#1976d2' : '#e0e0e0',
                  color: currentPage === number ? 'white' : '#455a64',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                {number}
              </button>
            </li>
          ))}
        </ul>
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
            <TabButton label="Prepaid" isActive={activeOrderTypeFilter === 'Prepaid'} onClick={() => setActiveOrderTypeFilter('Prepaid')} />
            <TabButton label="Advance" isActive={activeOrderTypeFilter === 'Advance'} onClick={() => setActiveOrderTypeFilter('Advance')} />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', ...styles.tableBorder }}>
            <thead>
              <tr>
                {['Name', 'Email', 'Phone', 'Address', 'Status', 'Order Type', 'Actions'].map(header => (
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
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{
                      ...styles.statusBadge[user.status],
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem'
                    }}>
                      {user.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {['COD', 'Prepaid', 'Advance'].map((type) => (
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
                    <button
                      onClick={() => toggleStatus(user._id, user.status)}
                      style={{
                        ...(user.status === '1' ? styles.actionButton.danger : styles.actionButton.success),
                        marginRight: '0.5rem',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '0.25rem',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {user.status === '1' ? 'Block' : 'Activate'}
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {renderPagination()}

        {isEditModalOpen && (
          <div style={{
            ...styles.modal.overlay,
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              ...styles.modal.content,
              padding: '1.5rem',
              borderRadius: '0.5rem',
              width: '90%',
              maxWidth: '500px'
            }}>
              <h2 style={{ ...styles.headerText, fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                Edit User
              </h2>
              <form onSubmit={handleEditUser}>
                {['name', 'email', 'phone', 'address'].map((field) => (
                  <div key={field} style={{ marginBottom: '1rem' }}>
                    <label
                      htmlFor={field}
                      style={{
                        display: 'block',
                        marginBottom: '0.25rem',
                        color: '#2c3e50',
                        fontWeight: '500',
                        textTransform: 'capitalize'
                      }}
                    >
                      {field}
                    </label>
                    <input
                      id={field}
                      type={field === 'email' ? 'email' : 'text'}
                      value={editingUser[field]}
                      onChange={(e) => setEditingUser({ ...editingUser, [field]: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        borderRadius: '0.25rem',
                        border: '1px solid #e0e0e0',
                        fontSize: '1rem',
                        transition: 'border-color 0.3s ease',
                        outline: 'none'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#1976d2';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e0e0e0';
                      }}
                    />
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
                  <button 
                    type="button" 
                    onClick={closeEditModal} 
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '0.25rem',
                      border: 'none',
                      backgroundColor: '#e0e0e0',
                      color: '#455a64',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      fontWeight: '500'
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    style={{
                      ...styles.actionButton.primary,
                      padding: '0.5rem 1rem',
                      borderRadius: '0.25rem',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      fontWeight: '500'
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
    <Layout title="Dashboard - User List">
      <div style={{
        margin: '1rem',
        padding: '1rem',
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
    </Layout>
  );
};

export default UserList;