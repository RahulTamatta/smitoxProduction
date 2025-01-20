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
            console.error(
              `Error checking wishlist status for product ${product._id}:`,
              error
            );
            statuses[product._id] = false;
          }
        })
      );
      setWishlistStatus(statuses);
    } catch (error) {
      console.error("Error checking wishlist statuses:", error);
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
          subcat.photos = subcat.photos || "https://via.placeholder.com/64";
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
      let url = `/api/v1/product/product-category/${params.slug}`;
      if (subcategoryId) {
        url = `/api/v1/product/product-subcategory/${subcategoryId}`;
      }
      const { data } = await axios.get(url);
      setProducts(data?.products || []);
      await checkWishlistStatus(data?.products || []);
    } catch (error) {
      console.log(error);
      toast.error("Error fetching products");
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
      toast.error("Please log in to manage your wishlist");
      return;
    }

    try {
      if (wishlistStatus[productId]) {
        await axios.delete(
          `/api/v1/carts/users/${auth.user._id}/wishlist/${productId}`
        );
        setWishlistStatus((prev) => ({ ...prev, [productId]: false }));
        toast.success("Removed from wishlist");
      } else {
        await axios.post(`/api/v1/carts/users/${auth.user._id}/wishlist`, {
          productId: productId,
        });
        setWishlistStatus((prev) => ({ ...prev, [productId]: true }));
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
      await checkWishlistStatus(data?.products || []);
    } catch (error) {
      console.log(error);
      toast.error("Error fetching products");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  

  return (
    <Layout>
      <div className="container mt-3 category">
        <h4 className="text-center mb-4" style={{ paddingTop: "1rem" }}>
          {category?.name}
        </h4>
  
        <div className="row">
          {/* Subcategories Column - Fixed Vertical */}
          {!fromBanner && subcategories.length > 0 && (
          <div className="col-12 col-md-2 col-mb-4">
            <div className="sticky-top" style={{ 
              top: "10px",
              maxHeight: "calc(100vh - 200px)", // Set maximum height
              zIndex: 1
            }}>
              <div 
                className="d-flex flex-row flex-md-column" 
                style={{ 
                  gap: "1.5rem",
                  overflowX: "auto",
                  overflowY: "auto",
                  padding: "0.5rem",
                  msOverflowStyle: "none", // Hide scrollbar for IE and Edge
                  scrollbarWidth: "none", // Hide scrollbar for Firefox
                  WebkitOverflowScrolling: "touch", // Smooth scrolling for iOS
                }}
              >
                {/* Style for hiding scrollbar in WebKit browsers */}
                <style>
                  {`
                    .d-flex::-webkit-scrollbar {
                      display: none;
                    }
                    @media (min-width: 768px) {
                      .d-flex {
                        max-height: calc(100vh - 220px);
                      }
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
                    <div
                      className="subcategory-circle mb-2"
                      style={{
                        width: "64px",
                        height: "64px",
                        borderRadius: "50%",
                        overflow: "hidden",
                        border: !selectedSubcategory ? "2px solid #e47911" : "2px solid #ddd",
                      }}
                    >
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
                      <div
                        className="subcategory-circle mb-2"
                        style={{
                          width: "64px",
                          height: "64px",
                          borderRadius: "50%",
                          overflow: "hidden",
                          border: selectedSubcategory === s._id ? "2px solid #e47911" : "2px solid #ddd",
                        }}
                      >
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
          </div>
        )}

  
          {/* Products Column - Scrollable */}
          <div className={`col-12 ${!fromBanner && subcategories.length > 0 ? 'col-md-9' : ''}`}
            style={{
              height: "calc(100vh - 180px)",
              overflowY: "auto",
              padding: "0 15px"
            }}
          >
            {loading ? (
              <div className="col-12 text-center my-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : products?.length > 0 ? (
              <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 g-4">
                {products.map((p) => (
                  <div className="col" key={p._id}>
                    <div
                      className="card h-100 product-card shadow-sm"
                      style={{ cursor: "pointer", position: "relative" }}
                      onClick={() => navigate(`/product/${p.slug}`)}
                    >
                  
                      <div className="card-img-top" style={{ height: "200px", overflow: "hidden" }}>
                        <img
                          src={p.photos }
                          className="w-100 h-100 object-fit-contain p-3"
                          alt={p.name}
                        
                        />
                      </div>
                      <div className="card-body flex-column">
                        <h6 className="card-title mb-2" style={{ fontSize: "0.9rem" }}>
                          {p.name.length > 10 ? `${p.name.substring(0, 15)}...` : p.name}
                          <button
                        onClick={(e) => toggleWishlist(e, p._id)}
                        className="btn btn-link p-0"
                        style={{
                          position: "absolute",
                          // top: "10px",
                          right: "20px",
                          zIndex: 2,
                        }
                      }
                      >
                        <Heart
                          size={24}
                          fill={wishlistStatus[p._id] ? "#e47911" : "transparent"}
                          color={wishlistStatus[p._id] ? "#e47911" : "#6c757d"}
                          strokeWidth={1.5}
                        />
                      </button>
                        </h6>
                        
                        <div className="mt-auto">
                          <div className="align-items-center gap-2">
                            <span className="text-primary fw-bold" style={{ fontSize: "1.1rem" }}>
                              {p.perPiecePrice?.toLocaleString("en-IN", {
                                style: "currency",
                                currency: "INR",
                                maximumFractionDigits: 0,
                              })}
                            </span>
                            {p.mrp && (
                              <span className="text-muted text-decoration-line-through" style={{ fontSize: "0.9rem" }}>
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
                  </div>
                ))}
              </div>
            ) : (
              <div className="col-12 text-center my-5">
                <h5 className="text-muted">No products found in this category</h5>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CategoryProduct;





// import React, { useState, useEffect } from "react";
// import { useParams, useNavigate, useLocation } from "react-router-dom";
// import axios from "axios";
// import { toast } from "react-hot-toast";
// import Layout from "../components/Layout/Layout";
// import { Heart } from "lucide-react";
// import { useAuth } from "../context/auth";

// const CategoryProduct = () => {
//   const params = useParams();
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [auth] = useAuth();

//   const [products, setProducts] = useState([]);
//   const [category, setCategory] = useState({});
//   const [subcategories, setSubcategories] = useState([]);
//   const [selectedSubcategory, setSelectedSubcategory] = useState(
//     location.state?.selectedSubcategory || null
//   );
//   const [loading, setLoading] = useState(true);
//   const [fromBanner, setFromBanner] = useState(
//     location.state?.fromBanner || false
//   );
//   const [wishlistStatus, setWishlistStatus] = useState({});

//   useEffect(() => {
//     if (params?.slug) {
//       getCategoryAndSubcategories();
//     }
//   }, [params?.slug]);

//   useEffect(() => {
//     if (fromBanner && selectedSubcategory) {
//       fetchProductsBySubcategory(selectedSubcategory);
//     } else {
//       fetchProductsByCategoryOrSubcategory(selectedSubcategory);
//     }
//   }, [fromBanner, selectedSubcategory]);

//   const checkWishlistStatus = async (products) => {
//     if (!auth?.user?._id) return;

//     try {
//       const statuses = {};
//       await Promise.all(
//         products.map(async (product) => {
//           try {
//             const { data } = await axios.get(
//               `/api/v1/carts/users/${auth.user._id}/wishlist/check/${product._id}`
//             );
//             statuses[product._id] = data.exists;
//           } catch (error) {
//             console.error(
//               `Error checking wishlist status for product ${product._id}:`,
//               error
//             );
//             statuses[product._id] = false;
//           }
//         })
//       );
//       setWishlistStatus(statuses);
//     } catch (error) {
//       console.error("Error checking wishlist statuses:", error);
//     }
//   };

//   const getCategoryAndSubcategories = async () => {
//     try {
//       const { data } = await axios.get(
//         `/api/v1/product/product-category/${params.slug}`
//       );
//       setCategory(data?.category);
//       await getSubcategories(data?.category._id);
//     } catch (error) {
//       console.log(error);
//       toast.error("Error fetching category information");
//     }
//   };

//   const getSubcategories = async (categoryId) => {
//     try {
//       const { data } = await axios.get("/api/v1/subcategory/get-subcategories");

//       if (data?.success) {
//         const filteredSubcategories = data.subcategories.filter((subcat) => {
//           subcat.photos = subcat.photos || "https://via.placeholder.com/64";
//           return subcat.category === categoryId;
//         });
//         setSubcategories(filteredSubcategories);
//       } else {
//         setSubcategories([]);
//       }
//     } catch (error) {
//       console.error("Error fetching subcategories:", error);
//       toast.error("Error fetching subcategories");
//       setSubcategories([]);
//     }
//   };

//   const fetchProductsByCategoryOrSubcategory = async (subcategoryId) => {
//     try {
//       setLoading(true);
//       let url = `/api/v1/product/product-category/${params.slug}`;
//       if (subcategoryId) {
//         url = `/api/v1/product/product-subcategory/${subcategoryId}`;
//       }
//       const { data } = await axios.get(url);
//       setProducts(data?.products || []);
//       await checkWishlistStatus(data?.products || []);
//     } catch (error) {
//       console.log(error);
//       toast.error("Error fetching products");
//       setProducts([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const filterBySubcategory = (subcategoryId) => {
//     setSelectedSubcategory(subcategoryId);
//     setProducts([]);
//     fetchProductsByCategoryOrSubcategory(subcategoryId);
//   };

//   const toggleWishlist = async (e, productId) => {
//     e.stopPropagation();

//     if (!auth?.user) {
//       toast.error("Please log in to manage your wishlist");
//       return;
//     }

//     try {
//       if (wishlistStatus[productId]) {
//         await axios.delete(
//           `/api/v1/carts/users/${auth.user._id}/wishlist/${productId}`
//         );
//         setWishlistStatus((prev) => ({ ...prev, [productId]: false }));
//         toast.success("Removed from wishlist");
//       } else {
//         await axios.post(`/api/v1/carts/users/${auth.user._id}/wishlist`, {
//           productId: productId,
//         });
//         setWishlistStatus((prev) => ({ ...prev, [productId]: true }));
//         toast.success("Added to wishlist");
//       }
//     } catch (error) {
//       console.error("Error toggling wishlist:", error);
//       toast.error("Error updating wishlist");
//     }
//   };

//   const fetchProductsBySubcategory = async (subcategoryId) => {
//     try {
//       setLoading(true);
//       const { data } = await axios.get(
//         `/api/v1/product/product-subcategory/${subcategoryId}`
//       );
//       setProducts(data?.products || []);
//       await checkWishlistStatus(data?.products || []);
//     } catch (error) {
//       console.log(error);
//       toast.error("Error fetching products");
//       setProducts([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <Layout>
//       <div className="container mt-3 category">
//         <h4 className="text-center mb-4" style={{ paddingTop: "10rem" }}>
//           {category?.name}
//         </h4>
  
//         <div className="row">
//           {/* Subcategories Column - Fixed Vertical */}
//           {!fromBanner && subcategories.length > 0 && (
//             <div className="col-12 col-md-3 col-mb-4">
//               <div className="sticky-top" style={{ 
//                 top: "10px", 
//                 // height: "calc(100vh - 150px)",
//                 overflowY: "auto",
//                 zIndex: 1
//               }}>
//                 <div className="flex-md-column flex-md-column pb-3" style={{ 
//                   gap: "1.5rem",
//                   overflowX: "auto",
//                   overflowY: "hidden"
//                 }}>
               
//                   <div
//                     className={`flex-shrink-0 ${!selectedSubcategory ? "active-subcategory" : ""}`}
//                     onClick={() => {
//                       setSelectedSubcategory(null);
//                       fetchProductsByCategoryOrSubcategory(null);
//                     }}
//                     style={{ cursor: "pointer", minWidth: "80px" }}
//                   >
//                     <div className="flex-column align-items-center">
//                       <div
//                         className="subcategory-circle mb-2"
//                         style={{
//                           width: "64px",
//                           height: "64px",
//                           borderRadius: "50%",
//                           overflow: "hidden",
//                           border: !selectedSubcategory ? "2px solid #e47911" : "2px solid #ddd",
//                         }}
//                       >
//                         <img
//                           src="https://via.placeholder.com/64"
//                           alt="All"
//                           className="w-100 h-100 object-fit-cover"
//                         />
//                       </div>
//                       <span className="text-center small text-muted">All</span>
//                     </div>
//                   </div>
  
//                   {subcategories.map((s) => (
//                     <div
//                       key={s._id}
//                       className={`flex-shrink-0 ${selectedSubcategory === s._id ? "active-subcategory" : ""}`}
//                       onClick={() => filterBySubcategory(s._id)}
//                       style={{ cursor: "pointer", minWidth: "80px" }}
//                     >
//                       <div className="flex-column align-items-center">
//                         <div
//                           className="subcategory-circle mb-2"
//                           style={{
//                             width: "64px",
//                             height: "64px",
//                             borderRadius: "50%",
//                             overflow: "hidden",
//                             border: selectedSubcategory === s._id ? "2px solid #e47911" : "2px solid #ddd",
//                           }}
//                         >
//                           <img
//                             src={s.photos}
//                             alt={s.name}
//                             className="w-100 h-100 object-fit-cover"
//                             onError={(e) => {
//                               e.target.src = "https://via.placeholder.com/64";
//                             }}
//                           />
//                         </div>
//                         <span className="text-center small text-muted">{s.name}</span>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           )}
  
//           {/* Products Column - Scrollable */}
//           <div className={`col-12 ${!fromBanner && subcategories.length > 0 ? 'col-md-9' : ''}`}
//             style={{
//               height: "calc(100vh - 180px)",
//               overflowY: "auto",
//               padding: "0 15px"
//             }}
//           >
//             {loading ? (
//               <div className="col-12 text-center my-5">
//                 <div className="spinner-border text-primary" role="status">
//                   <span className="visually-hidden">Loading...</span>
//                 </div>
//               </div>
//             ) : products?.length > 0 ? (
//               <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 g-4">
//                 {products.map((p) => (
//                   <div className="col" key={p._id}>
//                     <div
//                       className="card h-100 product-card shadow-sm"
//                       style={{ cursor: "pointer", position: "relative" }}
//                       onClick={() => navigate(`/product/${p.slug}`)}
//                     >
//                       <button
//                         onClick={(e) => toggleWishlist(e, p._id)}
//                         className="btn btn-link p-0"
//                         style={{
//                           position: "absolute",
//                           top: "10px",
//                           right: "10px",
//                           zIndex: 2,
//                         }}
//                       >
//                         <Heart
//                           size={24}
//                           fill={wishlistStatus[p._id] ? "#e47911" : "transparent"}
//                           color={wishlistStatus[p._id] ? "#e47911" : "#6c757d"}
//                           strokeWidth={1.5}
//                         />
//                       </button>
//                       <div className="card-img-top" style={{ height: "200px", overflow: "hidden" }}>
//                         <img
//                           src={p.photos || "https://via.placeholder.com/300"}
//                           className="w-100 h-100 object-fit-contain p-3"
//                           alt={p.name}
//                           onError={(e) => {
//                             e.target.src = "https://via.placeholder.com/300";
//                           }}
//                         />
//                       </div>
//                       <div className="card-body d-flex flex-column">
//                         <h6 className="card-title mb-2" style={{ fontSize: "0.9rem" }}>
//                           {p.name.length > 35 ? `${p.name.substring(0, 35)}...` : p.name}
//                         </h6>
//                         <div className="mt-auto">
//                           <div className="d-flex align-items-center gap-2">
//                             <span className="text-primary fw-bold" style={{ fontSize: "1.1rem" }}>
//                               {p.perPiecePrice?.toLocaleString("en-IN", {
//                                 style: "currency",
//                                 currency: "INR",
//                                 maximumFractionDigits: 0,
//                               })}
//                             </span>
//                             {p.mrp && (
//                               <span className="text-muted text-decoration-line-through" style={{ fontSize: "0.9rem" }}>
//                                 {p.mrp.toLocaleString("en-IN", {
//                                   style: "currency",
//                                   currency: "INR",
//                                   maximumFractionDigits: 0,
//                                 })}
//                               </span>
//                             )}
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <div className="col-12 text-center my-5">
//                 <h5 className="text-muted">No products found in this category</h5>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </Layout>
//   );
// };

// export default CategoryProduct;
