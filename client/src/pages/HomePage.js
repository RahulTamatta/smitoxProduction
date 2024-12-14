import React, { useState, useEffect } from "react";
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
    padding: '10px',
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
      toast.error("Failed to fetch products for you");
    }
  };


  useEffect(() => {
    if (page === 1) return;
    loadMore();
  }, [page]);

  const loadMore = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/v1/product/product-list/${page}`);
      setLoading(false);
      setProducts([...products, ...data?.products]);
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
      toast.error("Failed to fetch banners");
    }
  };

  const handleBannerClick = (banner) => {
    if (banner.categoryId) {
      navigate(`/category/${banner.subcategoryId.name}`, {
        state: { 
          selectedSubcategory: banner.subcategoryId._id || null,
          fromBanner: true,
          bannerName:banner._id,
          slug: banner.subcategoryId.slug,
        }
      });
    } else {
      toast.error("Banner is not linked to a category");
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

  const bannerSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
  };

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
    <div style={{mobileSearchStyle,padding:'80px 0px'}}>
    {isMobile && (
        <div style={{ padding: "20px 0px" }}>
          <SearchInput style={{ paddingTop: '1000px' }} />
        </div>
      )}
</div>

      <div className="banner-container" style={{ height: '300px', overflow: 'hidden', marginTop: isMobile ? '10px' : '0' }}>
        <Slider {...bannerSettings}>
          {banners.map((banner) => (
            <div key={banner._id} onClick={() => handleBannerClick(banner)} style={{cursor: 'pointer'}}>
              <img
                src={`/api/v1/bannerManagement/single-banner/${banner._id}`}
                alt={banner.bannerName}
                className="banner-image"
                style={{ width: '100%', height: '300px', objectFit: 'cover' }}
              />
            </div>
          ))}
        </Slider>
      </div>

      <div className="container-fluid mt-3">
        <h2 className="text-center">Categories</h2>
        <Slider {...settings}>
          {categories.map((c) => (
            <div key={c._id} className="text-center category-item">
              <div
                className="category-circle"
                onClick={() => navigate(`/category/${c.slug}`)}
                style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', margin: '0 auto' }}
              >
                <img
                  src={c.photo}
                  alt={c.name}
                  className="img-fluid"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <h6 className="mt-2">{c.name}</h6>
            </div>
          ))}
        </Slider>
      </div>

      <div className="container mt-4">
        <h1 className="text-center mb-4">All Products</h1>
        <div className="row">
  {products?.map((p) => (
  <div key={p._id} className="col-lg-4 col-md-4 col-sm-4 col-6 mb-2">
  <ProductCard product={p} />
</div>

  ))}
</div>

        <div className="m-2 p-3">
          {products && products.length < total && (
            <button
              className="btn loadmore"
              onClick={(e) => {
                e.preventDefault();
                setPage(page + 1);
              }}
            >
              {loading ? (
                "Loading ..."
              ) : (
                <>
                  {" "}
                  Loadmore <AiOutlineReload />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="container mt-5">
  <h2 className="text-center mb-4">Products For You</h2>
  <div className="row">
  {productsForYou
    .slice(0, 6)
    .filter(item => item._id)
    .map(item => (
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