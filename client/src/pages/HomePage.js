import React, { useState, useEffect,useRef } from "react";
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




const HomePage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [banners, setBanners] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [productsForYou, setProductsForYou] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const loaderRef = useRef(null);

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

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && products.length < total) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 1.0 }
    );

    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => {
      if (loaderRef.current) observer.unobserve(loaderRef.current);
    };
  }, [loaderRef.current, products, total]);

  useEffect(() => {
    if (page > 1) loadMore();
  }, [page]);

  const getAllCategory = async () => {
    try {
      const { data } = await axios.get('/api/v1/category/get-category');
      if (data?.success) setCategories(data?.category);
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
      const { data } = await axios.get('/api/v1/product/product-count');
      setTotal(data?.total);
    } catch (error) {
      console.log(error);
    }
  };

  const loadMore = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/v1/product/product-list/${page}`);
      setLoading(false);
      setProducts((prev) => [...prev, ...data?.products]);
    } catch (error) {
      setLoading(false);
      console.log(error);
    }
  };

  const getAllProductsForYou = async () => {
    try {
      const { data } = await axios.get('/api/v1/productForYou/get-all');
      if (data?.success) {
        // Make sure we're accessing the correct property from the response
        const products = data.products || []; // Changed from data.productsForYou
        
        // Filter out any null or undefined products
        const validProducts = products.filter(item => 
          item && 
          item.productId && 
          Object.keys(item.productId).length > 0
        );
        
        setProductsForYou(validProducts);
      }
    } catch (error) {
      console.log(error);
      toast.error('Failed to fetch products for you');
    }
  };

  const getBanners = async () => {
    try {
      const { data } = await axios.get('/api/v1/bannerManagement/get-banners');
      if (data?.success) setBanners(data.banners);
    } catch (error) {
      console.log(error);
      toast.error('Failed to fetch banners');
    }
  };


  const settings = {
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
  }
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
        backgroundColor: currentSlide === i ? '#fff' : 'rgba(255,255,255,0.5)',
        borderRadius: '50%',
        transition: 'all 0.3s ease'
      }}
    />
  )
  };
  
  return (
    <Layout title="All Products - Best offers">
      <div style={{ padding: '55px 0px' }}>
        {isMobile && (
          <div style={{ padding: '50px 0px' }}>
            <SearchInput />
          </div>
        )}
      </div>

      <div className="banner-container" style={{ height: '300px', overflow: 'hidden', }}>
        <Slider dots infinite autoplay autoplaySpeed={3000}>
          {banners.map((banner) => (
            <div key={banner._id}>
              <img
                src={`/api/v1/bannerManagement/single-banner/${banner._id}`}
                alt={banner.bannerName}
                style={{ width: '100%', height: '300px', objectFit: 'cover', borderRadius: '20px' }}
              />
            </div>
          ))}
        </Slider>
      </div>


      <div style={{ 
        width: '100%',
        padding: '0px 0px',
        marginTop: '20px'
      }}>
        <h2 style={{ 
          textAlign: 'center',
          marginBottom: '20px'
        }}>Categories</h2>
        
        <div style={{
          width: '100%',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          msOverflowStyle: '-ms-autohiding-scrollbar',
          padding: '0 15px'
        }}>
          <div style={{
            display: 'flex',
            gap: '20px',
            padding: '10px 5px',
            minWidth: 'min-content'
          }}>
            {categories.map((c) => (
              <div 
                key={c._id}
                onClick={() => navigate(`/category/${c.slug}`)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minWidth: isMobile ? '100px' : '120px',
                  cursor: 'pointer'
                }}
              >
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  marginBottom: '0px',
                  border: '1px solid #eee'
                }}>
                  <img
                    src={c.photo}
                    alt={c.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </div>
                <h6 style={{
                  margin: 0,
                  fontSize: isMobile ? '12px' : '14px',
                  textAlign: 'center',
                  maxWidth: '100px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {c.name}
                </h6>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mt-4">
        <h1 className="text-center mb-4">All Products</h1>
        <div className="row">
          {products.map((p) => (
            <div key={p._id} className="col-xl-3 col-lg-3 col-md-4 col-sm-6 col-6 mb-3">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
    
        <div ref={loaderRef} />
      </div>

      <div className="container mt-5">
        <h2 className="text-center mb-4">Products For You</h2>
        <div className="row">
          {productsForYou.slice(0, 6).map((item) => (
            <div key={item.productId?._id} className="col-lg-4 col-md-4 col-sm-4 col-6 mb-3">
              <ProductCard product={item.productId} />
            </div>
          ))}
        </div>
      </div>

      <WhatsAppButton />
    </Layout>
  );
};

export default HomePage;
