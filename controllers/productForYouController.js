import productForYouModel from "../models/productForYouModel.js";
import productModel from "../models/productModel.js";
import productForYou from "../models/productForYouModel.js";
import mongoose from 'mongoose';






export const getProductsForYouController = async (req, res) => {
  try {
    const { categoryId, subcategoryId } = req.params;

    // 1. Validate IDs
    if (
      !mongoose.Types.ObjectId.isValid(categoryId) ||
      !mongoose.Types.ObjectId.isValid(subcategoryId)
    ) {
      return res
        .status(400)
        .send({
          success: false,
          message: "Invalid category or subcategory ID",
        });
    }

    // 2. Fetch & populate, filtering out inactive or out-of-stock products
    const productsForYou = await productForYouModel
      .find({
        categoryId,
        subcategoryId,
      })
      .populate("categoryId", "name")
      .populate("subcategoryId", "name")
      .populate({
        path: "productId",
        match: { isActive: "1", stock: { $gt: 0 } },
        select:
          "name photos price slug perPiecePrice custom_order isActive stock",
      })
      .select("categoryId subcategoryId productId")
      .sort({ "productId.custom_order": 1, createdAt: -1 })
      .lean();

    // 3. Filter out any entries where the product populate didn't match
    const filtered = productsForYou.filter((entry) => entry.productId);

    // 4. Convert binary photos to Base64 URLs
    const productsWithBase64Photos = filtered.map((entry) => {
      const prod = { ...entry };
      if (
        prod.productId.photos &&
        prod.productId.photos.data &&
        prod.productId.photos.contentType
      ) {
        prod.productId.photoUrl = `data:${
          prod.productId.photos.contentType
        };base64,${prod.productId.photos.data.toString("base64")}`;
        delete prod.productId.photos;
      }
      return prod;
    });

    // 5. Send the result
    res.status(200).send({
      success: true,
      message: "Products fetched successfully",
      count: productsWithBase64Photos.length,
      products: productsWithBase64Photos,
    });
  } catch (error) {
    console.error("Error in getProductsForYouController:", error);
    res.status(500).send({
      success: false,
      message: "Error fetching products for you",
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
        productObj.productId.photoUrl = `data:${
          productObj.productId.photos.contentType
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
    const { categoryId, subcategoryId, productId } = req.fields;

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
    const { filter, categoryId, subcategoryId } = req.query;
    const query = {};

    // 1. Banner‐level isActive filter
    if (filter && filter !== "all") {
      if (filter === "active") query.isActive = "1";
      else if (filter === "inactive") query.isActive = "0";
    }

    // 2. Optional category/subcategory filters
    if (categoryId) {
      if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        return res.status(400).send({
          success: false,
          message: "Invalid categoryId",
        });
      }
      query.categoryId = categoryId;
    }
    if (subcategoryId) {
      if (!mongoose.Types.ObjectId.isValid(subcategoryId)) {
        return res.status(400).send({
          success: false,
          message: "Invalid subcategoryId",
        });
      }
      query.subcategoryId = subcategoryId;
    }

    // 3. Fetch & populate, matching only active + in-stock products
    const rawBanners = await bannerModel
      .find(query)
      .populate("categoryId", "name")
      .populate("subcategoryId", "name")
      .populate({
        path: "productId",
        match: { isActive: "1", stock: { $gt: 0 } },
        select: "name photos price slug perPiecePrice custom_order isActive stock",
      })
      .select("categoryId subcategoryId productId isActive createdAt")
      .sort({ "productId.custom_order": 1, createdAt: -1 })
      .lean();

    // 4. Filter out banners without a matching product & convert photos → data-URLs
    const banners = rawBanners
      .filter((b) => b.productId)
      .map((b) => {
        const banner = { ...b };
        const prod = banner.productId;
        if (prod.photos?.data && prod.photos.contentType) {
          banner.productId.photoUrl = 
            `data:${prod.photos.contentType};base64,` +
            prod.photos.data.toString("base64");
          delete banner.productId.photos;
        }
        return banner;
      });

    // 5. Send response
    res.status(200).send({
      success: true,
      message: "Filtered banners fetched successfully",
      count: banners.length,
      banners,
    });
  } catch (error) {
    console.error("Error in getBannersController:", error);
    res.status(500).send({
      success: false,
      message: "Error fetching banners",
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

export const getActiveInStockProductsForYou = async (req, res) => {
  try {
    const productsForYou = await productForYouModel
      .find({})
      .populate("categoryId", "name")
      .populate("subcategoryId", "name")
      .populate({
        path: "productId",
        match: { isActive: "1", stock: { $gt: 0 } },
        select: "name photos price slug perPiecePrice custom_order isActive stock"
      })
      .select("categoryId subcategoryId productId")
      .sort({ "productId.custom_order": 1, createdAt: -1 });

    // Filter out entries where productId did not match (i.e., not active or out of stock)
    const filtered = productsForYou.filter(p => p.productId);

    res.status(200).send({
      success: true,
      message: "Active and in-stock Product For You products fetched successfully",
      products: filtered,
      count: filtered.length
    });
  } catch (error) {
    console.error("Error in getActiveInStockProductsForYou:", error);
    res.status(500).send({
      success: false,
      message: "Error fetching active and in-stock Product For You products",
      error: error.message
    });
  }
};