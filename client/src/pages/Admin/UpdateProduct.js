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
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
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
  const [bulkProducts, setBulkProducts] = useState([
    { minimum: "", maximum: "", discount_mrp: "", selling_price_set: "" },
  ]);
  const [sku, setSku] = useState("");
  const [fk_tags, setFkTags] = useState("");
  const [totalsetPrice, setTotalsetPrice] = useState("");


// Missing Brand Name section
const [brands, setBrands] = useState([]);
const [brand, setBrand] = useState("");

const getAllBrands = async () => {
  try {
    const { data } = await axios.get("/api/v1/brand/get-brands");
    if (data?.success) {
      setBrands(data?.brands);
    }
  } catch (error) {
    console.error("Error fetching brands:", error);
    toast.error("Something went wrong in getting brands");
  }
};

useEffect(() => {
  getAllBrands();
}, []);

const handleBrandChange = (value) => {
  setBrand(value);
};


  // Get single product
  const getSingleProduct = async () => {
    try {
      const { data } = await axios.get(`/api/v1/product/get-product/${params.slug}`);
      setName(data.product.name);
      setId(data.product._id);
      setDescription(data.product.description);
      setPrice(data.product.price);
      setQuantity(data.product.quantity);
      setShipping(data.product.shipping);
      setCategory(data.product.category._id);
      setHsn(data.product.hsn);
      setUnit(data.product.unit);
      setUnitSet(data.product.unitSet);
      setPurchaseRate(data.product.purchaseRate);
      setMrp(data.product.mrp);
      setPerPiecePrice(data.product.perPiecePrice);
      setWeight(data.product.weight);
      setStock(data.product.stock);
      setGst(data.product.gst);
      setAdditionalUnit(data.product.additionalUnit);
      // Set bulk products data
      setSku(data.product.sku || "");
      setFkTags(data.product.fk_tags ? data.product.fk_tags.join(", ") : "");
      setBulkProducts(data.product.bulkProducts || []);
    } catch (error) {
      console.log(error);
      toast.error("Error fetching product data");
    }
  };
  useEffect(() => {
    getSingleProduct();
    //eslint-disable-next-line
  }, []);

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

  useEffect(() => {
    getAllCategory();
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
      const setPrice = parseFloat(price); // Make sure 'price' state variable exists
      const netWeightValue = parseFloat(unitSet); // Make sure 'unitSet' state variable exists
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
      productData.append("name", name);
      productData.append("description", description);
      productData.append("price", price);
      productData.append("sku", sku);
      productData.append("quantity", quantity);
      productData.append("category", category);
      productData.append("shipping", shipping);
      productData.append("hsn", hsn);
      productData.append("unit", unit);
      productData.append("unitSet", unitSet);
      productData.append("purchaseRate", purchaseRate);
      productData.append("mrp", mrp);
      productData.append("perPiecePrice", perPiecePrice);
      productData.append("weight", weight);
      productData.append("stock", stock);
      productData.append("gst", gst);
      productData.append("additionalUnit", additionalUnit);
      const fkTagsArray = fk_tags.split(',').map(tag => tag.trim()).filter(tag => tag !== "");
      productData.append("fk_tags", JSON.stringify(fkTagsArray));
      
      // Convert bulkProducts to a JSON string
      bulkProducts.forEach((product, index) => {
        Object.keys(product).forEach(key => {
          productData.append(`bulkProducts[${index}][${key}]`, product[key]);
        });
      });
  
      
      if (photo) {
        productData.append("photo", photo);
      }
  
      const { data } = await axios.put(
        `/api/v1/product/update-product/${id}`,
        productData
      );
  
      if (data?.success) {
        toast.success("Product Updated Successfully");
        // navigate("/dashboard/adminUser/products");
      } else {
        toast.error(data?.message);
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    }
  };

  const [subcategories, setSubcategories] = useState([]);
const [subcategory, setSubcategory] = useState("");

const getSubcategories = async () => {
  try {
    const { data } = await axios.get("/api/v1/subcategory/get-subcategories");
    if (data?.success) {
      setSubcategories(data?.subcategories || []);
    } else {
      setSubcategories([]);
    }
  } catch (error) {
    console.log(error);
    toast.error("Something went wrong in getting subcategories");
    setSubcategories([]);
  }
};

useEffect(() => {
  getSubcategories();
}, []);

const handleSubcategoryChange = (value) => {
  setSubcategory(value);
};
  // Delete product
  const handleDelete = async () => {
    try {
      let answer = window.prompt("Are you sure you want to delete this product?");
      if (!answer) return;
      const { data } = await axios.delete(`/api/v1/product/delete-product/${id}`);
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

              <div className="mb-3">
  <label htmlFor="brandSelect" className="form-label">
    Brand
  </label>
  <Select
    id="brandSelect"
    bordered={false}
    placeholder="Select a brand"
    size="large"
    showSearch
    className="form-select mb-3"
    onChange={handleBrandChange}
    value={brand}
  >
    {brands.map((b) => (
      <Option key={b._id} value={b._id}>
        {b.name}
      </Option>
    ))}
  </Select>
</div>
<div className="mb-3">
  <label htmlFor="subcategorySelect" className="form-label">
    Subcategory
  </label>
  <Select
    id="subcategorySelect"
    bordered={false}
    placeholder="Select a subcategory"
    size="large"
    showSearch
    className="form-select mb-3"
    onChange={handleSubcategoryChange}
    value={subcategory}
  >
    {subcategories.map((sc) => (
      <Option key={sc._id} value={sc._id}>
        {sc.name}
      </Option>
    ))}
  </Select>
</div>

              <h4>Product Photo</h4>
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

              <h4>Product Name</h4>
              <div className="mb-3">
                <input
                  type="text"
                  value={name}
                  placeholder="Write a name"
                  className="form-control"
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="row mb-3">
      <div className="col-md-4">
        <h4>SKU</h4>
        <input
          type="text"
          value={sku}
          className="form-control"
          onChange={(e) => setSku(e.target.value)}
          placeholder="Enter SKU"
        />
      </div>
    </div>

    <div className="mb-3">
      <h4>FK Tags</h4>
      <input
        type="text"
        className="form-control"
        value={fk_tags}
        onChange={(e) => setFkTags(e.target.value)}
        placeholder="Enter FK tags separated by commas"
      />
      <small className="text-muted">
        Enter FK tags separated by commas.
      </small>
    </div>

   
              <h4>Description</h4>
              <div className="mb-3">
                <textarea
                  type="text"
                  value={description}
                  placeholder="Write a description"
                  className="form-control"
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <h4>Price</h4>
              <div className="mb-3">
                <input
                  type="number"
                  value={price}
                  placeholder="Write a Price"
                  className="form-control"
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>

              <h4>Quantity</h4>
              <div className="mb-3">
                <input
                  type="number"
                  value={quantity}
                  placeholder="Write a quantity"
                  className="form-control"
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
{/* 
              <h4>Shipping</h4>
              <div className="mb-3">
                <Select
                  bordered={false}
                  placeholder="Select Shipping"
                  size="large"
                  showSearch
                  className="form-select mb-3"
                  onChange={(value) => setShipping(value)}
                  value={shipping ? "1" : "0"}
                >
                  <Option value="0">No</Option>
                  <Option value="1">Yes</Option>
                </Select>
              </div> */}

              <h4>HSN Code</h4>
              <div className="mb-3">
                <input
                  type="text"
                  value={hsn}
                  placeholder="HSN Code"
                  className="form-control"
                  onChange={(e) => setHsn(e.target.value)}
                />
              </div>

              <h4>Unit</h4>
              <div className="mb-3">
                <input
                  type="text"
                  value={unit}
                  placeholder="Unit"
                  className="form-control"
                  onChange={(e) => setUnit(e.target.value)}
                />
              </div>

              <h4>Net Weight</h4>
              <div className="mb-3">
                <input
                  type="text"
                  value={unitSet}
                  placeholder="unitDet"
                  className="form-control"
                  onChange={(e) => setUnitSet(e.target.value)}
                />
              </div>

              <h4>Purchase Rate</h4>
              <div className="mb-3">
                <input
                  type="number"
                  value={purchaseRate}
                  placeholder="Purchase Rate"
                  className="form-control"
                  onChange={(e) => setPurchaseRate(e.target.value)}
                />
              </div>

              <h4>MRP</h4>
              <div className="mb-3">
                <input
                  type="number"
                  value={mrp}
                  placeholder="MRP"
                  className="form-control"
                  onChange={(e) => setMrp(e.target.value)}
                />
              </div>

              <h4>Per Piece Price</h4>
              <div className="mb-3">
                <input
                  type="number"
                  value={perPiecePrice}
                  placeholder="Per Piece Price"
                  className="form-control"
                  onChange={(e) => setPerPiecePrice(e.target.value)}
                />
              </div>

              <h4>Weight</h4>
              <div className="mb-3">
                <input
                  type="number"
                  value={weight}
                  placeholder="Weight"
                  className="form-control"
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>

              <h4>Stock</h4>
              <div className="mb-3">
                <input
                  type="number"
                  value={stock}
                  placeholder="Stock"
                  className="form-control"
                  onChange={(e) => setStock(e.target.value)}
                />
              </div>

              <h4>GST</h4>
              <div className="mb-3">
                <input
                  type="number"
                  value={gst}
                  placeholder="GST"
                  className="form-control"
                  onChange={(e) => setGst(e.target.value)}
                />
              </div>

              <h4>Additional Unit</h4>
              <div className="mb-3">
                <input
                  type="text"
                  value={additionalUnit}
                  placeholder="Additional Unit"
                  className="form-control"
                  onChange={(e) => setAdditionalUnit(e.target.value)}
                />
              </div>
    
              <h4>Bulk Products</h4>
    <div className="mb-3">
      {bulkProducts.map((product, index) => (
        <div key={index} className="row mb-2">
          <div className="col">
            <input
              type="number"
              className="form-control"
              placeholder="Minimum"
              name="minimum"
              value={product?.minimum || ""}
              onChange={(e) => handleBulkProductChange(index, e)}
            />
          </div>
          <div className="col">
            <input
              type="number"
              className="form-control"
              placeholder="Maximum"
              name="maximum"
              value={product?.maximum || ""}
              onChange={(e) => handleBulkProductChange(index, e)}
            />
          </div>
          <div className="col">
            <input
              type="number"
              className="form-control"
              placeholder="Discount MRP"
              name="discount_mrp"
              value={product?.discount_mrp || ""}
              onChange={(e) => handleBulkProductChange(index, e)}
            />
          </div>
          <div className="col">
            <input
              type="number"
              className="form-control"
              placeholder="Selling Price Set"
              name="selling_price_set"
              value={product?.selling_price_set || ""}
              onChange={(e) => handleBulkProductChange(index, e)}
            />
          </div>
          <div className="col">
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
        className="btn btn-success"
        onClick={handleAddBulkProduct}
      >
        Add Bulk Product
      </button>
    </div>
              <div className="mb-3">
                <button className="btn btn-primary" onClick={handleUpdate}>
                  UPDATE PRODUCT
                </button>
              </div>
              <div className="mb-3">
                <button className="btn btn-danger" onClick={handleDelete}>
                  DELETE PRODUCT
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