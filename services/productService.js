// services/productService.js
// Business logic for product operations extracted from productController.js

import productModel from '../models/productModel.js';
import subcategoryModel from '../models/subcategoryModel.js';
import categoryModel from '../models/categoryModel.js';
import orderModel from '../models/orderModel.js';
import cloudinary from 'cloudinary';

import slugify from 'slugify';
import mongoose from 'mongoose';

export async function createProduct(fields, files, imageUrl = null) {
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
  } = fields;

  // Handle files from request
  const { photo, images } = files || {};

  // Photo validation for Buffer-based images
  if (photo && photo.size > 1000000) {
    throw new Error('Photo size should be less than 1MB.');
  }
  if (images) {
    const imageArray = Array.isArray(images) ? images : [images];
    for (let img of imageArray) {
      if (img.size > 1000000) {
        throw new Error('Each image size should be less than 1MB.');
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
      throw new Error('Cloudinary upload error: ' + error.message);
    }
  };

  // Upload main photo if present
  let productPhoto = imageUrl || photos || null;
  if (photo && !imageUrl) {
    const photoFile = {
      name: photo.name || 'product-photo.jpg',
      type: photo.type,
      size: photo.size,
      path: photo.path,
    };
    productPhoto = await uploadToCloudinary(photoFile, 'products');
  }

  // Handle multiple images upload/merge
  let multipleImagesArr = [];
  if (multipleimages) {
    // Accepts array or JSON string
    if (Array.isArray(multipleimages)) {
      multipleImagesArr = multipleimages;
    } else if (typeof multipleimages === 'string') {
      try {
        multipleImagesArr = JSON.parse(multipleimages);
      } catch {
        // fallback: treat as comma-separated string
        multipleImagesArr = multipleimages.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
  }
  // Upload any new images provided as files
  if (images) {
    const imageArray = Array.isArray(images) ? images : [images];
    const uploadPromises = imageArray.map(img => {
      const imgFile = {
        name: img.name || `product-image-${Date.now()}.jpg`,
        type: img.type,
        size: img.size,
        path: img.path,
      };
      return uploadToCloudinary(imgFile, 'products/gallery');
    });
    const uploadedUrls = await Promise.all(uploadPromises);
    multipleImagesArr = [...multipleImagesArr, ...uploadedUrls];
  }

  // SKU generation
  const generateSKU = () => {
    const timestamp = Date.now();
    const timeComponent = timestamp.toString(36).slice(-4).toUpperCase();
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const randomLetters = Array.from({ length: 2 }, () =>
      letters.charAt(Math.floor(Math.random() * letters.length))
    ).join('');
    return `SM-${timeComponent}${randomLetters}`;
  };

  // Custom order logic
  let productCustomOrder = custom_order;
  if (!productCustomOrder) {
    const lastProduct = await productModel
      .findOne()
      .sort({ custom_order: -1 })
      .select('custom_order');
    productCustomOrder = lastProduct?.custom_order ? lastProduct.custom_order + 1 : 1;
  }

  // Helper to ensure bulkProducts is always an array of objects
  function parseBulkProducts(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        // fallback: not valid JSON, return empty array
        return [];
      }
    }
    return [];
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
    shipping,
    hsn,
    unit,
    unitSet,
    additionalUnit,
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
    bulkProducts: parseBulkProducts(bulkProducts),
    youtubeUrl,
    sku: sku || generateSKU(),
    tag,
    fk_tags,
    photos: productPhoto,
    multipleimages: multipleImagesArr,
    custom_order: productCustomOrder,
  });
  await newProduct.save();
  return newProduct;
}


// Add more product-related business logic here, e.g.:
// - updateProduct
// - getProduct
// - searchProduct
// - deleteProduct
// - etc.
