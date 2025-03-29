import mongoose from "mongoose";
import productModel from "../models/productModel.js";
import subcategoryModel from "../models/subcategoryModel.js";
import categoryModel from "../models/categoryModel.js";
import orderModel from "../models/orderModel.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import fs from "fs";
import slugify from "slugify";
import dotenv from "dotenv";
import { uploadToImageKit } from "../utils/imageKitService.js"; // Changed from imageService.js to imageKitService.js
import cloudinary from "cloudinary"; // Import Cloudinary
dotenv.config();

// Configure Cloudinary
try {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
} catch (error) {
  console.error('Error configuring Cloudinary:', error);
}

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
    console.log("req.files:", req.files);
    console.log("req.imageUrl:", req.imageUrl);
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
      photos, // fallback if no image uploaded via middleware
      multipleimages,
      custom_order,
    } = req.fields;

    // Handle files from request
    const { photo, images } = req.files || {};
    console.log("photo:", photo);
    console.log("images:", images);
    console.log("photos:", photos);

    // Photo validation for Buffer-based images
    if (photo && photo.size > 1000000) {
      return res
        .status(400)
        .send({ error: "Photo size should be less than 1MB." });
    }

    if (images) {
      const imageArray = Array.isArray(images) ? images : [images];
      for (let img of imageArray) {
        if (img.size > 1000000) {
          return res
            .status(400)
            .send({ error: "Each image size should be less than 1MB." });
        }
      }
    }

    // Function to upload image to Cloudinary
    const uploadToCloudinary = async (file, folder) => {
      try {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: folder,
          use_filename: true,
          unique_filename: false,
        });
        return result.secure_url;
      } catch (error) {
        console.error("Cloudinary upload error:", error);
        throw error;
      }
    };

    // Upload primary photo to Cloudinary
    let productPhoto = req.imageUrl || photos || null;
    if (photo && !req.imageUrl) {
      try {
        const photoFile = {
          name: photo.name || "product-photo.jpg",
          type: photo.type,
          size: photo.size,
          path: photo.path,
        };
        productPhoto = await uploadToCloudinary(photoFile, "products");
      } catch (uploadError) {
        console.error("Error uploading to Cloudinary:", uploadError);
        // Fallback to ImageKit or local storage if Cloudinary fails
      }
    }

    // Upload multiple images to Cloudinary
    let imageUrls = [];
    if (images) {
      const imageArray = Array.isArray(images) ? images : [images];
      try {
        const uploadPromises = imageArray.map(async (img) => {
          const imgFile = {
            name: img.name || `product-image-${Date.now()}.jpg`,
            type: img.type,
            size: img.size,
            path: img.path,
          };
          return await uploadToCloudinary(imgFile, "products/gallery");
        });
        imageUrls = (await Promise.all(uploadPromises)).filter(
          (url) => url !== null
        );
      } catch (uploadError) {
        console.error(
          "Error uploading multiple images to Cloudinary:",
          uploadError
        );
        // Fallback logic
      }
    }

    // Parse multipleimages if provided as string
    let parsedMultipleImages = [];
    if (multipleimages) {
      try {
        parsedMultipleImages =
          typeof multipleimages === "string"
            ? JSON.parse(multipleimages)
            : Array.isArray(multipleimages)
            ? multipleimages
            : [multipleimages];
      } catch (error) {
        console.warn("Error parsing multiple images:", error);
        parsedMultipleImages = Array.isArray(multipleimages)
          ? multipleimages
          : multipleimages
          ? [multipleimages]
          : [];
      }
    }

    // Combine existing image URLs with newly uploaded ones
    const finalMultipleImages = [...parsedMultipleImages, ...imageUrls];

    // Parse bulkProducts if provided
    let formattedBulkProducts = null;
    if (bulkProducts) {
      if (typeof bulkProducts === "string") {
        try {
          formattedBulkProducts = JSON.parse(bulkProducts);
        } catch (error) {
          console.error("Error parsing bulkProducts:", error);
          return res.status(400).send({ error: "Invalid bulkProducts data" });
        }
      }
      if (formattedBulkProducts && !Array.isArray(formattedBulkProducts)) {
        return res.status(400).send({ error: "bulkProducts must be an array" });
      }
      if (Array.isArray(formattedBulkProducts)) {
        formattedBulkProducts = formattedBulkProducts.map((item) => ({
          minimum: isNaN(parseInt(item.minimum)) ? 0 : parseInt(item.minimum),
          maximum: isNaN(parseInt(item.maximum)) ? 0 : parseInt(item.maximum),
          discount_mrp: isNaN(parseFloat(item.discount_mrp))
            ? 0
            : parseFloat(item.discount_mrp),
          selling_price_set: isNaN(parseFloat(item.selling_price_set))
            ? 0
            : parseFloat(item.selling_price_set),
        }));
      }
    }

    // Parse fk_tags if provided
    let parsedFkTags = [];
    if (fk_tags) {
      try {
        parsedFkTags =
          typeof fk_tags === "string" ? JSON.parse(fk_tags) : fk_tags;
      } catch (error) {
        console.warn("Error parsing FK tags:", error);
        parsedFkTags = Array.isArray(fk_tags)
          ? fk_tags
          : fk_tags
          ? [fk_tags]
          : [];
      }
    }

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

    // Determine custom order if needed
    let productCustomOrder = custom_order;
    if (!productCustomOrder) {
      const lastProduct = await productModel
        .findOne()
        .sort({ custom_order: -1 })
        .select("custom_order");

      productCustomOrder = lastProduct?.custom_order
        ? lastProduct.custom_order + 1
        : 1;
    }

    // Create the new product
    const newProduct = new productModel({
      name,
      slug: slugify(name),
      description,
      price: parseFloat(price),
      category: mongoose.Types.ObjectId(category),
      subcategory: mongoose.Types.ObjectId(subcategory),
      brand: mongoose.Types.ObjectId(brand),
      quantity: parseInt(quantity),
      stock: parseInt(stock) || 0,
      shipping: shipping === "1",
      hsn,
      unit,
      unitSet: parseInt(unitSet),
      additionalUnit,
      gst: parseFloat(gst),
      gstType,
      purchaseRate: parseFloat(purchaseRate),
      mrp: parseFloat(mrp),
      perPiecePrice: parseFloat(perPiecePrice),
      weight: parseFloat(weight),
      youtubeUrl,
      sku: sku || generateSKU(),
      bulkProducts: formattedBulkProducts || [],
      allowCOD: allowCOD === "1",
      returnProduct: returnProduct === "1",
      userId,
      isActive: "1",
      variants: variants ? JSON.parse(variants) : [],
      sets: sets ? JSON.parse(sets) : [],
      tag: Array.isArray(tag) ? tag : tag ? [tag] : [],
      fk_tags: parsedFkTags,
      photos: productPhoto, // Use Cloudinary URL
      multipleimages: finalMultipleImages,
      custom_order: productCustomOrder,
    });

    // Handle Buffer-based photo if ImageKit upload failed
    if (photo && !productPhoto) {
      newProduct.photo = {
        data: fs.readFileSync(photo.path),
        contentType: photo.type,
      };
    }

    // Handle Buffer-based multiple images if ImageKit upload failed
    if (images && finalMultipleImages.length === parsedMultipleImages.length) {
      const imageArray = Array.isArray(images) ? images : [images];
      newProduct.images = imageArray.map((img) => ({
        data: fs.readFileSync(img.path),
        contentType: img.type,
      }));
    }

    // Save the product in MongoDB
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
      photos, // fallback if no image uploaded via middleware
      multipleimages,
      custom_order,
    } = req.fields;

    // Handle files from request
    const { photo, images } = req.files || {};

    // Find the original product
    const product = await productModel.findById(req.params.pid);
    if (!product) {
      return res.status(404).send({ error: "Product not found" });
    }

    // Preserve original custom order and assign a new one if needed
    const originalOrder = product.custom_order;
    const finalCustomOrder = await CustomOrderService.assignCustomOrder(
      custom_order,
      originalOrder,
      req.params.pid
    );

    // Prepare updated fields (converting numeric/JSON values as needed)
    const updatedFields = {
      name,
      description,
      slug: slugify(name),
      price: parseFloat(price),
      category: mongoose.Types.ObjectId(category),
      subcategory: mongoose.Types.ObjectId(subcategory),
      brand: mongoose.Types.ObjectId(brand),
      quantity: parseInt(quantity),
      stock: parseInt(stock) || 0,
      minimumqty: parseInt(minimumqty),
      shipping: shipping === "1",
      hsn,
      unit,
      unitSet: parseInt(unitSet),
      additionalUnit,
      gst: parseFloat(gst),
      gstType,
      purchaseRate: parseFloat(purchaseRate),
      mrp: parseFloat(mrp),
      perPiecePrice: parseFloat(perPiecePrice),
      setPrice: parseFloat(setPrice),
      weight: parseFloat(weight),
      allowCOD: allowCOD === "1",
      returnProduct: returnProduct === "1",
      userId,
      isActive: "1",
      variants: JSON.parse(variants || "[]"),
      sets: JSON.parse(sets || "[]"),
      sku,
      youtubeUrl: youtubeUrl || "",
      tag: Array.isArray(tag) ? tag : tag ? [tag] : [],
      // Use existing photo if none provided
      photos: photos || product.photos,
      custom_order: finalCustomOrder,
      multipleimages: Array.isArray(multipleimages)
        ? multipleimages
        : multipleimages
        ? [multipleimages]
        : [],
    };

    // Handle FK tags
    if (fk_tags) {
      let parsedFkTags = [];
      if (typeof fk_tags === "string") {
        try {
          parsedFkTags = JSON.parse(fk_tags);
        } catch (error) {
          console.error("Error parsing fk_tags:", error);
          return res.status(400).send({ error: "Invalid fk_tags data" });
        }
      } else if (Array.isArray(fk_tags)) {
        parsedFkTags = fk_tags;
      }
      updatedFields.fk_tags = parsedFkTags;
    }

    // Handle bulkProducts parsing
    if (bulkProducts) {
      let formattedBulkProducts = null;
      if (typeof bulkProducts === "string") {
        try {
          formattedBulkProducts = JSON.parse(bulkProducts);
        } catch (error) {
          console.error("Error parsing bulkProducts:", error);
          return res.status(400).send({ error: "Invalid bulkProducts data" });
        }
      }
      if (Array.isArray(formattedBulkProducts)) {
        formattedBulkProducts = formattedBulkProducts.map((item) => ({
          minimum: parseInt(item.minimum),
          maximum: parseInt(item.maximum),
          discount_mrp: parseFloat(item.discount_mrp),
          selling_price_set: parseFloat(item.selling_price_set),
        }));
      }
      updatedFields.bulkProducts = formattedBulkProducts;
    }

    // === Cloud Upload Logic for Primary Photo ===
    let productPhoto = req.imageUrl || photos || product.photos;
    if (photo && !req.imageUrl) {
      try {
        const photoFile = {
          name: photo.name || "product-photo.jpg",
          type: photo.type,
          size: photo.size,
          path: photo.path,
        };
        productPhoto = await uploadToCloudinary(photoFile, "products");
      } catch (uploadError) {
        console.error("Error uploading to Cloudinary:", uploadError);
        // Fallback logic
      }
    }
    updatedFields.photos = productPhoto;

    // === Cloud Upload Logic for Multiple Images ===
    let imageUrls = [];
    if (images) {
      const imageArray = Array.isArray(images) ? images : [images];
      try {
        const uploadPromises = imageArray.map(async (img) => {
          const imgFile = {
            name: img.name || `product-image-${Date.now()}.jpg`,
            type: img.type,
            size: img.size,
            path: img.path,
          };
          return await uploadToCloudinary(imgFile, "products/gallery");
        });
        imageUrls = (await Promise.all(uploadPromises)).filter(
          (url) => url !== null
        );
      } catch (uploadError) {
        console.error(
          "Error uploading multiple images to Cloudinary:",
          uploadError
        );
        // Fallback logic
      }
    }
    // Parse multipleimages from req.fields if provided
    let parsedMultipleImages = [];
    if (multipleimages) {
      try {
        parsedMultipleImages =
          typeof multipleimages === "string"
            ? JSON.parse(multipleimages)
            : Array.isArray(multipleimages)
            ? multipleimages
            : [multipleimages];
      } catch (error) {
        console.warn("Error parsing multiple images:", error);
        parsedMultipleImages = Array.isArray(multipleimages)
          ? multipleimages
          : multipleimages
          ? [multipleimages]
          : [];
      }
    }
    const finalMultipleImages = [...parsedMultipleImages, ...imageUrls];
    updatedFields.multipleimages = finalMultipleImages;

    // Update the product document with the new fields
    Object.assign(product, updatedFields);

    // Fallback: if cloud upload did not occur, you can use Buffer-based handling
    if (photo && !productPhoto) {
      product.photo = {
        data: fs.readFileSync(photo.path),
        contentType: photo.type,
      };
    }
    if (images && finalMultipleImages.length === parsedMultipleImages.length) {
      const imageArray = Array.isArray(images) ? images : [images];
      product.images = imageArray.map((img) => ({
        data: fs.readFileSync(img.path),
        contentType: img.type,
      }));
    }

    // Save the updated product
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

// Helper function: wrap Cloudinary API resource call into a promise to get file size (bytes)
const getResourceBytes = (publicId) => {
  return new Promise((resolve) => {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      console.warn('Cloudinary configuration missing - skipping bandwidth calculation');
      return resolve(0);
    }

    cloudinary.api.resource(publicId, (error, result) => {
      if (error) {
        console.error(`Error fetching resource for ${publicId}:`, error);
        return resolve(0); // resolve with 0 if there's an error
      }
      resolve(result.bytes || 0);
    });
  });
};

export const productListController = async (req, res) => {
  try {
    const perPage = parseInt(req.query.limit) || 10;
    const page = parseInt(req.params.page) || 1;
    const isActiveFilter = req.query.isActive || "1";
    const stocks = req.query.stock || "1";
    const skip = (page - 1) * perPage;

    // Build the filter query
    const filterQuery = {
      ...(isActiveFilter === "1" && { isActive: "1" }),
      ...(stocks === "1" && { stock: { $gt: 0 } }),
    };

    // Sorting logic: primary by custom_order, secondary by createdAt
    const sortQuery = { 
      custom_order: 1,
      createdAt: -1
    };

    // Get total count of products matching the filter
    const total = await productModel.countDocuments(filterQuery);

    // Fetch products with pagination and sorting
    const products = await productModel
      .find(filterQuery, "name photo photos _id perPiecePrice mrp stock slug custom_order")
      .skip(skip)
      .limit(perPage)
      .sort(sortQuery);

    // Process products to attach optimized Cloudinary photo URLs
    // and collect promises for file size retrieval
    const bandwidthPromises = [];
    const productsWithPhotos = products.map((product) => {
      const productObj = product.toObject();
      if (productObj.photos) {
        // Generate an optimized URL using low quality and auto format for better bandwidth savings
        productObj.photoUrl = cloudinary.url(productObj.photos, {
          transformation: [{
            // width: 200,
            // height: 200,
            // crop: "contain",
            quality: "30", // Lower quality (30%) to reduce bandwidth
            // fetch_format: "auto"
          }]
        });
        // Add a promise to retrieve the file size for this photo
        bandwidthPromises.push(getResourceBytes(productObj.photos));
      } else {
        // If no photo exists, add a zero-size placeholder
        bandwidthPromises.push(Promise.resolve(0));
      }
      return productObj;
    });

    // Wait for all Cloudinary API calls to get file sizes
    const bytesArray = await Promise.all(bandwidthPromises);
    const totalBytes = bytesArray.reduce((sum, current) => sum + current, 0);
    
    // Enhanced response with pagination metadata
    res.status(200).send({
      success: true,
      total,
      products: productsWithPhotos,
      pagination: {
        currentPage: page,
        perPage,
        totalPages: Math.ceil(total / perPage),
        hasNextPage: skip + products.length < total,
        hasPrevPage: page > 1
      },
      bandwidthUsedBytes: totalBytes
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

// searchProductController
export const searchProductController = async (req, res) => {
  try {
    const { keyword } = req.params;
    const isObjectId = mongoose.Types.ObjectId.isValid(keyword);
    const keywordNumber = Number(keyword);
    const isNumber = !isNaN(keywordNumber);

    // Fetch category IDs based on name match
    const categories = await categoryModel
      .find({
        name: { $regex: keyword, $options: "i" },
      })
      .select("_id")
      .lean();
    const categoryIds = categories.map((c) => c._id);

    // Fetch subcategory IDs based on name match
    const subcategories = await subcategoryModel
      .find({
        name: { $regex: keyword, $options: "i" },
      })
      .select("_id")
      .lean();
    const subcategoryIds = subcategories.map((s) => s._id);

    const results = await productModel
      .find({
        $and: [
          {
            $or: [
              { name: { $regex: keyword, $options: "i" } },
              { description: { $regex: keyword, $options: "i" } },
              { tag: { $regex: keyword, $options: "i" } },
              { sku: { $regex: `^${keyword}`, $options: "i" } },
              { slug: { $regex: keyword, $options: "i" } },
              ...(isObjectId
                ? [
                    { category: keyword },
                    { subcategory: keyword },
                    { brand: keyword },
                  ]
                : []),
              ...(isNumber ? [{ perPiecePrice: keywordNumber }] : []),
              { category: { $in: categoryIds } },
              { subcategory: { $in: subcategoryIds } },
            ],
          },
          { stock: { $gt: 0 } }, // Exclude out-of-stock
          { isActive: "1" }, // Exclude inactive products
        ],
      })
      .populate("category", "name")
      .populate("subcategory", "name")
      .populate("brand", "name");

    const resultsWithPhotos = results.map((product) => {
      const productObj = product.toObject();
      if (productObj.photos) {
        productObj.photoUrl = cloudinary.url(productObj.photos, {
          transformation: [{ 
            width: 200, 
            height: 200, 
            crop: "fill",
            quality: "30", // Lower quality for search results
            fetch_format: "auto"
          }],
        });
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
      })
      .limit(3)
      .populate("category");

    const productsWithPhotos = products.map((product) => {
      const productObj = product.toObject();
      if (productObj.photos) {
        productObj.photoUrl = cloudinary.url(productObj.photos, {
          transformation: [{ 
            width: 200, 
            height: 200, 
            crop: "fill",
            quality: "30", // Lower quality
            fetch_format: "auto"
          }],
        });
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
    const total = await productModel.countDocuments({ stock: { $gt: 0 } }); // Only products with stock > 0
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

    // Convert photo to base64
    const productObj = product.toObject();
    if (productObj.photos) {
      productObj.photoUrl = cloudinary.url(productObj.photos, {
        transformation: [{ 
          width: 400, 
          height: 400, 
          crop: "fill",
          quality: "50" // Slightly higher quality for product detail page
        }],
      });
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

    // Handle COD and Advance orders immediately
    if (paymentMethod === "COD" || paymentMethod === "Advance") {
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

        const order = new orderModel({
          products: products.map((item) => ({
            product: item.product,
            quantity: item.quantity,
            price: item.price,
          })),
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
      console.log(`[Payment] Razorpay order created | Order ID: ${razorpayOrder.id} | Amount: ${razorpayOrder.amount/100}`);

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
      console.log(`[Verification] Razorpay order fetched | Status: ${razorpayOrder.status} | Amount: ${razorpayOrder.amount/100}`);
      
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
      console.log(`[Verification] Payment details fetched | Status: ${paymentDetails.status} | Amount: ${paymentDetails.amount/100}`);
      
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

      // Create order
      const order = new orderModel({
        products: products.map((item) => ({
          product: item.product,
          quantity: item.quantity,
          price: item.price,
        })),
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
export const productCategoryController = async (req, res) => {
  try {
    // Find category by slug
    const category = await categoryModel.findOne({ slug: req.params.slug });
    if (!category) {
      return res.status(404).send({
        success: false,
        message: "Category not found",
      });
    }

    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Determine filters from query parameters (with defaults)
    const isActiveFilter = req.query.isActive || "1";
    const stocks = req.query.stock || "1";

    // Build filter query including category and other filters
    const filterQuery = {
      category: category._id,
      ...(isActiveFilter === "1" && { isActive: "1" }),
      ...(stocks === "1" && { stock: { $gt: 0 } }),
    };

    // Sorting logic: primary by custom_order, secondary by createdAt
    const sortQuery = { 
      custom_order: 1,
      createdAt: -1
    };

    // Get total count of products matching the filter
    const total = await productModel.countDocuments(filterQuery);

    // Fetch products with filtering, sorting, and pagination
    const products = await productModel
      .find(filterQuery)
      .populate("category")
      .sort(sortQuery)
      .skip(skip)
      .limit(limit);

    // Calculate if there are more products to load
    const hasMore = total > skip + products.length;

    // Process products to attach optimized Cloudinary photo URLs
    const productsWithPhotos = products.map((product) => {
      const productObj = product.toObject();
      if (productObj.photos) {
        // Generate an optimized URL using lower quality for better bandwidth savings
        productObj.photoUrl = cloudinary.url(productObj.photos, {
          transformation: [{
            quality: "30", // Lower quality (30%) to reduce bandwidth
          }]
        });
      }
      return productObj;
    });

    // Response with pagination metadata
    res.status(200).send({
      success: true,
      category,
      total,
      products: productsWithPhotos,
      count: products.length,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      hasMore
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error: error.message,
      message: "Error while getting products",
    });
  }
};

export const productSubcategoryController = async (req, res) => {
  try {
    const { subcategoryId } = req.params;
    
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Filter parameters
    const isActiveFilter = req.query.isActive || "1";
    const stocks = req.query.stock || "1";

    // Validate subcategory ID
    if (!mongoose.Types.ObjectId.isValid(subcategoryId)) {
      return res.status(400).send({
        success: false,
        message: "Invalid subcategory ID",
      });
    }

    // Fetch the subcategory
    const subcategory = await subcategoryModel.findById(subcategoryId);
    if (!subcategory) {
      return res.status(404).send({
        success: false,
        message: "Subcategory not found",
      });
    }

    // Build the filter query
    const filterQuery = {
      subcategory: subcategoryId,
      ...(isActiveFilter === "1" && { isActive: "1" }),
      ...(stocks === "1" && { stock: { $gt: 0 } }),
    };

    // Get total count of products matching the filter
    const total = await productModel.countDocuments(filterQuery);

    // Fetch products with filtering, sorting, and pagination
    const products = await productModel
      .find(filterQuery)
      .sort({ custom_order: 1, createdAt: -1 })
      .select("name photo photos _id perPiecePrice mrp stock slug custom_order")
      .skip(skip)
      .limit(limit);

    // Calculate if there are more products to load
    const hasMore = total > skip + products.length;

    // Process products to include optimized Cloudinary photo URLs
    const productsWithPhotos = products.map((product) => {
      const productObj = product.toObject();
      if (productObj.photos) {
        // Generate an optimized URL using lower quality for better bandwidth savings
        productObj.photoUrl = cloudinary.url(productObj.photos, {
          transformation: [{
            quality: "30", // Lower quality (30%) to reduce bandwidth
          }]
        });
      }
      return productObj;
    });

    // Send response with pagination metadata
    res.status(200).send({
      success: true,
      message: "Products fetched successfully",
      subcategory,
      products: productsWithPhotos,
      total,
      count: products.length,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      hasMore
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      error: error.message,
      message: "Error while getting products",
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
