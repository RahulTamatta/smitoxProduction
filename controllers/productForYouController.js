import productForYouModel from "../models/productForYouModel.js";
import productModel from "../models/productModel.js";
import mongoose from 'mongoose';

export const getProductsForYouController = async (req, res) => {
    try {
        const { categoryId, subcategoryId } = req.params;
    
  
        // Validate the IDs (they should be strings representing ObjectIds)
        if (!mongoose.Types.ObjectId.isValid(categoryId) || !mongoose.Types.ObjectId.isValid(subcategoryId)) {
          return res.status(400).send({ success: false, message: "Invalid category or subcategory ID" });
        }
    
        const products = await productModel.find({
          category: categoryId,
          subcategory: subcategoryId
        }).populate("category subcategory");
    
        res.status(200).send({
          success: true,
          message: "Products fetched successfully",
          products,
        });
      } catch (error) {
        console.error(error);
        res.status(500).send({
          success: false,
          message: "Error in fetching banner products",
          error: error.message,
        });
      }
    };

    export const singleProductController = async (req, res) => {
      try {
        const banner = await bannerModel
          .findOne({ _id: req.params.id })
          .select("-image")
          .populate("category")
          .populate("subcategory");
        res.status(200).send({
          success: true,
          message: "Single Banner Fetched",
          banner,
        });
      } catch (error) {
        console.log(error);
        res.status(500).send({
          success: false,
          message: "Error while getting single banner",
          error,
        });
      }
    };

    export const getAllProductsForYouController = async (req, res) => {
      try {
        // Fetch all products from the productForYouModel
        const productsForYou = await productForYouModel.find().populate("categoryId subcategoryId productId");
    
        res.status(200).send({
          success: true,
          message: "Products for you fetched successfully",
          productsForYou
        });
      } catch (error) {
        console.error(error);
        res.status(500).send({
          success: false,
          error: error.message,
          message: "Error in fetching products for you"
        });
      }
    };
export const createProductForYouController = async (req, res) => {
  try {
    const { categoryId, subcategoryId, productId } = req.fields;

    // Validation
    if (!categoryId) return res.status(400).send({ error: "Category is required" });
    if (!subcategoryId) return res.status(400).send({ error: "Subcategory is required" });
    if (!productId) return res.status(400).send({ error: "Product is required" });

    const productForYouData = {
      categoryId,
      subcategoryId,
      productId
    };

    const banner = await new productForYouModel(productForYouData).save();

    res.status(201).send({
      success: true,
      message: "Banner created successfully",
      banner,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      error: error.message,
      message: "Error in creating banner",
    });
  }
};

export const updateBannerController = async (req, res) => {
  try {
    const { categoryId, subcategoryId, productId } = req.fields;
    const { id } = req.params;

    // Validation
    if (!categoryId) return res.status(400).send({ error: "Category is required" });
    if (!subcategoryId) return res.status(400).send({ error: "Subcategory is required" });
    if (!productId) return res.status(400).send({ error: "Product is required" });

    const banner = await productForYouModel.findByIdAndUpdate(
      id,
      { categoryId, subcategoryId, productId },
      { new: true }
    );

    res.status(200).send({
      success: true,
      message: "Banner updated successfully",
      banner,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error in updating banner",
    });
  }
};

export const getBannersController = async (req, res) => {
  try {
    const banners = await productForYouModel
      .find({})
      .populate("categoryId", "name")
      .populate("subcategoryId", "name")
      .populate("productId", "name photo price slug") // Include price and slug
      .select("categoryId subcategoryId productId")
      .limit(12)
      .sort({ createdAt: -1 });

    res.status(200).send({
      success: true,
      countTotal: banners.length,
      message: "All Banners",
      banners,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in getting banners",
      error: error.message,
    });
  }
};
export const deleteProductController = async (req, res) => {
  try {
    await productForYouModel.findByIdAndDelete(req.params.id);
    res.status(200).send({
      success: true,
      message: "Banner Deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while deleting banner",
      error,
    });
  }
};

export const getProductPhoto = async (req, res) => {
  try {
    const product = await productModel.findById(req.params.pid).select("photo");
    if (product.photo.data) {
      res.set("Content-type", product.photo.contentType);
      return res.status(200).send(product.photo.data);
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