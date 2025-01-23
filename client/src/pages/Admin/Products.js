import React, { useState, useEffect } from "react";
import AdminMenu from "../../components/Layout/AdminMenu";
import Layout from "./../../components/Layout/Layout";
import axios from "axios";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { useNavigate, useLocation } from 'react-router-dom';
import { Edit, Trash2, MessageCircle } from "lucide-react";

const Products = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize state from URL search params
  const urlParams = new URLSearchParams(location.search);
  const pageFromUrl = parseInt(urlParams.get('page')) || 1;
  const searchFromUrl = urlParams.get('search') || "";
  const filterFromUrl = urlParams.get('filter') || "all";

  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState(filterFromUrl);
  const [searchTerm, setSearchTerm] = useState(searchFromUrl);
  const [currentPage, setCurrentPage] = useState(pageFromUrl);
  const [itemsPerPage] = useState(10);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(false);

  // Handle browser navigation (back/forward)
  useEffect(() => {
    const handleLocationChange = () => {
      const params = new URLSearchParams(location.search);
      setCurrentPage(parseInt(params.get('page')) || 1);
      setSearchTerm(params.get('search') || "");
      setFilter(params.get('filter') || "all");
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, [location]);

  // Fetch products with current filters
  // Fetch products with filters
  const getAllProducts = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/v1/product/get-product`, {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: searchTerm,
          filter: filter,
        }
      });

      if (data.success) {
        setProducts(data.products);
        setTotalProducts(data.total);
        // Update URL without reload
        const params = new URLSearchParams({
          page: currentPage,
          ...(searchTerm && { search: searchTerm }),
          ...(filter !== 'all' && { filter: filter })
        }).toString();
        window.history.replaceState({}, '', `?${params}`);
      }
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllProducts();
  }, [currentPage, searchTerm, filter]);

  // Responsive filter buttons
  const FilterButton = ({ value, label }) => (
    <button
      onClick={() => setFilter(value)}
      className={`px-4 py-2 rounded-lg text-sm md:text-base ${
        filter === value 
          ? 'bg-blue-600 text-white'
          : 'bg-white text-gray-600 border hover:bg-gray-50'
      }`}
    >
      {label}
    </button>
  );

  useEffect(() => {
    getAllProducts();
  }, [currentPage, searchTerm, filter]);

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // Pagination
  const totalPages = Math.ceil(totalProducts / itemsPerPage);
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Bulk actions
  const handleBulkAction = async (action) => {
    if (selectedProducts.length === 0) return;
    
    try {
      if (action === "delete" && !window.confirm("Are you sure?")) return;
      
      const endpoints = selectedProducts.map(id => {
        if (action === "delete") {
          return axios.delete(`/api/v1/product/delete-product/${id}`);
        }
        return axios.put(`/api/v1/product/updateStatus/products/${id}`, {
          isActive: action === "activate" ? "1" : "0"
        });
      });

      await Promise.all(endpoints);
      await getAllProducts();
      setSelectedProducts([]);
      toast.success(`Bulk ${action} successful`);
    } catch (error) {
      toast.error(`Bulk ${action} failed`);
    }
  };

  // Toggle selection
  const toggleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p._id));
    }
  };

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AdminMenu />
        <div style={{ 
          width: '100%',
          padding: '16px',
          backgroundColor: '#f3f4f6',
          marginLeft: '0',
          overflowX: 'auto'
        }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Products List</h1>
  
          {/* Filters */}
          <div style={{ 
            marginBottom: '16px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            {["all", "active", "inactive", "outOfStock"].map((tab) => (
              <button
                key={tab}
                onClick={() => handleFilterChange(tab)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '4px',
                  backgroundColor: filter === tab ? '#3b82f6' : 'white',
                  color: filter === tab ? 'white' : 'black',
                  border: '1px solid #e5e7eb',
                  whiteSpace: 'nowrap'
                }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
  
          {/* Search and Bulk Actions */}
          <div style={{ 
            marginBottom: '16px',
            display: 'flex',
            flexDirection: window.innerWidth < 768 ? 'column' : 'row',
            gap: '16px',
            justifyContent: 'space-between'
          }}>
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              style={{
                border: '1px solid #e5e7eb',
                padding: '8px',
                borderRadius: '4px',
                width: window.innerWidth < 768 ? '100%' : '256px'
              }}
            />
            <div style={{ 
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              justifyContent: window.innerWidth < 768 ? 'flex-start' : 'flex-end'
            }}>
              {['delete', 'activate', 'deactivate'].map((action) => (
                <button
                  key={action}
                  onClick={() => handleBulkAction(action)}
                  disabled={!selectedProducts.length}
                  style={{
                    backgroundColor: 
                      action === 'delete' ? '#ef4444' :
                      action === 'activate' ? '#22c55e' : '#eab308',
                    color: action === 'deactivate' ? 'black' : 'white',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    opacity: !selectedProducts.length ? 0.5 : 1,
                    cursor: !selectedProducts.length ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {action.charAt(0).toUpperCase() + action.slice(1)} Selected
                </button>
              ))}
            </div>
          </div>
  
          {/* Products Table */}
          <div style={{ 
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            overflowX: 'auto'
          }}>
            <table style={{ width: '100%', minWidth: '800px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  {['', 'Photo', 'Name', 'Category', 'Price', 'Stock', 'Status', 'Actions'].map((header) => (
                    <th key={header} style={{ 
                      padding: '8px',
                      textAlign: 'left',
                      display: window.innerWidth < 640 && header === 'Category' ? 'none' : 'table-cell'
                    }}>
                      {header === '' ? (
                        <input
                          type="checkbox"
                          checked={selectedProducts.length === products.length && products.length > 0}
                          onChange={toggleSelectAll}
                        />
                      ) : header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '16px' }}>Loading...</td>
                  </tr>
                ) : products.map((product) => (
                  <tr key={product._id} style={{ borderBottom: '1px solid #e5e7eb', hover: { backgroundColor: '#f9fafb' } }}>
                    <td style={{ padding: '8px' }}>
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product._id)}
                        onChange={() => setSelectedProducts(prev =>
                          prev.includes(product._id)
                            ? prev.filter(id => id !== product._id)
                            : [...prev, product._id]
                        )}
                      />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <img
                        src={product.photos || '/placeholder.jpg'}
                        alt={product.name}
                        style={{ 
                          width: '48px',
                          height: '48px',
                          objectFit: 'cover',
                          borderRadius: '4px'
                        }}
                      />
                    </td>
                    <td>{product.name}</td>
                    <td style={{ display: window.innerWidth < 640 ? 'none' : 'table-cell' }}>
                      {product.category?.name}
                    </td>
                    <td>{product.perPiecePrice}</td>
                    <td>{product.stock}</td>
                    <td>
                      <span style={{ 
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: product.isActive === "1" ? '#dcfce7' : '#fee2e2',
                        color: product.isActive === "1" ? '#166534' : '#991b1b'
                      }}>
                        {product.isActive === "1" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <Link
                        to={`/dashboard/admin/product/${product.slug}`}
                        style={{ color: '#3b82f6', textDecoration: 'none' }}
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
  
          {/* Pagination */}
          <div style={{ 
            marginTop: '16px',
            display: 'flex',
            flexDirection: window.innerWidth < 640 ? 'column' : 'row',
            gap: '16px',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ marginBottom: window.innerWidth < 640 ? '8px' : '0' }}>
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, totalProducts)} of{' '}
              {totalProducts} products
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  opacity: currentPage === 1 ? 0.5 : 1,
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  opacity: currentPage === totalPages ? 0.5 : 1,
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
export default Products;
