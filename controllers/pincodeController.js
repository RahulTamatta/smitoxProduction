import mongoose from "mongoose";
import Pincode from "../models/pincodeModel.js";

export const createPincodeController = async (req, res) => {
  try {
    const { code, isAvailable } = req.body;
    const pincode = await new Pincode({ code, isAvailable }).save();
    res.status(201).send({
      success: true,
      message: "Pincode created successfully",
      pincode,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error in creating pincode",
    });
  }
};

export const updatePincodeController = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, isAvailable } = req.body;
    const pincode = await Pincode.findByIdAndUpdate(
      id,
      { code, isAvailable },
      { new: true }
    );
    res.status(200).send({
      success: true,
      message: "Pincode updated successfully",
      pincode,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error in updating pincode",
    });
  }
};

export const getAllPincodesController = async (req, res) => {
  try {
    const pincodes = await Pincode.find({});
    res.status(200).send({
      success: true,
      message: "All Pincodes",
      pincodes,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error while getting all pincodes",
    });
  }
};

export const getSinglePincodeController = async (req, res) => {
  try {
    const { id } = req.params;
    
    let pincode;
    if (mongoose.Types.ObjectId.isValid(id)) {
      pincode = await Pincode.findById(id);
    } else {
      pincode = await Pincode.findOne({ code: id });
    }

    if (!pincode) {
      return res.status(404).send({
        success: false,
        message: "Pincode not found",
      });
    }

    res.status(200).send({
      success: true,
      pincode,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error while getting single pincode",
    });
  }
};

export const deletePincodeController = async (req, res) => {
  try {
    const { id } = req.params;
    await Pincode.findByIdAndDelete(id);
    res.status(200).send({
      success: true,
      message: "Pincode deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error while deleting pincode",
    });
  }
};