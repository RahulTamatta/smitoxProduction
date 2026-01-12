import mongoose from "mongoose";
import path from "path";
import productForYouModel from "../models/productForYouModel.js";
import productModel from "../models/productModel.js";
import subcategoryModel from "../models/subcategoryModel.js";

export const adminGetProductsForYouController = async (req, res) => {
  try {
    // Fetch all products-for-you, populating necessary fields
    const products = await productForYouModel
      .find({})
      .populate("categoryId", "name")
      .populate("subcategoryId", "name")
      .populate("productId", "name photos price slug perPiecePrice")
      .select("categoryId subcategoryId productId")
      .sort({ createdAt: -1 });

    let productsWithBase64Photos = products.map((productForYou) => {
      const productObj = productForYou.toObject();

      if (
        productObj.productId &&
        productObj.productId.photos &&
        productObj.productId.photos.data
      ) {
        productObj.productId.photoUrl = `data:${productObj.productId.photos.contentType};base64,${productObj.productId.photos.data.toString(
          "base64"
        )}`;
        delete productObj.productId.photos;
      }

      return productObj;
    });

    res.status(200).send({
      success: true,
      message: "Admin products fetched successfully",
      banners: productsWithBase64Photos,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error in fetching admin products for you",
      error: error.message,
    });
  }
};

export const getProductsForYouController = async (req, res) => {
  try {
    const { categoryId, subcategoryId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res
        .status(400)
        .send({ success: false, message: "Invalid category ID" });
    }

    // Build filter for ProductForYou collection
    const filter = { categoryId };
    if (subcategoryId && mongoose.Types.ObjectId.isValid(subcategoryId)) {
      filter.subcategoryId = subcategoryId;
    }

    // Try to fetch from ProductForYou collection first
    let pfyItems = await productForYouModel
      .find(filter)
      .populate("productId", "name photos price slug perPiecePrice isActive")
      .select("productId")
      .sort({ createdAt: -1 });

    let products = [];

    if (pfyItems.length > 0) {
      // Map and filter active products
      products = pfyItems
        .filter(item => item.productId && item.productId.isActive === "1")
        .map(item => item.productId.toObject());
    }

    // Fallback: If no items in PFY, fetch directly from Product collection
    if (products.length < 4) {
      const remainingCount = 8 - products.length;
      const existingIds = products.map(p => p._id);

      const fallbackProducts = await productModel
        .find({
          category: categoryId,
          isActive: "1",
          _id: { $nin: existingIds }
        })
        .select("name photos price slug perPiecePrice isActive")
        .limit(remainingCount);

      products = [...products, ...fallbackProducts.map(p => p.toObject())];
    }

    // Convert photos to photoUrl if needed and prepare for frontend
    const finalProducts = products.map(p => {
      const productObj = p;
      if (productObj.photos && productObj.photos.data) {
        productObj.photoUrl = `data:${productObj.photos.contentType};base64,${productObj.photos.data.toString("base64")}`;
      } else if (productObj.photos && typeof productObj.photos === 'string') {
        productObj.photoUrl = productObj.photos;
      } else if (productObj.multipleimages && productObj.multipleimages.length > 0) {
        productObj.photoUrl = productObj.multipleimages[0];
      }
      return { productId: productObj };
    });

    // Shuffle the final list for variety
    const shuffledProducts = finalProducts.sort(() => Math.random() - 0.5);

    res.status(200).send({
      success: true,
      message: "Products fetched successfully",
      products: shuffledProducts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error in fetching products for you",
      error: error.message,
    });
  }
};

export const getAllProductsForYouController = async (req, res) => {
  try {
    const products = await productForYouModel.find()
      .populate("categoryId", "name")
      .populate("subcategoryId", "name")
      .populate("productId", "name photos price slug perPiecePrice custom_order")
      .select("categoryId subcategoryId productId")
      .sort({ "productId.custom_order": 1, createdAt: -1 });

    const productsWithBase64Photos = products.map((productForYou) => {
      const productObj = productForYou.toObject();

      if (
        productObj.productId &&
        productObj.productId.photos &&
        productObj.productId.photos.data
      ) {
        productObj.productId.photoUrl = `data:${productObj.productId.photos.contentType
          };base64,${productObj.productId.photos.data.toString("base64")}`;
        delete productObj.productId.photos;
      }

      return productObj;
    });

    res.status(200).send({
      success: true,
      message: "Products for you fetched successfully",
      products: productsWithBase64Photos,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error in fetching products for you",
      error: error.message,
    });
  }
};

export const singleProductController = async (req, res) => {
  try {
    const banner = await bannerModel
      .findOne({ _id: req.params.id })
      .select("-photos")
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

export const createProductForYouController = async (req, res) => {
  try {
    const { categoryId, subcategoryId, productId } = req.body;
    const file = req.file;

    if (!categoryId) return res.status(400).send({ error: "Category is required" });
    if (!subcategoryId) return res.status(400).send({ error: "Subcategory is required" });
    if (!productId) return res.status(400).send({ error: "Product is required" });

    const productForYouData = {
      categoryId,
      subcategoryId,
      productId
    };

    if (file) {
      productForYouData.photos = `uploads/banners/${path.basename(file.path)}`;
    }

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

// Bulk create multiple "Product For You" entries in one request
export const bulkCreateProductForYouController = async (req, res) => {
  try {
    const { categoryId, subcategoryId, productIds } = req.body;

    if (!categoryId) {
      return res.status(400).send({ success: false, message: "Category is required" });
    }
    if (!subcategoryId) {
      return res.status(400).send({ success: false, message: "Subcategory is required" });
    }
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).send({ success: false, message: "At least one productId is required" });
    }

    // Optional: filter out invalid ObjectIds
    const validProductIds = productIds.filter(
      (id) => id && mongoose.Types.ObjectId.isValid(id)
    );

    if (validProductIds.length === 0) {
      return res.status(400).send({ success: false, message: "No valid productIds provided" });
    }

    const docsToInsert = validProductIds.map((pid) => ({
      categoryId,
      subcategoryId,
      productId: pid,
    }));

    const created = await productForYouModel.insertMany(docsToInsert);

    res.status(201).send({
      success: true,
      message: "Products added to Product For You list successfully",
      count: created.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error in bulk creating products for you",
      error: error.message,
    });
  }
};

export const updateBannerController = async (req, res) => {
  try {
    const { categoryId, subcategoryId, productId } = req.body;
    const file = req.file;
    const { id } = req.params;

    if (!categoryId) return res.status(400).send({ error: "Category is required" });
    if (!subcategoryId) return res.status(400).send({ error: "Subcategory is required" });
    if (!productId) return res.status(400).send({ error: "Product is required" });

    const updateData = { categoryId, subcategoryId, productId };
    if (file) {
      updateData.photos = `uploads/banners/${path.basename(file.path)}`;
    }

    const banner = await productForYouModel.findByIdAndUpdate(
      id,
      updateData,
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
    // Build base query
    const query = {};

    // Apply isActive filter if provided
    // Example: GET /api/banners?filter=active
    if (req.query.filter && req.query.filter !== "all") {
      switch (req.query.filter) {
        case "active":
          query.isActive = "1";
          break;
        case "inactive":
          query.isActive = "0";
          break;
        default:
          // if you need other filter types, handle them here
          break;
      }
    }

    // (Optional) Filter by categoryId or subcategoryId if passed as query params
    // Example: GET /api/banners?categoryId=…&subcategoryId=…
    if (req.query.categoryId) {
      if (!mongoose.Types.ObjectId.isValid(req.query.categoryId)) {
        return res.status(400).send({
          success: false,
          message: "Invalid categoryId",
        });
      }
      query.categoryId = req.query.categoryId;
    }

    if (req.query.subcategoryId) {
      if (!mongoose.Types.ObjectId.isValid(req.query.subcategoryId)) {
        return res.status(400).send({
          success: false,
          message: "Invalid subcategoryId",
        });
      }
      query.subcategoryId = req.query.subcategoryId;
    }

    // Fetch banners with population, selection, and sorting
    const banners = await productForYouModel
      .find(query)
      .populate("categoryId", "name")
      .populate("subcategoryId", "name")
      .populate("productId", "name photos perPiecePrice price slug")
      .select("categoryId subcategoryId productId isActive")
      .sort({ createdAt: -1 });

    // Get all unique category IDs from the banners
    const categoryIds = [...new Set(banners
      .filter(banner => banner.categoryId)
      .map(banner => banner.categoryId._id.toString()))];

    // Fetch all subcategories related to these categories
    const subcategoriesByCategory = {};

    if (categoryIds.length > 0) {
      // Use the imported subcategoryModel to fetch data

      // Fetch subcategories for all categories in one query
      const relatedSubcategories = await subcategoryModel.find({
        category: { $in: categoryIds }
      }).select('name category');

      // Organize subcategories by category
      for (const subcategory of relatedSubcategories) {
        const categoryId = subcategory.category.toString();
        if (!subcategoriesByCategory[categoryId]) {
          subcategoriesByCategory[categoryId] = [];
        }
        subcategoriesByCategory[categoryId].push({
          _id: subcategory._id,
          name: subcategory.name
        });
      }
    }

    // Shuffle the banners array for random display and filter active ones
    const shuffledBanners = [...banners]
      .filter((b) => b.productId && b.productId.isActive === "1")
      .sort(() => Math.random() - 0.5);

    res.status(200).send({
      success: true,
      countTotal: shuffledBanners.length,
      message: "Filtered Banners",
      banners: shuffledBanners,
      categorySubcategories: subcategoriesByCategory
    });
  } catch (error) {
    console.error("Error in getting banners:", error);
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

// Bulk delete multiple "Product For You" entries
export const bulkDeleteProductController = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).send({
        success: false,
        message: "No ids provided for bulk delete",
      });
    }

    const validIds = ids.filter((id) => id && mongoose.Types.ObjectId.isValid(id));

    if (validIds.length === 0) {
      return res.status(400).send({
        success: false,
        message: "No valid ids provided for bulk delete",
      });
    }

    const result = await productForYouModel.deleteMany({ _id: { $in: validIds } });

    res.status(200).send({
      success: true,
      message: "Selected products deleted successfully from Product For You list",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error while performing bulk delete",
      error: error.message,
    });
  }
};

export const getProductPhoto = async (req, res) => {
  try {
    const product = await productModel.findById(req.params.pid).select("photos");
    if (product.photos.data) {
      res.set("Content-type", product.photos.contentType);
      return res.status(200).send(product.photos.data);
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while getting photos",
      error,
    });
  }
};