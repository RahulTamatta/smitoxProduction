import mongoose from "mongoose";
import Pincode from "../models/pincodeModel.js";

// In pincodeController.js

export const createPincodeController = async (req, res) => {
  try {
    const { code, isAvailable, city, landmark, state } = req.body;
    const pincode = await new Pincode({ 
      code, 
      isAvailable,
      city,
      landmark,
      state
    }).save();
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
    const { code, isAvailable, city, landmark, state } = req.body;
    const pincode = await Pincode.findByIdAndUpdate(
      id,
      { 
        code, 
        isAvailable,
        city,
        landmark,
        state
      },
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
      // Search by either pincode or other fields
      pincode = await Pincode.findOne({
        $or: [
          { code: id },
          { city: { $regex: new RegExp(id, 'i') } },  // Case-insensitive city search
          { state: { $regex: new RegExp(id, 'i') } },  // Case-insensitive state search
          { landmark: { $regex: new RegExp(id, 'i') } }  // Case-insensitive landmark search
        ]
      });
    }

    if (!pincode) {
      return res.status(404).send({
        success: false,
        message: "No matching location found",
      });
    }

    // Find related pincodes in the same city/state
    const relatedPincodes = await Pincode.find({
      $and: [
        { _id: { $ne: pincode._id } },  // Exclude current pincode
        { 
          $or: [
            { city: pincode.city },
            { state: pincode.state }
          ]
        }
      ]
    }).limit(5);  // Limit to 5 related results

    res.status(200).send({
      success: true,
      pincode: {
        ...pincode._doc,
        related_locations: relatedPincodes,
        location_details: {
          city: pincode.city,
          state: pincode.state,
          landmark: pincode.landmark,
          full_address: `${pincode.landmark ? pincode.landmark + ', ' : ''}${pincode.city}, ${pincode.state} - ${pincode.code}`
        }
      }
    });

  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error while getting location details",
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