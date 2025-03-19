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

//upate producta

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Controller
export const processPaymentController = async (req, res) => {
  try {
    console.log("Received payment request:", req.body);

    if (!req.user || !req.user._id) {
      console.error("Authentication failed: User not found");
      return res.status(401).json({
        success: false,
        message: "Authentication required",
        reason: "User not authenticated",
      });
    }

    const { products, paymentMethod, amount, amountPending } = req.body;

    // Validation
    if (!products || !Array.isArray(products) || products.length === 0 || !paymentMethod) {
      console.error("Validation failed: Invalid request body", req.body);
      return res.status(400).json({
        success: false,
        message: "Invalid request body. Missing products or paymentMethod.",
        reason: "Missing or invalid fields in request body",
      });
    }

    console.log("Processing payment for user:", req.user._id);

    // Handle COD and Advance orders immediately
    if (paymentMethod === "COD" || paymentMethod === "Advance") {
      console.log("Processing COD/Advance order");
      const order = new orderModel({
        products: products.map((item) => ({
          product: item.product,
          quantity: item.quantity,
          price: item.price,
        })),
        payment: {
          paymentMethod,
          transactionId: `${paymentMethod}-${Date.now()}`,
        },
        buyer: req.user._id,
        amount: amount,
        amountPending: amountPending,
        status: "Pending",
      });

      await order.save();
      console.log("Order saved successfully:", order);

      // Update stock for each product
      await Promise.all(
        products.map(async (item) => {
          console.log("Updating stock for product:", item.product);
          await productModel.findByIdAndUpdate(
            item.product,
            { $inc: { stock: -item.quantity } }, // Decrease stock
            { new: true }
          );
        })
      );

      return res.json({
        success: true,
        message: `${paymentMethod} order placed successfully`,
        order,
      });
    }

    console.log("Initiating Razorpay payment");
    const razorpayOrderData = {
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `order_${Date.now()}`,
      notes: {
        paymentMethod,
        baseAmount: amount,
        amountPending: amountPending,
        userId: req.user._id.toString(),
        products: JSON.stringify(products),
      },
    };

    const razorpayOrder = await razorpay.orders.create(razorpayOrderData);
    console.log("Razorpay order created successfully:", razorpayOrder);

    res.json({
      success: true,
      message: "Razorpay order initiated",
      razorpayOrder,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Error in processPaymentController:", error);
    res.status(500).json({
      success: false,
      message: "Error in payment processing",
      error: error.message,
    });
  }
};

export const verifyPaymentController = async (req, res) => {
  try {
    console.log("Received payment verification request:", req.body);
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.error("Missing required payment verification parameters");
      return res.status(400).json({
        success: false,
        message: "Missing required payment verification parameters",
      });
    }

    console.log("Verifying payment signature");
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.error("Invalid payment signature");
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    console.log("Fetching Razorpay order data");
    const razorpayOrder = await razorpay.orders.fetch(razorpay_order_id);
    console.log("Fetched Razorpay order:", razorpayOrder);

    const products = JSON.parse(razorpayOrder.notes.products);

    console.log("Creating order after successful payment");
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
      amount: razorpayOrder.notes.baseAmount,
      status: "Pending",
    });

    await order.save();
    console.log("Order saved successfully:", order);

    // Update stock for each product
    await Promise.all(
      products.map(async (item) => {
        console.log("Updating stock for product:", item.product);
        await productModel.findByIdAndUpdate(
          item.product,
          { $inc: { stock: -item.quantity } },
          { new: true }
        );
      })
    );

    res.json({
      success: true,
      message: "Payment verified and order created successfully",
      order,
    });
  } catch (error) {
    console.error("Error in verifyPaymentController:", error);
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
    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.payment.paymentMethod === "COD") {
      return res.json({
        success: true,
        status: "COD",
        order,
      });
    }

    const payment = await razorpay.payments.fetch(order.payment.transactionId);

    res.json({
      success: true,
      status: payment.status,
      order,
      payment,
    });
  } catch (error) {
    console.error("Error in getPaymentStatusController:", error);
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

    // Determine active filter from query parameter; default to "1" (active)
    const isActiveFilter = req.query.isActive !== undefined ? req.query.isActive : "1";

    // Build filter query including category, stock, and active status
    const filterQuery = {
      category: category._id,
      stock: { $gt: 0 }, // Only products with stock > 0
      isActive: isActiveFilter,
    };

    // Fetch products with filtering and sorting
    const products = await productModel
      .find(filterQuery)
      .populate("category")
      .sort({ createdAt: -1 });

    // Map products to include optimized Cloudinary photo URLs if available
    const productsWithPhotos = products.map((product) => {
      const productObj = product.toObject();
      if (productObj.photos) {
        productObj.photoUrl = cloudinary.url(productObj.photos, {
          transformation: [{ width: 200, height: 200, crop: "fill" }],
        });
      }
      return productObj;
    });

    res.status(200).send({
      success: true,
      category,
      products: productsWithPhotos,
      count: products.length,
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
    // Use provided isActive query parameter if available; default to "1" (active)
    const isActiveFilter = req.query.isActive !== undefined ? req.query.isActive : "1";
    const stocks = req.query.stock || "1"; // Default to "1" (products with stock > 0)

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

    // Build the filter query, including active status and stock filters
    const filterQuery = {
      subcategory: subcategoryId,
      isActive: isActiveFilter, // Filter by active/inactive status based on query parameter
      ...(stocks === "1" && { stock: { $gt: 0 } }), // Only products with stock > 0 if stocks === "1"
    };

    // Fetch products with the filter applied, sorting by custom order then createdAt
    const products = await productModel
      .find(filterQuery)
      .sort({ custom_order: 1, createdAt: -1 })
      .select("name photo photos _id perPiecePrice mrp stock slug custom_order");

    // Process products to include optimized Cloudinary photo URLs if photos exist
    const productsWithPhotos = products.map((product) => {
      const productObj = product.toObject();
      if (productObj.photos) {
        productObj.photoUrl = cloudinary.url(productObj.photos, {
          transformation: [{ width: 200, height: 200, crop: "fill" }],
        });
      }
      return productObj;
    });

    // Send response
    res.status(200).send({
      success: true,
      message: "Products fetched successfully",
      subcategory,
      products: productsWithPhotos,
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
