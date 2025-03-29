import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import Layout from "../components/Layout/Layout";
import { Heart } from "lucide-react";
import { useAuth } from "../context/auth";

const CategoryProduct = () => {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [auth] = useAuth();
  const observer = useRef();
  const loadMoreTriggerRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState({});
  const [subcategories, setSubcategories] = useState([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState(
    location.state?.selectedSubcategory || null
  );
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [fromBanner, setFromBanner] = useState(
    location.state?.fromBanner || false
  );
  const [wishlistStatus, setWishlistStatus] = useState({});

  useEffect(() => {
    if (params?.slug) {
      getCategoryAndSubcategories();
    }
  }, [params?.slug]);

  useEffect(() => {
    if (fromBanner && selectedSubcategory) {
      resetPaginationAndFetch();
    } else {
      resetPaginationAndFetch();
    }
  }, [fromBanner, selectedSubcategory]);

  useEffect(() => {
    if (auth?.user?._id && products.length > 0) {
      checkWishlistStatus(products);
    }
  }, [auth?.user?._id, products]);

  // Intersection Observer for infinite scrolling
  const lastProductElementRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) {
        loadMoreProducts();
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, hasMore, loadingMore]);

  const resetPaginationAndFetch = () => {
    setProducts([]);
    setPage(1);
    setHasMore(true);
    if (fromBanner && selectedSubcategory) {
      fetchProductsBySubcategory(selectedSubcategory, 1);
    } else {
      fetchProductsByCategoryOrSubcategory(selectedSubcategory, 1);
    }
  };

  const loadMoreProducts = () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    
    if (fromBanner && selectedSubcategory) {
      fetchProductsBySubcategory(selectedSubcategory, nextPage, true);
    } else {
      fetchProductsByCategoryOrSubcategory(selectedSubcategory, nextPage, true);
    }
  };

  const checkWishlistStatus = async (productsToCheck) => {
    if (!auth?.user?._id) {
      console.error("User ID not found.");
      return;
    }
  
    try {
      const statuses = {...wishlistStatus};
      const requests = productsToCheck.map(async (product) => {
        // Skip if we already know the status
        if (statuses[product._id] !== undefined) return;
        
        try {
          const { data } = await axios.get(
            `/api/v1/carts/users/${auth.user._id}/wishlist/check/${product._id}`
          );
          statuses[product._id] = data.exists;
        } catch (error) {
          console.error(
            `Error checking wishlist status for product ${product._id}:`,
            error.response?.data || error.message
          );
          statuses[product._id] = false;
        }
      });
  
      await Promise.all(requests);
      setWishlistStatus(statuses);
    } catch (error) {
      console.error("Error checking wishlist statuses:", error.response?.data || error.message);
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
    }
  };

  const getSubcategories = async (categoryId) => {
    try {
      const { data } = await axios.get("/api/v1/subcategory/get-subcategories");

      if (data?.success) {
        const filteredSubcategories = data.subcategories.filter((subcat) => {
          subcat.photos = subcat.photos || "https://via.placeholder.com/64";
          return subcat.category === categoryId;
        });
        setSubcategories(filteredSubcategories);
      } else {
        setSubcategories([]);
      }
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      setSubcategories([]);
    }
  };

  const fetchProductsByCategoryOrSubcategory = async (subcategoryId, pageNumber = 1, isLoadMore = false) => {
    try {
      if (pageNumber === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      let url = `/api/v1/product/product-category/${params.slug}?page=${pageNumber}&limit=20`;
      if (subcategoryId) {
        url = `/api/v1/product/product-subcategory/${subcategoryId}?page=${pageNumber}&limit=20`;
      }
      
      const { data } = await axios.get(url);
      
      if (isLoadMore) {
        setProducts(prev => [...prev, ...data?.products]);
      } else {
        setProducts(data?.products || []);
      }
      
      setTotalProducts(data?.total || 0);
      setHasMore(data?.hasMore || false);
      setPage(pageNumber);
      
      if (data?.products?.length > 0) {
        await checkWishlistStatus(data.products);
      }
    } catch (error) {
      console.log(error);
      if (!isLoadMore) {
        setProducts([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const filterBySubcategory = (subcategoryId) => {
    setSelectedSubcategory(subcategoryId);
    setProducts([]);
    setPage(1);
    setHasMore(true);
    fetchProductsByCategoryOrSubcategory(subcategoryId, 1);
  };

  const toggleWishlist = async (e, productId) => {
    e.stopPropagation();

    if (!auth?.user) {
      return;
    }

    try {
      if (wishlistStatus[productId]) {
        await axios.delete(
          `/api/v1/carts/users/${auth.user._id}/wishlist/${productId}`
        );
        setWishlistStatus((prev) => ({ ...prev, [productId]: false }));
      } else {
        await axios.post(`/api/v1/carts/users/${auth.user._id}/wishlist`, {
          productId: productId,
        });
        setWishlistStatus((prev) => ({ ...prev, [productId]: true }));
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);
    }
  };

  const fetchProductsBySubcategory = async (subcategoryId, pageNumber = 1, isLoadMore = false) => {
    try {
      if (pageNumber === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      const { data } = await axios.get(
        `/api/v1/product/product-subcategory/${subcategoryId}?page=${pageNumber}&limit=20`
      );
      
      if (isLoadMore) {
        setProducts(prev => [...prev, ...data?.products]);
      } else {
        setProducts(data?.products || []);
      }
      
      setTotalProducts(data?.total || 0);
      setHasMore(data?.hasMore || false);
      setPage(pageNumber);
      
      if (data?.products?.length > 0) {
        await checkWishlistStatus(data.products);
      }
    } catch (error) {
      console.log(error);
      if (!isLoadMore) {
        setProducts([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  return (
    <Layout>
      <div className="container-fluid px-0">
        <div className="row mx-0">
          <div className="col-12 px-3 mb-4 mt-4">
            <h4 className="text-center">{category?.name}</h4>
          </div>
  
          {!fromBanner && subcategories.length > 0 && (
            <div className="col-12 col-md-2" style={{ position: "sticky", top: "80px", height: "fit-content" }}>
              <div className="d-flex flex-row flex-md-column gap-4 px-2" style={{
                overflowX: "auto",
                overflowY: "auto",
                maxHeight: "calc(100vh - 200px)",
                msOverflowStyle: "none",
                scrollbarWidth: "none",
                WebkitOverflowScrolling: "touch"
              }}>
                <style>
                  {`
                    .d-flex::-webkit-scrollbar {
                      display: none;
                    }
                  `}
                </style>
  
                <div
                  className={`flex-shrink-0 ${!selectedSubcategory ? "active-subcategory" : ""}`}
                  onClick={() => {
                    setSelectedSubcategory(null);
                    resetPaginationAndFetch();
                  }}
                  style={{ cursor: "pointer", minWidth: "80px" }}
                >
                  <div className="d-flex flex-column align-items-center">
                    <div className="subcategory-circle mb-2" style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "50%",
                      overflow: "hidden",
                      border: !selectedSubcategory ? "2px solid #e47911" : "2px solid #ddd"
                    }}>
                      <img
                        src="https://via.placeholder.com/64"
                        alt="All"
                        className="w-100 h-100 object-fit-cover"
                      />
                    </div>
                    <span className="text-center small text-muted">All</span>
                  </div>
                </div>
  
                {subcategories.map((s) => (
                  <div
                    key={s._id}
                    className={`flex-shrink-0 ${selectedSubcategory === s._id ? "active-subcategory" : ""}`}
                    onClick={() => filterBySubcategory(s._id)}
                    style={{ cursor: "pointer", minWidth: "80px" }}
                  >
                    <div className="d-flex flex-column align-items-center">
                      <div className="subcategory-circle mb-2" style={{
                        width: "64px",
                        height: "64px",
                        borderRadius: "50%",
                        overflow: "hidden",
                        border: selectedSubcategory === s._id ? "2px solid #e47911" : "2px solid #ddd"
                      }}>
                        <img
                          src={s.photos}
                          alt={s.name}
                          className="w-100 h-100 object-fit-cover"
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/64";
                          }}
                        />
                      </div>
                      <span className="text-center small text-muted">{s.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
  
          <div 
            className={`col ${!fromBanner && subcategories.length > 0 ? "col-md-10" : "col-12"} px-3`}
            style={{ 
              height: "calc(100vh - 120px)", 
              overflowY: "auto" 
            }}
          >
            <div style={{ minHeight: "calc(100vh - 200px)" }}>
              {loading ? (
                <div className="text-center my-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : products?.length > 0 ? (
                <div className="row g-3">
                  {products.map((p, index) => (
                    <div 
                      className="col-6 col-md-4 col-lg-3" 
                      key={p._id} 
                      ref={index === products.length - 1 ? lastProductElementRef : null}
                    >
                      <div
                        className="card h-100 product-card shadow-sm"
                        style={{ cursor: "pointer", position: "relative" }}
                        onClick={() => navigate(`/product/${p.slug}`)}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWishlist(e, p._id);
                          }}
                          className="btn btn-link p-0 bg-white rounded-circle shadow-sm"
                          style={{
                            position: "absolute",
                            top: "8px",
                            right: "8px",
                            zIndex: 2,
                            width: "32px",
                            height: "32px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}
                        >
                          <Heart
                            size={18}
                            fill={wishlistStatus[p._id] ? "#dc3545" : "transparent"}
                            color={wishlistStatus[p._id] ? "#dc3545" : "#6c757d"}
                          />
                        </button>
  
                        <div className="ratio ratio-1x1">
                          <img
                            src={p.photos}
                            className="card-img-top p-2"
                            alt={p.name}
                            style={{
                              objectFit: "contain",
                              objectPosition: "center"
                            }}
                          />
                        </div>
  
                        <div className="card-body p-2">
                          <h6 className="card-title mb-2" style={{
                            fontSize: "0.9rem",
                            lineHeight: "1.2",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden"
                          }}>
                            {p.name}
                          </h6>
  
                          <div className="d-flex flex-column">
                            <span className="text-primary fw-bold">
                              {p.perPiecePrice?.toLocaleString("en-IN", {
                                style: "currency",
                                currency: "INR",
                                maximumFractionDigits: 0,
                              })}
                            </span>
                            {p.mrp && (
                              <span className="text-muted text-decoration-line-through" style={{ fontSize: "0.8rem" }}>
                                {p.mrp.toLocaleString("en-IN", {
                                  style: "currency",
                                  currency: "INR",
                                  maximumFractionDigits: 0,
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center my-5">
                  <h5 className="text-muted">No products found in this category</h5>
                </div>
              )}
              {loadingMore && (
                <div className="text-center my-3">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading more...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CategoryProduct;
