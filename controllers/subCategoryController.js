import subcategoryModel from "../models/subcategoryModel.js";
import slugify from "slugify";

// Create Subcategory
// Create Subcategory Controller
export const createSubcategoryController = async (req, res) => {
  try {
    const { name, photos, parentCategoryId, isActive } = req.body;

    if (!name) {
      return res.status(401).send({ message: "Name is required" });
    }

    if (!parentCategoryId) {
      return res.status(401).send({ message: "Parent category is required" });
    }

    const existingCategory = await subcategoryModel.findOne({ name });
    if (existingCategory) {
      return res.status(200).send({
        success: false,
        message: "Subcategory already exists",
      });
    }

    if (photos && photos.length > 5 * 1024 * 1024) { // 5MB size limit
      return res.status(400).send({
        success: false,
        message: "Image size too large. Maximum 5MB allowed.",
      });
    }

    const subcategoryData = {
      name,
      slug: slugify(name),
      isActive: isActive !== undefined ? isActive : true,
      category: parentCategoryId,
      photos, // Store the URLs from Cloudinary
    };

    const subcategory = await new subcategoryModel(subcategoryData).save();

    res.status(201).send({
      success: true,
      message: "New subcategory created",
      subcategory,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error: error.message,
      message: "Error in subcategory creation",
    });
  }
};


// Update Subcategory Controller
export const updateSubcategoryController = async (req, res) => {
  try {
    const { name, category, isActive, photos } = req.body;
    const { id } = req.params;

    if (!category) {
      return res.status(401).send({ message: "Parent category is required" });
    }

    const updateData = {
      name,
      slug: slugify(name),
      category,
      isActive,
    };

    if (photos) {
      if (photos.length > 5 * 1024 * 1024) { // Validate photos size
        return res.status(400).send({
          success: false,
          message: "Image size too large. Maximum 5MB allowed.",
        });
      }
      updateData.photos = photos; // Update photos if provided
    }

    const subcategory = await subcategoryModel.findByIdAndUpdate(id, updateData, { new: true });

    if (!subcategory) {
      return res.status(404).send({
        success: false,
        message: "Subcategory not found",
      });
    }

    res.status(200).send({
      success: true,
      message: "Subcategory updated successfully",
      subcategory,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error: error.message,
      message: "Error while updating subcategory",
    });
  }
};


// Get Single Subcategory Controller
export const getSingleSubcategoryController = async (req, res) => {
  try {
    const { id } = req.params;
    const subcategory = await subcategoryModel.findById(id);

    if (!subcategory) {
      return res.status(404).send({
        success: false,
        message: "Subcategory not found",
      });
    }

    res.status(200).send({
      success: true,
      message: "Subcategory retrieved successfully",
      subcategory,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error while retrieving subcategory",
    });
  }
};



// Delete Subcategory Controller
export const deleteSubcategoryController = async (req, res) => {
  try {
    const { id } = req.params;
    await subcategoryModel.findByIdAndDelete(id);
    res.status(200).send({
      success: true,
      message: "Subcategory deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while deleting subcategory",
      error,
    });
  }
};


// Get All Subcategories Controller with Active Status Filter
export const getAllSubcategoriesController = async (req, res) => {
  try {
    const { active } = req.query;
    let query = {};

    if (active !== undefined) {
      query.isActive = active === 'true';
    }

    const subcategories = await subcategoryModel.find(query);
    res.status(200).send({
      success: true,
      message: "All subcategories retrieved",
      subcategories,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error while retrieving subcategories",
    });
  }
};


// export const createSubcategoryController = async (req, res) => {
//   try {
//     const { name, parentCategoryId, photo } = req.body;
//     console.log("request body", req.body);

//     if (!name) {
//       return res.status(401).send({ message: "Name is required" });
//     }
//     if (!parentCategoryId) {
//       return res.status(401).send({ message: "Category is required" });
//     }

//     const existingSubcategory = await subcategoryModel.findOne({ name, parentCategoryId });
//     if (existingSubcategory) {
//       return res.status(200).send({
//         success: false,
//         message: "Subcategory Already Exists",
//       });
//     }

//     // Create a new subcategory object with name, slug, and category
//     const subcategoryData = {
//       name,
//       slug: slugify(name),
//       parentCategoryId
//     };

//     // Only add photo if it's a non-empty string
//     if (photo && typeof photo === 'string' && photo.trim() !== '') {
//       subcategoryData.photo = photo;
//     }

//     const subcategory = await new subcategoryModel(subcategoryData).save();

//     res.status(201).send({
//       success: true,
//       message: "New Subcategory Created",
//       subcategory,
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).send({
//       success: false,
//       error: error.message,
//       message: "Error in Subcategory Creation",
//     });
//   }
// };
// Get Single Subcategory


// Other controllers remain unchanged...





// Add a new controller to toggle active status
export const toggleSubcategoryStatusController = async (req, res) => {
  try {
    const { id } = req.params;
    const subcategory = await subcategoryModel.findById(id);
    
    if (!subcategory) {
      return res.status(404).send({
        success: false,
        message: "Subcategory not found",
      });
    }

    subcategory.isActive = !subcategory.isActive;
    await subcategory.save();

    res.status(200).send({
      success: true,
      message: `Subcategory ${subcategory.isActive ? 'activated' : 'deactivated'}  successfully`,
      subcategory,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error while toggling subcategory status",
    });
  }
};

