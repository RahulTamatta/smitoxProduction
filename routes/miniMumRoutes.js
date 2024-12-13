// routes/miniMumRoutes.js
import express from "express";
import {
  getMinimumOrder,
  createMinimumOrder,
  updateMinimumOrder
} from "../controllers/minimumOrderController.js";
import { isAdmin, requireSignIn } from "./../middlewares/authMiddleware.js";

const router = express.Router();

router.get('/getMinimumOrder',   requireSignIn,
getMinimumOrder);
router.post('/createMinimumOrder',  requireSignIn,
isAdmin, createMinimumOrder);
router.put('/updateMinimumOrder',  requireSignIn,
isAdmin, updateMinimumOrder);

export default router;