import React, { useState, useEffect } from "react";
import Layout from "./../../components/Layout/Layout";
import AdminMenu from "./../../components/Layout/AdminMenu";
import toast from "react-hot-toast";
import axios from "axios";
import { Select } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/auth"; // <-- Add this import

const { Option } = Select;

const UpdateProduct = () => {
  const navigate = useNavigate();
  const params = useParams();
  const [auth] = useAuth(); // <-- Add this line
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [subcategories, setSubcategories] = useState([]);

  // Product state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  // YouTube URL state
  const [youtubeUrl, setYoutubeUrl] = useState("");
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
  const [multipleimages, setMultipleImages] = useState([]); // For multiple image URLs

  // Upload to Cloudinary function
  const uploadToCloudinary = async (file) => {
    console.log('Starting Cloudinary upload for file:', file.name);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'smitoxphoto');
      formData.append('cloud_name', 'dj62teqfp');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/dj62teqfp/image/upload`,
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

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      toast.loading("Updating product...");
      const productData = new FormData();

      // Handle single photo upload
      let photoUrl = "";
      if (photo) {
        // Upload the new file and set the returned URL
        photoUrl = await uploadToCloudinary(photo);
        productData.append("photos", photoUrl);
      } else if (photos) {
        // If no new file provided, use the fallback URL already stored in state
        productData.append("photos", photos);
      }

      // Handle multiple images upload
      let allImageUrls = [];
      
      // If there are existing multiple images, use them as the starting point
      if (multipleimages && Array.isArray(multipleimages)) {
        allImageUrls = [...multipleimages];
      } else if (multipleimages && typeof multipleimages === "string") {
        try {
          // If it's a JSON string, parse it
          allImageUrls = JSON.parse(multipleimages);
        } catch (err) {
          console.error('Error parsing multipleimages:', err);
          allImageUrls = [];
        }
      }
      
      // Process new images if any are selected
      if (images && images.length > 0) {
        console.log(`Uploading ${images.length} additional images...`);
        const imageUploadPromises = [];
        
        // Create a separate promise for each image upload
        for (const imageFile of images) {
          imageUploadPromises.push(uploadToCloudinary(imageFile));
        }
        
        // Wait for all uploads to complete and collect URLs
        const newImageUrls = await Promise.all(imageUploadPromises);
        console.log(`Successfully uploaded ${newImageUrls.length} images`);
        
        // Add new image URLs to the existing ones
        allImageUrls = [...allImageUrls, ...newImageUrls];
      }
      
      // Add the image URLs as a JSON string
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
        fk_tags: fk_tags
          ? JSON.stringify(
              fk_tags.split(",").map((tag) => tag.trim()).filter(Boolean)
            )
          : "",
        bulkProducts: JSON.stringify(
          bulkProducts.map((p) => ({
            minimum: parseFloat(p.minimum) || 0,
            maximum: parseFloat(p.maximum) || 0,
            discount_mrp: parseFloat(p.discount_mrp) || 0,
            selling_price_set: parseFloat(p.selling_price_set) || 0,
          }))
        ),
        custom_order: customOrder || "",
        youtubeUrl, // Append YouTube URL
      };

      Object.entries(formFields).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          productData.append(key, value);
        }
      });

      const { data } = await axios.put(
        `/api/v1/product/update-product/${id}`,
        productData,
        {
          headers: { "Content-Type": "multipart/form-data" ,         'Authorization': auth?.token},
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
        console.log('Product data:', product);

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
        setPhotos(product.photos || "");  // Set the single photo URL
        setCustomOrder(product.custom_order || "");
        setYoutubeUrl(product.youtubeUrl || ""); // Prepopulate YouTube URL

        // Handle multipleimages properly
        if (product.multipleimages) {
          console.log('Processing multipleimages:', product.multipleimages);
          let processedImages = [];
          
          // If multipleimages is a string (JSON), try to parse it
          if (typeof product.multipleimages === 'string') {
            try {
              processedImages = JSON.parse(product.multipleimages);
            } catch (e) {
              console.error('Error parsing multipleimages string:', e);
              processedImages = [];
            }
          } 
          // If multipleimages is already an array, use it directly
          else if (Array.isArray(product.multipleimages)) {
            processedImages = product.multipleimages.map(img => {
              // If any array item is a string that needs parsing (like a JSON string)
              if (typeof img === 'string' && img.startsWith('{')) {
                try {
                  const parsed = JSON.parse(img);
                  return parsed.url || img;
                } catch (e) {
                  return img;
                }
              }
              return img;
            });
          }
          
          console.log('Processed multipleimages:', processedImages);
          setMultipleImages(processedImages);
        } else {
          setMultipleImages([]);
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

  const handleFkTagsChange = (e) => {
    setFkTags(e.target.value);
  };

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
                  {photo ? photo.name : "Upload Main Photo"}
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

              {/* Multiple Images Upload */}
              <div className="mb-3">
                <label className="btn btn-outline-secondary col-md-12">
                  Upload Additional Images
                  <input
                    type="file"
                    name="images"
                    accept="image/*"
                    multiple="multiple"
                    onChange={(e) => {
                      const selectedFiles = Array.from(e.target.files);
                      console.log(`Selected ${selectedFiles.length} files`);
                      setImages(prevImages => [...prevImages, ...selectedFiles]);
                    }}
                    hidden
                  />
                </label>
                <small className="d-block mt-2 text-muted">
                  You can select multiple images at once. These will be displayed in the product gallery.
                </small>
                
                {/* Preview for newly selected images */}
                {images && images.length > 0 && (
                  <div className="mt-3">
                    <h6>New Additional Images:</h6>
                    <div className="d-flex flex-wrap gap-2">
                      {images.map((img, index) => (
                        <div key={index} className="position-relative" style={{ width: '100px', height: '100px' }}>
                          <img
                            src={URL.createObjectURL(img)}
                            alt={`Product image ${index + 1}`}
                            style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                            className="border rounded"
                          />
                          <button
                            type="button"
                            className="btn btn-sm btn-danger position-absolute"
                            style={{ top: '0', right: '0', padding: '0 5px' }}
                            onClick={() => {
                              const newImages = [...images];
                              newImages.splice(index, 1);
                              setImages(newImages);
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Display existing multipleimages */}
                {multipleimages && multipleimages.length > 0 && (
                  <div className="mt-3">
                    <h6>Existing Additional Images:</h6>
                    <div className="d-flex flex-wrap gap-2">
                      {multipleimages.map((imgUrl, index) => (
                        <div key={index} className="position-relative" style={{ width: '100px', height: '100px' }}>
                          <img
                            src={imgUrl}
                            alt={`Product image ${index + 1}`}
                            style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                            className="border rounded"
                          />
                          <button
                            type="button"
                            className="btn btn-sm btn-danger position-absolute"
                            style={{ top: '0', right: '0', padding: '0 5px' }}
                            onClick={() => {
                              const updatedImages = multipleimages.filter((_, i) => i !== index);
                              setMultipleImages(updatedImages);
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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

              {/* YouTube URL Field */}
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