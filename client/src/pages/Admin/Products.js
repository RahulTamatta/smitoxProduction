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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Responsive check
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
      //toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

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
      //toast.error(`Bulk ${action} failed`);
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

  // Pagination
  const totalPages = Math.ceil(totalProducts / itemsPerPage);
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Mobile Product Card View
  const MobileProductCard = ({ product }) => (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      padding: '16px',
      marginBottom: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <input
          type="checkbox"
          checked={selectedProducts.includes(product._id)}
          onChange={() => setSelectedProducts(prev =>
            prev.includes(product._id)
              ? prev.filter(id => id !== product._id)
              : [...prev, product._id]
          )}
        />
        <img
          src={product.photos || '/placeholder.jpg'}
          alt={product.name}
          style={{ 
            width: '64px',
            height: '64px',
            objectFit: 'cover',
            borderRadius: '4px'
          }}
        />
        <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 'bold' }}>{product.custom_order}</div>
          <div style={{ fontWeight: 'bold' }}>{product.name}</div>
          <div style={{ color: 'gray', fontSize: '0.875rem' }}>
            {product.category?.name} - {product.subcategory.name}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <div>Price: {product.perPiecePrice}</div>
          <div>Stock: {product.stock}</div>
        </div>
        <div>
          <span style={{ 
            padding: '4px 8px',
            borderRadius: '4px',
            backgroundColor: product.isActive === "1" ? '#dcfce7' : '#fee2e2',
            color: product.isActive === "1" ? '#166534' : '#991b1b'
          }}>
            {product.isActive === "1" ? "Active" : "Inactive"}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <Link
          to={`/dashboard/admin/product/${product.slug}`}
          style={{ 
            flex: 1, 
            textAlign: 'center',
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '8px',
            borderRadius: '4px',
            textDecoration: 'none'
          }}
        >
          Edit
        </Link>
      </div>
    </div>
  );

  return (
    <Layout>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh',
        padding: isMobile ? '8px' : '16px' 
      }}>
        <AdminMenu />
        <div style={{ 
          width: '100%',
          backgroundColor: '#f3f4f6',
          marginLeft: '0',
          overflowX: 'auto'
        }}>
          <h1 style={{ 
            fontSize: isMobile ? '20px' : '24px', 
            fontWeight: 'bold', 
            marginBottom: '16px',
            padding: isMobile ? '0 8px' : '0' 
          }}>
            Products List
          </h1>
  
          {/* Filters */}
          <div style={{ 
            marginBottom: '16px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            padding: isMobile ? '0 8px' : '0'
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
                  whiteSpace: 'nowrap',
                  fontSize: isMobile ? '0.875rem' : '1rem'
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
            flexDirection: isMobile ? 'column' : 'row',
            gap: '16px',
            justifyContent: 'space-between',
            padding: isMobile ? '0 8px' : '0'
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
                width: isMobile ? '100%' : '256px',
                marginBottom: isMobile ? '8px' : '0'
              }}
            />
            <div style={{ 
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              justifyContent: isMobile ? 'flex-start' : 'flex-end'
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
                    whiteSpace: 'nowrap',
                    fontSize: isMobile ? '0.875rem' : '1rem'
                  }}
                >
                  {action.charAt(0).toUpperCase() + action.slice(1)} Selected
                </button>
              ))}
            </div>
          </div>
  
          {/* Products Display */}
          {isMobile ? (
            <div style={{ padding: '0 8px' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '16px' }}>Loading...</div>
              ) : (
                products.map((product) => (
                  <MobileProductCard key={product._id} product={product} />
                ))
              )}
            </div>
          ) : (
            <div style={{ 
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              overflowX: 'auto'
            }}>
              <table style={{ width: '100%', minWidth: '800px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    {['','Sr.', 'Photo', 'Name', 'Category', 'Subcategory', 'Price', 'Stock', 'Status', 'Actions'].map((header) => (
                      <th key={header} style={{ 
                        padding: '8px',
                        textAlign: 'left'
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
                      <td colSpan="9" style={{ textAlign: 'center', padding: '16px' }}>Loading...</td>
                    </tr>
                  ) : (
                    products.map((product) => (
                      <tr key={product._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
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
                        <td>{product.custom_order}</td>
                        
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
                      
                        <td>{product.category?.name}</td>
                        <td>{product.subcategory.name}</td>
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
  
          {/* Pagination */}
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
  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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

    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
      if (
        page <= 5 || 
        page >= totalPages - 4 || 
        (page >= currentPage - 2 && page <= currentPage + 2)
      ) {
        return (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            disabled={page === currentPage}
            style={{
              backgroundColor: page === currentPage ? '#3b82f6' : 'white',
              color: page === currentPage ? 'white' : 'black',
              border: '1px solid #e5e7eb',
              padding: '8px 12px',
              borderRadius: '4px',
              cursor: page === currentPage ? 'default' : 'pointer',
              minWidth: '32px',
              display: 
                (totalPages > 10 && page === 6 && currentPage < 7) || 
                (totalPages > 10 && page === totalPages - 5 && currentPage > totalPages - 6)
                ? 'none' 
                : 'inline-block'
            }}
          >
            {page}
          </button>
        );
      } else if (
        (page === 6 && currentPage < 7) || 
        (page === totalPages - 5 && currentPage > totalPages - 6)
      ) {
        return (
          <span 
            key={`ellipsis-${page}`} 
            style={{ 
              padding: '8px 12px',
              color: '#6b7280'
            }}
          >
            ...
          </span>
        );
      }
      return null;
    })}

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
