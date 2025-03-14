import React, { useState, useEffect } from "react";
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
  useEffect(() => {
    if (auth?.user?._id && products.length > 0) {
      checkWishlistStatus(products);
    }
  }, [auth?.user?._id, products]);
  const checkWishlistStatus = async (products) => {
    if (!auth?.user?._id) {
      console.error("User ID not found.");
      return;
    }
  
    try {
      const statuses = {};
      const requests = products.map(async (product) => {
        try {
          const { data } = await axios.get(
            `/api/v1/carts/users/${auth.user._id}/wishlist/check/${product._id}`
          );
          statuses[product._id] = data.exists; // Ensure `data.exists` matches API response structure
        } catch (error) {
          console.error(
            `Error checking wishlist status for product ${product._id}:`,
            error.response?.data || error.message
          );
          statuses[product._id] = false; // Default to `false` if the API call fails
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
      //toast.error("Error fetching category information");
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
      //toast.error("Error fetching subcategories");
      setSubcategories([]);
    }
  };

  const fetchProductsByCategoryOrSubcategory = async (subcategoryId) => {
    try {
      setLoading(true);
      let url = `/api/v1/product/product-category/${params.slug}`;
      if (subcategoryId) {
        url = `/api/v1/product/product-subcategory/${subcategoryId}`;
      }
      const { data } = await axios.get(url);
      setProducts(data?.products || []);
      await checkWishlistStatus(data?.products || []);
    } catch (error) {
      console.log(error);
      //toast.error("Error fetching products");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const filterBySubcategory = (subcategoryId) => {
    setSelectedSubcategory(subcategoryId);
    setProducts([]);
    fetchProductsByCategoryOrSubcategory(subcategoryId);
  };

  const toggleWishlist = async (e, productId) => {
    e.stopPropagation();

    if (!auth?.user) {
      //toast.error("Please log in to manage your wishlist");
      return;
    }

    try {
      if (wishlistStatus[productId]) {
        await axios.delete(
          `/api/v1/carts/users/${auth.user._id}/wishlist/${productId}`
        );
        setWishlistStatus((prev) => ({ ...prev, [productId]: false }));
        //toast.success("Removed from wishlist");
      } else {
        await axios.post(`/api/v1/carts/users/${auth.user._id}/wishlist`, {
          productId: productId,
        });
        setWishlistStatus((prev) => ({ ...prev, [productId]: true }));
        // //toast.success("Added to wishlist");
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);
      //toast.error("Error updating wishlist");
    }
  };

  const fetchProductsBySubcategory = async (subcategoryId) => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `/api/v1/product/product-subcategory/${subcategoryId}`
      );
      setProducts(data?.products || []);
      await checkWishlistStatus(data?.products || []);
    } catch (error) {
      console.log(error);
      //toast.error("Error fetching products");
      setProducts([]);
    } finally {
      setLoading(false);
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
                    fetchProductsByCategoryOrSubcategory(null);
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
                  {products.map((p) => (
                    <div className="col-6 col-md-4 col-lg-3" key={p._id}>
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
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CategoryProduct;
