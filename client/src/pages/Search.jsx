import { useEffect, useState } from "react";
import ProductFilters from '../components/ProductFilters';
import { useSearch } from "../context/search";
import { useCategories, useProducts } from '../hooks/useProducts';
import Layout from "./../components/Layout/Layout";
import ProductCard from "./ProductCard";
import WhatsAppButton from './whatsapp';

const Search = () => {
  const [values] = useSearch();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: values.keyword });
  const [sortBy, setSortBy] = useState('');

  // Sync keyword with filters
  useEffect(() => {
    setFilters(prev => ({ ...prev, search: values.keyword }));
    setPage(1);
  }, [values.keyword]);

  // Hooks
  const { data: allCategories = [] } = useCategories();
  const { data: productsData, isLoading: loading } = useProducts({
    page,
    filters,
    sortBy
  });

  const products = productsData?.products || [];
  const total = productsData?.total || 0;
  const hasMore = productsData?.pagination?.hasNextPage || false;

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    setPage(1);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  return (
    <Layout title={`Search: ${values?.keyword || 'Results'} - Smitox`}>
      <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', paddingBottom: '50px' }}>
        {/* Header Section */}
        <div
          className="search-header"
          style={{
            background: 'linear-gradient(135deg, #374151 0%, #111827 100%)',
            padding: '40px 20px',
            color: 'white',
            textAlign: 'center',
            marginBottom: '20px'
          }}
        >
          <h1 style={{ fontSize: '2rem', fontWeight: '700', margin: 0 }}>
            Search Results for "{values?.keyword}"
          </h1>
          <p style={{ opacity: 0.9, marginTop: '10px' }}>
            {total} Products found
          </p>
        </div>

        <div className="container-fluid px-md-4">
          <div className="row">
            {/* Filters Section */}
            <div className="col-12 mb-4">
              <ProductFilters
                categories={allCategories}
                onFilterChange={handleFilterChange}
                onSortChange={handleSortChange}
                activeFilters={filters}
                activeSort={sortBy}
              />
            </div>

            {/* Products Grid */}
            <div className="col-12">
              {loading && page === 1 ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : products.length > 0 ? (
                <>
                  <div className="row g-3 g-md-4">
                    {products.map((p) => (
                      <div className="col-6 col-md-4 col-lg-2" key={p._id}>
                        <ProductCard product={p} />
                      </div>
                    ))}
                  </div>

                  {/* Pagination/Load More */}
                  <div className="text-center mt-5">
                    <div className="mb-3">
                      <span className="text-muted" style={{ fontWeight: '500' }}>
                        Showing {products.length} of {total} products
                      </span>
                    </div>
                    {hasMore && (
                      <button
                        className="btn btn-primary"
                        onClick={loadMore}
                        disabled={loading}
                        style={{
                          backgroundColor: '#2563eb',
                          border: 'none',
                          padding: '10px 30px',
                          borderRadius: '25px',
                          fontWeight: '600'
                        }}
                      >
                        {loading ? 'Loading...' : 'Load More'}
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-5">
                  <div
                    style={{
                      backgroundColor: 'white',
                      padding: '40px',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                    }}
                  >
                    <h3 className="text-muted">No products found</h3>
                    <p className="text-muted">Try searching for something else or adjusting filters</p>
                    <button
                      className="btn btn-outline-primary mt-3"
                      onClick={() => {
                        setFilters({ search: values.keyword });
                        setSortBy('');
                      }}
                    >
                      Clear All Filters
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <WhatsAppButton />
    </Layout>
  );
};

export default Search;
