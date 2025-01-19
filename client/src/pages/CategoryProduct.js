import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import Layout from "../components/Layout/Layout";
import Slider from "react-slick";
import { Heart } from "lucide-react";
import { useAuth } from "../context/auth";

const CategoryProduct = () => {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [auth] = useAuth();

  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState({});
  const [subcategories, setSubcategories] = useState([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState(
    location.state?.selectedSubcategory || null
  );
  const [loading, setLoading] = useState(true);
  const [fromBanner, setFromBanner] = useState(
    location.state?.fromBanner || false
  );
  const [wishlistStatus, setWishlistStatus] = useState({});
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const productsPerPage = 15;

  useEffect(() => {
    if (params?.slug) {
      getCategoryAndSubcategories();
    }
  }, [params?.slug]);

  useEffect(() => {
    if (fromBanner && selectedSubcategory) {
      fetchProductsBySubcategory(selectedSubcategory);
    } else {
      fetchProductsByCategoryOrSubcategory(selectedSubcategory);
    }
  }, [fromBanner, selectedSubcategory]);

  const checkWishlistStatus = async (products) => {
    if (!auth?.user?._id) return;

    try {
      const statuses = {};
      await Promise.all(
        products.map(async (product) => {
          try {
            const { data } = await axios.get(
              `/api/v1/carts/users/${auth.user._id}/wishlist/check/${product._id}`
            );
            statuses[product._id] = data.exists;
          } catch (error) {
            console.error(`Error checking wishlist status for product ${product._id}:`, error);
            statuses[product._id] = false;
          }
        })
      );
      setWishlistStatus(statuses);
    } catch (error) {
      console.error('Error checking wishlist statuses:', error);
    }
  };

  const getCategoryAndSubcategories = async () => {
    try {
      const { data } = await axios.get(
        `/api/v1/product/product-category/${params.slug}`
      );
      setCategory(data?.category);
      await getSubcategories(data?.category._id);
    } catch (error) {
      console.log(error);
      toast.error("Error fetching category information");
    }
  };

  const getSubcategories = async (categoryId) => {
    try {
      const { data } = await axios.get("/api/v1/subcategory/get-subcategories");
      
      if (data?.success) {
        const filteredSubcategories = data.subcategories.filter((subcat) => {
          subcat.photo = subcat.photo || "/api/v1/placeholder/64/64";
          return subcat.category === categoryId;
        });
        setSubcategories(filteredSubcategories);
      } else {
        setSubcategories([]);
      }
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      toast.error("Error fetching subcategories");
      setSubcategories([]);
    }
  };

  const fetchProductsByCategoryOrSubcategory = async (subcategoryId) => {
    try {
      setLoading(true);
      let url = `/api/v1/product/product-category/${params.slug}?page=${page}`;
      if (subcategoryId) {
        url = `/api/v1/product/product-subcategory/${subcategoryId}?page=${page}`;
      }
      const { data } = await axios.get(url);
      
      if (page === 1) {
        setProducts(data?.products || []);
      } else {
        setProducts(prev => [...prev, ...(data?.products || [])]);
      }
      
      setTotal(data?.pagination?.totalProducts || 0);
      setHasMore(data?.pagination?.hasMore || false);
      await checkWishlistStatus(data?.products || []);
    } catch (error) {
      console.log(error);
      toast.error("Error fetching products");
      if (page === 1) {
        setProducts([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (loading || !hasMore) return;
    setPage(prev => prev + 1);
    await fetchProductsByCategoryOrSubcategory(selectedSubcategory);
  };

  const filterBySubcategory = (subcategoryId) => {
    setPage(1); // Reset page when filtering
    setSelectedSubcategory(subcategoryId);
    setProducts([]); // Clear existing products
    fetchProductsByCategoryOrSubcategory(subcategoryId);
  };

  const toggleWishlist = async (e, productId) => {
    e.stopPropagation();
    
    if (!auth?.user) {
      toast.error("Please log in to manage your wishlist");
      return;
    }
  
    try {
      if (wishlistStatus[productId]) {
        await axios.delete(`/api/v1/carts/users/${auth.user._id}/wishlist/${productId}`);
        setWishlistStatus(prev => ({ ...prev, [productId]: false }));
        toast.success("Removed from wishlist");
      } else {
        await axios.post(`/api/v1/carts/users/${auth.user._id}/wishlist`, { 
          productId: productId 
        });
        setWishlistStatus(prev => ({ ...prev, [productId]: true }));
        toast.success("Added to wishlist");
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);
      toast.error("Error updating wishlist");
    }
  };


  

  const fetchProductsBySubcategory = async (subcategoryId) => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `/api/v1/product/product-subcategory/${subcategoryId}`
      );
      setProducts(data?.products || []);
      setTotal(data?.products?.length || 0);
      setPage(1); // Reset page when fetching new products
      await checkWishlistStatus(data?.products || []);
    } catch (error) {
      console.log(error);
      toast.error("Error fetching products");
      setProducts([]);
    } finally {
      setLoading(false);
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
        },
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        },
      },
    ],
  };

  return (
    <Layout>
      <div className="container mt-3 category">
        <h4 className="text-center" style={{ marginBottom: "1rem", paddingTop: "8rem" }}>
          {category?.name}
        </h4>

        {!fromBanner && subcategories.length > 0 && (
          <div className="subcategory-slider mb-4">
            <Slider {...settings}>
              <div
                key="all"
                className={`subcategory-item ${!selectedSubcategory ? "active" : ""}`}
                onClick={() => {
                  setSelectedSubcategory(null);
                  setPage(1);
                  fetchProductsByCategoryOrSubcategory(null);
                }}
                style={{
                  cursor: "pointer",
                  textAlign: "center",
                  margin: "0 10px",
                }}
              >
                <div
                  className="subcategory-circle"
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    overflow: "hidden",
                    margin: "0 auto",
                    border: "none",
                    padding: "0",
                  }}
                >
                  <img
                    src="/api/v1/placeholder/64/64"
                    alt="All"
                    className="subcategory-image"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>
                <h6 className="mt-2">All</h6>
              </div>
              {subcategories.map((s) => (
                <div
                  key={s._id}
                  className={`subcategory-item ${selectedSubcategory === s._id ? "active" : ""}`}
                  onClick={() => filterBySubcategory(s._id)}
                  style={{
                    cursor: "pointer",
                    textAlign: "center",
                    margin: "0 10px",
                  }}
                >
                  <div
                    className="subcategory-circle"
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      width: "80px",
                      height: "80px",
                      borderRadius: "50%",
                      overflow: "hidden",
                      margin: "0 auto",
                      border: "none",
                      padding: "0",
                    }}
                  >
                    <img
                      src={s.photo}
                      alt={s.name}
                      className="subcategory-image"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  </div>
                  <h6 className="mt-2">{s.name}</h6>
                </div>
              ))}
            </Slider>
          </div>
        )}
        
    

        {loading && products.length === 0 ? (
          <div className="text-center">Loading...</div>
        ) : products?.length > 0 ? (
          <>
            <div className="row">
              {products.map((p) => (
                  <div className="col-lg-3 col-md-4 col-sm-6 mb-3" key={p._id}>
                  <div
                    className="card product-card h-100"
                    style={{ cursor: "pointer", position: "relative" }}
                    onClick={() => navigate(`/product/${p.slug}`)}
                  >
                    <button 
                      onClick={(e) => toggleWishlist(e, p._id)}
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        zIndex: 2,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <Heart
                        size={24}
                        fill={wishlistStatus[p._id] ? "#e47911" : "none"}
                        color={wishlistStatus[p._id] ? "#e47911" : "#000000"}
                      />
                    </button>
                    <img
                      src={p.photos}
                      className="card-img-top product-image"
                      alt={p.name}
                      style={{ height: "200px", objectFit: "contain" }}
                    />
                    <div className="p-4 flex flex-col h-full">
                      <h5 className="text-xs font-semibold text-gray-900 dark:text-white mb-2">
                        {p.name.length > 20 ? `${p.name.slice(0, 20)}.....` : p.name}
                      </h5>
                      <div className="mt-auto">
                        <h5 className="text-base font-bold text-gray-900 dark:text-white">
                          {p.perPiecePrice?.toLocaleString("en-US", {
                            style: "currency",
                            currency: "INR",
                          }) || "Price not available"}
                        </h5>
                        {p.mrp && (
                          <h6
                            className="text-xs text-red-500"
                            style={{ textDecoration: "line-through" }}
                          >
                            {p.mrp.toLocaleString("en-US", {
                              style: "currency",
                              currency: "INR",
                            })}
                          </h6>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {hasMore && (
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
          </>
        ) : (
          <div className="text-center">No products found.</div>
        )}
      </div>
    </Layout>
  );
};

export default CategoryProduct;