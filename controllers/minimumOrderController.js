// controllers/minimumOrderController.js
import mongoose from "mongoose";
import MinimumOrder from "../models/miniMumOrderModel.js";

export const getMinimumOrder = async (req, res) => {
  try {
    // Fetch the minimum order data
    const minimumOrder = await MinimumOrder.findOne();

    // If no minimum order data is found
    if (!minimumOrder) {
      return res.status(404).json({ 
        success: false, 
        message: "Minimum order data not found",
        data: null,
      });
    }

    // Return the minimum order data
    res.status(200).json({ 
      success: true,
      message: "Minimum order data fetched successfully",
      data: {
        amount: minimumOrder.amount,
        currency: minimumOrder.currency,
        advancePercentage: minimumOrder.advancePercentage,
      },
    });
  } catch (error) {
    // Log the error on the server
    console.error('Error fetching minimum order:', error);

    // Return a generic error message to the client
    res.status(500).json({ 
      success: false,
      message: "Error fetching minimum order data",
      error: error.message, // Include the error message for debugging
      data: null,
    });
  }
};
export const createMinimumOrder = async (req, res) => {
  const minimumOrder = new MinimumOrder({
    amount: req.body.amount,
    currency: req.body.currency,
    ...(req.body.advancePercentage !== undefined && { advancePercentage: req.body.advancePercentage })
  });

  try {
    const newMinimumOrder = await minimumOrder.save();
    res.status(201).json(newMinimumOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateMinimumOrder = async (req, res) => {
  try {
    const updateData = {};
    
    // Only include fields that are provided in the request
    if (req.body.amount !== undefined) updateData.amount = req.body.amount;
    if (req.body.currency !== undefined) updateData.currency = req.body.currency;
    if (req.body.advancePercentage !== undefined) updateData.advancePercentage = req.body.advancePercentage;

    const updatedMinimumOrder = await MinimumOrder.findOneAndUpdate(
      {},
      updateData,
      { new: true, upsert: true }
    );
    res.json(updatedMinimumOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
