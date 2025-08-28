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
import { useAuth } from "../../context/authContext";
import AdminPageTemplate from "../../features/admin/components/layout/AdminPageTemplate";
const ProductForYou = () => {
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [formData, setFormData] = useState({
    categoryId: "",
    subcategoryId: "",
    productId: "",
  });
  const [auth] = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBanners();
    fetchCategories();
    fetchSubcategories();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      await fetchProductsByCategoryOrSubcategory(value, null);
    } else if (name === "subcategoryId") {
      await fetchProductsByCategoryOrSubcategory(formData.categoryId, value);
      setFormData((prev) => ({ ...prev, productId: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    for (const key in formData) {
      data.append(key, formData[key]);
    }

    try {
<<<<<<< HEAD
      await axios.post("/api/v1/productForYou/createProductForYou", data, {
        headers: {
          'Authorization': `Bearer ${auth.user.token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
=======
      const response = await axios.post("/api/v1/productForYou/createProductForYou", data, {
  headers: {
    'Authorization': `Bearer ${auth.user.token}`,
    'Content-Type': 'application/json'
  }
});
>>>>>>> 4dfcbaf53792781327558b6f61c9b00ac93c8749
      //toast.success("Product added successfully");
      
      // Add the new banner to the existing banners
      setBanners(prevBanners => [...prevBanners, response.data.banner]);
      
      resetForm();
    } catch (error) {
      console.error("Error submitting banner:", error);
      ////toast.error("Failed to submit banner");
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
  };

  return (
    <AdminPageTemplate title="Product For You Management">
      <div className="row dashboard">
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
                      <span>Product For You table</span>
                    </li>
                  </ol>
                </div>
              </Col>
            </Row>

            <Row>
              <Col xs={12} md={4} className="mt-3">
                <Form onSubmit={handleSubmit}>
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
                  <Form.Group>
                    <Form.Label>Product</Form.Label>
                    <Form.Control
                      as="select"
                      name="productId"
                      value={formData.productId}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select a product</option>
                      {filteredProducts.map((product) => (
                        <option key={product._id} value={product._id}>
                          {product.name}
                        </option>
                      ))}
                    </Form.Control>
                  </Form.Group>
                  <Button variant="primary" type="submit">
                    Add Product For You
                  </Button>
                </Form>
              </Col>
              <Col xs={12} md={8} className="mt-3">
                <div className="card">
                  <div className="card-body">
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
    </AdminPageTemplate>
  );
};

export default ProductForYou;