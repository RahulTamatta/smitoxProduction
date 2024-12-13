// controllers/minimumOrderController.js
import mongoose from "mongoose";
import MinimumOrder from "../models/miniMumOrderModel.js";

export const getMinimumOrder = async (req, res) => {
  try {
    const minimumOrder = await MinimumOrder.findOne();
    res.json(minimumOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createMinimumOrder = async (req, res) => {
  const minimumOrder = new MinimumOrder({
    amount: req.body.amount,
    currency: req.body.currency,
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
    const updatedMinimumOrder = await MinimumOrder.findOneAndUpdate(
      {},
      { amount: req.body.amount, currency: req.body.currency },
      { new: true, upsert: true }
    );
    res.json(updatedMinimumOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};