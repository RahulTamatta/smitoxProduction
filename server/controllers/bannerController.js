import mongoose from "mongoose";
import path from "path";
import bannerModel from "../models/bannerModel.js";
import productModel from "../models/productModel.js";

// Create Banner
export const createBannerController = async (req, res) => {
  try {
    const { bannerName, categoryId, subcategoryId, isActive } = req.body;
    const photo = req.file;

    // Validations
    if (!bannerName) {
      return res.status(400).send({ success: false, message: "Banner name is required" });
    }
    if (!categoryId) {
      return res.status(400).send({ success: false, message: "Category is required" });
    }
    if (!subcategoryId) {
      return res.status(400).send({ success: false, message: "Subcategory is required" });
    }
    if (!photo) {
      return res.status(400).send({ success: false, message: "Banner image is required" });
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(categoryId) || !mongoose.Types.ObjectId.isValid(subcategoryId)) {
      return res.status(400).send({ success: false, message: "Invalid category or subcategory ID" });
    }

    // Check for duplicate banner name
    const existingBanner = await bannerModel.findOne({ bannerName });
    if (existingBanner) {
      return res.status(400).send({
        success: false,
        message: "Banner with this name already exists",
      });
    }

    const photoPath = `uploads/banners/${path.basename(photo.path)}`;

    // Create banner
    const banner = await new bannerModel({
      bannerName,
      categoryId,
      subcategoryId,
      photos: photoPath,
      isActive: isActive === undefined ? true : (isActive === 'true' || isActive === true || isActive === '1' || isActive === 1),
    }).save();

    res.status(201).send({
      success: true,
      message: "Banner created successfully",
      banner,
    });
  } catch (error) {
    console.error("Error in createBannerController:", error);
    res.status(500).send({
      success: false,
      message: "Error in creating banner",
      error: error.message,
    });
  }
};

// Update Banner
export const updateBannerController = async (req, res) => {
  try {
    const { bannerName, categoryId, subcategoryId, isActive } = req.body;
    const { id } = req.params;
    const photo = req.file;

    // Validate banner ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ success: false, message: "Invalid banner ID" });
    }

    // Check if banner exists
    const existingBanner = await bannerModel.findById(id);
    if (!existingBanner) {
      return res.status(404).send({
        success: false,
        message: "Banner not found",
      });
    }

    // Update data object
    const updateData = {};
    if (bannerName) updateData.bannerName = bannerName;
    if (categoryId) {
      if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        return res.status(400).send({ success: false, message: "Invalid category ID" });
      }
      updateData.categoryId = categoryId;
    }
    if (subcategoryId) {
      if (!mongoose.Types.ObjectId.isValid(subcategoryId)) {
        return res.status(400).send({ success: false, message: "Invalid subcategory ID" });
      }
      updateData.subcategoryId = subcategoryId;
    }
    if (isActive !== undefined) {
      updateData.isActive = isActive === 'true' || isActive === true || isActive === '1' || isActive === 1;
    }
    if (photo) {
      updateData.photos = `uploads/banners/${path.basename(photo.path)}`;
    }

    // Update banner
    const updatedBanner = await bannerModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate("categoryId", "name isActive").populate("subcategoryId", "name isActive");

    res.status(200).send({
      success: true,
      message: "Banner updated successfully",
      banner: updatedBanner,
    });
  } catch (error) {
    console.error("Error in updateBannerController:", error);
    res.status(500).send({
      success: false,
      message: "Error in updating banner",
      error: error.message,
    });
  }
};

// Toggle Banner Status (Active / Inactive)
export const toggleBannerStatusController = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ success: false, message: "Invalid banner ID" });
    }

    const banner = await bannerModel.findById(id);
    if (!banner) {
      return res.status(404).send({
        success: false,
        message: "Banner not found",
      });
    }

    // Toggle status (default undefined to true, so toggling makes it false)
    banner.isActive = banner.isActive === false ? true : false;
    await banner.save();

    res.status(200).send({
      success: true,
      message: `Banner status set to ${banner.isActive ? 'Active' : 'Inactive'}`,
      banner,
    });
  } catch (error) {
    console.error("Error in toggleBannerStatusController:", error);
    res.status(500).send({
      success: false,
      message: "Error in toggling banner status",
      error: error.message,
    });
  }
};

// Get Single Banner (Modified)
export const getSingleBannerController = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate banner ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ success: false, message: "Invalid banner ID" });
    }

    const banner = await bannerModel
      .findById(id)
      .populate("categoryId", "name")
      .populate("subcategoryId", "name");

    if (!banner) {
      return res.status(404).send({
        success: false,
        message: "Banner not found",
      });
    }

    res.status(200).send({
      success: true,
      message: "Banner fetched successfully",
      banner,
    });
  } catch (error) {
    console.error("Error in getSingleBannerController:", error);
    res.status(500).send({
      success: false,
      message: "Error in getting banner",
      error: error.message,
    });
  }
};

// Get Banners by Category and Subcategory (Modified)
export const getBannersByCategoryController = async (req, res) => {
  try {
    const { categoryId, subcategoryId } = req.params;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(categoryId) || !mongoose.Types.ObjectId.isValid(subcategoryId)) {
      return res.status(400).send({ success: false, message: "Invalid category or subcategory ID" });
    }

    const showAll = req.query.all === "true";
    const query = {
      categoryId,
      subcategoryId,
    };
    if (!showAll) {
      query.$or = [
        { isActive: true },
        { isActive: { $exists: false } },
        { isActive: "1" },
      ];
    }

    let banners = await bannerModel
      .find(query)
      .populate("categoryId", "name isActive")
      .populate("subcategoryId", "name isActive")
      .sort({ createdAt: -1 });

    if (!showAll) {
      banners = banners.filter((banner) => {
        if (banner.isActive === false || banner.isActive === "0") return false;
        if (banner.categoryId && (banner.categoryId.isActive === false || banner.categoryId.isActive === "0")) {
          return false;
        }
        if (banner.subcategoryId && (banner.subcategoryId.isActive === false || banner.subcategoryId.isActive === "0")) {
          return false;
        }
        return true;
      });
    }

    res.status(200).send({
      success: true,
      message: "Banners fetched successfully",
      count: banners.length,
      banners,
    });
  } catch (error) {
    console.error("Error in getBannersByCategoryController:", error);
    res.status(500).send({
      success: false,
      message: "Error in getting banners by category",
      error: error.message,
    });
  }
};




// Update Banner


// Get All Banners
export const getBannersController = async (req, res) => {
  try {
    const showAll = req.query.all === "true";
    let query = {};
    if (!showAll) {
      query = {
        $or: [
          { isActive: true },
          { isActive: { $exists: false } },
          { isActive: "1" },
        ],
      };
    }

    let banners = await bannerModel
      .find(query)
      .populate("categoryId", "name isActive")
      .populate("subcategoryId", "name isActive")
      .sort({ createdAt: -1 });

    if (!showAll) {
      // Exclude inactive banners and banners whose parent category/subcategory is inactive
      banners = banners.filter((banner) => {
        if (banner.isActive === false || banner.isActive === "0") return false;
        if (banner.categoryId && (banner.categoryId.isActive === false || banner.categoryId.isActive === "0")) {
          return false;
        }
        if (banner.subcategoryId && (banner.subcategoryId.isActive === false || banner.subcategoryId.isActive === "0")) {
          return false;
        }
        return true;
      });
    }

    res.status(200).send({
      success: true,
      message: showAll ? "All Banners fetched successfully" : "Active Banners fetched successfully",
      count: banners.length,
      banners,
    });
  } catch (error) {
    console.error("Error in getBannersController:", error);
    res.status(500).send({
      success: false,
      message: "Error in getting banners",
      error: error.message,
    });
  }
};

// Get Single Banner


// Delete Banner
export const deleteBannerController = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate banner ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ success: false, message: "Invalid banner ID" });
    }

    // Check if banner exists
    const banner = await bannerModel.findById(id);
    if (!banner) {
      return res.status(404).send({
        success: false,
        message: "Banner not found"
      });
    }

    // Delete banner
    await bannerModel.findByIdAndDelete(id);

    res.status(200).send({
      success: true,
      message: "Banner deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteBannerController:", error);
    res.status(500).send({
      success: false,
      message: "Error in deleting banner",
      error: error.message,
    });
  }
};


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
      subcategory: subcategoryId,
      isActive: "1",
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


