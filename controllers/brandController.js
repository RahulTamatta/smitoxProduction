import brandModel from "../models/brandModel.js";
import slugify from "slugify";

export const createBrandController = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(401).send({ message: "Name is required" });
    }

    const existingBrand = await brandModel.findOne({ name });
    if (existingBrand) {
      return res.status(200).send({
        success: false,
        message: "brandModel Already Exists",
      });
    }

    const brandData = {
      name,
      slug: slugify(name),
    };

    const brand = await new brandModel(brandData).save();

    res.status(201).send({
      success: true,
      message: "New brand created",
      brand,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error: error.message,
      message: "Error in brandModel",
    });
  }
};

export const updateBrandController = async (req, res) => {
  try {
    const { name } = req.body;
    const { id } = req.params;
    const brand = await brandModel.findByIdAndUpdate(
      id,
      { name, slug: slugify(name) },
      { new: true }
    );
    res.status(200).send({
      success: true,
      message: "brandModel Updated Successfully",
      brand,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error while updating brand",
    });
  }
};

export const brandControlller = async (req, res) => {
  try {
    const brands = await brandModel.find({});
    res.status(200).send({
      success: true,
      message: "All brandModel List",
      brands,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error while getting all brands",
    });
  }
};

export const singleBrandController = async (req, res) => {
  try {
    const brand = await brandModel.findOne({ slug: req.params.slug });
    res.status(200).send({
      success: true,
      message: "Get Single brandModel Successfully",
      brand,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error While getting Single brandModel",
    });
  }
};

export const deleteBrandController = async (req, res) => {
  try {
    const { id } = req.params;
    await brandModel.findByIdAndDelete(id);
    res.status(200).send({
      success: true,
      message: "brandModel Deleted Successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "error while deleting brand",
      error,
    });
  }
};