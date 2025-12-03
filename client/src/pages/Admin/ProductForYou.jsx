import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Button,
  Form,
  Table,
  Spinner,
  Alert,
  Image,
  Container,
  Row,
  Col,
} from "react-bootstrap";
import { Trash } from "lucide-react";
import { useAuth } from "../../context/auth";
import { toast } from "react-toastify";
import Column from "antd/es/table/Column";
import AdminMenu from "../../components/Layout/AdminMenu";
import Layout from "../../components/Layout/Layout";
const ProductForYou = () => {
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  // Form/filter state
  const [formData, setFormData] = useState({
    categoryId: "",
    subcategoryId: "",
    productId: "",
  });
  // Left panel: products available to add
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  // Right panel: products already in "Product For You" list
  const [selectedForYouIds, setSelectedForYouIds] = useState([]);
  const [auth] = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBulkAdding, setIsBulkAdding] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  useEffect(() => {
    fetchBanners();
    fetchCategories();
    fetchSubcategories();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get("/api/v1/productForYou/admin-get-products", {
  headers: {
    'Authorization': `Bearer ${auth.user.token}`,
    'Content-Type': 'application/json'
  }
});
      setBanners(response.data.banners || []);
    } catch (error) {
      console.error("Error fetching banners:", error);
      setError("Failed to fetch banners");
      setBanners([]);
    } finally {
      setLoading(false);
    }
  };

  // Toggle selection for left-panel product list
  const toggleProductSelection = (productId) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  // Right panel selection helpers
  const toggleForYouSelection = (id) => {
    setSelectedForYouIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllForYou = (visibleIds) => {
    // If all visible are already selected, clear them; otherwise select all visible
    const allSelected = visibleIds.every((id) => selectedForYouIds.includes(id));
    if (allSelected) {
      setSelectedForYouIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      const merged = new Set([...selectedForYouIds, ...visibleIds]);
      setSelectedForYouIds(Array.from(merged));
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedForYouIds.length) return;

    try {
      setIsBulkDeleting(true);
      await axios.post(
        "/api/v1/productForYou/bulk-delete",
        { ids: selectedForYouIds },
        {
          headers: {
            Authorization: `Bearer ${auth.user.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setBanners((prev) =>
        prev.filter((banner) => !selectedForYouIds.includes(banner._id))
      );
      setSelectedForYouIds([]);
    } catch (error) {
      console.error("Error bulk deleting products for you:", error);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await axios.get("/api/v1/category/get-category", {
  headers: {
    'Authorization': `Bearer ${auth.user.token}`,
    'Content-Type': 'application/json'
  }
});
      if (data?.success) {
        setCategories(data.category || []);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      ////toast.error("Something went wrong in getting categories");
      setCategories([]);
    }
  };

  const fetchSubcategories = async () => {
    try {
      const { data } = await axios.get("/api/v1/subcategory/get-subcategories", {
  headers: {
    'Authorization': `Bearer ${auth.user.token}`,
    'Content-Type': 'application/json'
  }
});
      if (data?.success) {
        setSubcategories(data.subcategories || []);
      } else {
        setSubcategories([]);
      }
    } catch (error) {
      console.log(error);
      ////toast.error("Something went wrong in getting subcategories");
      setSubcategories([]);
    }
  };

  const fetchProductsByCategoryOrSubcategory = async (
    categoryId,
    subcategoryId,
    limit = 1000 // Fetch up to 1000 products by default
  ) => {
    try {
      setLoading(true);
      let url = `/api/v1/product/product-category/${categoryId}?limit=${limit}`;
      if (subcategoryId) {
        url = `/api/v1/product/product-subcategory/${subcategoryId}?limit=${limit}`;
      }
      const { data } = await axios.get(url);
      setFilteredProducts(data?.products || []);
    } catch (error) {
      console.log(error);
      ////toast.error("Error fetching products");
      setFilteredProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === "categoryId") {
      const filteredSubcategories = subcategories.filter(
        (subcat) => subcat.category === value
      );
      setSubcategories(filteredSubcategories);
      setFormData((prev) => ({ ...prev, subcategoryId: "", productId: "" }));
      setSelectedProductIds([]);
      await fetchProductsByCategoryOrSubcategory(value, null);
    } else if (name === "subcategoryId") {
      await fetchProductsByCategoryOrSubcategory(formData.categoryId, value);
      setFormData((prev) => ({ ...prev, productId: "" }));
      setSelectedProductIds([]);
    }
  };

  // Add a single product to "Product For You" using existing endpoint
  const addSingleProductForYou = async (productId) => {
    if (!formData.categoryId || !formData.subcategoryId || !productId) return;

    const data = new FormData();
    data.append("categoryId", formData.categoryId);
    data.append("subcategoryId", formData.subcategoryId);
    data.append("productId", productId);

    try {
      await axios.post("/api/v1/productForYou/createProductForYou", data, {
        headers: {
          Authorization: `Bearer ${auth.user.token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      await fetchBanners();
    } catch (error) {
      console.error("Error adding product for you:", error);
    }
  };

  // Bulk add selected products via new bulk-create API
  const handleBulkAdd = async (e) => {
    if (e) e.preventDefault();

    if (
      !formData.categoryId ||
      !formData.subcategoryId ||
      !selectedProductIds.length
    ) {
      return;
    }

    try {
      setIsBulkAdding(true);
      await axios.post(
        "/api/v1/productForYou/bulk-create",
        {
          categoryId: formData.categoryId,
          subcategoryId: formData.subcategoryId,
          productIds: selectedProductIds,
        },
        {
          headers: {
            Authorization: `Bearer ${auth.user.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      await fetchBanners();
      setSelectedProductIds([]);
    } catch (error) {
      console.error("Error bulk adding products for you:", error);
    } finally {
      setIsBulkAdding(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/v1/productForYou/delete-product/${id}`, {
  headers: {
    'Authorization': `Bearer ${auth.user.token}`,
    'Content-Type': 'application/json'
  }
});
      
      // Remove the deleted banner from the state
      setBanners(prevBanners => prevBanners.filter(banner => banner._id !== id));
      
      //toast.success("Banner deleted successfully");
    } catch (error) {
      console.error("Error deleting banner:", error);
      ////toast.error("Failed to delete banner");
    }
  };

  const resetForm = () => {
    setFormData({ categoryId: "", subcategoryId: "", productId: "" });
    setFilteredProducts([]);
    setSelectedProductIds([]);
  };

  return (
    <Layout title={"All Orders Data"}>
      <AdminMenu />
      <div className="container-fluid dashboard">
        <div className="row">
          <div className="col-md-12">
          <Container fluid className="site-width">
            <Row>
              <Col xs={12} className="align-self-center">
                <div className="sub-header mt-3 py-3 align-self-center d-sm-flex w-100 rounded">
                  <div className="w-sm-100 mr-auto">
                    <h4 className="mb-0">Product For You List</h4>
                  </div>
                  <ol className="breadcrumb bg-transparent align-self-center m-0 p-0">
                    <li className="breadcrumb-item">Master</li>
                    <li className="breadcrumb-item">Product For You</li>
                    <li className="breadcrumb-item active">
                      <a href="#">Product For You table</a>
                    </li>
                  </ol>
                </div>
              </Col>
            </Row>

            <Row>
              {/* Left: filters and product source list */}
              <Col xs={12} md={4} className="mt-3">
                <Form onSubmit={handleBulkAdd}>
                  <Form.Group>
                    <Form.Label>Category Name</Form.Label>
                    <Form.Control
                      as="select"
                      name="categoryId"
                      value={formData.categoryId}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </Form.Control>
                  </Form.Group>
                  <Form.Group>
                    <Form.Label>Subcategory Name</Form.Label>
                    <Form.Control
                      as="select"
                      name="subcategoryId"
                      value={formData.subcategoryId}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select a subcategory</option>
                      {subcategories.map((subcategory) => (
                        <option key={subcategory._id} value={subcategory._id}>
                          {subcategory.name}
                        </option>
                      ))}
                    </Form.Control>
                  </Form.Group>
                  <Form.Group className="mt-3">
                    <Form.Label>Available Products</Form.Label>
                    <div
                      style={{
                        maxHeight: "320px",
                        overflowY: "auto",
                        border: "1px solid #e5e7eb",
                        borderRadius: "4px",
                        padding: "8px",
                        backgroundColor: "#ffffff",
                      }}
                    >
                      {loading && !filteredProducts.length ? (
                        <div className="text-center py-3">
                          <Spinner animation="border" size="sm" />
                        </div>
                      ) : filteredProducts.length === 0 ? (
                        <div className="text-muted small">
                          Select a category and subcategory to see products.
                        </div>
                      ) : (
                        filteredProducts.map((product) => {
                          const isSelected = selectedProductIds.includes(product._id);
                          return (
                            <div
                              key={product._id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: "8px",
                                padding: "6px 4px",
                                borderBottom: "1px solid #f1f5f9",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  minWidth: 0,
                                  flex: 1,
                                }}
                              >
                                {product.multipleimages &&
                                product.multipleimages.length > 0 ? (
                                  <Image
                                    src={product.multipleimages[0]}
                                    alt={product.name}
                                    rounded
                                    style={{
                                      width: 32,
                                      height: 32,
                                      objectFit: "cover",
                                      flexShrink: 0,
                                    }}
                                  />
                                ) : null}
                                <div
                                  style={{
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  <div style={{ fontSize: "0.9rem", fontWeight: 500 }}>
                                    {product.name}
                                  </div>
                                  {product.perPiecePrice && (
                                    <div
                                      style={{
                                        fontSize: "0.8rem",
                                        color: "#6b7280",
                                      }}
                                    >
                                      ₹{product.perPiecePrice}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                }}
                              >
                                <Form.Check
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleProductSelection(product._id)}
                                />
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => addSingleProductForYou(product._id)}
                                >
                                  Choose
                                </Button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </Form.Group>
                  <Button
                    variant="primary"
                    type="submit"
                    className="mt-3"
                    disabled={isBulkAdding || !selectedProductIds.length}
                  >
                    {isBulkAdding ? "Adding..." : "Add Selected Products"}
                  </Button>
                </Form>
              </Col>
              {/* Right: current "Product For You" list */}
              <Col xs={12} md={8} className="mt-3">
                <div className="card">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                      <h5 className="mb-0">Current Product For You List</h5>
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <span className="text-muted small">
                          Selected: {selectedForYouIds.length}
                        </span>
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={isBulkDeleting || !selectedForYouIds.length}
                          onClick={handleBulkDelete}
                        >
                          {isBulkDeleting
                            ? "Deleting..."
                            : "Delete Selected"}
                        </Button>
                      </div>
                    </div>
                    {loading ? (
                      <div className="text-center">
                        <Spinner animation="border" role="status">
                          <span className="sr-only">Loading...</span>
                        </Spinner>
                      </div>
                    ) : error ? (
                      <Alert variant="danger">{error}</Alert>
                    ) : banners.length > 0 ? (
                      <div className="table-responsive">
                        <Table striped bordered hover>
                          <thead>
                            <tr>
                              <th>
                                <Form.Check
                                  type="checkbox"
                                  onChange={() =>
                                    toggleSelectAllForYou(
                                      banners
                                        .filter(
                                          (banner) =>
                                            !formData.subcategoryId ||
                                            banner.subcategoryId?._id ===
                                              formData.subcategoryId
                                        )
                                        .map((b) => b._id)
                                    )
                                  }
                                  checked={
                                    banners.length > 0 &&
                                    banners
                                      .filter(
                                        (banner) =>
                                          !formData.subcategoryId ||
                                          banner.subcategoryId?._id ===
                                            formData.subcategoryId
                                      )
                                      .every((b) =>
                                        selectedForYouIds.includes(b._id)
                                      )
                                  }
                                />
                              </th>
                              <th>Sr.No</th>
                              <th>Image</th>
                              <th>Category</th>
                              <th>Subcategory</th>
                              <th>Product</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {banners
                              .filter(
                                (banner) =>
                                  !formData.subcategoryId ||
                                  banner.subcategoryId?._id === formData.subcategoryId
                              )
                              .map((banner, index) => (
                                <tr key={banner._id}>
                                  <td>
                                    <Form.Check
                                      type="checkbox"
                                      checked={selectedForYouIds.includes(
                                        banner._id
                                      )}
                                      onChange={() =>
                                        toggleForYouSelection(banner._id)
                                      }
                                    />
                                  </td>
                                  <td>{index + 1}</td>
                                  <td>
                                    {banner.productId?._id ? (
                                      <Image
  src={
    banner.productId.photoUrl ||
    (banner.productId.multipleimages && banner.productId.multipleimages.length > 0
      ? banner.productId.multipleimages[0]
      : (typeof banner.productId.photos === 'string' ? banner.productId.photos : null)
    )
  }
  alt={banner.productId?.name}
  thumbnail
  style={{
    width: "50px",
    height: "50px",
    objectFit: "cover",
  }}
  onError={(e) => {
    e.target.onerror = null;
    e.target.src = '/placeholder-image.png';
  }}
/>
                                    ) : (
                                      "No image"
                                    )}
                                  </td>
                                  <td>{banner.categoryId?.name || 'N/A'}</td>
                                  <td>{banner.subcategoryId?.name || 'N/A'}</td>
                                  <td>{banner.productId?.name || 'N/A'}</td>
                                  <td>
                                    <Button
                                      variant="danger"
                                      size="sm"
                                      onClick={() => handleDelete(banner._id)}
                                    >
                                      <Trash size={18} />
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </Table>
                      </div>
                    ) : (
                      <Alert variant="info">No products for you found.</Alert>
                    )}
                  </div>
                </div>
              </Col>
            </Row>
          </Container>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductForYou;