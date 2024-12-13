import bannerModel from "../models/bannerModel.js";
import fs from "fs";
import slugify from "slugify";
import productModel from "../models/productModel.js";
import mongoose from 'mongoose';


export const getBannerProductsController = async (req, res) => {
  try {
    const { categoryId, subcategoryId } = req.params;

    // Debugging: Log the IDs
    console.log("CatId", categoryId);
    console.log("SubCatId", subcategoryId);

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



export const createBannerController = async (req, res) => {
  try {
    const { bannerName, categoryId, subcategoryId } = req.fields;
    const { image } = req.files;
    console.log("Banner",{bannerName,categoryId,subcategoryId});
    // Validation
    if (!bannerName) return res.status(400).send({ error: "Name is required" });
    if (!categoryId) return res.status(400).send({ error: "Category is required" });
    if (!subcategoryId) return res.status(400).send({ error: "Subcategory is required" });
    if (image && image.size > 1000000)
      return res.status(400).send({ error: "Image should be less than 1mb in size" });

    const bannerData = {
      bannerName,
      categoryId,
      subcategoryId,
      image: {
        data: image ? fs.readFileSync(image.path) : undefined,
        contentType: image ? image.type : undefined
      }
    };

    const banner = await new bannerModel(bannerData).save();
    
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
    const { name, category, subcategory } = req.fields;
    const { image } = req.files;
    const { id } = req.params;

    // Validation
    if (!name) return res.status(400).send({ error: "Name is required" });
    if (!category) return res.status(400).send({ error: "Category is required" });
    if (!subcategory) return res.status(400).send({ error: "Subcategory is required" });
    if (image && image.size > 1000000)
      return res.status(400).send({ error: "Image should be less than 1mb in size" });

    const banner = await bannerModel.findByIdAndUpdate(
      id,
      { ...req.fields, slug: slugify(name) },
      { new: true }
    );
    if (image) {
      banner.image.data = fs.readFileSync(image.path);
      banner.image.contentType = image.type;
    }
    await banner.save();
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
    const banners = await bannerModel
      .find({})
      .populate("categoryId", "name")
      .populate("subcategoryId", "name")
      .select("bannerName categoryId subcategoryId image")
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

export const singleBannerController = async (req, res) => {
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

export const bannerImageController = async (req, res) => {
  try {
    const banner = await bannerModel.findById(req.params.id).select("image");
    if (banner.image.data) {
      res.set("Content-type", banner.image.contentType);
      return res.status(200).send(banner.image.data);
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while getting banner image",
      error,
    });
  }
};

export const deleteBannerController = async (req, res) => {
  try {
    await bannerModel.findByIdAndDelete(req.params.id).select("-image");
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

