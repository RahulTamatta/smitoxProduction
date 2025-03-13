import React, { useState, useEffect,useRef,Suspense } from "react";
import { useNavigate } from "react-router-dom";
import Slider from "react-slick";
import axios from "axios";
import toast from "react-hot-toast";
import Layout from "./../components/Layout/Layout";
import { AiOutlineReload } from "react-icons/ai";
import "../styles/Homepage.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { useCart } from "../context/cart";
import SearchInput from "../components/Form/SearchInput";
import ProductCard from "./ProductCard"; // Import the new ProductCard component
import WhatsAppButton from './whatsapp'; // Adjust the import path as needed
import { useLocation } from 'react-router-dom';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';



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

const HomePage = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useCart();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [checked, setChecked] = useState([]);
  const [radio, setRadio] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [banners, setBanners] = useState([]);
  const [user, setUser] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [productsForYou, setProductsForYou] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [hasMore, setHasMore] = useState(true); // Add this new state
  const location = useLocation();
  useEffect(() => {
    getAllCategory();
    getTotal();
    getBanners();
    getAllProductsForYou();
  }, []);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const mobileSearchStyle = {
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    backgroundColor: '#2874f0',
    padding: '0px 0px 0px 0px',
    display: isMobile ? 'block' : 'none',
  };
  const getAllCategory = async () => {
    try {
      const { data } = await axios.get("/api/v1/category/get-category");
      if (data?.success) {
        setCategories(data?.category);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getAllProducts = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/v1/product/product-list/${page}`);
      setLoading(false);
      setProducts(data.products);
    } catch (error) {
      setLoading(false);
      console.log(error);
    }
  };

  const getTotal = async () => {
    try {
      const { data } = await axios.get("/api/v1/product/product-count");
      setTotal(data?.total);
    } catch (error) {
      console.log(error);
    }
  };

  const getAllProductsForYou = async () => {
    try {
      const { data } = await axios.get("/api/v1/productForYou/get-all");
      if (data?.success) {
        setProductsForYou(data.productsForYou || []);
      }
    } catch (error) {
      console.log(error);
      //toast.error("Failed to fetch products for you");
    }
  };

  const loadMore = async () => {
    try {
      if (loading) return; // Prevent multiple simultaneous calls
      
      setLoading(true);
      const nextPage = page + 1;
      
      const { data } = await axios.get(`/api/v1/product/product-list/${nextPage}`, {
        params: { limit: 12 } // Ensure consistent page size
      });
      
      if (data.products.length === 0) {
        setHasMore(false);
      } else {
        setProducts([...products, ...data.products]);
        setPage(nextPage); // Update page after successful data fetch
      }
      
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  const handleFilter = (value, id) => {
    let all = [...checked];
    if (value) {
      all.push(id);
    } else {
      all = all.filter((c) => c !== id);
    }
    setChecked(all);
  };

  useEffect(() => {
    if (!checked.length || !radio.length) getAllProducts();
  }, [checked.length, radio.length]);

  useEffect(() => {
    if (checked.length || radio.length) filterProduct();
  }, [checked, radio]);

  const filterProduct = async () => {
    try {
      const { data } = await axios.post("/api/v1/product/product-filters", {
        checked,
        radio,
      });
      setProducts(data?.products);
    } catch (error) {
      console.log(error);
    }
  };

  const getBanners = async () => {
    try {
      const { data } = await axios.get("/api/v1/bannerManagement/get-banners");
      if (data?.success) {
        setBanners(data.banners);
      }
    } catch (error) {
      console.log(error);
      //toast.error("Failed to fetch banners");
    }
  };

  const handleBannerClick = (banner) => {
    if (banner.categoryId) {
      navigate(`/category/${banner.subcategoryId._id}`, {
        state: { 
          selectedSubcategory: banner.subcategoryId._id || null,
          fromBanner: true,
          bannerName:banner._id,
          slug: banner.subcategoryId,
        }
      });
    } else {
      //toast.error("Banner is not linked to a category");
    }
  };

  const settings = {
    dots: false,
    infinite: false,
    speed: 500,
    slidesToShow: 6,
    slidesToScroll: 1,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 4,
          slidesToScroll: 1,
        }
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
        }
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1
        }
      }
    ]
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
const handleProductClick = (product) => {
  // Save current scroll position before navigating
  sessionStorage.setItem(`scrollPosition_${location.pathname}`, window.scrollY.toString());
  navigate(`/product/${product.slug}`);
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
  
  if (isBlocked) {
    return (
      <Layout title="Account Blocked">
        <div className="container">
          <h1>Your account has been blocked</h1>
          <p>Please contact support for more information.</p>
        </div>
      </Layout>
    );
  }

  return (
    
    <Layout title={"All Products - Best offers"}>
      {/* Mobile Search */}
    
      {isMobile && (
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
      )}
  
      {/* Banner Section */}
    {/* Banner Section */}
<div
  className="banner-container"
  style={{
    height: 'auto', // Remove fixed height
    overflow: 'hidden',
    margin: isMobile ? '10px' : '20px',
    borderRadius: '15px',
    position: 'relative',
  }}
>
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
          paddingTop: isMobile ? '56.25%' : '35%', // 16:9 aspect ratio for mobile, wider for desktop
          width: '100%',
        }}>
          <img
            src={banner.photos}
            alt={banner.bannerName}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'fill',
              borderRadius: '15px',
            }}
          />
        </div>
      </div>
    ))}
  </Slider>
</div>
  
      {/* Categories Section */}
      <div style={{ padding: '20px 0', marginTop: '20px' }}>
        <h2 style={{ 
          textAlign: 'center', 
          marginBottom: '20px',
          fontSize: isMobile ? '1.5rem' : '2rem'
        }}>
          Shop by Category
        </h2>
        <div style={{ 
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: '0 10px'
        }}>
          <div style={{
            display: 'flex',
            gap: '15px',
            padding: '10px',
            minWidth: 'fit-content'
          }}>
            {categories.map((c) => (
              <div 
                key={c._id}
                onClick={() => navigate(`/category/${c.slug}`)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minWidth: isMobile ? '90px' : '120px',
                  cursor: 'pointer',
                  transition: 'transform 0.2s'
                }}
              >
                <div style={{
                  width: isMobile ? '70px' : '80px',
                  height: isMobile ? '70px' : '80px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '2px solid #f0f0f0'
                }}>
                  <LazyLoadImage
                    src={c.photos}
                    alt={c.name}
                    effect="blur"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </div>
                <h6 style={{
                  marginTop: '10px',
                  fontSize: isMobile ? '12px' : '14px',
                  textAlign: 'center',
                  fontWeight: '500',
                  color: '#333'
                }}>
                  {c.name}
                </h6>
              </div>
            ))}
          </div>
        </div>
      </div>
  
      {/* All Products Section */}
      <div className="container mt-4">
        <h2 className="text-center mb-4" style={{ fontSize: isMobile ? '1.5rem' : '2rem' }}>
          Trending Products
        </h2>
        <div className="row g-3">
          {products.map((p) => (
            <div 
              key={p._id} 
              className="col-6 col-sm-6 col-md-4 col-lg-3 col-xl-3" // Change col-lg-3 to col-lg-4
      
              style={{ padding: '8px' }}
            >
            <ProductCard 
  product={p}
  photoUrl={p.photoUrl}
/>
            </div>
          ))}
        </div>
        
        {/* Pagination and Load More */}
        <div className="text-center mt-4 mb-5">
          {/* Pagination indicator */}
          {products.length > 0 && (
            <div className="mb-3">
              <span className="text-muted">
                Page {page} of {Math.ceil(total/12)} • Showing {products.length} of {total} products
              </span>
            </div>
          )}
          
          {hasMore && products.length < total && (
            <button
              className="btn btn-primary"
              onClick={loadMore} // Directly call loadMore
              disabled={loading}
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
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Loading...
                </>
              ) : (
                'Show More Products'
              )}
            </button>
          )}
          
          {!hasMore && products.length > 0 && (
            <p className="text-muted">No more products to show</p>
          )}
        </div>
      </div>
  
      {/* Products For You Section */}
      {productsForYou.length > 0 && (
        <div className="container mt-5">
          <h2 className="text-center mb-4" style={{ fontSize: isMobile ? '1.5rem' : '2rem' }}>
            Recommended for You
          </h2>
          <div className="row g-3">
            {productsForYou.map((item, index) => (
              <div 
                key={item.productId?._id || index} 
                className="col-6 col-sm-6 col-md-4 col-lg-3 col-xl-2"
                style={{ padding: '8px' }}
              >
                <ProductCard 
                  product={item.productId}
                  photoUrl={item.productId?.photoUrl}
                  style={{
                    height: '100%',
                    borderRadius: '12px'
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
  
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
  );}

export default HomePage;