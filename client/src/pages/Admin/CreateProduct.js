import React, { useState, useEffect } from "react";
import Layout from "./../../components/Layout/Layout";
import AdminMenu from "./../../components/Layout/AdminMenu";
import toast from "react-hot-toast";
import axios from "axios";
import { Select } from "antd";
import { useNavigate } from "react-router-dom";

const { Option } = Select;

const CreateProduct = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [brand, setBrand] = useState("");
  const [quantity, setQuantity] = useState("");
  const [shipping, setShipping] = useState(false);
  const [hsn, setHsn] = useState("");
  const [photo, setPhoto] = useState(null);
  const [images, setImages] = useState([]); // Added for multiple images
  const [bulkProducts, setBulkProducts] = useState([
    { minimum: "", maximum: "", discount_mrp: "", selling_price_set: "" },
  ]);
  const [youtubeUrl, setYoutubeUrl] = useState("");

  const [unit, setUnit] = useState("");
  const [unitSet, setUnitSet] = useState("");
  const [purchaseRate, setPurchaseRate] = useState("");
  const [mrp, setMrp] = useState("");
  const [perPiecePrice, setPerPiecePrice] = useState("");
  const [totalsetPrice, setTotalsetPrice] = useState(""); // Added to match controller
  const [weight, setWeight] = useState("");
  const [stock, setStock] = useState("");
  const [gst, setGst] = useState("");
  const [gstType, setGstType] = useState(""); // Added to match controller
  const [additionalUnit, setAdditionalUnit] = useState("Unit A");
  const [allowCOD, setAllowCOD] = useState(false); // Added to match controller
  const [returnProduct, setReturnProduct] = useState(false); // Added to match controller
  const [tags, setTags] = useState([]); // Added to match controller
  const [fk_tags, setFkTags] = useState([]); // Added to match controller
  const [sku, setSku] = useState(""); // Added to match controller
  const [customOrder, setCustomOrder] = useState("");
  const [photos, setPhotos] = useState(""); 
  const [multipleimages, setMultipleImages] = useState([]);

  
  useEffect(() => {
    getAllCategories();
    getSubcategories();
    getAllBrands();
  }, []);

  const getAllCategories = async () => {
    try {
      const { data } = await axios.get("/api/v1/category/get-category");
      if (data?.success) {
        setCategories(data?.category);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      //toast.error("Something went wrong in getting categories");
    }
  };

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
      //toast.error("Something went wrong in getting subcategories");
      setSubcategories([]);
    }
  };

  const getAllBrands = async () => {
    try {
      const { data } = await axios.get("/api/v1/brand/get-brands");
      if (data?.success) {
        setBrands(data?.brands);
      }
    } catch (error) {
      console.error("Error fetching brands:", error);
      //toast.error("Something went wrong in getting brands");
    }
  };

  const handleCategoryChange = (value) => {
    setCategory(value);
    setSubcategory("");
    setBrand("");

    const filteredSubcategories = subcategories.filter(
      (subcat) => subcat.category === value
    );
    setSubcategories(filteredSubcategories);
  };

  const handleBrandChange = (value) => {
    setBrand(value);
  };

  const handleChange = (index, e) => {
    const { name, value } = e.target;
    const list = [...bulkProducts];
    list[index][name] = value;

    if (name === "maximum" && index < list.length - 1) {
      list[index + 1].minimum = (parseInt(value) + 1).toString();
    }

    const netWeight = parseFloat(unitSet);
    list[index].minNetWeight = (
      parseFloat(list[index].minimum) * netWeight
    ).toFixed(2);
    list[index].maxNetWeight = (
      parseFloat(list[index].maximum) * netWeight
    ).toFixed(2);

    if (name === "discount_mrp") {
      const setPrice = parseFloat(perPiecePrice);
      const totalPrice = setPrice;
      const discountAmount = parseFloat(value);
      list[index].selling_price_set = (totalPrice - discountAmount).toFixed(2);
    }

    setBulkProducts(list);
  };

  const handleAddRow = () => {
    const lastRow = bulkProducts[bulkProducts.length - 1];
    const newMinimum =
      lastRow && lastRow.maximum
        ? (parseInt(lastRow.maximum) + 1).toString()
        : "";

    setBulkProducts([
      ...bulkProducts,
      {
        minimum: newMinimum,
        maximum: "",
        discount_mrp: "",
        selling_price_set: "",
      },
    ]);
  };

  const handleRemoveRow = (index) => {
    const list = [...bulkProducts];
    list.splice(index, 1);
    setBulkProducts(list);
  };

  const handleFkTagsChange = (e) => {
    setFkTags(e.target.value);
  };


  // Add this function for Cloudinary upload
  const uploadToCloudinary = async (file) => {
    console.log('Starting Cloudinary upload for file:', file.name);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'smitoxphoto');
      formData.append('cloud_name', 'djtiblazd');
  
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/djtiblazd/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );
  
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }
  
      const data = await response.json();
      console.log('Upload successful, URL:', data.secure_url);
      return data.secure_url;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw error;
    }
  };
  
  // Modify the handleCreate function to handle image uploads
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      toast.loading("Creating product...");
      const productData = new FormData();
  
      // Upload photos in parallel if they exist
      const uploadPromises = [];
      
      if (photo) {
        uploadPromises.push(
          uploadToCloudinary(photo).then(url => {
            productData.append("photos", url);
          })
        );
      }
  
      // Handle multiple images in parallel
      let allImageUrls = [...(multipleimages || [])];
      
      if (images?.length) {
        const newImagePromises = images.map(uploadToCloudinary);
        const newUrls = await Promise.all(newImagePromises);
        allImageUrls.push(...newUrls);
      }
      
      productData.append("multipleimages", JSON.stringify(allImageUrls));
  
      // Add all other form fields
      const formFields = {
        name, description, price, quantity, category, subcategory, brand,
        shipping: shipping ? "1" : "0", hsn, unit, unitSet, purchaseRate,
        mrp, perPiecePrice, totalsetPrice, weight, stock, gst,
        additionalUnit, sku, fk_tags: fk_tags ? JSON.stringify(fk_tags.split(',').map(tag => tag.trim()).filter(Boolean)) : "",
        youtubeUrl,
        bulkProducts: JSON.stringify(bulkProducts.map(p => ({
          minimum: parseFloat(p.minimum) || 0,
          maximum: parseFloat(p.maximum) || 0,
          discount_mrp: parseFloat(p.discount_mrp) || 0,
          selling_price_set: parseFloat(p.selling_price_set) || 0
          
        }))),
        custom_order: customOrder || "" 
      };
  
      Object.entries(formFields).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          productData.append(key, value);
        }
      });
  
      // Wait for all uploads to complete
      await Promise.all(uploadPromises);
  
      const { data } = await axios.post(
        "/api/v1/product/create-product",
        productData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );
  
      if (data?.success) {
        toast.dismiss();
        toast.success("Product Created Successfully");
        navigate("/dashboard/admin/products");
      } else {
        toast.dismiss();
        toast.error(data?.message || "Error creating product");
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.message || "Error creating product");
      console.error('Create error:', error);
    }
  };
  
  // Add this function after your state declarations
  const generateUniqueSkU = () => {
    // Get current timestamp
    const timestamp = Date.now();

    // Convert timestamp to base 36 (numbers + letters) and take last 4 characters
    const timeComponent = timestamp.toString(36).slice(-4).toUpperCase();

    // Generate 2 random letters
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const randomLetters = Array.from({ length: 2 }, () =>
      letters.charAt(Math.floor(Math.random() * letters.length))
    ).join("");

    // Combine components
    return `SM-${timeComponent}${randomLetters}`;
  };

  // Add this useEffect after your other useEffect hooks
  useEffect(() => {
    // Generate and set SKU when component mounts
    const uniqueSku = generateUniqueSkU();
    setSku(uniqueSku);
  }, []); // Empty dependency array means this runs once on mount

  const handlePerPiecePriceChange = (e) => {
    const newPerPiecePrice = e.target.value;
    setPerPiecePrice(newPerPiecePrice);
    const newSetPrice = (
      parseFloat(newPerPiecePrice) * parseFloat(unitSet)
    ).toFixed(2);
    setPrice(newSetPrice);
  };

  return (
    <Layout title={"Dashboard - Create Product"}>
      <div className="container-fluid m-3 p-3 dashboard">
        <div className="row">
          <div className="col-md-3">
            <AdminMenu />
          </div>
          <div className="col-md-9">
            <h1>Create Product</h1>
            <div className="m-1 w-75">
              {/* Category dropdown */}
              <div className="mb-3">
                <label htmlFor="categorySelect" className="form-label">
                  Category
                </label>
                <Select
                  id="categorySelect"
                  bordered={false}
                  placeholder="Select a category"
                  size="large"
                  showSearch
                  className="form-select mb-3"
                  onChange={handleCategoryChange}
                  value={category}
                >
                  {categories.map((c) => (
                    <Option key={c._id} value={c._id}>
                      {c.name}
                    </Option>
                  ))}
                </Select>
              </div>

              {/* Subcategory dropdown */}
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
                  onChange={(value) => setSubcategory(value)}
                  value={subcategory}
                >
                  {subcategories.map((sc) => (
                    <Option key={sc._id} value={sc._id}>
                      {sc.name}
                    </Option>
                  ))}
                </Select>
              </div>

              {/* Brand dropdown */}
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
                <label htmlFor="youtubeUrl" className="form-label">
                  YouTube URL
                </label>
                <input
                  id="youtubeUrl"
                  type="text"
                  value={youtubeUrl}
                  placeholder="Enter YouTube URL"
                  className="form-control"
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                />
                <small className="text-muted">
                  Enter a valid YouTube URL for the product video.
                </small>
              </div>

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
  <div className="mb-3">
    {photo ? (
      <div className="text-center">
        <img
          src={URL.createObjectURL(photo)}
          alt="product_photo"
          height="200"
          className="img img-responsive"
        />
      </div>
    ) : photos ? (
      <div className="text-center">
        <img
          src={photos}
          alt="product_photo"
          height="200"
          className="img img-responsive"
        />
      </div>
    ) : null}
  </div>
</div>
{/* Custom Order */}
<div className="mb-3">
  <label htmlFor="customOrder" className="form-label">
    Custom Order
  </label>
  <input
    id="customOrder"
    type="number"
    name="custom_order"
    placeholder="Enter custom order position (optional)"
    className="form-control"
    value={customOrder}
    onChange={(e) => setCustomOrder(e.target.value)}
  />
  <small className="text-muted">
    Optional: Specify a specific position for this product in the product list. 
    If left blank, it will be automatically assigned the next available position.
  </small>
</div>



              <div className="mb-3">
                <label htmlFor="productName" className="form-label">
                  Product Name
                </label>
                <input
                  id="productName"
                  type="text"
                  value={name}
                  placeholder="Enter product name"
                  className="form-control"
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="hsnCodeInput" className="form-label">
                  HSN Code
                </label>
                <input
                  id="hsnCodeInput"
                  type="text"
                  value={hsn}
                  placeholder="Enter HSN code"
                  className="form-control"
                  onChange={(e) => setHsn(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="productDescription" className="form-label">
                  Product Description
                </label>
                <textarea
                  id="productDescription"
                  type="text"
                  value={description}
                  placeholder="Enter product description"
                  className="form-control"
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="row mb-3">
                <div className="col-md-4">
                  <label htmlFor="sku" className="form-label">
                    SKU
                  </label>
                  <input
                    id="sku"
                    type="text"
                    value={sku}
                    className="form-control"
                    readOnly
                    onChange={(e) => setSku(e.target.value)}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">FK Tags</label>
                <input
                  type="text"
                  className="form-control"
                  value={fk_tags}
                  onChange={handleFkTagsChange}
                  placeholder="Enter FK tags separated by commas"
                />
                <small className="text-muted">
                  Enter FK tags separated by commas.
                </small>
              </div>

              <div className="row mb-3">
                <div className="col-md-4">
                  <label htmlFor="unit" className="form-label">
                    Unit
                  </label>
                  <select
                    id="unit"
                    name="unit"
                    value={unit}
                    className="form-control"
                    onChange={(e) => setUnit(e.target.value)}
                  >
                    <option value="Chart">Chart</option>
                    <option value="Dozens">Dozens</option>
                    <option value="Kg">Kg</option>
                    <option value="Litre">Litre</option>
                    <option value="Meter">Meter</option>
                    <option value="Metric Tons">Metric Tons</option>
                    <option value="Nos.">Nos.</option>
                    <option value="Packet">Packet</option>
                    <option value="Pairs">Pairs</option>
                    <option value="Piece">Piece</option>
                    <option value="Pieces">Pieces</option>
                    <option value="Pounds">Pounds</option>
                    <option value="Quintal">Quintal</option>
                    <option value="Sets">Sets</option>
                    <option value="Tons">Tons</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label htmlFor="unitSet" className="form-label">
                    Net weight
                  </label>
                  <input
                    id="unitSet"
                    type="text"
                    value={unitSet}
                    name="unitSet"
                    placeholder="Enter Net Weight"
                    className="form-control"
                    onChange={(e) => setUnitSet(e.target.value)}
                  />
                </div>
                <div className="col-md-4">
                  <label htmlFor="additionalUnit" className="form-label">
                    Additional Unit
                  </label>
                  <select
                    id="additionalUnit"
                    name="additionalUnit"
                    value={additionalUnit}
                    className="form-control"
                    onChange={(e) => setAdditionalUnit(e.target.value)}
                  >
                    <option value="Chart">Chart</option>
                    <option value="Dozens">Dozens</option>
                    <option value="Kg">Kg</option>
                    <option value="Litre">Litre</option>
                    <option value="Meter">Meter</option>
                    <option value="Metric Tons">Metric Tons</option>
                    <option value="Nos.">Nos.</option>
                    <option value="Packet">Packet</option>
                    <option value="Pairs">Pairs</option>
                    <option value="Piece">Piece</option>
                    <option value="Pieces">Pieces</option>
                    <option value="Pounds">Pounds</option>
                    <option value="Quintal">Quintal</option>
                    <option value="Sets">Sets</option>
                    <option value="Tons">Tons</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label htmlFor="purchaseRate" className="form-label">
                    Purchase Rate
                  </label>
                  <input
                    id="purchaseRate"
                    type="text"
                    value={purchaseRate}
                    name="purchaseRate"
                    placeholder="Enter price set"
                    className="form-control"
                    onChange={(e) => setPurchaseRate(e.target.value)}
                  />
                </div>
                <div className="col-md-4">
                  <label htmlFor="mrp" className="form-label">
                    MRP
                  </label>
                  <input
                    id="mrp"
                    type="text"
                    value={mrp}
                    name="mrp"
                    placeholder="Enter MRP"
                    className="form-control"
                    onChange={(e) => setMrp(e.target.value)}
                  />
                </div>

                <div className="col-md-4">
                  <label htmlFor="perPiecePrice" className="form-label">
                    PER PIECE PRICE
                  </label>
                  <input
                    id="perPiecePrice"
                    type="text"
                    value={perPiecePrice}
                    name="perPiecePrice"
                    placeholder="Enter per piece price"
                    className="form-control"
                    onChange={handlePerPiecePriceChange}
                  />
                </div>
                <div className="col-md-4">
                  <label htmlFor="price" className="form-label">
                    SET PRICE
                  </label>
                  <input
                    id="price"
                    type="text"
                    value={price}
                    name="price"
                    placeholder="Enter set price"
                    className="form-control"
                    readOnly
                  />
                </div>
                <div className="col-md-4">
                  <label htmlFor="weight" className="form-label">
                    WEIGHT
                  </label>
                  <input
                    id="weight"
                    type="text"
                    value={weight}
                    name="weight"
                    placeholder="Enter weight"
                    className="form-control"
                    onChange={(e) => setWeight(e.target.value)}
                  />
                </div>
                <div className="col-md-4">
                  <label htmlFor="quantity" className="form-label">
                    MINIMUM QUANTITY
                  </label>
                  <input
                    id="quantity"
                    type="text"
                    value={quantity}
                    name="quantity"
                    placeholder="Enter minimum quantity"
                    className="form-control"
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
                <div className="col-md-4">
                  <label htmlFor="stock" className="form-label">
                    STOCK
                  </label>
                  <input
                    id="stock"
                    type="text"
                    value={stock}
                    name="stock"
                    placeholder="Enter stock"
                    className="form-control"
                    onChange={(e) => setStock(e.target.value)}
                  />
                </div>
                <div className="col-md-4">
                  <label htmlFor="gst" className="form-label">
                    GST
                  </label>
                  <input
                    id="gst"
                    type="text"
                    value={gst}
                    name="GST"
                    placeholder="Enter GST"
                    className="form-control"
                    onChange={(e) => setGst(e.target.value)}
                  />
                </div>
              </div>

              {/* Bulk products */}
              <div className="mb-3">
                <label>Bulk Products</label>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Minimum Quantity</th>
                      <th>Maximum Quantity</th>
                      <th>Discount MRP (Amount)</th>
                      <th>Selling Price Set</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkProducts.map((product, index) => (
                      <tr key={index}>
                        <td>
                          <input
                            type="number"
                            className="form-control"
                            name="minimum"
                            value={product.minimum}
                            onChange={(e) => handleChange(index, e)}
                            readOnly={index > 0}
                          />
                          <small>
                            {product.minNetWeight} {unit}
                          </small>
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control"
                            name="maximum"
                            value={product.maximum}
                            onChange={(e) => handleChange(index, e)}
                          />
                          <small>
                            {product.maxNetWeight} {unit}
                          </small>
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control"
                            name="discount_mrp"
                            value={product.discount_mrp}
                            onChange={(e) => handleChange(index, e)}
                          />
                           <small>
                            {(product.discount_mrp)*(unitSet)} {"Discount"}
                          </small>
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control"
                            name="selling_price_set"
                            value={product.selling_price_set}
                            onChange={(e) => handleChange(index, e)}
                            readOnly
                          />
                                 <small>
                            {(product.selling_price_set)*(unitSet)} {"Discount"}
                          </small>
                        </td>
                        <td>
                          <button
                            className="btn btn-danger"
                            onClick={() => handleRemoveRow(index)}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button className="btn btn-primary" onClick={handleAddRow}>
                  Add Bulk Product
                </button>
              </div>

              <div className="mb-3">
                <button className="btn btn-primary" onClick={handleCreate}>
                  Create Product
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CreateProduct;
