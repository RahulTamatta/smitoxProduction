import React, { useState, useEffect } from "react";
import Layout from "./../../components/Layout/Layout";
import AdminMenu from "./../../components/Layout/AdminMenu";
import toast from "react-hot-toast";
import axios from "axios";
import { Select } from "antd";
import { useNavigate, useParams } from "react-router-dom";
const { Option } = Select;

const UpdateProduct = () => {
  const navigate = useNavigate();
  const params = useParams();
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  
  // Product state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [brand, setBrand] = useState("");
  const [quantity, setQuantity] = useState("");
  const [shipping, setShipping] = useState("");
  const [photo, setPhoto] = useState("");
  const [id, setId] = useState("");
  const [hsn, setHsn] = useState("");
  const [unit, setUnit] = useState("");
  const [unitSet, setUnitSet] = useState("");
  const [purchaseRate, setPurchaseRate] = useState("");
  const [mrp, setMrp] = useState("");
  const [perPiecePrice, setPerPiecePrice] = useState("");
  const [weight, setWeight] = useState("");
  const [stock, setStock] = useState("");
  const [gst, setGst] = useState("");
  const [additionalUnit, setAdditionalUnit] = useState("");
  const [sku, setSku] = useState("");
  const [fk_tags, setFkTags] = useState("");
  const [bulkProducts, setBulkProducts] = useState([
    { minimum: "", maximum: "", discount_mrp: "", selling_price_set: "" },
  ]);

  // Get single product
  const getSingleProduct = async () => {
    try {
      const { data } = await axios.get(`/api/v1/product/get-product/${params.slug}`);
      if (data?.success) {
        const product = data.product;
        setName(product.name || "");
        setId(product._id || "");
        setDescription(product.description || "");
        setPrice(product.price || "");
        setQuantity(product.quantity || "");
        setShipping(product.shipping || "");
        setCategory(product.category?._id || "");
        setSubcategory(product.subcategory?._id || "");
        setBrand(product.brand?._id || "");
        setHsn(product.hsn || "");
        setUnit(product.unit || "");
        setUnitSet(product.unitSet || "");
        setPurchaseRate(product.purchaseRate || "");
        setMrp(product.mrp || "");
        setPerPiecePrice(product.perPiecePrice || "");
        setWeight(product.weight || "");
        setStock(product.stock || "");
        setGst(product.gst || "");
        setAdditionalUnit(product.additionalUnit || "");
        setSku(product.sku || "");
        setFkTags(product.fk_tags ? product.fk_tags.join(", ") : "");
        setBulkProducts(product.bulkProducts || [{ minimum: "", maximum: "", discount_mrp: "", selling_price_set: "" }]);
      }
    } catch (error) {
      console.log(error);
      toast.error("Error fetching product data");
    }
  };

  // Get all categories
  const getAllCategory = async () => {
    try {
      const { data } = await axios.get("/api/v1/category/get-category");
      if (data?.success) {
        setCategories(data?.category);
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong in getting categories");
    }
  };

  // Get all brands
  const getAllBrands = async () => {
    try {
      const { data } = await axios.get("/api/v1/brand/get-brands");
      if (data?.success) {
        setBrands(data?.brands);
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong in getting brands");
    }
  };

  // Get all subcategories
  const getSubcategories = async () => {
    try {
      const { data } = await axios.get("/api/v1/subcategory/get-subcategories");
      if (data?.success) {
        setSubcategories(data?.subcategories || []);
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong in getting subcategories");
    }
  };

  useEffect(() => {
    getSingleProduct();
    getAllCategory();
    getAllBrands();
    getSubcategories();
  }, []);

  // Handle bulk product changes
  const handleBulkProductChange = (index, e) => {
    const { name, value } = e.target;
    const updatedBulkProducts = [...bulkProducts];
    updatedBulkProducts[index] = {
      ...updatedBulkProducts[index],
      [name]: value
    };
  
    if (name === "discount_mrp") {
      const discountPercentage = parseFloat(value) / 100;
      const setPrice = parseFloat(price);
      const netWeightValue = parseFloat(unitSet);
      const discountedPrice = setPrice * (1 - discountPercentage);
      updatedBulkProducts[index].selling_price_set = (
        discountedPrice * netWeightValue
      ).toFixed(2);
    }
  
    setBulkProducts(updatedBulkProducts);
  };

  // Add bulk product row
  const handleAddBulkProduct = () => {
    setBulkProducts([...bulkProducts, { minimum: "", maximum: "", discount_mrp: "", selling_price_set: "" }]);
  };

  // Remove bulk product row
  const handleRemoveBulkProduct = (index) => {
    const updatedBulkProducts = bulkProducts.filter((_, i) => i !== index);
    setBulkProducts(updatedBulkProducts);
  };

  // Update product function
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const productData = new FormData();
      
      // Append all fields only if they have values or are being updated
      productData.append("name", name);
      productData.append("description", description);
      productData.append("price", price);
      productData.append("quantity", quantity);
      productData.append("category", category);
      productData.append("subcategory", subcategory);
      productData.append("brand", brand);
      productData.append("shipping", shipping);
      
      if (hsn !== undefined) productData.append("hsn", hsn);
      if (unit !== undefined) productData.append("unit", unit);
      if (unitSet !== undefined) productData.append("unitSet", unitSet);
      if (purchaseRate !== undefined) productData.append("purchaseRate", purchaseRate);
      if (mrp !== undefined) productData.append("mrp", mrp);
      if (perPiecePrice !== undefined) productData.append("perPiecePrice", perPiecePrice);
      if (weight !== undefined) productData.append("weight", weight);
      if (stock !== undefined) productData.append("stock", stock);
      if (gst !== undefined) productData.append("gst", gst);
      if (additionalUnit !== undefined) productData.append("additionalUnit", additionalUnit);
      if (sku !== undefined) productData.append("sku", sku);
      
      const fkTagsArray = fk_tags.split(',').map(tag => tag.trim()).filter(tag => tag !== "");
      productData.append("fk_tags", JSON.stringify(fkTagsArray));
      
      // Handle bulk products
      productData.append("bulkProducts", JSON.stringify(bulkProducts));
      
      if (photo) {
        productData.append("photo", photo);
      }
  
      const { data } = await axios.put(
        `/api/v1/product/update-product/${id}`,
        productData
      );
  
      if (data?.success) {
        toast.success("Product Updated Successfully");
        navigate("/dashboard/admin/products");
      } else {
        toast.error(data?.message);
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    }
  };

  // Delete product
  const handleDelete = async () => {
    try {
      let answer = window.prompt("Are you sure you want to delete this product?");
      if (!answer) return;
      await axios.delete(`/api/v1/product/delete-product/${id}`);
      toast.success("Product Deleted Successfully");
      navigate("/dashboard/admin/products");
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    }
  };

  return (
    <Layout title={"Dashboard - Update Product"}>
      <div className="container-fluid m-3 p-3">
        <div className="row">
          <div className="col-md-3">
            <AdminMenu />
          </div>
          <div className="col-md-9">
            <h1>Update Product</h1>
            <div className="m-1 w-75">
              <h4>Category</h4>
              <Select
                bordered={false}
                placeholder="Select a category"
                size="large"
                showSearch
                className="form-select mb-3"
                onChange={(value) => setCategory(value)}
                value={category}
              >
                {categories?.map((c) => (
                  <Option key={c._id} value={c._id}>
                    {c.name}
                  </Option>
                ))}
              </Select>

              <h4>Brand</h4>
              <Select
                bordered={false}
                placeholder="Select a brand"
                size="large"
                showSearch
                className="form-select mb-3"
                onChange={(value) => setBrand(value)}
                value={brand}
              >
                {brands?.map((b) => (
                  <Option key={b._id} value={b._id}>
                    {b.name}
                  </Option>
                ))}
              </Select>

              <h4>Subcategory</h4>
              <Select
                bordered={false}
                placeholder="Select a subcategory"
                size="large"
                showSearch
                className="form-select mb-3"
                onChange={(value) => setSubcategory(value)}
                value={subcategory}
              >
                {subcategories?.map((sc) => (
                  <Option key={sc._id} value={sc._id}>
                    {sc.name}
                  </Option>
                ))}
              </Select>

              {/* Rest of your form fields remain the same */}
              {/* ... Photo upload section ... */}
              <div className="mb-3">
                <label className="btn btn-outline-secondary col-md-12">
                  {photo ? photo.name : "Upload Photo"}
                  <input
                    type="file"
                    name="photo"
                    accept="image/*"
                    onChange={(e) => setPhoto(e.target.files[0])}
                    hidden
                  />
                </label>
              </div>

              <div className="mb-3">
                {photo ? (
                  <div className="text-center">
                    <img
                      src={URL.createObjectURL(photo)}
                      alt="product_photo"
                      height={"200px"}
                      className="img img-responsive"
                    />
                  </div>
                ) : (
                  <div className="text-center">
                    <img
                      src={`/api/v1/product/product-photo/${id}`}
                      alt="product_photo"
                      height={"200px"}
                      className="img img-responsive"
                    />
                  </div>
                )}
              </div>

              {/* Basic Info Fields */}
              <div className="mb-3">
                <h4>Product Name</h4>
                <input
                  type="text"
                  value={name}
                  placeholder="Write a name"
                  className="form-control"
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <h4>SKU</h4>
                <input
                  type="text"
                  value={sku}
                  placeholder="Enter SKU"
                  className="form-control"
                  onChange={(e) => setSku(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <h4>FK Tags</h4>
                <input
                  type="text"
                  value={fk_tags}
                  placeholder="Enter FK tags separated by commas"
                  className="form-control"
                  onChange={(e) => setFkTags(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <h4>Description</h4>
                <textarea
                  value={description}
                  placeholder="Write a description"
                  className="form-control"
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Pricing Fields */}
              <div className="mb-3">
                <h4>Price</h4>
                <input
                  type="number"
                  value={price}
                  placeholder="Write a Price"
                  className="form-control"
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <h4>Purchase Rate</h4>
                <input
                  type="number"
                  value={purchaseRate}
                  placeholder="Purchase Rate"
                  className="form-control"
                  onChange={(e) => setPurchaseRate(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <h4>MRP</h4>
                <input
                  type="number"
                  value={mrp}
                  placeholder="MRP"
                  className="form-control"
                  onChange={(e) => setMrp(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <h4>Per Piece Price</h4>
                <input
                  type="number"
                  value={perPiecePrice}
                  placeholder="Per Piece Price"
                  className="form-control"
                  onChange={(e) => setPerPiecePrice(e.target.value)}
                />
              </div>

              {/* Inventory Fields */}
              <div className="mb-3">
                <h4>Quantity</h4>
                <input
                  type="number"
                  value={quantity}
                  placeholder="Write a quantity"
                  className="form-control"
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <h4>Stock</h4>
                <input
                  type="number"
                  value={stock}
                  placeholder="Enter stock quantity"
                  className="form-control"
                  onChange={(e) => setStock(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <h4>GST (%)</h4>
                <input
                  type="number"
                  value={gst}
                  placeholder="Enter GST percentage"
                  className="form-control"
                  onChange={(e) => setGst(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <h4>Additional Unit</h4>
                <input
                  type="text"
                  value={additionalUnit}
                  placeholder="Enter additional unit"
                  className="form-control"
                  onChange={(e) => setAdditionalUnit(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <h4>Bulk Products</h4>
                {bulkProducts.map((product, index) => (
                  <div key={index} className="row mb-2">
                    <div className="col">
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Minimum"
                        name="minimum"
                        value={product.minimum}
                        onChange={(e) => handleBulkProductChange(index, e)}
                      />
                    </div>
                    <div className="col">
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Maximum"
                        name="maximum"
                        value={product.maximum}
                        onChange={(e) => handleBulkProductChange(index, e)}
                      />
                    </div>
                    <div className="col">
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Discount MRP %"
                        name="discount_mrp"
                        value={product.discount_mrp}
                        onChange={(e) => handleBulkProductChange(index, e)}
                      />
                    </div>
                    <div className="col">
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Selling Price Set"
                        name="selling_price_set"
                        value={product.selling_price_set}
                        disabled
                      />
                    </div>
                    <div className="col-auto">
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => handleRemoveBulkProduct(index)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-success mt-2"
                  onClick={handleAddBulkProduct}
                >
                  Add Bulk Product
                </button>
              </div>

              <div className="mb-3 d-flex gap-3">
                <button className="btn btn-primary" onClick={handleUpdate}>
                  Update Product
                </button>
                <button className="btn btn-danger" onClick={handleDelete}>
                  Delete Product
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default UpdateProduct;