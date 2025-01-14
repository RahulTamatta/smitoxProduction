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

import { LazyLoadImage } from 'react-lazy-load-image-component';



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
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [banners, setBanners] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [productsForYou, setProductsForYou] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const abortController = useRef(null);

  // Fetch initial data
  const fetchInitialData = async () => {
    try {
      if (abortController.current) {
        abortController.current.abort();
      }
      abortController.current = new AbortController();

      setLoading(true);
      const [categoryRes, totalRes, bannerRes, forYouRes, productsRes] = await Promise.all([
        axios.get('/api/v1/category/get-category', {
          signal: abortController.current.signal,
        }),
        axios.get('/api/v1/product/product-count', {
          signal: abortController.current.signal,
        }),
        axios.get('/api/v1/bannerManagement/get-banners', {
          signal: abortController.current.signal,
        }),
        axios.get('/api/v1/productForYou/get-all', {
          signal: abortController.current.signal,
        }),
        axios.get('/api/v1/product/product-list/1', {
          signal: abortController.current.signal,
        }),
      ]);

      setCategories(categoryRes.data?.category || []);
      setTotal(totalRes.data?.total || 0);
      setBanners(bannerRes.data?.banners || []);
      setProducts(productsRes.data?.products || []);

      const validProducts = forYouRes.data?.products?.filter(
        (item) => item?.productId && Object.keys(item.productId).length > 0
      ) || [];
      setProductsForYou(validProducts);
    } catch (error) {
      if (!axios.isCancel(error)) {
        console.error('Fetch error:', error);
        toast.error('Error loading content');
      }
    } finally {
      setLoading(false);
    }
  };

  // Load more products
  const loadMore = async () => {
    if (loading) return;
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/v1/product/product-list/${page + 1}`);
      if (data?.success) {
        setProducts((prev) => [...prev, ...data.products]);
        setPage((prev) => prev + 1);
      }
    } catch (error) {
      console.error('Load more error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initial data load
  useEffect(() => {
    fetchInitialData();
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  const bannerSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
  };

  return (
    <Layout title="All Products - Best offers">
      <div style={{ padding: '55px 0px' }}>
        {isMobile && (
          <div style={{ padding: '50px 0px' }}>
            <Suspense fallback={<div>Loading...</div>}>
              <SearchInput />
            </Suspense>
          </div>
        )}
      </div>

      <div className="banner-container" style={{ height: '300px', overflow: 'hidden', borderRadius: '20px', margin: '0 20px' }}>
        <Slider {...bannerSettings}>
          {banners.map((banner) => (
            <div key={banner._id}>
              <LazyLoadImage
                src={banner.photoUrl || `/api/v1/bannerManagement/single-banner/${banner._id}`}
                alt={banner.bannerName}
                effect="blur"
                style={{
                  width: '100%',
                  height: '300px',
                  objectFit: 'cover',
                }}
              />
            </div>
          ))}
        </Slider>
      </div>

      <div className="container mt-4">
        <h2 className="text-center mb-4">All Products</h2>
        <div className="row">
          <Suspense fallback={<div>Loading products...</div>}>
            {products.map((p) => (
              <div key={p._id} className="col-xl-3 col-lg-3 col-md-4 col-sm-6 col-6 mb-3">
                <ProductCard product={p} />
              </div>
            ))}
          </Suspense>
        </div>
        {products.length < total && (
  <div className="text-center mt-4">
    <button
      className="btn btn-primary"
      onClick={loadMore}
      disabled={loading}
      style={{
        backgroundColor: 'red',
        border: 'none',
        color: 'white',
        padding: '10px 20px',
        borderRadius: '5px',
        fontSize: '16px',
        cursor: 'pointer',
        boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s ease',
      }}
      onMouseEnter={(e) => (e.target.style.backgroundColor = '#cc0000')}
      onMouseLeave={(e) => (e.target.style.backgroundColor = 'red')}
    >
      {loading ? 'Loading...' : 'Show More'}
    </button>
  </div>
)}

      </div>

      {productsForYou.length > 0 && (
        <div className="container mt-5">
          <h2 className="text-center mb-4">Products For You</h2>
          <div className="row">
            <Suspense fallback={<div>Loading recommended products...</div>}>
              {productsForYou.slice(0, 10).map((item, index) => (
                <div key={item.productId?._id || index} className="col-lg-4 col-md-4 col-sm-4 col-6 mb-3">
                  <ProductCard product={item.productId} />
                </div>
              ))}
            </Suspense>
          </div>
          {productsForYou.length > 10 && (
  <div className="text-center mt-4">
    <button
      className="btn btn-primary"
      onClick={() => setProductsForYou(productsForYou.slice(0, productsForYou.length + 10))}
      style={{
        backgroundColor: 'red',
        border: 'none',
        color: 'white',
        padding: '10px 20px',
        borderRadius: '5px',
        fontSize: '16px',
        cursor: 'pointer',
        boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s ease',
      }}
      onMouseEnter={(e) => (e.target.style.backgroundColor = '#cc0000')}
      onMouseLeave={(e) => (e.target.style.backgroundColor = 'red')}
    >
      Show More
    </button>
  </div>
)}

        </div>
      )}

      <Suspense fallback={null}>
        <WhatsAppButton />
      </Suspense>
    </Layout>
  );
};

export default HomePage;


