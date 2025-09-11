// routes/miniMumRoutes.js
import express from "express";
import {
  getMinimumOrder,
  createMinimumOrder,
  updateMinimumOrder
} from "../controllers/minimumOrderController.js";
import { isAdmin, requireSignIn } from "./../middlewares/authMiddleware.js";

const router = express.Router();

// Public GET route
router.get('/getMinimumOrder', getMinimumOrder);

// Protected routes (require authentication and admin role)
router.post('/createMinimumOrder', requireSignIn, isAdmin, createMinimumOrder);
router.put('/updateMinimumOrder', requireSignIn, isAdmin, updateMinimumOrder);

export default router;