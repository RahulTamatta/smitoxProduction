import { BadgePercent, Headphones, ShieldCheck, Truck } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import 'react-lazy-load-image-component/src/effects/blur.css';
import { useLocation, useNavigate } from "react-router-dom";
import Slider from "react-slick";
import "slick-carousel/slick/slick-theme.css";
import "slick-carousel/slick/slick.css";
import OptimizedImage from '../components/OptimizedImage';
import ProductFilters from '../components/ProductFilters';
import ShopBySellers from '../components/Stores/ShopBySellers';
import { useBanners, useCategories, useInfiniteProducts, useProductsForYou } from '../hooks/useProducts';
import "../styles/Homepage.css";
import Layout from "./../components/Layout/Layout";
import ProductCard from "./ProductCard";
import WhatsAppButton from './whatsapp';



// Memoized settings objects
const sliderSettings = {
  dots: false,
  infinite: false,
  speed: 500,
  slidesToShow: 6,
  slidesToScroll: 1,
  initialSlide: 0,
  centerMode: false,
  centerPadding: "0px",
  responsive: [
    {
      breakpoint: 1024,
      settings: {
        slidesToShow: 4,
        slidesToScroll: 1,
      },
    },
    {
      breakpoint: 600,
      settings: {
        slidesToShow: 3,
        slidesToScroll: 1,
        centerMode: true,
        centerPadding: "20px",
      },
    },
    {
      breakpoint: 480,
      settings: {
        slidesToShow: 2.5,
        slidesToScroll: 1,
        centerMode: true,
        centerPadding: "40px",
      },
    },
  ],
};

const storeFeatures = [
  { icon: Truck, label: "Delivery across India" },
  { icon: ShieldCheck, label: "Verified sellers" },
  { icon: BadgePercent, label: "Bulk / wholesale prices" },
  { icon: Headphones, label: "WhatsApp support" },
];

const HomePage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // State
  // Page state is handled by useInfiniteQuery now, but we keep this if needed for other logic or remove if unused. 
  // Actually useInfiniteQuery handles page param internally via getNextPageParam.
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState('');

  // React Query hooks
  // const { data: productsData, isLoading: productsLoading } = useProducts({ page, filters, sortBy });
  const {
    data: productsData,
    isLoading: productsLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage
  } = useInfiniteProducts({ limit: 12, filters, sortBy });

  const { data: categories = [] } = useCategories();
  const { data: productsForYou = [] } = useProductsForYou();
  const { data: banners = [] } = useBanners();

  // Flatten the pages to get all products
  const products = productsData?.pages?.flatMap(page => page.products) || [];
  const total = productsData?.pages?.[0]?.total || 0; // Get total from the first page

  // hasMore logic is now handled by hasNextPage from react-query
  // const hasMore = products.length > 0 && products.length === 12;

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filter and sort handlers
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    // setPage(1); // No longer needed, useInfiniteQuery handles reset on key change
  };

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    // setPage(1); // No longer needed
  };

  const loadMore = () => {
    if (!isFetchingNextPage && hasNextPage) {
      fetchNextPage();
    }
  };

  const handleBannerClick = (banner) => {
    if (banner.categoryId) {
      navigate(`/category/${banner.subcategoryId._id}`, {
        state: {
          selectedSubcategory: banner.subcategoryId._id || null,
          fromBanner: true,
          bannerName: banner._id,
          slug: banner.subcategoryId,
        }
      });
    } else {
      //toast.error("Banner is not linked to a category");
    }
  };

  const [currentSlide, setCurrentSlide] = useState(0);

  const bannerSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2000,
    beforeChange: (_, next) => setCurrentSlide(next),
    nextArrow: (
      <button
        type="button"
        style={{
          position: 'absolute',
          right: '30px', // Adjusted to account for container padding
          top: '50%',
          transform: 'translateY(-50%)',
          width: '40px',
          height: '40px',
          backgroundColor: '#f0f0f0',
          borderRadius: '50%',
          border: '1px solid #e0e0e0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          cursor: 'pointer',
          zIndex: 2, // Increased z-index
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#666',
          transition: 'all 0.3s ease'
        }}
      >
        <span style={{ fontSize: '24px', fontWeight: 'bold' }}>&rsaquo;</span>
      </button>
    ),
    prevArrow: (
      <button
        type="button"
        style={{
          position: 'absolute',
          left: '30px', // Adjusted to account for container padding
          top: '50%',
          transform: 'translateY(-50%)',
          width: '40px',
          height: '40px',
          backgroundColor: '#f0f0f0',
          borderRadius: '50%',
          border: '1px solid #e0e0e0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          cursor: 'pointer',
          zIndex: 2, // Increased z-index
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#666',
          transition: 'all 0.3s ease'
        }}
      >
        <span style={{ fontSize: '24px', fontWeight: 'bold' }}>&lsaquo;</span>
      </button>
    ),
    appendDots: dots => (
      <div
        style={{
          position: 'absolute',
          bottom: '10px',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          gap: '5px',
          zIndex: 2 // Increased z-index
        }}
      >
        {dots}
      </div>
    ),
    customPaging: i => (
      <div
        style={{
          width: '8px',
          height: '8px',
          backgroundColor: currentSlide === i ? 'red' : 'rgba(255,0,0,0.5)', // Active dot: solid red, Inactive dots: transparent red
          borderRadius: '50%',
          transition: 'all 0.3s ease',
        }}
      />
    )

  };
  useEffect(() => {
    // Restore scroll position on component mount
    const savedScrollPosition = sessionStorage.getItem(`scrollPosition_${location.pathname}`);
    if (savedScrollPosition) {
      window.scrollTo(0, parseInt(savedScrollPosition, 10));
      sessionStorage.removeItem(`scrollPosition_${location.pathname}`);
    }

    // Save scroll position on component unmount
    return () => {
      sessionStorage.setItem(`scrollPosition_${location.pathname}`, window.scrollY);
    };
  }, [location.pathname]);

  if (productsLoading && !productsData) {
    return (
      <Layout title="All Products - Best offers">
        <div className="sx-container mt-4">
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading products...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (

    <Layout title={"Smitox - India's Leading B2B Wholesale Marketplace"}>
      {/* Mobile Search */}

      {/* {isMobile && (
        <div 
          className="searchInput" 
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            backgroundColor: 'white',
            padding: '10px 15px',
            marginTop: '110px'
          }}
        >
          <SearchInput />
        </div>
      )} */}

      {/* Banner Section */}
      <section className="sx-container sx-home-banner">
        <div className="sx-home-banner-frame">
          <Slider {...{
            ...bannerSettings,
            // Update banner settings for better responsiveness
            responsive: [
              {
                breakpoint: 768, // Mobile breakpoint
                settings: {
                  arrows: false, // Hide arrows on mobile
                  dots: true,
                  autoplay: true,
                  autoplaySpeed: 3000,
                }
              }
            ]
          }}>
            {banners.map((banner) => (
              <div key={banner._id} onClick={() => handleBannerClick(banner)}>
                <div style={{
                  position: 'relative',
                  paddingTop: isMobile ? '65%' : '40%', // Increased aspect ratios for taller banners
                  width: '100%',
                  backgroundColor: '#fff',
                }}>
                  <OptimizedImage
                    src={banner.photos}
                    alt={banner.bannerName}
                    objectFit="contain"
                    backgroundColor="#fff"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                    }}
                  />
                </div>
              </div>
            ))}
          </Slider>
        </div>
      </section>

      {/* Shop by Category */}
      <section className="sx-container sx-section">
        <h2 className="sx-section-title">Shop by Category</h2>
        <div className="sx-home-cats">
          {categories.map((c) => (
            <button
              type="button"
              key={c._id}
              className="sx-home-cat"
              onClick={() => navigate(`/category/${c.slug}`)}
            >
              <div className="sx-home-cat-tile">
                {c.photos ? (
                  <OptimizedImage
                    src={c.photos}
                    alt={c.name}
                    className="sx-home-cat-img"
                    objectFit="contain"
                    style={{ width: "100%", height: "100%", padding: "10px" }}
                  />
                ) : (
                  <span className="sx-home-cat-letter">
                    {c.name?.charAt(0)?.toUpperCase()}
                  </span>
                )}
              </div>
              <span className="sx-home-cat-name">{c.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Shop by Seller */}
      <ShopBySellers />

      {/* Store Features */}
      <div className="sx-container sx-section">
        <div className="sx-home-features">
          {storeFeatures.map(({ icon: Icon, label }) => (
            <div key={label} className="sx-home-feature">
              <span className="sx-home-feature-icon">
                <Icon size={20} aria-hidden="true" />
              </span>
              <span className="sx-home-feature-text">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Products For You Section */}
      {productsForYou.length > 0 && (
        <section className="sx-container sx-section">
          <h2 className="sx-section-title">Recommended for You</h2>
          <div className="sx-home-grid">
            {productsForYou.map((item, index) => (
              <ProductCard
                key={item.productId?._id || index}
                product={item.productId}
                photoUrl={item.productId?.photoUrl}
              />
            ))}
          </div>
        </section>
      )}

      {/* All Products Section */}
      <section className="sx-container sx-section">
        <h2 className="sx-section-title">Trending Products</h2>

        {/* Filters */}
        <div className="sx-home-filters">
          <ProductFilters
            categories={categories}
            onFilterChange={handleFilterChange}
            currentFilters={filters}
            currentSort={sortBy}
            onSortChange={handleSortChange}
          />
        </div>

        {/* Products Grid */}
        <div className="sx-home-grid">
          {products.map((p) => (
            <ProductCard
              key={p._id}
              product={p}
              photoUrl={p.photoUrl}
            />
          ))}
        </div>

        {/* Pagination and Load More */}
        <div className="text-center mt-4 mb-5">
          {/* Pagination indicator */}
          {products.length > 0 && (
            <div className="mb-3">
              <span className="text-muted" style={{ fontWeight: '500' }}>
                Showing {products.length} of {total} products
              </span>
            </div>
          )}

          {hasNextPage && (
            <button
              className="btn btn-primary"
              onClick={loadMore}
              disabled={isFetchingNextPage}
              style={{
                backgroundColor: '#e53935',
                border: 'none',
                padding: isMobile ? '8px 16px' : '12px 24px',
                fontSize: isMobile ? '14px' : '16px',
                borderRadius: '25px',
                width: isMobile ? '80%' : 'auto',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}
            >
              {isFetchingNextPage ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Loading...
                </>
              ) : (
                'Show More Products'
              )}
            </button>
          )}

          {!hasNextPage && products.length > 0 && (
            <p className="text-muted">No more products to show</p>
          )}
        </div>
      </section>

      <Suspense fallback={null}>
        <WhatsAppButton
          style={{
            position: 'fixed',
            bottom: isMobile ? '70px' : '30px',
            right: '20px',
            zIndex: 1000
          }}
        />
      </Suspense>

    </Layout>
  );
}

export default HomePage;
