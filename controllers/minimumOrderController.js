// controllers/minimumOrderController.js
import mongoose from "mongoose";
import MinimumOrder from "../models/miniMumOrderModel.js";

export const getMinimumOrder = async (req, res) => {
  try {
    const minimumOrder = await MinimumOrder.findOne();
    res.status(200).send({
      success: true,
      message: "All Minimum ",
      minimumOrder,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
