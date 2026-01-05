import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AdminMenu from "../../components/Layout/AdminMenu";
import OptimizedImage from "../../components/OptimizedImage";
import Layout from "./../../components/Layout/Layout";

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
      //toast.success(`Bulk ${action} successful`);
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
        <OptimizedImage
          src={product.photos}
          alt={product.name}
          width={64}
          height={64}
          style={{
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
      <AdminMenu />
      <div className="container-fluid dashboard">
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          <div>
            <h1 style={{
              fontSize: isMobile ? '20px' : '28px',
              fontWeight: '600',
              marginBottom: '4px',
              color: '#0f172a'
            }}>
              Products
            </h1>
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              margin: '0'
            }}>
              Manage and view all your products.
            </p>
          </div>

          {/* Filter Tabs */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            borderBottom: '1px solid #e4e7eb',
            paddingBottom: '16px'
          }}>
            {["all", "active", "inactive", "outOfStock"].map((tab) => (
              <button
                key={tab}
                onClick={() => handleFilterChange(tab)}
                style={{
                  padding: '8px 0',
                  backgroundColor: 'transparent',
                  color: filter === tab ? '#137fec' : '#6b7280',
                  border: 'none',
                  borderBottom: filter === tab ? '2px solid #137fec' : 'none',
                  whiteSpace: 'nowrap',
                  fontSize: '14px',
                  fontWeight: filter === tab ? '600' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {tab === 'all' ? 'All Products' :
                  tab === 'active' ? 'Active' :
                    tab === 'inactive' ? 'Inactive' : 'Out of Stock'}
              </button>
            ))}
          </div>

          {/* Search and Bulk Actions */}
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: '16px',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'stretch' : 'center'
          }}>
            <input
              type="text"
              placeholder="Search products by name, category..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              style={{
                border: '1px solid #e4e7eb',
                padding: '10px 14px',
                borderRadius: '20px',
                width: isMobile ? '100%' : '300px',
                fontSize: '14px',
                backgroundColor: '#f9fafb',
                outline: 'none',
                transition: 'all 0.2s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#137fec'}
              onBlur={(e) => e.target.style.borderColor = '#e4e7eb'}
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
                      action === 'delete' ? '#dc2626' :
                        action === 'activate' ? '#16a34a' : '#eab308',
                    color: action === 'deactivate' ? '#0f172a' : 'white',
                    padding: '10px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    opacity: !selectedProducts.length ? 0.5 : 1,
                    cursor: !selectedProducts.length ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {action === 'delete' ? 'Delete Selected' :
                    action === 'activate' ? 'Activate Selected' : 'Deactivate Selected'}
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
              borderRadius: '12px',
              border: '1px solid #e4e7eb',
              boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)',
              overflowX: 'auto'
            }}>
              <table style={{ width: '100%', minWidth: '900px' }}>
                <thead>
                  <tr style={{
                    borderBottom: '1px solid #e4e7eb',
                    backgroundColor: '#f9fafb'
                  }}>
                    {['', '#', 'Photo', 'Name', 'Category', 'Subcategory', 'Price', 'Stock', 'Status', 'Actions'].map((header) => (
                      <th key={header} style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontSize: '12px',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: '#6b7280'
                      }}>
                        {header === '' ? (
                          <input
                            type="checkbox"
                            checked={selectedProducts.length === products.length && products.length > 0}
                            onChange={toggleSelectAll}
                            style={{ cursor: 'pointer' }}
                          />
                        ) : header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="10" style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>Loading...</td>
                    </tr>
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan="10" style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>No products found</td>
                    </tr>
                  ) : (
                    products.map((product) => (
                      <tr key={product._id} style={{
                        borderBottom: '1px solid #e4e7eb',
                        transition: 'background-color 0.15s ease'
                      }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td style={{ padding: '12px 16px' }}>
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product._id)}
                            onChange={() => setSelectedProducts(prev =>
                              prev.includes(product._id)
                                ? prev.filter(id => id !== product._id)
                                : [...prev, product._id]
                            )}
                            style={{ cursor: 'pointer' }}
                          />
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#0f172a' }}>{product.custom_order}</td>

                        <td style={{ padding: '12px 16px' }}>
                          <OptimizedImage
                            src={product.photos}
                            alt={product.name}
                            width={48}
                            height={48}
                            style={{
                              objectFit: 'cover',
                              borderRadius: '6px'
                            }}
                          />
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#0f172a', fontWeight: '500' }}>{product.name}</td>

                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#6b7280' }}>{product.category?.name}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#6b7280' }}>{product.subcategory.name}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#0f172a', fontWeight: '500' }}>₹{product.perPiecePrice}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#0f172a' }}>{product.stock}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '500',
                            backgroundColor: product.isActive === "1" ? '#ecfdf3' : '#fef2f2',
                            color: product.isActive === "1" ? '#16a34a' : '#dc2626'
                          }}>
                            {product.isActive === "1" ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <Link
                            to={`/dashboard/admin/product/${product.slug}`}
                            style={{
                              color: '#137fec',
                              textDecoration: 'none',
                              fontSize: '14px',
                              fontWeight: '500',
                              cursor: 'pointer'
                            }}
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
          {totalPages > 1 && (
            <nav aria-label="Pagination" style={{
              marginTop: '24px',
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: '16px',
              justifyContent: 'space-between',
              alignItems: isMobile ? 'stretch' : 'center',
              borderTop: '1px solid #e4e7eb',
              paddingTop: '16px'
            }}>
              <span style={{
                fontSize: '13px',
                color: '#6b7280'
              }}>
                Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                {Math.min(currentPage * itemsPerPage, totalProducts)} of{' '}
                {totalProducts} products
              </span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: isMobile ? 'center' : 'flex-end' }}>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{
                    backgroundColor: 'white',
                    border: '1px solid #e4e7eb',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    opacity: currentPage === 1 ? 0.5 : 1,
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#0f172a',
                    transition: 'all 0.2s ease',
                    minHeight: '36px'
                  }}
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    style={{
                      backgroundColor: page === currentPage ? '#137fec' : 'white',
                      color: page === currentPage ? 'white' : '#0f172a',
                      border: page === currentPage ? '1px solid #137fec' : '1px solid #e4e7eb',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      cursor: page === currentPage ? 'default' : 'pointer',
                      minWidth: '36px',
                      minHeight: '36px',
                      fontSize: '13px',
                      fontWeight: page === currentPage ? '600' : '500',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={{
                    backgroundColor: 'white',
                    border: '1px solid #e4e7eb',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    opacity: currentPage === totalPages ? 0.5 : 1,
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#0f172a',
                    transition: 'all 0.2s ease',
                    minHeight: '36px'
                  }}
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
export default Products;
