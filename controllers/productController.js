import mongoose from "mongoose";
import productModel from "../models/productModel.js";
import subcategoryModel from "../models/subcategoryModel.js";
import categoryModel from "../models/categoryModel.js";
import orderModel from "../models/orderModel.js";
import Razorpay from 'razorpay';
import crypto from 'crypto';
import fs from "fs";
import slugify from "slugify";
import dotenv from "dotenv";
// import { v4 as uuidv4 } from 'uuid';
dotenv.config();
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
      photos, // Cloudinary URL
      multipleimages, // Array of Cloudinary URLs
    } = req.fields;

    // Handle files from request
    const { photo, images } = req.files;

    // Generate SKU if not provided
    const generateSKU = () => {
      const timestamp = Date.now();
      const timeComponent = timestamp.toString(36).slice(-4).toUpperCase();
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const randomLetters = Array.from(
        { length: 2 },
        () => letters.charAt(Math.floor(Math.random() * letters.length))
      ).join('');
      return `SM-${timeComponent}${randomLetters}`;
    };

    // Photo validation for Buffer-based images
    if (photo && photo.size > 1000000) {
      return res.status(400).send({ error: "Photo size should be less than 1MB." });
    }

    if (images) {
      const imageArray = Array.isArray(images) ? images : [images];
      for (let img of imageArray) {
        if (img.size > 1000000) {
          return res.status(400).send({ error: "Each image size should be less than 1MB." });
        }
      }
    }

    // Parse bulkProducts
    let formattedBulkProducts = null;
    if (bulkProducts) {
      if (typeof bulkProducts === 'string') {
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
          discount_mrp: isNaN(parseFloat(item.discount_mrp)) ? 0 : parseFloat(item.discount_mrp),
          selling_price_set: isNaN(parseFloat(item.selling_price_set)) ? 0 : parseFloat(item.selling_price_set),
        }));
      }
    }

    // Create product instance
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
      isActive: '1',
      variants: JSON.parse(variants || '[]'),
      sets: JSON.parse(sets || '[]'),
      tag: Array.isArray(tag) ? tag : tag ? [tag] : [],
      // Handle Cloudinary URLs
      photos: photos || null,
      multipleimages: Array.isArray(multipleimages) ? multipleimages : multipleimages ? [multipleimages] : [],
    });

    // Handle Buffer-based photo
    if (photo) {
      newProduct.photo = {
        data: fs.readFileSync(photo.path),
        contentType: photo.type
      };
    }

    // Handle Buffer-based multiple images
    if (images) {
      const imageArray = Array.isArray(images) ? images : [images];
      newProduct.images = imageArray.map(img => ({
        data: fs.readFileSync(img.path),
        contentType: img.type
      }));
    }

    // Save product
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
      error: error.message || "Internal Server Error",
      message: "Error in creating product",
    });
  }
};
//get all products
export const getProductController = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1); // Ensure page is at least 1
    const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1); // Ensure limit is at least 1
    const skip = (page - 1) * limit;

    const products = await productModel
      .find({})
      .populate("category", "name")
      .populate("subcategory", "name")
      .select("name category subcategory isActive perPiecePrice slug stock photos")
      .skip(skip)
      .limit(limit);

    const total = await productModel.countDocuments();

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
    const perPage = 10;
    const page = req.params.page ? req.params.page : 1;

    // Fetch only the required fields for the product card
    const products = await productModel
      .find({ isActive: "1" }, "name photo photos _id perPiecePrice mrp stock slug")
      .skip((page - 1) * perPage)
      .limit(perPage)
      .sort({ createdAt: -1 });

    // Format response to include Base64-encoded photos
    const productsWithPhotos = products.map(product => {
      const productObj = product.toObject();
      if (productObj.photo && productObj.photo.data) {
        productObj.photoUrl = `data:${productObj.photo.contentType};base64,${productObj.photo.data.toString('base64')}`;
        delete productObj.photo; // Remove the buffer data
      }
      return productObj;
    });

    res.status(200).send({
      success: true,
      products: productsWithPhotos,
    });
  } catch (error) {
    console.error(error);
    res.status(400).send({
      success: false,
      message: "Error fetching product data",
      error,
    });
  }
};

// Modified search controller with direct photo data
export const searchProductController = async (req, res) => {
  try {
    const { keyword } = req.params;
    const isObjectId = mongoose.Types.ObjectId.isValid(keyword);

    const results = await productModel
      .find({
        $or: [
          { name: { $regex: keyword, $options: "i" } },
          { description: { $regex: keyword, $options: "i" } },
          { tag: { $regex: keyword, $options: "i" } },
          { sku: { $regex: `^${keyword}`, $options: "i" } },
          { slug: { $regex: keyword, $options: "i" } },
          ...(isObjectId ? [
            { category: keyword },
            { subcategory: keyword },
            { brand: keyword },
          ] : []),
        ],
      })
      .populate("category", "name")
      .populate("subcategory", "name")
      .populate("brand", "name");

    // Convert photos to base64
    const resultsWithPhotos = results.map(product => {
      const productObj = product.toObject();
      if (productObj.photo && productObj.photo.data) {
        productObj.photoUrl = `data:${productObj.photo.contentType};base64,${productObj.photo.data.toString('base64')}`;
        delete productObj.photo;
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

// Modified related products controller with direct photo data
export const realtedProductController = async (req, res) => {
  try {
    const { pid, cid } = req.params;
    const products = await productModel
      .find({
        category: cid,
        _id: { $ne: pid },
      })
      .limit(3)
      .populate("category");

    // Convert photos to base64
    const productsWithPhotos = products.map(product => {
      const productObj = product.toObject();
      if (productObj.photo && productObj.photo.data) {
        productObj.photoUrl = `data:${productObj.photo.contentType};base64,${productObj.photo.data.toString('base64')}`;
        delete productObj.photo;
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
      message: "error while getting related product",
      error,
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
    if (productObj.photo && productObj.photo.data) {
      productObj.photoUrl = `data:${productObj.photo.contentType};base64,${productObj.photo.data.toString('base64')}`;
      delete productObj.photo;
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

// Modified product category controller with direct photo data
export const productCategoryController = async (req, res) => {
  try {
    const category = await categoryModel.findOne({ slug: req.params.slug });
    if (!category) {
      return res.status(404).send({
        success: false,
        message: "Category not found",
      });
    }

    // Fetch all products without pagination
    const products = await productModel
      .find({ category: category._id })
      .populate("category")
      .sort({ createdAt: -1 });

    // Convert photos to base64
    const productsWithPhotos = products.map(product => {
      const productObj = product.toObject();
      if (productObj.photo && productObj.photo.data) {
        productObj.photoUrl = `data:${productObj.photo.contentType};base64,${productObj.photo.data.toString('base64')}`;
        delete productObj.photo;
      }
      return productObj;
    });

    res.status(200).send({
      success: true,
      category,
      products: productsWithPhotos,
      count: products.length // Total number of products
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
// get photo
export const productPhotoController = async (req, res) => {
  try {
    const product = await productModel.findById(req.params._id).select("photos");
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
      photos, // Cloudinary URL
      multipleimages, // Array of Cloudinary URLs
    } = req.fields;

    // Handle files from request
    const { photo, images } = req.files;

    // Validation
    switch (true) {
      case !name:
        return res.status(400).send({ error: "Name is Required" });
      case !description:
        return res.status(400).send({ error: "Description is Required" });
      case !price:
        return res.status(400).send({ error: "Price is Required" });
      case !category:
        return res.status(400).send({ error: "Category is Required" });
      case !quantity:
        return res.status(400).send({ error: "Quantity is Required" });
      case photo && photo.size > 1000000:
        return res.status(400).send({ error: "Photo should be less than 1MB" });
      case youtubeUrl && !/^(https?:\/\/)?(www\.)?(youtube|youtu|youtube-nocookie)\.(com|be)\/(watch\?v=|embed\/|v\/|e\/|playlist\?list=)[\w-]+$/.test(youtubeUrl):
        return res.status(400).send({ error: "Invalid YouTube URL" });
    }

    // Validate additional images if provided
    if (images) {
      const imageArray = Array.isArray(images) ? images : [images];
      for (let img of imageArray) {
        if (img.size > 1000000) {
          return res.status(400).send({ error: "Each additional image should be less than 1MB" });
        }
      }
    }

    // Convert numeric fields and prepare updated fields
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
      // Handle Cloudinary URLs
      photos: photos || null,
      multipleimages: Array.isArray(multipleimages) ? multipleimages : multipleimages ? [multipleimages] : [],
    };

    // Handle FK Tags
    if (fk_tags) {
      let parsedFkTags = [];
      if (typeof fk_tags === 'string') {
        try {
          parsedFkTags = JSON.parse(fk_tags);
        } catch (error) {
          console.error("Error parsing fk_tags:", error);
          return res.status(400).send({ error: "Invalid fk_tags data" });
        }
      } else if (Array.isArray(fk_tags)) {
        parsedFkTags = fk_tags;
      }

      if (!Array.isArray(parsedFkTags)) {
        return res.status(400).send({ error: "fk_tags must be an array" });
      }

      updatedFields.fk_tags = parsedFkTags;
    }

    // Handle bulkProducts
    if (bulkProducts) {
      let formattedBulkProducts = null;
      if (typeof bulkProducts === 'string') {
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
          minimum: parseInt(item.minimum),
          maximum: parseInt(item.maximum),
          discount_mrp: parseFloat(item.discount_mrp),
          selling_price_set: parseFloat(item.selling_price_set),
        }));
      }

      updatedFields.bulkProducts = formattedBulkProducts;
    }

    // Find the product to update
    const products = await productModel.findById(req.params.pid);
    if (!products) {
      return res.status(404).send({ error: "Product not found" });
    }

    // Update the product with new fields
    Object.assign(products, updatedFields);

    // Handle Buffer-based photo if provided
    if (photo) {
      products.photo = {
        data: fs.readFileSync(photo.path),
        contentType: photo.type
      };
    }

    // Handle Buffer-based multiple images if provided
    if (images) {
      const imageArray = Array.isArray(images) ? images : [images];
      products.images = imageArray.map(img => ({
        data: fs.readFileSync(img.path),
        contentType: img.type
      }));
    }

    // Save the updated product
    await products.save();

    res.status(200).send({
      success: true,
      message: "Product Updated Successfully",
      products,
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
// filters
export const productFiltersController = async (req, res) => {
  try {
    const { checked, radio } = req.body;
    let args = {};
    if (checked.length > 0) args.category = checked;
    if (radio.length) args.price = { $gte: radio[0], $lte: radio[1] };
    const products = await productModel.find(args);
    res.status(200).send({
      success: true,
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "Error WHile Filtering Products",
      error,
    });
  }
};

// product count
export const productCountController = async (req, res) => {
  try {
    const total = await productModel.find({}).estimatedDocumentCount();
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




export const productSubcategoryController = async (req, res) => {
  try {
    const { subcategoryId } = req.params;

    // Validate that subcategoryId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(subcategoryId)) {
      return res.status(400).send({
        success: false,
        message: "Invalid subcategory ID",
      });
    }

    const subcategory = await subcategoryModel.findById(subcategoryId);

    if (!subcategory) {
      return res.status(404).send({
        success: false,
        message: "Subcategory not found",
      });
    }

    const products = await productModel.find({ subcategory: subcategoryId });

    res.status(200).send({
      success: true,
      message: "Products fetched successfully",
      subcategory,
      products,
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


// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Controller
export const processPaymentController = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
        reason: "User not authenticated"
      });
    }

    const { products, paymentMethod, amount, amountPending } = req.body;

    // Validation
    if (!products || !Array.isArray(products) || products.length === 0 || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Invalid request body. Missing products or paymentMethod.",
        reason: "Missing or invalid fields in request body"
      });
    }

    // Handle COD and Advance orders immediately
    if (paymentMethod === "COD" || paymentMethod === "Advance") {
      const order = new orderModel({
        products: products.map(item => ({
          product: item.product,
          quantity: item.quantity,
          price: item.price
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
      return res.json({
        success: true,
        message: `${paymentMethod} order placed successfully`,
        order
      });
    }

    // For Razorpay payments
    const razorpayOrderData = {
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `order_${Date.now()}`,
      notes: {
        paymentMethod,
        baseAmount: amount,
        amountPending: amountPending,
        userId: req.user._id.toString(),
        products: JSON.stringify(products)
      }
    };

    const razorpayOrder = await razorpay.orders.create(razorpayOrderData);

    res.json({
      success: true,
      message: "Razorpay order initiated",
      razorpayOrder,
      key: process.env.RAZORPAY_KEY_ID
    });

  } catch (error) {
    console.error("Error in processPaymentController:", error);
    res.status(500).json({
      success: false,
      message: "Error in payment processing",
      error: error.message
    });
  }
};

// Verify payment and create order only after successful payment
export const verifyPaymentController = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing required payment verification parameters"
      });
    }

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature"
      });
    }

    // Fetch the Razorpay order to get the stored data
    const razorpayOrder = await razorpay.orders.fetch(razorpay_order_id);
    const products = JSON.parse(razorpayOrder.notes.products);

    // Create order in database only after successful payment verification
    const order = new orderModel({
      products: products.map(item => ({
        product: item.product,
        quantity: item.quantity,
        price: item.price
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

    res.json({
      success: true,
      message: "Payment verified and order created successfully",
      order
    });

  } catch (error) {
    console.error("Error in verifyPaymentController:", error);
    res.status(500).json({
      success: false,
      message: "Error in payment verification",
      error: error.message
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
                message: "Order not found"
            });
        }

        if (order.payment.paymentMethod === "COD") {
            return res.json({
                success: true,
                status: "COD",
                order
            });
        }

        const payment = await razorpay.payments.fetch(order.payment.transactionId);

        res.json({
            success: true,
            status: payment.status,
            order,
            payment
        });

    } catch (error) {
        console.error("Error in getPaymentStatusController:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching payment status",
            error: error.message
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