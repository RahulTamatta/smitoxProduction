import path from "path";
import slugify from "slugify";
import categoryModel from "../models/categoryModel.js";

// Category Controller functions

export const createCategoryController = async (req, res) => {
  try {
    const { name, isActive } = req.body;
    const photo = req.file;

    console.log("createCategoryController body:", req.body);

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

    let photoPath = "";
    if (photo) {
      photoPath = `uploads/categories/${path.basename(photo.path)}`;
    }

    const categoryData = {
      name,
      isActive: isActive === 'true' || isActive === true,
      slug: slugify(name),
      photos: photoPath
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
    const { name, isActive } = req.body;
    const { id } = req.params;
    const photo = req.file;

    const updateData = {
      name,
      slug: slugify(name),
      isActive: isActive === 'true' || isActive === true
    };
    if (photo) {
      updateData.photos = `uploads/categories/${path.basename(photo.path)}`;
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

// get all category
export const categoryControlller = async (req, res) => {
  try {
    const { active } = req.query;
    const query = {};

    // If active query param is present, filter by isActive
    // Include true OR missing (legacy data)
    if (active) {
      query.$or = [{ isActive: true }, { isActive: { $exists: false } }];
    }

    const category = await categoryModel.find(query);
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

export const toggleCategoryStatusController = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await categoryModel.findById(id);

    if (!category) {
      return res.status(404).send({
        success: false,
        message: "Category not found",
      });
    }

    category.isActive = !category.isActive;
    await category.save();

    res.status(200).send({
      success: true,
      message: "Category status updated",
      category,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error while toggling status",
    });
  }
};