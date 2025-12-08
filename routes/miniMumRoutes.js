// routes/miniMumRoutes.js
import express from "express";
import {
  getMinimumOrder,
  createMinimumOrder,
  updateMinimumOrder
} from "../controllers/minimumOrderController.js";
import { requireSignIn } from "./../middlewares/authMiddleware.js";
import { requireCapability } from "../middlewares/rbacMiddleware.js";

const router = express.Router();

// Public GET route
router.get('/getMinimumOrder', getMinimumOrder);

// Protected routes (require authentication and admin role)
router.post('/createMinimumOrder', requireSignIn, requireCapability("settings:write"), createMinimumOrder);
router.put('/updateMinimumOrder', requireSignIn, requireCapability("settings:write"), updateMinimumOrder);

export default router;