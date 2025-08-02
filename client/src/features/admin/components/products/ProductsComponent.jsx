// ===================================
// PRODUCTS MANAGEMENT COMPONENT
// ===================================

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useProducts } from '../../hooks/products/useProducts';
import { useWindowSize } from '../../hooks/common/useCommon';
import { productApi } from '../../services/api/adminApi';
import { formatCurrency } from '../../utils';
import ProductCard from './ProductCard';
import ProductsTable from './ProductsTable';
import SearchAndFilters from './SearchAndFilters';
import Pagination from '../common/Pagination';
import toast from 'react-hot-toast';

const ProductsComponent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { width } = useWindowSize();
  const isMobile = width <= 768;

  // URL params state
  const urlParams = new URLSearchParams(location.search);
  const pageFromUrl = parseInt(urlParams.get('page')) || 1;
  const searchFromUrl = urlParams.get('search') || '';
  const filterFromUrl = urlParams.get('filter') || 'all';

  // Local state
  const [filter, setFilter] = useState(filterFromUrl);
  const [searchTerm, setSearchTerm] = useState(searchFromUrl);
  const [currentPage, setCurrentPage] = useState(pageFromUrl);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const itemsPerPage = 10;

  // Use custom hook for products
  const { products, totalProducts, loading, error, fetchProducts } = useProducts();

  // Handle browser navigation (back/forward)
  useEffect(() => {
    const handleLocationChange = () => {
      const params = new URLSearchParams(location.search);
      setCurrentPage(parseInt(params.get('page')) || 1);
      setSearchTerm(params.get('search') || '');
      setFilter(params.get('filter') || 'all');
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, [location]);

  // Fetch products when filters change
  useEffect(() => {
    const params = {
      page: currentPage,
      limit: itemsPerPage,
      search: searchTerm,
      filter: filter,
    };

    fetchProducts(params);

    // Update URL without reload
    const urlParams = new URLSearchParams({
      page: currentPage.toString(),
      ...(searchTerm && { search: searchTerm }),
      ...(filter !== 'all' && { filter: filter })
    }).toString();
    
    window.history.replaceState({}, '', `?${urlParams}`);
  }, [currentPage, searchTerm, filter]);

  // Handlers
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    const totalPages = Math.ceil(totalProducts / itemsPerPage);
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Bulk actions
  const handleBulkAction = async (action) => {
    if (selectedProducts.length === 0) {
      toast.error('Please select products first');
      return;
    }

    if (action === 'delete' && !window.confirm('Are you sure you want to delete selected products?')) {
      return;
    }

    setBulkActionLoading(true);
    try {
      const promises = selectedProducts.map(id => {
        if (action === 'delete') {
          return productApi.deleteProduct(id);
        }
        return productApi.updateProductStatus(id, action === 'activate' ? '1' : '0');
      });

      await Promise.all(promises);
      
      // Refresh products
      await fetchProducts({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        filter: filter,
      });
      
      setSelectedProducts([]);
      toast.success(`Bulk ${action} completed successfully`);
    } catch (error) {
      console.error(`Bulk ${action} failed:`, error);
      toast.error(`Bulk ${action} failed`);
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p._id));
    }
  };

  const toggleProductSelection = (productId) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Calculate pagination info
  const totalPages = Math.ceil(totalProducts / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalProducts);

  if (error) {
    return (
      <div className="container-fluid">
        <div className="card p-lg text-center">
          <h2 className="heading-2 text-error mb-base">Error Loading Products</h2>
          <p className="text-secondary">{error}</p>
          <button 
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Page Header */}
      <div className="d-flex justify-between align-center mb-lg">
        <h1 className="heading-1 mb-0">Products Management</h1>
        <Link to="/dashboard/admin/create-product" className="btn btn-primary">
          <i className="fas fa-plus mr-sm"></i>
          Add Product
        </Link>
      </div>

      {/* Search and Filters */}
      <SearchAndFilters
        searchTerm={searchTerm}
        filter={filter}
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
        selectedCount={selectedProducts.length}
        onBulkAction={handleBulkAction}
        bulkActionLoading={bulkActionLoading}
        isMobile={isMobile}
      />

      {/* Products Display */}
      <div className="card mb-lg">
        {loading ? (
          <div className="text-center p-xl">
            <div className="spinner-border text-primary" role="status">
              <span className="sr-only">Loading...</span>
            </div>
            <p className="text-secondary mt-base">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center p-xl">
            <i className="fas fa-box-open fa-3x text-muted mb-base"></i>
            <h3 className="heading-3 mb-base">No Products Found</h3>
            <p className="text-secondary mb-lg">
              {searchTerm || filter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Start by adding your first product.'
              }
            </p>
            <Link to="/dashboard/admin/create-product" className="btn btn-primary">
              Add First Product
            </Link>
          </div>
        ) : (
          <>
            {isMobile ? (
              <div className="p-base">
                {products.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    isSelected={selectedProducts.includes(product._id)}
                    onToggleSelection={toggleProductSelection}
                  />
                ))}
              </div>
            ) : (
              <ProductsTable
                products={products}
                selectedProducts={selectedProducts}
                onToggleSelection={toggleProductSelection}
                onToggleSelectAll={toggleSelectAll}
                isAllSelected={selectedProducts.length === products.length && products.length > 0}
              />
            )}
          </>
        )}
      </div>

      {/* Pagination */}
      {totalProducts > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalProducts}
          itemsPerPage={itemsPerPage}
          startItem={startItem}
          endItem={endItem}
          onPageChange={handlePageChange}
          isMobile={isMobile}
        />
      )}
    </div>
  );
};

export default ProductsComponent;
