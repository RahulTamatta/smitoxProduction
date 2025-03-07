import categoryModel from "../models/categoryModel.js";
import slugify from "slugify";
import fs from 'fs';

// Category Controller functions

export const createCategoryController = async (req, res) => {
  try {
    const { name, photos } = req.body;
    console.log("request body", req.body);
    
    // Changed photo to photos in validation
    if (photos && photos.length > 5 * 1024 * 1024) { // 5MB limit
      return res.status(400).send({
        success: false,
        message: "Image size too large. Maximum 5MB allowed."
      });
    }
    
    if (!name) {
      return res.status(401).send({ message: "Name is required" });
    }
    
    const existingCategory = await categoryModel.findOne({ name });
    if (existingCategory) {
      return res.status(200).send({
        success: false,
        message: "Category Already Exists",
      });
    }
    
    // Updated to use photos instead of photo
    const categoryData = {
      name,
      slug: slugify(name),
      photos: photos  // Store the URL from Cloudinary
    };
    
    const category = await new categoryModel(categoryData).save();
    
    res.status(201).send({
      success: true,
      message: "New category created",
      category,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error: error.message,
      message: "Error in Category",
    });
  }
};

export const updateCategoryController = async (req, res) => {
  try {
    const { name, photos } = req.body; // Changed photo to photos
    const { id } = req.params;

    // Build the update data object with photos
    const updateData = { name, slug: slugify(name) };
    if (photos) {
      updateData.photos = photos; // Update photos if provided
    }

    const category = await categoryModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!category) {
      return res.status(404).send({
        success: false,
        message: "Category not found",
      });
    }

    res.status(200).send({
      success: true,
      message: "Category Updated Successfully",
      category,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error: error.message,
      message: "Error while updating category",
    });
  }
};

// No changes needed for categoryController (get all)
export const categoryControlller = async (req, res) => {
  try {
    const category = await categoryModel.find({});
    res.status(200).send({
      success: true,
      message: "All Categories List",
      category,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error while getting all categories",
    });
  }
};

// No changes needed for singleCategoryController
export const singleCategoryController = async (req, res) => {
  try {
    const category = await categoryModel.findOne({ slug: req.params.slug });
    res.status(200).send({
      success: true,
      message: "Get Single Category Successfully",
      category,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error While getting Single Category",
    });
  }
};

// No changes needed for deleteCategoryController
export const deleteCategoryCOntroller = async (req, res) => {
  try {
    const { id } = req.params;
    await categoryModel.findByIdAndDelete(id);
    res.status(200).send({
      success: true,
      message: "Category Deleted Successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "error while deleting category",
      error,
    });
  }
};