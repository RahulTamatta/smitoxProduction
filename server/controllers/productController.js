import crypto from "crypto";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Razorpay from "razorpay";
import slugify from "slugify";
import { enrichOrderProducts } from "../helpers/orderSnapshotHelper.js";
import categoryModel from "../models/categoryModel.js";
import orderModel from "../models/orderModel.js";
import productModel from "../models/productModel.js";
import subcategoryModel from "../models/subcategoryModel.js";
dotenv.config();



class CustomOrderService {
  static async assignCustomOrder(
    proposedOrder,
    originalOrder = null,
    productId = null
  ) {
    // If updating, first decrement orders above original position
    if (originalOrder !== null) {
      await productModel.updateMany(
        { custom_order: { $gt: originalOrder } },
        { $inc: { custom_order: -1 } }
      );
    }

    // If no proposed order, auto-generate last+1
    if (!proposedOrder) {
      const lastProduct = await productModel
        .findOne()
        .sort({ custom_order: -1 })
        .select("custom_order");

      return lastProduct?.custom_order + 1 || 1;
    }

    // Check if proposed order already exists (excluding current product)
    const query = { custom_order: proposedOrder };
    if (productId) {
      query._id = { $ne: productId };
    }

    const existingProduct = await productModel.findOne(query);

    if (!existingProduct) return proposedOrder;

    // Shift orders only if new position is different from original
    if (proposedOrder !== originalOrder) {
      await productModel.updateMany(
        { custom_order: { $gte: proposedOrder } },
        { $inc: { custom_order: 1 } }
      );
    }

    return proposedOrder;
  }
}
export const createProductController = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      subcategory,
      brand,
      quantity,
      shipping,
      hsn,
      unit,
      unitSet,
      additionalUnit,
      stock,
      gst,
      gstType,
      purchaseRate,
      mrp,
      perPiecePrice,
      weight,
      allowCOD,
      returnProduct,
      userId,
      variants,
      sets,
      bulkProducts,
      youtubeUrl,
      sku,
      tag,
      fk_tags,
      photos, // fallback
      multipleimages,
      custom_order,
    } = req.body; // Changed from req.fields to req.body

    // Multer files
    const photo = req.files?.photo?.[0];
    const images = req.files?.images;

    // Handle primary photo
    let productPhoto = photos || null;
    if (photo) {
      // Create relative path: uploads/products/filename.ext
      const fileName = path.basename(photo.path);
      productPhoto = `uploads/products/${fileName}`;
    }

    // Handle multiple images
    let imageUrls = [];
    if (images) {
      imageUrls = images.map(file => {
        const fileName = path.basename(file.path);
        return `uploads/products/${fileName}`;
      });
    }

    // Parse numeric/JSON fields safely
    const parseJSON = (data, fallback = []) => {
      if (!data) return fallback;
      try {
        return typeof data === "string" ? JSON.parse(data) : data;
      } catch (e) {
        return fallback;
      }
    };

    const finalMultipleImages = [...parseJSON(multipleimages), ...imageUrls];
    const formattedBulkProducts = parseJSON(bulkProducts);
    const parsedFkTags = parseJSON(fk_tags);
    const parsedVariants = parseJSON(variants);
    const parsedSets = parseJSON(sets);
    const parsedTags = parseJSON(tag);

    // Function to generate SKU if not provided
    const generateSKU = () => {
      const timestamp = Date.now();
      const timeComponent = timestamp.toString(36).slice(-4).toUpperCase();
      const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const randomLetters = Array.from({ length: 2 }, () =>
        letters.charAt(Math.floor(Math.random() * letters.length))
      ).join("");
      return `SM-${timeComponent}${randomLetters}`;
    };

    // Determine custom order
    let productCustomOrder = custom_order;
    if (!productCustomOrder) {
      const lastProduct = await productModel
        .findOne()
        .sort({ custom_order: -1 })
        .select("custom_order");
      productCustomOrder = lastProduct?.custom_order ? lastProduct.custom_order + 1 : 1;
    }

    // Create the new product
    const newProduct = new productModel({
      name,
      slug: slugify(name),
      description,
      price: parseFloat(price),
      category: mongoose.Types.ObjectId(category),
      subcategory: mongoose.Types.ObjectId(subcategory),
      brand: brand ? mongoose.Types.ObjectId(brand) : undefined,
      quantity: parseInt(quantity) || 0,
      stock: parseInt(stock) || 0,
      shipping: shipping === "1" || shipping === true,
      hsn,
      unit,
      unitSet: parseInt(unitSet) || 0,
      additionalUnit,
      gst: gst,
      gstType,
      purchaseRate: parseFloat(purchaseRate) || 0,
      mrp: parseFloat(mrp) || 0,
      perPiecePrice: parseFloat(perPiecePrice) || 0,
      weight: parseFloat(weight) || 0,
      youtubeUrl,
      sku: sku || generateSKU(),
      bulkProducts: formattedBulkProducts,
      allowCOD: allowCOD === "1" || allowCOD === true,
      returnProduct: returnProduct === "1" || returnProduct === true,
      userId,
      isActive: "1",
      variants: parsedVariants,
      sets: parsedSets,
      tag: parsedTags,
      fk_tags: parsedFkTags,
      photos: productPhoto,
      multipleimages: finalMultipleImages,
      custom_order: productCustomOrder,
    });

    await newProduct.save();

    res.status(201).send({
      success: true,
      message: "Product Created Successfully",
      product: newProduct,
    });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).send({
      success: false,
      message: "Error in creating product",
      error: error.message,
    });
  }
};

export const updateProductController = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      subcategory,
      brand,
      quantity,
      shipping,
      hsn,
      unit,
      unitSet,
      additionalUnit,
      stock,
      minimumqty,
      gst,
      gstType,
      purchaseRate,
      mrp,
      perPiecePrice,
      setPrice,
      weight,
      allowCOD,
      returnProduct,
      userId,
      variants,
      sets,
      bulkProducts,
      sku,
      fk_tags,
      youtubeUrl,
      tag,
      photos, // existing photo URL
      multipleimages, // existing images array
      custom_order,
    } = req.body;

    // Find the original product
    const product = await productModel.findById(req.params.pid);
    if (!product) {
      return res.status(404).send({ error: "Product not found" });
    }

    // Multer files
    const photoFile = req.files?.photo?.[0];
    const imagesFiles = req.files?.images;

    // Handle primary photo
    let productPhoto = photos || product.photos;
    if (photoFile) {
      const fileName = path.basename(photoFile.path);
      productPhoto = `uploads/products/${fileName}`;
    }

    // Handle multiple images
    let newImageUrls = [];
    if (imagesFiles) {
      newImageUrls = imagesFiles.map(file => {
        const fileName = path.basename(file.path);
        return `uploads/products/${fileName}`;
      });
    }

    // Helper to parse JSON safely
    const parseJSON = (data, fallback = []) => {
      if (!data) return fallback;
      try {
        return typeof data === "string" ? JSON.parse(data) : data;
      } catch (e) {
        return fallback;
      }
    };

    const existingMultipleImages = parseJSON(multipleimages);
    const finalMultipleImages = [...existingMultipleImages, ...newImageUrls];

    // Preserve original custom order logic
    const originalOrder = product.custom_order;
    const finalCustomOrder = await CustomOrderService.assignCustomOrder(
      custom_order,
      originalOrder,
      req.params.pid
    );

    // Update fields
    const updatedFields = {
      name,
      description,
      slug: slugify(name || product.name),
      price: price ? parseFloat(price) : product.price,
      category: category ? mongoose.Types.ObjectId(category) : product.category,
      subcategory: subcategory ? mongoose.Types.ObjectId(subcategory) : product.subcategory,
      brand: brand ? mongoose.Types.ObjectId(brand) : product.brand,
      quantity: quantity !== undefined ? parseInt(quantity) : product.quantity,
      stock: stock !== undefined ? parseInt(stock) : product.stock,
      minimumqty: minimumqty !== undefined ? parseInt(minimumqty) : product.minimumqty,
      shipping: shipping === "1" || shipping === true,
      hsn: hsn || product.hsn,
      unit: unit || product.unit,
      unitSet: unitSet !== undefined ? parseInt(unitSet) : product.unitSet,
      additionalUnit: additionalUnit || product.additionalUnit,
      gst: gst || product.gst,
      gstType: gstType || product.gstType,
      purchaseRate: purchaseRate ? parseFloat(purchaseRate) : product.purchaseRate,
      mrp: mrp ? parseFloat(mrp) : product.mrp,
      perPiecePrice: perPiecePrice ? parseFloat(perPiecePrice) : product.perPiecePrice,
      setPrice: setPrice ? parseFloat(setPrice) : product.setPrice,
      weight: weight ? parseFloat(weight) : product.weight,
      allowCOD: allowCOD === "1" || allowCOD === true,
      returnProduct: returnProduct === "1" || returnProduct === true,
      userId: userId || product.userId,
      variants: parseJSON(variants, product.variants),
      sets: parseJSON(sets, product.sets),
      sku: sku || product.sku,
      youtubeUrl: youtubeUrl || product.youtubeUrl,
      tag: parseJSON(tag, product.tag),
      fk_tags: parseJSON(fk_tags, product.fk_tags),
      bulkProducts: parseJSON(bulkProducts, product.bulkProducts),
      photos: productPhoto,
      multipleimages: finalMultipleImages,
      custom_order: finalCustomOrder,
    };

    // Update document
    Object.assign(product, updatedFields);
    await product.save();

    res.status(200).send({
      success: true,
      message: "Product Updated Successfully",
      product,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).send({
      success: false,
      error: error.message || "Internal Server Error",
      message: "Error in Updating Product",
    });
  }
};

// getProductController
export const getProductController = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);
    const search = req.query.search?.trim() || "";
    const skip = (page - 1) * limit;

    // Build the search query
    const searchQuery = {
      ...(search && { name: { $regex: search, $options: "i" } }),
    };

    // Apply filters if provided
    if (req.query.filter && req.query.filter !== "all") {
      switch (req.query.filter) {
        case "active":
          searchQuery.isActive = "1";
          break;
        case "inactive":
          searchQuery.isActive = "0";
          break;
        case "outOfStock":
          searchQuery.stock = 0;
          break;
        default:
          // Handle unexpected filter values
          break;
      }
    }

    // Define the sorting logic
    const sortQuery = {
      custom_order: 1, // Primary sort by custom_order (ascending)
      createdAt: -1, // Secondary sort by createdAt (descending)
    };

    // Fetch products with pagination, sorting, and population
    const products = await productModel
      .find(searchQuery)
      .populate("category", "name")
      .populate("subcategory", "name")
      .select(
        "name category subcategory isActive perPiecePrice slug stock photos custom_order"
      )
      .sort(sortQuery) // Apply sorting here
      .skip(skip)
      .limit(limit);

    // Get the total count of matching products
    const total = await productModel.countDocuments(searchQuery);

    // Send the response
    res.status(200).send({
      success: true,
      total,
      page,
      limit,
      message: "Fetched products successfully",
      products,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).send({
      success: false,
      message: "Error in fetching products",
      error: error.message,
    });
  }
};



export const productListController = async (req, res) => {
  try {
    const perPage = parseInt(req.query.limit) || 12;
    const page = parseInt(req.params.page) || 1;
    const { category, subcategory, minPrice, maxPrice, sortBy, search } = req.query;
    const skip = (page - 1) * perPage;

    // Build the filter query
    const filterQuery = {
      isActive: "1",
      stock: { $gt: 0 },
    };

    if (search) {
      filterQuery.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }

    // Handle category filtering - support both ObjectId and slug/name
    if (category) {
      // Check if it's a valid ObjectId (24 hex characters)
      if (mongoose.Types.ObjectId.isValid(category) && category.length === 24) {
        filterQuery.category = category;
      } else {
        // Treat as slug or name and look up category
        const categoryDoc = await categoryModel.findOne({
          $or: [
            { slug: category.toLowerCase() },
            { name: { $regex: new RegExp(`^${category}$`, 'i') } }
          ]
        });

        if (categoryDoc) {
          filterQuery.category = categoryDoc._id;
        } else {
          // Category not found - return empty results
          return res.status(200).send({
            success: true,
            total: 0,
            products: [],
            pagination: {
              currentPage: page,
              perPage,
              totalPages: 0,
              hasNextPage: false,
              hasPrevPage: false
            },
            bandwidthUsedBytes: 0
          });
        }
      }
    }

    // Handle subcategory filtering
    if (subcategory) {
      if (mongoose.Types.ObjectId.isValid(subcategory) && subcategory.length === 24) {
        filterQuery.subcategory = new mongoose.Types.ObjectId(subcategory);
      } else {
        // Support lookup by subcategory slug too
        const subDoc = await subcategoryModel.findOne({
          $or: [
            { slug: subcategory.toLowerCase() },
            { name: { $regex: new RegExp(`^${subcategory}$`, 'i') } }
          ]
        });
        if (subDoc) {
          filterQuery.subcategory = subDoc._id;
        }
      }
    }

    console.log('DEBUG: filterQuery', JSON.stringify(filterQuery, null, 2));

    if (minPrice || maxPrice) {
      filterQuery.perPiecePrice = {};
      if (minPrice) filterQuery.perPiecePrice.$gte = parseFloat(minPrice);
      if (maxPrice) filterQuery.perPiecePrice.$lte = parseFloat(maxPrice);
    }

    // Sorting logic
    let sortQuery = { custom_order: 1, createdAt: -1 }; // Default: Popular
    if (sortBy) {
      switch (sortBy) {
        case 'price_asc':
          sortQuery = { perPiecePrice: 1, createdAt: -1 };
          break;
        case 'price_desc':
          sortQuery = { perPiecePrice: -1, createdAt: -1 };
          break;
        case 'newest':
          sortQuery = { createdAt: -1 };
          break;
        case 'popular':
          sortQuery = { custom_order: 1, createdAt: -1 };
          break;
      }
    }

    // Get total count of products matching the filter
    const total = await productModel.countDocuments(filterQuery);

    // Fetch products with pagination and sorting
    const products = await productModel
      .find(filterQuery, "name photo photos _id perPiecePrice mrp stock slug custom_order")
      .skip(skip)
      .limit(perPage)
      .sort(sortQuery);

    // Simplified response without Cloudinary bandwidth calculation
    const productsWithPhotos = products.map((product) => {
      const productObj = product.toObject();
      if (productObj.photos) {
        // Use the relative path directly; OptimizedImage on frontend handles resolving it
        productObj.photoUrl = productObj.photos;
      }
      return productObj;
    });

    // Enhanced response with pagination metadata
    res.status(200).send({
      success: true,
      count: productsWithPhotos.length,
      total,
      products: productsWithPhotos,
      currentPage: page,
      totalPages: Math.ceil(total / perPage),
      hasNextPage: skip + products.length < total,
      hasPrevPage: page > 1
    });
  } catch (error) {
    console.error(error);
    res.status(400).send({
      success: false,
      message: "Error fetching product data",
      error: error.message,
    });
  }
};

// Utility to escape regex special characters
function escapeRegex(str) {
  // Escapes: . * + ? ^ $ { } ( ) | [ ] \ /
  return str.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');
}

export const searchProductController = async (req, res) => {
  try {
    const { keyword } = req.params;
    const isObjectId = mongoose.Types.ObjectId.isValid(keyword);
    const keywordNumber = Number(keyword);
    const isNumber = !isNaN(keywordNumber);

    // Escape keyword for regex
    const safeKeyword = escapeRegex(keyword);

    // Fetch category IDs based on name match
    const categories = await categoryModel
      .find({
        name: { $regex: safeKeyword, $options: "i" },
      })
      .select("_id")
      .lean();
    const categoryIds = categories.map((c) => c._id);

    // Fetch subcategory IDs based on name match
    const subcategories = await subcategoryModel
      .find({
        name: { $regex: safeKeyword, $options: "i" },
      })
      .select("_id")
      .lean();
    const subcategoryIds = subcategories.map((c) => c._id);

    // Build the search conditions
    const searchConditions = [
      { name: { $regex: safeKeyword, $options: "i" } },
      { description: { $regex: safeKeyword, $options: "i" } },
      { tag: { $regex: safeKeyword, $options: "i" } },
      { sku: { $regex: safeKeyword, $options: "i" } },
      { slug: { $regex: safeKeyword, $options: "i" } },
      { category: { $in: categoryIds } },
      { subcategory: { $in: subcategoryIds } },
    ];

    // Add validation-specific search fields
    if (isObjectId) {
      searchConditions.push({ category: keyword });
      searchConditions.push({ subcategory: keyword });
      searchConditions.push({ brand: keyword });
    }

    if (isNumber) {
      searchConditions.push({ perPiecePrice: keywordNumber });
    }

    // Combine with filters for stock and active status
    const query = {
      $and: [
        { $or: searchConditions },
        { stock: { $gt: 0 } }, // Exclude out-of-stock
        { isActive: "1" },      // Exclude inactive products
      ]
    };

    const results = await productModel
      .find(query)
      .populate("category", "name")
      .populate("subcategory", "name")
      .populate("brand", "name")
      .sort({ createdAt: -1 });

    const resultsWithPhotos = results.map((product) => {
      const productObj = product.toObject();
      if (productObj.photos) {
        productObj.photoUrl = productObj.photos;
      }
      return productObj;
    });

    res.json(resultsWithPhotos);
  } catch (error) {
    console.error(error);
    res.status(400).send({
      success: false,
      message: "Error In Search Product API",
      error,
    });
  }
};
// realtedProductController
export const realtedProductController = async (req, res) => {
  try {
    const { pid, cid } = req.params;

    const products = await productModel
      .find({
        category: cid,
        _id: { $ne: pid },
        stock: { $gt: 0 }, // Only products with stock > 0
        isActive: "1", // Only active products
      })
      .limit(3)
      .populate("category");

    const productsWithPhotos = products.map((product) => {
      const productObj = product.toObject();
      if (productObj.photos) {
        productObj.photoUrl = productObj.photos;
      }
      return productObj;
    });

    res.status(200).send({
      success: true,
      products: productsWithPhotos,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "Error while getting related product",
      error,
    });
  }
};

// productCountController
export const productCountController = async (req, res) => {
  try {
    const total = await productModel.countDocuments({ stock: { $gt: 0 }, isActive: "1" }); // Only active products with stock > 0
    res.status(200).send({
      success: true,
      total,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      message: "Error in product count",
      error,
      success: false,
    });
  }
};

// Modified single product controller with direct photo data
export const getSingleProductController = async (req, res) => {
  try {
    const product = await productModel
      .findOne({ slug: req.params.slug })
      .populate("category")
      .populate("subcategory")
      .populate("brand");

    if (!product) {
      return res.status(404).send({
        success: false,
        message: "Product not found",
      });
    }

    // Hide inactive products from public product detail views
    if (product.isActive !== "1") {
      return res.status(404).send({
        success: false,
        message: "Product not found",
      });
    }

    // Convert photo to base64
    const productObj = product.toObject();
    if (productObj.photos) {
      productObj.photoUrl = productObj.photos;
    }

    res.status(200).send({
      success: true,
      message: "Single Product Fetched",
      product: productObj,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while getting single product",
      error,
    });
  }
};

// get photo
export const productPhotoController = async (req, res) => {
  try {
    const product = await productModel
      .findById(req.params._id)
      .select("photos");
    if (product == null) {
      return res.status(404).send({
        success: false,
        message: "Product not found",
      });
    }
    if (product.photos.data) {
      res.set("Content-type", product.photos.contentType);
      return res.status(200).send(product.photos.data);
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while getting photo",
      error,
    });
  }
};

//delete controller
export const deleteProductController = async (req, res) => {
  try {
    await productModel.findByIdAndDelete(req.params.pid).select("-photos");
    res.status(200).send({
      success: true,
      message: "Product Deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while deleting product",
      error,
    });
  }
};
// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Controller
export const processPaymentController = async (req, res) => {
  try {
    console.log(`[Payment] Request initiated | IP: ${req.ip} | Method: ${req.method}`);

    // Add request compression support
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Connection', 'keep-alive');

    // Sanitize the logging of sensitive data
    const sanitizedBody = { ...req.body };
    if (sanitizedBody.products) {
      sanitizedBody.products = `[${sanitizedBody.products.length} items]`;
    }
    console.log(`[Payment] Request body (sanitized): ${JSON.stringify(sanitizedBody, null, 2)}`);

    // Authentication check
    if (!req.user || !req.user._id) {
      console.error(`[Payment] Authentication failed | No user in request`);
      return res.status(401).json({
        success: false,
        message: "Authentication required",
        reason: "User not authenticated",
        requestId: `req-${Date.now()}` // Add request ID for tracking
      });
    }

    const { products, paymentMethod, amount, amountPending } = req.body;

    // Enhanced validation with detailed error messages
    if (!products || !Array.isArray(products)) {
      console.error(`[Payment] Validation failed | Invalid products array: ${JSON.stringify(products)}`);
      return res.status(400).json({
        success: false,
        message: "Invalid request body. Products array is required.",
        reason: "Invalid products data",
        requestId: `req-${Date.now()}`
      });
    }

    if (products.length === 0) {
      console.error(`[Payment] Validation failed | Empty products array`);
      return res.status(400).json({
        success: false,
        message: "Products array must not be empty.",
        reason: "Empty products data",
        requestId: `req-${Date.now()}`
      });
    }

    // Validate each product has required fields
    for (const [index, item] of products.entries()) {
      if (!item.product || !mongoose.Types.ObjectId.isValid(item.product)) {
        console.error(`[Payment] Validation failed | Invalid product ID at index ${index}: ${item.product}`);
        return res.status(400).json({
          success: false,
          message: `Invalid product ID at position ${index + 1}`,
          reason: "Invalid product data",
          requestId: `req-${Date.now()}`
        });
      }

      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        console.error(`[Payment] Validation failed | Invalid quantity at index ${index}: ${item.quantity}`);
        return res.status(400).json({
          success: false,
          message: `Invalid quantity at position ${index + 1}. Must be a positive integer.`,
          reason: "Invalid quantity data",
          requestId: `req-${Date.now()}`
        });
      }
    }

    if (!paymentMethod) {
      console.error(`[Payment] Validation failed | Missing payment method`);
      return res.status(400).json({
        success: false,
        message: "Payment method is required",
        reason: "Missing payment method",
        requestId: `req-${Date.now()}`
      });
    }

    // For COD orders, allow zero amount with non-zero amountPending
    if (paymentMethod === "COD") {
      if ((isNaN(amount) || amount < 0) || (isNaN(amountPending) || amountPending <= 0)) {
        console.error(`[Payment] Validation failed | Invalid amount combination: amount=${amount}, amountPending=${amountPending}`);
        return res.status(400).json({
          success: false,
          message: "For COD orders, amount must be 0 or greater and amountPending must be positive.",
          reason: "Invalid amount values for COD",
          requestId: `req-${Date.now()}`
        });
      }
    } else {
      // For non-COD payments, require positive amount
      if (isNaN(amount) || amount <= 0) {
        console.error(`[Payment] Validation failed | Invalid amount: ${amount}`);
        return res.status(400).json({
          success: false,
          message: "Invalid amount. Amount must be a positive number.",
          reason: "Invalid amount",
          requestId: `req-${Date.now()}`
        });
      }
    }

    console.log(`[Payment] Processing payment for user: ${req.user._id} | Method: ${paymentMethod} | Amount: ${amount} | Pending: ${amountPending || 0}`);

    // Handle COD orders immediately
    if (paymentMethod === "COD") {
      console.log(`[Payment] Processing ${paymentMethod} order`);

      try {
        // Wrap stock validation in a timeout to prevent hanging
        const stockValidationPromise = new Promise(async (resolve, reject) => {
          try {
            // Stock validation before creating order with improved error handling
            for (const item of products) {
              const product = await productModel.findById(item.product);
              if (!product) {
                console.error(`[Payment] Product not found | ID: ${item.product}`);
                return reject({
                  statusCode: 404,
                  message: `Product with ID ${item.product} not found`,
                  reason: "Product not found"
                });
              }

              if (product.stock < item.quantity) {
                console.error(`[Payment] Insufficient stock | Product: ${product.name} | Available: ${product.stock} | Requested: ${item.quantity}`);
                return reject({
                  statusCode: 400,
                  message: `Insufficient stock for product "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`,
                  reason: "Insufficient stock"
                });
              }
            }
            resolve(true);
          } catch (error) {
            reject({
              statusCode: 500,
              message: `Error validating stock: ${error.message}`,
              reason: "Stock validation error"
            });
          }
        });

        // Set a timeout for stock validation
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject({
              statusCode: 408,
              message: "Request timeout while validating stock",
              reason: "Stock validation timeout"
            });
          }, 30000); // 30-second timeout
        });

        try {
          await Promise.race([stockValidationPromise, timeoutPromise]);
        } catch (validationError) {
          return res.status(validationError.statusCode || 500).json({
            success: false,
            message: validationError.message,
            reason: validationError.reason,
            requestId: `req-${Date.now()}`
          });
        }

        const totalOrderAmount = amountPending || amount;

        // Ensure we have a valid total order amount
        if (isNaN(totalOrderAmount) || totalOrderAmount <= 0) {
          console.error(`[Payment] Invalid total order amount: ${totalOrderAmount}`);
          return res.status(400).json({
            success: false,
            message: "Invalid total order amount. Either amount or amountPending must be positive.",
            reason: "Invalid total amount",
            requestId: `req-${Date.now()}`
          });
        }

        // Enrich products with snapshot data
        const enrichedProducts = await enrichOrderProducts(products);
        console.log(`[Payment] Products enriched with snapshot data | Count: ${enrichedProducts.length}`);

        const order = new orderModel({
          products: enrichedProducts,
          payment: {
            paymentMethod,
            transactionId: `${paymentMethod}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            status: paymentMethod === "COD" ? false : true,
          },
          buyer: req.user._id,
          amount: amount,
          amountPending: amountPending || 0,
          status: "Pending",
        });

        await order.save();
        console.log(`[Payment] ${paymentMethod} order saved successfully | Order ID: ${order._id}`);

        // Update stock for each product with timeout handling
        const updateStockPromise = new Promise(async (resolve, reject) => {
          try {
            await Promise.all(
              products.map(async (item) => {
                console.log(`[Payment] Updating stock for product: ${item.product} | Quantity: -${item.quantity}`);
                const updatedProduct = await productModel.findByIdAndUpdate(
                  item.product,
                  { $inc: { stock: -item.quantity } }, // Decrease stock
                  { new: true }
                );

                if (!updatedProduct) {
                  throw new Error(`Failed to update stock for product: ${item.product}`);
                }

                console.log(`[Payment] Stock updated | Product: ${item.product} | New stock: ${updatedProduct.stock}`);
              })
            );
            resolve(true);
          } catch (error) {
            reject(error);
          }
        });

        const stockUpdateTimeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error("Timeout while updating product stock"));
          }, 30000); // 30-second timeout
        });

        try {
          await Promise.race([updateStockPromise, stockUpdateTimeoutPromise]);
        } catch (stockError) {
          console.error(`[Payment] Stock update failed | Error: ${stockError.message}`);
          // Attempt to roll back the order if stock update fails
          try {
            await orderModel.findByIdAndDelete(order._id);
            console.log(`[Payment] Order rolled back | Order ID: ${order._id}`);
          } catch (rollbackError) {
            console.error(`[Payment] Failed to roll back order | Error: ${rollbackError.message}`);
          }

          return res.status(500).json({
            success: false,
            message: `Failed to update product stock: ${stockError.message}`,
            requestId: `req-${Date.now()}`
          });
        }

        return res.json({
          success: true,
          message: `${paymentMethod} order placed successfully`,
          order,
          requestId: `req-${Date.now()}`
        });
      } catch (codError) {
        console.error(`[Payment] ${paymentMethod} order processing failed | Error: ${codError.message}`);
        return res.status(500).json({
          success: false,
          message: `Error processing ${paymentMethod} order`,
          error: codError.message,
          requestId: `req-${Date.now()}`
        });
      }
    }

    // Online payment via Razorpay
    console.log(`[Payment] Initiating Razorpay payment | Amount: ${amount}`);

    // Validate product stock before creating Razorpay order with timeout handling
    const stockValidationPromise = new Promise(async (resolve, reject) => {
      try {
        for (const item of products) {
          const product = await productModel.findById(item.product);
          if (!product) {
            console.error(`[Payment] Product not found | ID: ${item.product}`);
            return reject({
              statusCode: 404,
              message: `Product with ID ${item.product} not found`,
              reason: "Product not found"
            });
          }

          if (product.stock < item.quantity) {
            console.error(`[Payment] Insufficient stock | Product: ${product.name} | Available: ${product.stock} | Requested: ${item.quantity}`);
            return reject({
              statusCode: 400,
              message: `Insufficient stock for product "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`,
              reason: "Insufficient stock"
            });
          }
        }
        resolve(true);
      } catch (error) {
        reject({
          statusCode: 500,
          message: `Error validating stock: ${error.message}`,
          reason: "Stock validation error"
        });
      }
    });

    const stockValidationTimeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject({
          statusCode: 408,
          message: "Request timeout while validating stock",
          reason: "Stock validation timeout"
        });
      }, 30000); // 30-second timeout
    });

    try {
      await Promise.race([stockValidationPromise, stockValidationTimeoutPromise]);
    } catch (validationError) {
      return res.status(validationError.statusCode || 500).json({
        success: false,
        message: validationError.message,
        reason: validationError.reason,
        requestId: `req-${Date.now()}`
      });
    }

    try {
      const razorpayOrderData = {
        amount: Math.round(amount * 100),
        currency: "INR",
        receipt: `order_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        notes: {
          paymentMethod,
          baseAmount: amount,
          amountPending: amountPending || 0,
          userId: req.user._id.toString(),
          products: JSON.stringify(products),
          requestTimestamp: Date.now()
        },
      };

      // Set a timeout for Razorpay API call
      const razorpayPromise = razorpay.orders.create(razorpayOrderData);
      const razorpayTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error("Razorpay API request timed out"));
        }, 30000); // 30-second timeout
      });

      const razorpayOrder = await Promise.race([razorpayPromise, razorpayTimeoutPromise]);
      console.log(`[Payment] Razorpay order created | Order ID: ${razorpayOrder.id} | Amount: ${razorpayOrder.amount / 100}`);

      res.json({
        success: true,
        message: "Razorpay order initiated",
        razorpayOrder,
        key: process.env.RAZORPAY_KEY_ID,
        requestId: `req-${Date.now()}`
      });
    } catch (razorpayError) {
      console.error(`[Payment] Razorpay order creation failed | Error: ${razorpayError.message}`);
      return res.status(500).json({
        success: false,
        message: "Failed to create Razorpay order",
        error: razorpayError.message,
        requestId: `req-${Date.now()}`
      });
    }
  } catch (error) {
    console.error(`[Payment] Unhandled exception in processPaymentController | Error: ${error.message}`);
    console.error(error.stack);
    res.status(500).json({
      success: false,
      message: "Error in payment processing",
      error: error.message,
      requestId: `req-${Date.now()}`
    });
  }
};

export const verifyPaymentController = async (req, res) => {
  try {
    console.log(`[Verification] Payment verification initiated | IP: ${req.ip}`);
    console.log(`[Verification] Request body: ${JSON.stringify(req.body, null, 2)}`);

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Validation
    if (!razorpay_order_id) {
      console.error(`[Verification] Missing order ID`);
      return res.status(400).json({
        success: false,
        message: "Missing Razorpay order ID",
      });
    }

    if (!razorpay_payment_id) {
      console.error(`[Verification] Missing payment ID`);
      return res.status(400).json({
        success: false,
        message: "Missing Razorpay payment ID",
      });
    }

    if (!razorpay_signature) {
      console.error(`[Verification] Missing payment signature`);
      return res.status(400).json({
        success: false,
        message: "Missing Razorpay signature",
      });
    }

    console.log(`[Verification] Verifying payment signature | Order ID: ${razorpay_order_id} | Payment ID: ${razorpay_payment_id}`);

    // Verify signature
    try {
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        console.error(`[Verification] Invalid payment signature | Expected: ${expectedSignature} | Received: ${razorpay_signature}`);
        return res.status(400).json({
          success: false,
          message: "Invalid payment signature. This could be a fraudulent request.",
        });
      }

      console.log(`[Verification] Payment signature verified successfully`);
    } catch (signatureError) {
      console.error(`[Verification] Signature verification failed | Error: ${signatureError.message}`);
      return res.status(500).json({
        success: false,
        message: "Failed to verify payment signature",
        error: signatureError.message,
      });
    }

    // Fetch Razorpay order
    let razorpayOrder;
    try {
      console.log(`[Verification] Fetching Razorpay order | Order ID: ${razorpay_order_id}`);
      razorpayOrder = await razorpay.orders.fetch(razorpay_order_id);
      console.log(`[Verification] Razorpay order fetched | Status: ${razorpayOrder.status} | Amount: ${razorpayOrder.amount / 100}`);

      // Verify payment status
      if (razorpayOrder.status !== 'paid') {
        console.error(`[Verification] Order not paid | Status: ${razorpayOrder.status}`);
        return res.status(400).json({
          success: false,
          message: `Payment not completed. Order status: ${razorpayOrder.status}`,
        });
      }
    } catch (fetchError) {
      console.error(`[Verification] Failed to fetch Razorpay order | Error: ${fetchError.message}`);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch Razorpay order details",
        error: fetchError.message,
      });
    }

    // Fetch payment details to verify amount
    let paymentDetails;
    try {
      console.log(`[Verification] Fetching payment details | Payment ID: ${razorpay_payment_id}`);
      paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
      console.log(`[Verification] Payment details fetched | Status: ${paymentDetails.status} | Amount: ${paymentDetails.amount / 100}`);

      // Verify payment status
      if (paymentDetails.status !== 'captured') {
        console.error(`[Verification] Payment not captured | Status: ${paymentDetails.status}`);
        return res.status(400).json({
          success: false,
          message: `Payment not captured. Payment status: ${paymentDetails.status}`,
        });
      }

      // Verify payment amount matches order amount
      if (paymentDetails.amount !== razorpayOrder.amount) {
        console.error(`[Verification] Amount mismatch | Order amount: ${razorpayOrder.amount} | Paid amount: ${paymentDetails.amount}`);
        return res.status(400).json({
          success: false,
          message: "Payment amount does not match order amount",
        });
      }
    } catch (paymentFetchError) {
      console.error(`[Verification] Failed to fetch payment details | Error: ${paymentFetchError.message}`);
      return res.status(500).json({
        success: false,
        message: "Failed to verify payment details",
        error: paymentFetchError.message,
      });
    }

    // Parse products data
    let products;
    try {
      products = JSON.parse(razorpayOrder.notes.products);
      console.log(`[Verification] Parsed products data | Count: ${products.length}`);
    } catch (parseError) {
      console.error(`[Verification] Failed to parse products data | Error: ${parseError.message}`);
      return res.status(500).json({
        success: false,
        message: "Failed to parse order product data",
        error: parseError.message,
      });
    }

    // Transaction management - use a session to ensure atomicity
    let session;
    try {
      session = await mongoose.startSession();
      session.startTransaction();
      console.log(`[Verification] Transaction started`);

      // Enrich products with snapshot data
      const enrichedProducts = await enrichOrderProducts(products);
      console.log(`[Verification] Products enriched with snapshot data | Count: ${enrichedProducts.length}`);

      // Create order
      const order = new orderModel({
        products: enrichedProducts,
        payment: {
          paymentMethod: "Razorpay",
          transactionId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          status: true,
        },
        buyer: razorpayOrder.notes.userId,
        amount: parseFloat(razorpayOrder.notes.baseAmount),
        status: "Pending",
      });

      await order.save({ session });
      console.log(`[Verification] Order created | Order ID: ${order._id}`);

      // Update stock for each product
      for (const item of products) {
        console.log(`[Verification] Updating stock | Product: ${item.product} | Quantity: -${item.quantity}`);
        const updatedProduct = await productModel.findByIdAndUpdate(
          item.product,
          { $inc: { stock: -item.quantity } },
          { new: true, session }
        );

        if (!updatedProduct) {
          throw new Error(`Product with ID ${item.product} not found`);
        }

        console.log(`[Verification] Stock updated | Product: ${updatedProduct.name} | New stock: ${updatedProduct.stock}`);
      }

      // Commit transaction
      await session.commitTransaction();
      console.log(`[Verification] Transaction committed successfully`);
      session.endSession();

      res.json({
        success: true,
        message: "Payment verified and order created successfully",
        order,
      });
    } catch (transactionError) {
      console.error(`[Verification] Transaction failed | Error: ${transactionError.message}`);

      // Abort transaction if it exists and is active
      if (session) {
        try {
          await session.abortTransaction();
          console.log(`[Verification] Transaction aborted`);
          session.endSession();
        } catch (abortError) {
          console.error(`[Verification] Failed to abort transaction | Error: ${abortError.message}`);
        }
      }

      res.status(500).json({
        success: false,
        message: "Failed to process verified payment",
        error: transactionError.message,
      });
    }
  } catch (error) {
    console.error(`[Verification] Unhandled exception in verifyPaymentController | Error: ${error.message}`);
    console.error(error.stack);
    res.status(500).json({
      success: false,
      message: "Error in payment verification",
      error: error.message,
    });
  }
};

// Get payment status
export const getPaymentStatusController = async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log(`[Status] Fetching payment status | Order ID: ${orderId}`);

    if (!orderId) {
      console.error(`[Status] Missing order ID`);
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    // Validate orderId format (assuming MongoDB ObjectId)
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      console.error(`[Status] Invalid order ID format | ID: ${orderId}`);
      return res.status(400).json({
        success: false,
        message: "Invalid order ID format",
      });
    }

    const order = await orderModel.findById(orderId);

    if (!order) {
      console.error(`[Status] Order not found | ID: ${orderId}`);
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    console.log(`[Status] Order found | Payment method: ${order.payment.paymentMethod}`);

    if (order.payment.paymentMethod === "COD") {
      console.log(`[Status] COD order status returned | Order ID: ${orderId}`);
      return res.json({
        success: true,
        status: "COD",
        order,
      });
    }

    if (order.payment.paymentMethod === "Advance") {
      console.log(`[Status] Advance payment order status returned | Order ID: ${orderId}`);
      return res.json({
        success: true,
        status: "Advance Payment",
        order,
      });
    }

    // For Razorpay payments, fetch status from Razorpay
    try {
      console.log(`[Status] Fetching Razorpay payment | Payment ID: ${order.payment.razorpayPaymentId}`);
      const payment = await razorpay.payments.fetch(order.payment.razorpayPaymentId);
      console.log(`[Status] Razorpay payment status: ${payment.status} | Order ID: ${orderId}`);

      res.json({
        success: true,
        status: payment.status,
        order,
        payment,
      });
    } catch (razorpayError) {
      console.error(`[Status] Failed to fetch Razorpay payment | Error: ${razorpayError.message}`);

      // Still return order info even if Razorpay fetch fails
      res.json({
        success: true,
        status: "unknown",
        message: "Could not fetch payment status from Razorpay",
        order,
        error: razorpayError.message,
      });
    }
  } catch (error) {
    console.error(`[Status] Error in getPaymentStatusController | Error: ${error.message}`);
    console.error(error.stack);
    res.status(500).json({
      success: false,
      message: "Error fetching payment status",
      error: error.message,
    });
  }
};

export const getProductPhoto = async (req, res) => {
  try {
    const product = await productModel.findById(req.params.pid).select("photo");
    if (product == null || product.photo == null) {
      return res.status(404).send({
        success: false,
        message: "Product photo not found",
      });
    }
    res.set("Content-type", product.photo.contentType);
    return res.status(200).send(product.photo.data);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while getting photo",
      error,
    });
  }
};

// Controller to get products by category slug with filtering
export const productCategoryController = async (req, res) => {
  try {
    // Find category by slug from URL parameters
    const category = await categoryModel.findOne({ slug: req.params.slug });
    if (!category) {
      return res.status(404).send({
        success: false,
        message: "Category not found",
      });
    }

    // --- Pagination Parameters ---
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 12, 1);
    const { minPrice, maxPrice, sortBy } = req.query;
    const skip = (page - 1) * limit;

    // --- Build Filter Query ---
    const filterQuery = {
      category: category._id,
      isActive: "1",
      stock: { $gt: 0 },
    };

    if (minPrice || maxPrice) {
      filterQuery.perPiecePrice = {};
      if (minPrice) filterQuery.perPiecePrice.$gte = parseFloat(minPrice);
      if (maxPrice) filterQuery.perPiecePrice.$lte = parseFloat(maxPrice);
    }

    // --- Sorting Logic ---
    let sortQuery = { custom_order: 1, createdAt: -1 };
    if (sortBy) {
      switch (sortBy) {
        case 'price_asc':
          sortQuery = { perPiecePrice: 1, createdAt: -1 };
          break;
        case 'price_desc':
          sortQuery = { perPiecePrice: -1, createdAt: -1 };
          break;
        case 'newest':
          sortQuery = { createdAt: -1 };
          break;
        case 'popular':
          sortQuery = { custom_order: 1, createdAt: -1 };
          break;
      }
    }

    // --- Database Queries ---
    // Get total count of products matching the filter
    const total = await productModel.countDocuments(filterQuery);

    // Fetch products with filtering, sorting, and pagination
    const products = await productModel
      .find(filterQuery)
      .populate("category", "name") // Populate category name for context
      .sort(sortQuery)
      .select("name category photos _id perPiecePrice mrp stock slug custom_order isActive") // Select necessary fields
      .skip(skip)
      .limit(limit);

    // --- Post-processing and Response ---
    // Calculate if there are more products to load
    const hasMore = total > skip + products.length;

    // Process products to attach photo URLs
    const productsWithPhotos = products.map((product) => {
      const productObj = product.toObject(); // Convert Mongoose doc to plain object
      if (productObj.photos) {
        productObj.photoUrl = productObj.photos;
      } else {
        productObj.photoUrl = null; // Set to null if no photo exists
      }
      return productObj;
    });

    // Send response with pagination metadata
    res.status(200).send({
      success: true,
      category, // Send category details
      total, // Total matching products
      products: productsWithPhotos, // Products for the current page
      count: products.length, // Count for the current page
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      hasMore // Indicate if more pages are available
    });

  } catch (error) {
    // --- Error Handling ---
    console.error("Error in productCategoryController:", error); // Log the detailed error
    res.status(500).send({
      success: false,
      error: error.message,
      message: "Error while getting products by category",
    });
  }
};

// Controller to get products by subcategory ID with filtering
export const productSubcategoryController = async (req, res) => {
  try {
    const { subcategoryId } = req.params;

    // --- Pagination Parameters ---
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 12, 1);
    const { minPrice, maxPrice, sortBy } = req.query;
    const skip = (page - 1) * limit;

    // --- Build Filter Query ---
    const filterQuery = {
      subcategory: subcategoryId,
      isActive: "1",
      stock: { $gt: 0 },
    };

    if (minPrice || maxPrice) {
      filterQuery.perPiecePrice = {};
      if (minPrice) filterQuery.perPiecePrice.$gte = parseFloat(minPrice);
      if (maxPrice) filterQuery.perPiecePrice.$lte = parseFloat(maxPrice);
    }

    // --- Sorting Logic ---
    let sortQuery = { custom_order: 1, createdAt: -1 };
    if (sortBy) {
      switch (sortBy) {
        case 'price_asc':
          sortQuery = { perPiecePrice: 1, createdAt: -1 };
          break;
        case 'price_desc':
          sortQuery = { perPiecePrice: -1, createdAt: -1 };
          break;
        case 'newest':
          sortQuery = { createdAt: -1 };
          break;
        case 'popular':
          sortQuery = { custom_order: 1, createdAt: -1 };
          break;
      }
    }

    // --- Database Queries ---
    // Get total count of products matching the filter
    const total = await productModel.countDocuments(filterQuery);

    // Fetch products with filtering, sorting, and pagination
    const products = await productModel
      .find(filterQuery)
      .sort(sortQuery)
      .select("name photos _id perPiecePrice mrp stock slug custom_order isActive") // Select fields
      .skip(skip)
      .limit(limit);

    // --- Post-processing and Response ---
    // Calculate if there are more products to load
    const hasMore = total > skip + products.length;

    // Process products to include photo URLs
    const productsWithPhotos = products.map((product) => {
      const productObj = product.toObject();
      if (productObj.photos) {
        productObj.photoUrl = productObj.photos;
      } else {
        productObj.photoUrl = null;
      }
      return productObj;
    });

    // Send response with pagination metadata
    res.status(200).send({
      success: true,
      message: "Products fetched successfully by subcategory",
      subcategoryId, // Send subcategory ID
      products: productsWithPhotos,
      total,
      count: products.length,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      hasMore
    });

  } catch (error) {
    // --- Error Handling ---
    console.error("Error in productSubcategoryController:", error);
    res.status(500).send({
      success: false,
      error: error.message,
      message: "Error while getting products by subcategory",
    });
  }
};

// productFiltersController
export const productFiltersController = async (req, res) => {
  try {
    const { checked, radio } = req.body;
    let args = {
      ...(checked.length > 0 && { category: checked }),
      ...(radio.length && { price: { $gte: radio[0], $lte: radio[1] } }),
      stock: { $gt: 0 }, // Only products with stock > 0
    };

    const products = await productModel.find(args);
    res.status(200).send({
      success: true,
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "Error while filtering products",
      error,
    });
  }
};
