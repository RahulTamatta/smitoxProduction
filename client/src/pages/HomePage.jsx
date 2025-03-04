import React, { useState, useEffect, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import Slider from "react-slick";
import axios from "axios";
import Layout from "./../components/Layout/Layout";
import "../styles/Homepage.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import SearchInput from "../components/Form/SearchInput";
import ProductCard from "./ProductCard";
import WhatsAppButton from "./whatsapp";
import OptimizedImage from "../components/OptimizedImage";

// Custom arrow components defined first
const CustomNextArrow = (props) => (
  <button
    type="button"
    onClick={props.onClick}
    style={{
      position: "absolute",
      right: "30px",
      top: "50%",
      transform: "translateY(-50%)",
      width: "40px",
      height: "40px",
      backgroundColor: "#f0f0f0",
      borderRadius: "50%",
      border: "1px solid #e0e0e0",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      cursor: "pointer",
      zIndex: 2,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#666",
      transition: "all 0.3s ease",
    }}
  >
    <span style={{ fontSize: "24px", fontWeight: "bold" }}>›</span>
  </button>
);

const CustomPrevArrow = (props) => (
  <button
    type="button"
    onClick={props.onClick}
    style={{
      position: "absolute",
      left: "30px",
      top: "50%",
      transform: "translateY(-50%)",
      width: "40px",
      height: "40px",
      backgroundColor: "#f0f0f0",
      borderRadius: "50%",
      border: "1px solid #e0e0e0",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      cursor: "pointer",
      zIndex: 2,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#666",
      transition: "all 0.3s ease",
    }}
  >
    <span style={{ fontSize: "24px", fontWeight: "bold" }}>‹</span>
  </button>
);

const HomePage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [banners, setBanners] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Fetch initial data on mount
  useEffect(() => {
    getAllCategory();
    getBanners();
    getAllProducts();
  }, []);

  // Handle window resize for mobile responsiveness
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch all categories
  const getAllCategory = async () => {
    try {
      const { data } = await axios.get("/api/v1/category/get-category");
      if (data?.success) {
        setCategories(data.category);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Fetch banners
  const getBanners = async () => {
    try {
      const { data } = await axios.get("/api/v1/bannerManagement/get-banners");
      if (data?.success) {
        setBanners(data.banners);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Fetch initial set of products (page 1)
  const getAllProducts = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/v1/product/product-list/1`);
      setProducts(data.products);
      setTotal(data.total);
      setPage(1);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  // Fetch additional products for lazy loading
  const loadMore = async () => {
    try {
      setLoading(true);
      const nextPage = page + 1;
      const { data } = await axios.get(`/api/v1/product/product-list/${nextPage}`);
      setProducts((prev) => [...prev, ...data.products]);
      setPage(nextPage);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  // Handle banner click to navigate to category
  const handleBannerClick = (banner) => {
    if (banner.categoryId) {
      navigate(`/category/${banner.categoryId}`);
    }
  };

  // Banner carousel settings
  const bannerSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2000,
    beforeChange: (_, next) => setCurrentSlide(next),
    nextArrow: <CustomNextArrow />,
    prevArrow: <CustomPrevArrow />,
    appendDots: (dots) => (
      <div style={{ position: "absolute", bottom: "10px", width: "100%", display: "flex", justifyContent: "center", gap: "5px", zIndex: 2 }}>
        {dots}
      </div>
    ),
    customPaging: (i) => (
      <div style={{ width: "8px", height: "8px", backgroundColor: currentSlide === i ? "red" : "rgba(255,0,0,0.5)", borderRadius: "50%", transition: "all 0.3s ease" }} />
    ),
  };

  return (
    <Layout title={"All Products - Best offers"}>
      {/* Mobile Search */}
      {isMobile && (
        <div style={{ position: "sticky", top: 0, zIndex: 1000, backgroundColor: "white", padding: "10px 15px", marginTop: "110px" }}>
          <SearchInput />
        </div>
      )}

      {/* Banner Section */}
      <div style={{ height: "auto", overflow: "hidden", margin: isMobile ? "10px" : "20px", borderRadius: "15px", position: "relative" }}>
        <Slider {...bannerSettings}>
          {banners.map((banner) => (
            <div key={banner._id} onClick={() => handleBannerClick(banner)}>
              <OptimizedImage
                src={banner.photos}
                alt={banner.bannerName}
                width={isMobile ? window.innerWidth - 20 : 1200}
                height={isMobile ? Math.round((window.innerWidth - 20) * 0.5625) : 420}
                style={{ width: "100%", height: "auto", borderRadius: "15px" }}
                objectFit="fill"
                quality={80}
                loading="eager"
              />
            </div>
          ))}
        </Slider>
      </div>

      {/* Shop by Category Section */}
      <div style={{ padding: "20px 0", marginTop: "20px" }}>
        <h2 style={{ textAlign: "center", marginBottom: "20px", fontSize: isMobile ? "1.5rem" : "2rem" }}>
          Shop by Category
        </h2>
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", padding: "0 10px" }}>
          <div style={{ display: "flex", gap: "15px", padding: "10px", minWidth: "fit-content" }}>
            {categories.map((c) => (
              <div
                key={c._id}
                onClick={() => navigate(`/category/${c.slug}`)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  minWidth: isMobile ? "90px" : "120px",
                  cursor: "pointer",
                  transition: "transform 0.2s",
                }}
              >
                <div style={{ width: isMobile ? "70px" : "80px", height: isMobile ? "70px" : "80px", borderRadius: "50%", overflow: "hidden", border: "2px solid #f0f0f0" }}>
                  <OptimizedImage
                    src={c.photos}
                    alt={c.name}
                    width={isMobile ? 70 : 80}
                    height={isMobile ? 70 : 80}
                    objectFit="cover"
                    quality={75}
                  />
                </div>
                <h6 style={{ marginTop: "10px", fontSize: isMobile ? "12px" : "14px", textAlign: "center", fontWeight: "500", color: "#333" }}>
                  {c.name}
                </h6>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Product Listing Section */}
      <div className="container mt-4">
        <h2 className="text-center mb-4" style={{ fontSize: isMobile ? "1.5rem" : "2rem" }}>
          Trending Products
        </h2>
        <div className="row g-3">
          {products.map((p) => (
            <div key={p._id} className="col-6 col-sm-6 col-md-4 col-lg-3 col-xl-3" style={{ padding: "8px" }}>
              <ProductCard product={p} handleProductClick={() => navigate(`/product/${p.slug}`)} />
            </div>
          ))}
        </div>
        {products.length < total && (
          <div className="text-center mt-4 mb-5">
            <button
              className="btn btn-primary"
              onClick={loadMore}
              disabled={loading}
              style={{
                backgroundColor: "#e53935",
                border: "none",
                padding: isMobile ? "8px 16px" : "12px 24px",
                fontSize: isMobile ? "14px" : "16px",
                borderRadius: "25px",
                width: isMobile ? "80%" : "auto",
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              }}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Loading...
                </>
              ) : (
                "Show More Products"
              )}
            </button>
          </div>
        )}
        {products.length >= total && products.length > 0 && (
          <div className="text-center mt-4 mb-5">
            <p>All products have been loaded.</p>
          </div>
        )}
      </div>

      {/* WhatsApp Button */}
      <Suspense fallback={null}>
        <WhatsAppButton style={{ position: "fixed", bottom: isMobile ? "70px" : "30px", right: "20px", zIndex: 1000 }} />
      </Suspense>
    </Layout>
  );
};

export default HomePage;