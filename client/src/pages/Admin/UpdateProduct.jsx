import React, { useState, useEffect } from "react";
import Layout from "./../../components/Layout/Layout";
import AdminMenu from "./../../components/Layout/AdminMenu";
import toast from "react-hot-toast";
import axios from "axios";
import { Select } from "antd";
import { useNavigate, useParams } from "react-router-dom";
// import { v2 as cloudinary } from 'cloudinary';

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
  const [shipping, setShipping] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [images, setImages] = useState([]);
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [id, setId] = useState("");
  const [hsn, setHsn] = useState("");
  const [unit, setUnit] = useState("");
  const [unitSet, setUnitSet] = useState("");
  const [purchaseRate, setPurchaseRate] = useState("");
  const [product, setProducts] = useState("");
  const [mrp, setMrp] = useState("");
  const [perPiecePrice, setPerPiecePrice] = useState("");
  const [totalsetPrice, setTotalsetPrice] = useState("");
  const [weight, setWeight] = useState("");
  const [stock, setStock] = useState("");
  const [gst, setGst] = useState("");
  const [additionalUnit, setAdditionalUnit] = useState("Unit A");
  const [sku, setSku] = useState("");
  const [fk_tags, setFkTags] = useState("");
  const [bulkProducts, setBulkProducts] = useState([
    { minimum: "", maximum: "", discount_mrp: "", selling_price_set: "" },
  ]);
  const [existingPhotoObject, setExistingPhotoObject] = useState(null); // To store the full photo object
  const [customOrder, setCustomOrder] = useState("");

const [photos, setPhotos] = useState(""); // For single photo URL
// For new image uploads
const [multipleimages, setMultipleImages] = useState([]); // For multiple image URLs


  // Upload image to Cloudinary

  // Upload multiple images
// Upload to Cloudinary function
// Upload to Cloudinary function
const uploadToCloudinary = async (file) =>  {
  console.log('Uploading file to ImageKit:', file.name);
  try {
    const formData = new FormData();
    formData.append('image', file); // Use 'image' field name to match middleware
    
    const response = await axios.post(
      "/api/v1/images/upload-single",
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    );

    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Upload failed');
    }
    
    console.log('ImageKit upload successful:', response.data);
    return {
      url: response.data.data.url,
      fileId: response.data.data?.fileId || ""
    };
  } catch (error) {
    console.error('Error in ImageKit upload:', error);
    throw error;
  }
};
const handleUpdate = async (e) => {
  e.preventDefault();
  try {
    toast.loading("Updating product...");
    const productData = new FormData();

    // Handle single photo upload
    let photoUrl = "";
    if (photo) {
      // Upload the new file and set the returned URL
      const uploadResult = await uploadToCloudinary(photo);
      // Append only the URL to the form data
      if (uploadResult && uploadResult.url) {
        photoUrl = uploadResult.url;
        productData.append("photos", photoUrl);
      }
    } else if (photos) {
      // If no new file provided, use the fallback URL already stored in state
      productData.append("photos", photos);
    }

    // Handle multiple images upload
    let allImageUrls = [];
    // If there are pre-existing multiple images (passed as a field), try to parse them
    if (multipleimages) {
      try {
        allImageUrls =
          typeof multipleimages === "string"
            ? JSON.parse(multipleimages)
            : multipleimages;
      } catch (err) {
        allImageUrls = [];
      }
    }
    // Upload new images if provided
    if (images && images.length) {
      const newUploadResults = await Promise.all(
        images.map(uploadToCloudinary)
      );
      // Extract only the URL from each upload result
      const newUrls = newUploadResults.map((result) => result.url);
      allImageUrls = [...allImageUrls, ...newUrls];
    }
    productData.append("multipleimages", JSON.stringify(allImageUrls));

    // Batch append all other form fields
    const formFields = {
      name,
      description,
      price,
      quantity,
      category,
      subcategory,
      brand,
      shipping: shipping ? "1" : "0",
      hsn,
      unit,
      unitSet,
      purchaseRate,
      mrp,
      perPiecePrice,
      totalsetPrice,
      weight,
      stock,
      gst,
      additionalUnit,
      sku,
      // Process fk_tags: split by comma, trim, filter out empty values, then JSON stringify
      fk_tags: fk_tags
        ? JSON.stringify(
            fk_tags.split(",").map((tag) => tag.trim()).filter(Boolean)
          )
        : "",
      // Process bulkProducts: map each item and convert numeric values, then JSON stringify
      bulkProducts: JSON.stringify(
        bulkProducts.map((p) => ({
          minimum: parseFloat(p.minimum) || 0,
          maximum: parseFloat(p.maximum) || 0,
          discount_mrp: parseFloat(p.discount_mrp) || 0,
          selling_price_set: parseFloat(p.selling_price_set) || 0,
        }))
      ),
      custom_order: customOrder || "",
    };

    Object.entries(formFields).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        productData.append(key, value);
      }
    });

    // Wait for all uploads to complete (if any were pending)
    // (Not needed here since we're already awaiting Promise.all)

    const { data } = await axios.put(
      `/api/v1/product/update-product/${id}`,
      productData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );

    if (data?.success) {
      toast.dismiss();
      // Optionally, show success message and navigate
      // toast.success("Product Updated Successfully");
      // navigate('/dashboard/admin/products');
    }
  } catch (error) {
    toast.dismiss();
    console.error("Update error:", error);
    // Optionally: toast.error(error.message || "Error updating product");
  }
};

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
        setShipping(product.shipping || false);
        setCategory(product.category?._id || "");
        setSubcategory(product.subcategory?._id || "");
        setBrand(product.brand?._id || "");
        setExistingPhotos(product.images || []);
        setHsn(product.hsn || "");
        setUnit(product.unit || "");
        setUnitSet(product.unitSet || "");
        setPurchaseRate(product.purchaseRate || "");
        setMrp(product.mrp || "");
        setPerPiecePrice(product.perPiecePrice || "");
        setTotalsetPrice(product.totalsetPrice || "");
        setWeight(product.weight || "");
        setStock(product.stock || "");
        setGst(product.gst || "");
        setAdditionalUnit(product.additionalUnit || "Unit A");
        setSku(product.sku || "");
        setFkTags(product.fk_tags ? product.fk_tags.join(", ") : "");
        setBulkProducts(product.bulkProducts || [{ minimum: "", maximum: "", discount_mrp: "", selling_price_set: "" }]);
        setProducts(product.photo);
    setPhotos(product.photos || "");  // Set the single photo URL
    setCustomOrder(product.custom_order || "");


      if (product.multipleimages && product.multipleimages.length > 0) {
        try {
          let parsedImages = Array.isArray(product.multipleimages) ? 
            product.multipleimages.map(img => {
              if (typeof img === 'string') {
                const parsed = JSON.parse(img);
                return parsed.url;
              }
              return img;
            }) : [];
          setMultipleImages(parsedImages);
        } catch (e) {
          console.error('Error parsing multipleimages:', e);
          setMultipleImages([]);
        }
      }
    }
  } catch (error) {
    console.log(error);
    ////toast.error("Error fetching product data");
  }
};


  // Get all categories
  const getAllCategories = async () => {
    try {
      const { data } = await axios.get("/api/v1/category/get-category");
      if (data?.success) {
        setCategories(data?.category);
      }
    } catch (error) {
      console.log(error);
      ////toast.error("Something went wrong in getting categories");
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
      ////toast.error("Something went wrong in getting brands");
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
      ////toast.error("Something went wrong in getting subcategories");
    }
  };

  useEffect(() => {
    getSingleProduct();
    getAllCategories();
    getAllBrands();
    getSubcategories();
  }, []);

  // Handle update
 






  useEffect(() => {
    getSingleProduct();
    getAllCategories();
    getAllBrands();
    getSubcategories();
  }, []);

  // Handle category change
  const handleCategoryChange = (value) => {
    setCategory(value);
    setSubcategory("");
    setBrand("");

    const filteredSubcategories = subcategories.filter(
      (subcat) => subcat.category === value
    );
    setSubcategories(filteredSubcategories);
  };

  // Handle bulk product changes
  const handleChange = (index, e) => {
    const { name, value } = e.target;
    const list = [...bulkProducts];
    list[index][name] = value;

    if (name === "maximum" && index < list.length - 1) {
      list[index + 1].minimum = (parseInt(value) + 1).toString();
    }

    const netWeight = parseFloat(unitSet);
    list[index].minNetWeight = (parseFloat(list[index].minimum) * netWeight).toFixed(2);
    list[index].maxNetWeight = (parseFloat(list[index].maximum) * netWeight).toFixed(2);

    if (name === "discount_mrp") {
      const setPrice = parseFloat(perPiecePrice);
      const totalPrice = setPrice;
      const discountAmount = parseFloat(value);
      list[index].selling_price_set = (totalPrice - discountAmount).toFixed(2);
    }

    setBulkProducts(list);
  };

  // Add bulk product row
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

  
  // Remove bulk product row
  const handleRemoveRow = (index) => {
    const list = [...bulkProducts];
    list.splice(index, 1);
    setBulkProducts(list);
  };

  const handlePerPiecePriceChange = (e) => {
    const newPerPiecePrice = e.target.value;
    setPerPiecePrice(newPerPiecePrice);
    
    // Calculate new set price
    const newSetPrice = (parseFloat(newPerPiecePrice) * parseFloat(unitSet)).toFixed(2);
    setPrice(newSetPrice);
    
    // Update selling price for all bulk products
    const updatedBulkProducts = bulkProducts.map(product => {
      const discountAmount = parseFloat(product.discount_mrp) || 0;
      return {
        ...product,
        selling_price_set: (parseFloat(newPerPiecePrice) - discountAmount).toFixed(2)
      };
    });
    
    setBulkProducts(updatedBulkProducts);
  };
  // Handle FK Tags change
  const handleFkTagsChange = (e) => {
    setFkTags(e.target.value);
  };

  // Update product function



  // Delete product
  const handleDelete = async () => {
    try {
      let answer = window.prompt("Are you sure you want to delete this product?");
      if (!answer) return;
      await axios.delete(`/api/v1/product/delete-product/${id}`);
      //toast.success("Product Deleted Successfully");
      navigate("/dashboard/admin/products");
    } catch (error) {
      console.log(error);
      ////toast.error("Something went wrong");
    }
  };

  return (
    <Layout title={"Dashboard - Update Product"}>
      <div className="container-fluid m-3 p-3 dashboard">
        <div className="row">
          <div className="col-md-3">
            <AdminMenu />
          </div>
          <div className="col-md-9">
            <h1>Update Product</h1>
            <div className="m-1 w-75">
            <div className="col-md-4">
  <label htmlFor="customOrder" className="form-label">
    Custom Order
  </label>
  <input
    id="customOrder"
    type="number"
    value={customOrder}
    name="custom_order"
    placeholder="Enter custom order"
    className="form-control"
    onChange={(e) => setCustomOrder(e.target.value)}
  />
</div>
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
                  onChange={(value) => setBrand(value)}
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
            <small>{product.minNetWeight} {unit}</small>
          </td>
          <td>
            <input
              type="number"
              className="form-control"
              name="maximum"
              value={product.maximum}
              onChange={(e) => handleChange(index, e)}
            />
            <small>{product.maxNetWeight} {unit}</small>
          </td>
          <td>
            <input
              type="number"
              className="form-control"
              name="discount_mrp"
              value={product.discount_mrp}
              onChange={(e) => handleChange(index, e)}
            />
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

<div className="mb-3 d-flex justify-content-between">
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



{/* Multiple Images Display
<div className="mb-3">
  <label className="form-label">Additional Product Images</label>
  <input
    type="file"
    className="form-control"
    multiple
    accept="image/*"
    onChange={(e) => setImages(Array.from(e.target.files))}
  /> */}
  
  {/* Display existing multiple images */}
  {/* <div className="d-flex flex-wrap gap-2 mt-2">
    {multipleimages.map((imgUrl, index) => (
      <div key={index} className="position-relative">
        <img
          src={imgUrl}
          alt={`Product ${index + 1}`}
          style={{ width: '100px', height: '100px', objectFit: 'cover' }}
          className="border rounded"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/default-product.jpg'; // fallback image
          }}
        />
        <button
          className="btn btn-sm btn-danger position-absolute top-0 end-0"
          onClick={() => {
            const updatedImages = multipleimages.filter((_, i) => i !== index);
            setMultipleImages(updatedImages);
          }}
        >
          ×
        </button>
      </div>
    ))} */}
    
    {/* Display newly uploaded images */}
    {/* {images.map((file, index) => (
      <div key={`new-${index}`} className="position-relative">
        <img
          src={URL.createObjectURL(file)}
          alt={`New Upload ${index + 1}`}
          style={{ width: '100px', height: '100px', objectFit: 'cover' }}
          className="border rounded"
        />
        <button
          className="btn btn-sm btn-danger position-absolute top-0 end-0"
          onClick={() => {
            const updatedImages = images.filter((_, i) => i !== index);
            setImages(updatedImages);
          }}
        >
          ×
        </button>
      </div>
    ))} */}
  {/* </div> */}
{/* </div> */}
              {/* Basic Info Fields */}