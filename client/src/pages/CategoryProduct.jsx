import { useEffect, useState } from "react";
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout/Layout";
import ProductFilters from '../components/ProductFilters';
import { useCategories, useInfiniteProducts, useSubcategories } from '../hooks/useProducts';
import ProductCard from "./ProductCard";
import WhatsAppButton from './whatsapp';

const CategoryProduct = () => {
  const params = useParams();
  const navigate = useNavigate();

  // State
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState('');
  const [currentCategory, setCurrentCategory] = useState(null);
  const [currentSubcategory, setCurrentSubcategory] = useState(null);
  const [isSubcategoryView, setIsSubcategoryView] = useState(false);

  // Hooks
  const { data: allCategories = [] } = useCategories();
  const { data: allSubcategories = [] } = useSubcategories();

  // Handle Category/Subcategory identification
  useEffect(() => {
    if (!params.slug || allCategories.length === 0) return;

    // 1. Try to match params.slug with a Category ID first (high priority)
    let cat = allCategories.find(c => c._id === params.slug);

    // 2. If no ID match, try Slug
    if (!cat) {
      cat = allCategories.find(c => c.slug === params.slug);
    }

    if (cat) {
      setCurrentCategory(cat);
      setCurrentSubcategory(null);
      setIsSubcategoryView(false);
      setFilters({ category: cat._id, subcategory: undefined });
      return;
    }

    // 3. Try to match params.slug with a Subcategory (ID first)
    if (allSubcategories.length > 0) {
      let sub = allSubcategories.find(s => s._id === params.slug);
      if (!sub) {
        sub = allSubcategories.find(s => s.slug === params.slug);
      }

      if (sub) {
        setCurrentSubcategory(sub);
        const parentCat = allCategories.find(c => c._id === sub.category);
        setCurrentCategory(parentCat || null);
        setIsSubcategoryView(true);
        setFilters({ subcategory: sub._id, category: undefined });
        return;
      }
    }
  }, [params.slug, allCategories, allSubcategories]);

  // Fetch products (Infinite)
  const {
    data: productsData,
    isLoading: loading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage
  } = useInfiniteProducts({
    limit: 12,
    filters,
    sortBy
  });

  const products = productsData?.pages?.flatMap(page => page.products) || [];
  const total = productsData?.pages?.[0]?.total || 0;

  // Get related subcategories for the current category
  const displayedSubcategories = currentCategory
    ? allSubcategories.filter(s => s.category === currentCategory._id)
    : [];

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
  };

  const loadMore = () => {
    if (!isFetchingNextPage && hasNextPage) {
      fetchNextPage();
    }
  };

  return (
    <Layout title={`${isSubcategoryView ? currentSubcategory?.name : currentCategory?.name || 'Category'} - Smitox`}>
      <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', paddingBottom: '50px' }}>
        {/* Banner/Header */}
        {/* Banner/Header */}
        <div
          className="category-header"
          style={{
            backgroundColor: '#fff',
            padding: '30px 40px',
            borderBottom: '1px solid #e5e7eb',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <h1 style={{
            fontSize: '2rem',
            fontWeight: '700',
            margin: 0,
            color: '#111827'
          }}>
            {isSubcategoryView ? currentSubcategory?.name : currentCategory?.name || 'Loading...'}
          </h1>
          <p style={{
            margin: 0,
            color: '#6b7280',
            fontSize: '0.95rem'
          }}>
            {total} Products found • Updated today
          </p>
        </div>

        {/* Subcategory List (Show if has subcategories) */}
        {displayedSubcategories.length > 0 && (
          <div className="container-fluid px-md-4 mb-4">
            <div style={{
              backgroundColor: 'white',
              padding: '15px',
              borderRadius: '10px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <h5 className="mb-3" style={{ color: '#444', fontWeight: '600' }}>Explore Subcategories</h5>
              <div style={{
                display: 'flex',
                gap: '15px',
                overflowX: 'auto',
                paddingBottom: '5px'
              }}>
                {/* 'All' Option */}
                <div
                  onClick={() => currentCategory && navigate(`/category/${currentCategory.slug}`)}
                  style={{
                    cursor: 'pointer',
                    minWidth: '100px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}
                >
                  <div style={{
                    width: '70px',
                    height: '70px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    marginBottom: '8px',
                    border: isSubcategoryView ? '1px solid #eee' : '2px solid #2563eb', // Highlight if active
                    backgroundColor: '#f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#555' }}>All</span>
                  </div>
                  <span style={{
                    fontSize: '13px',
                    color: isSubcategoryView ? '#555' : '#2563eb',
                    fontWeight: isSubcategoryView ? '500' : '700'
                  }}>All</span>
                </div>

                {displayedSubcategories.map(sub => (
                  <div
                    key={sub._id}
                    onClick={() => navigate(`/category/${sub._id}`)}
                    style={{
                      cursor: 'pointer',
                      minWidth: '100px',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{
                      width: '70px',
                      height: '70px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      marginBottom: '8px',
                      border: (currentSubcategory?._id === sub._id) ? '2px solid #2563eb' : '1px solid #eee'
                    }}>
                      <LazyLoadImage
                        src={sub.photos ? (sub.photos.startsWith('http') ? sub.photos : `https://www.smitox.com/${sub.photos}`) : 'https://www.smitox.com/api/v1/placeholder/64/64'}
                        alt={sub.name}
                        effect="blur"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <span style={{
                      fontSize: '13px',
                      color: (currentSubcategory?._id === sub._id) ? '#2563eb' : '#555',
                      fontWeight: (currentSubcategory?._id === sub._id) ? '700' : '500'
                    }}>{sub.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="container-fluid px-md-4">
          <div className="row">
            {/* Filters Section */}
            <div className="col-12 mb-4">
              <ProductFilters
                categories={allCategories}
                onFilterChange={handleFilterChange}
                onSortChange={handleSortChange}
                currentFilters={filters}
                currentSort={sortBy}
              />
            </div>

            {/* Products Grid */}
            <div className="col-12">
              {loading && !productsData ? (
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
                    {hasNextPage && (
                      <button
                        className="btn btn-primary"
                        onClick={loadMore}
                        disabled={isFetchingNextPage}
                        style={{
                          backgroundColor: '#2563eb',
                          border: 'none',
                          padding: '10px 30px',
                          borderRadius: '25px',
                          fontWeight: '600'
                        }}
                      >
                        {isFetchingNextPage ? 'Loading...' : 'Load More'}
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
                    <p className="text-muted">Try adjusting your filters or category</p>
                    <button
                      className="btn btn-outline-primary mt-3"
                      onClick={() => {
                        // Reset to main category if stuck in empty subcategory or just clear all
                        if (currentCategory && isSubcategoryView) {
                          navigate(`/category/${currentCategory.slug}`);
                        } else {
                          setFilters({ category: currentCategory?._id });
                          setSortBy('');
                        }
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

export default CategoryProduct;
