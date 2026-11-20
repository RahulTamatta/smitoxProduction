import axios from "axios";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import SellerMenu from "../../../components/Layout/SellerMenu";
import Layout from "../../../components/Layout/Layout";

const DEBOUNCE_MS = 400;

const SellerListings = () => {
  const navigate = useNavigate();
  
  // Initialize state from URL search params
  const urlParams = new URLSearchParams(window.location.search);
  const pageFromUrl = parseInt(urlParams.get('page')) || 1;
  const searchFromUrl = urlParams.get('search') || "";
  const statusFromUrl = urlParams.get('status') || "";

  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState(statusFromUrl);
  const [searchTerm, setSearchTerm] = useState(searchFromUrl);
  const [currentPage, setCurrentPage] = useState(pageFromUrl);
  const [itemsPerPage] = useState(10);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchFromUrl);

  const debounceTimerRef = useRef(null);

  // Responsive check
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle browser navigation (back/forward)
  useEffect(() => {
    const handleLocationChange = () => {
      const params = new URLSearchParams(window.location.search);
      setCurrentPage(parseInt(params.get('page')) || 1);
      setSearchTerm(params.get('search') || "");
      setFilter(params.get('status') || "");
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Fetch vendor info
  const getVendorInfo = async () => {
    try {
      const { data } = await axios.get('/api/v1/seller-portal/me');
      if (data.success) {
        setVendor(data.vendor);
        // Update URL without reload
        const params = new URLSearchParams(window.location.search);
        if (currentPage > 1) params.set('page', currentPage);
        else params.delete('page');
        if (searchTerm) params.set('search', searchTerm);
        else params.delete('search');
        if (filter) params.set('status', filter);
        else params.delete('status');
        window.history.replaceState({}, '', `?${params.toString()}`);
      }
    } catch (error) {
      toast.error('Failed to load vendor information');
    }
  };

  // Fetch products with current filters
  const getAllProducts = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/v1/seller-portal/products`, {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: searchTerm,
          status: filter,
        }
      });

      if (data.success) {
        setProducts(data.products);
        setTotalProducts(data.total);
        // Update URL without reload
        const params = new URLSearchParams(window.location.search);
        if (currentPage > 1) params.set('page', currentPage);
        else params.delete('page');
        if (searchTerm) params.set('search', searchTerm);
        else params.delete('search');
        if (filter) params.set('status', filter);
        else params.delete('status');
        window.history.replaceState({}, '', `?${params.toString()}`);
      }
    } catch (error) {
      //toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // Debounce search term
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchTerm]);

  useEffect(() => {
    getVendorInfo();
  }, []);

  useEffect(() => {
    getAllProducts();
  }, [currentPage, debouncedSearchTerm, filter]);

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    // Don't set page here - debounce effect will handle it
  };

  // Pagination
  const totalPages = Math.ceil(totalProducts / itemsPerPage);
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Handle Status Toggle with Optimistic Update
  const handleStatusToggle = async (product) => {
    const originalStatus = product.isActive;
    const newStatus = originalStatus === '1' ? '0' : '1';

    // Check if adminHold is true
    if (product.adminHold) {
      toast.error('Cannot modify product status - it is on admin hold');
      return;
    }

    // Optimistic Update
    setProducts(prevProducts =>
      prevProducts.map(p =>
        p._id === product._id ? { ...p, isActive: newStatus } : p
      )
    );

    try {
      await axios.put(`/api/v1/product/updateStatus/products/${product._id}`, {
        isActive: newStatus
      });
      toast.success(newStatus === '1' ? 'Product activated' : 'Product deactivated');
    } catch (error) {
      console.error("Status toggle failed:", error);
      // Revert on error
      setProducts(prevProducts =>
        prevProducts.map(p =>
          p._id === product._id ? { ...p, isActive: originalStatus } : p
        )
      );
      toast.error("Failed to update status");
    }
  };

  // Handle Delete
  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await axios.delete(`/api/v1/product/delete-product/${productId}`);
      toast.success('Product deleted successfully');
      // Refetch products
      getAllProducts();
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error(error.response?.data?.message || "Failed to delete product");
    }
  };

  // Mobile Product Card View
  const MobileProductCard = ({ product }) => (
    <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '16px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <img
          src={product.photos}
          alt={product.name}
          style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: '4px', backgroundColor: '#f3f4f6' }}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
        <div style={{ display: 'none', width: 64, height: 64, backgroundColor: '#e5e7eb', borderRadius: '4px', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#6b7280' }}>No Image</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{product.name}</div>
          <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>{product.category?.name || 'No Category'}</div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '0.875rem' }}>Price: ₹{product.perPiecePrice}</div>
          <div style={{ fontSize: '0.875rem' }}>MRP: ₹{product.mrp}</div>
          <div style={{ fontSize: '0.875rem' }}>Stock: {product.stock}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
          <span
            onClick={() => handleStatusToggle(product)}
            style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: product.isActive === '1' ? '#dcfce7' : '#fee2e2', color: product.isActive === '1' ? '#166534' : '#991b1b', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '500', opacity: product.adminHold ? 0.5 : 1 }}
          >
            {product.adminHold ? 'Hidden by admin' : (product.isActive === '1' ? 'Active' : 'Inactive')}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => navigate(`/seller/listings/${product.slug}`)}
          style={{ flex: 1, backgroundColor: '#3b82f6', color: 'white', padding: '8px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500' }}
        >
          Edit
        </button>
        <button
          onClick={() => handleDelete(product._id)}
          style={{ backgroundColor: '#dc2626', color: 'white', padding: '8px 12px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500' }}
        >
          Delete
        </button>
      </div>
    </div>
  );

  // Desktop Table View
  const DesktopTable = () => (
    <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e4e7eb', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)', overflowX: 'auto' }}>
      <table style={{ width: '100%', minWidth: '900px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #e4e7eb', backgroundColor: '#f9fafb' }}>
            {['Photo', 'Name', 'Category', 'Price', 'MRP', 'Stock', 'Status', 'Actions'].map((header) => (
              <th key={header} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b7280' }}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>Loading...</td>
            </tr>
          ) : products.length === 0 ? (
            <tr>
              <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>No products found</td>
            </tr>
          ) : (
            products.map((product) => (
              <tr key={product._id} style={{ borderBottom: '1px solid #e4e7eb', transition: 'background-color 0.15s ease' }}>
                <td style={{ padding: '12px 16px' }}>
                  <img
                    src={product.photos}
                    alt={product.name}
                    style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: '6px', backgroundColor: '#f3f4f6' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div style={{ display: 'none', width: 48, height: 48, backgroundColor: '#e5e7eb', borderRadius: '6px', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#6b7280' }}>No Image</div>
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: '#0f172a', fontWeight: '500' }}>{product.name}</td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: '#6b7280' }}>{product.category?.name || 'N/A'}</td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: '#0f172a', fontWeight: '500' }}>₹{product.perPiecePrice}</td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: '#0f172a' }}>₹{product.mrp}</td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: '#0f172a' }}>{product.stock}</td>
                <td style={{ padding: '12px 16px' }}>
                  <button
                    onClick={() => handleStatusToggle(product)}
                    style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', backgroundColor: product.isActive === '1' ? '#ecfdf3' : '#fef2f2', color: product.isActive === '1' ? '#16a34a' : '#dc2626', border: 'none', cursor: 'pointer', transition: 'all 0.2s ease', opacity: product.adminHold ? 0.5 : 1 }}
                    disabled={product.adminHold}
                  >
                    {product.adminHold ? 'Hidden by admin' : (product.isActive === '1' ? 'Active' : 'Inactive')}
                  </button>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => navigate(`/seller/listings/${product.slug}`)}
                      style={{ backgroundColor: '#3b82f6', color: 'white', padding: '6px 12px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product._id)}
                      style={{ backgroundColor: '#dc2626', color: 'white', padding: '6px 12px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <Layout title="My Listings">
      <SellerMenu />
      <div className="container-fluid dashboard">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h1 style={{ fontSize: isMobile ? '20px' : '28px', fontWeight: '600', marginBottom: '4px', color: '#0f172a' }}>
              My Listings
            </h1>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: '0' }}>
              Manage your own products.
            </p>
          </div>

          {/* Vendor Info Strip */}
          {vendor && (
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '14px', color: '#64748b' }}>Plan: </span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{vendor.currentPlanId?.name || 'Basic'}</span>
              </div>
              <div>
                <span style={{ fontSize: '14px', color: '#64748b' }}>Usage: </span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{vendor.listings} / {vendor.listingLimit === null ? 'Unlimited' : vendor.listingLimit}</span>
              </div>
              {vendor.status === false && (
                <div style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  ⚠️ Your store is hidden by the admin. Contact support.
                </div>
              )}
            </div>
          )}

          {/* Add Listing Button */}
          {vendor?.listingLimit === null || vendor?.listings < vendor?.listingLimit ? (
            <button
              onClick={() => navigate('/seller/listings/new')}
              style={{ backgroundColor: '#16a34a', color: 'white', padding: '12px 24px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px', alignSelf: 'flex-start' }}
            >
              ➕ Add Listing
            </button>
          ) : (
            <div style={{ backgroundColor: '#fef3c7', color: '#d97706', padding: '12px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}
              title="Plan limit reached - upgrade your plan"
            >
              📋 Plan limit reached - upgrade your plan
              <button
                onClick={() => navigate('/seller/dashboard')}
                style={{ backgroundColor: '#d97706', color: 'white', padding: '4px 8px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '500', marginLeft: '8px' }}
              >
                Upgrade Plan
              </button>
            </div>
          )}

          {/* Filter and Search */}
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '16px', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}
              title="Status filter: All, Active, Inactive"
            >
              {['', 'active', 'inactive'].map((status) => (
                <button
                  key={status}
                  onClick={() => handleFilterChange(status)}
                  style={{ padding: '8px 16px', backgroundColor: filter === status ? '#137fec' : '#f1f5f9', color: filter === status ? 'white' : '#64748b', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', transition: 'all 0.2s ease' }}
                >
                  {status === '' ? 'All' : status === 'active' ? 'Active' : 'Inactive'}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Search products by name..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ border: '1px solid #e2e8f0', padding: '10px 14px', borderRadius: '20px', width: isMobile ? '100%' : '300px', fontSize: '14px', backgroundColor: '#f8fafc', outline: 'none', transition: 'all 0.2s ease' }}
              onFocus={(e) => e.target.style.borderColor = '#137fec'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
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
            <DesktopTable />
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <nav style={{ marginTop: '24px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '16px', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', borderTop: '1px solid #e4e7eb', paddingTop: '16px' }}
              aria-label="Pagination"
            >
              <span style={{ fontSize: '13px', color: '#6b7280' }}>
                Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                {Math.min(currentPage * itemsPerPage, totalProducts)} of{' '}
                {totalProducts} products
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

export default SellerListings;