import express from 'express';
import {
  registerController,
  loginController,
  addProductToOrderController,
  forgotPasswordController,
  updateProfileController,
  updateOrderController,
  getOrdersController,
  getAllOrdersController,sendOTPController,verifyOTPAndLoginController,
  orderStatusController,
  deleteProductFromOrderController,addTrackingInfo,
  refreshTokenController // Import the refresh token controller
} from '../controllers/authController.js';
import { requireSignIn, requireCapability, auditLog } from '../middlewares/rbacMiddleware.js';
import orderModel from '../models/orderModel.js'; // Changed to import
import mongoose from 'mongoose';
// import { addTrackingInfo } from "../controllers/orderController.js";

//router object
const router = express.Router();

//routing
//REGISTER || METHOD POST
router.post("/register", registerController);

//LOGIN || POST
router.post("/send-otp", sendOTPController);
router.post("/verify-otp", verifyOTPAndLoginController);

router.post("/login", loginController);

//REFRESH TOKEN || POST
router.post("/refresh-token", refreshTokenController);

//Forgot Password || POST
router.post("/forgot-password", forgotPasswordController);

//test routes
// router.get("/test", requireSignIn, isAdmin, testController);
router.put("/order/:orderId/tracking", requireSignIn, requireCapability("orders:write"), addTrackingInfo);

//protected User route auth
router.get("/user-auth", requireSignIn, (req, res) => {
  res.status(200).send({ ok: true });
});
//protected Admin/Seller route auth
// Any authenticated user passes; actual pages are gated by capabilities
router.get("/admin-auth", requireSignIn, (req, res) => {
  res.status(200).send({ ok: true });
});

//update profile
router.put("/profile", requireSignIn, updateProfileController);

//orders
router.get("/orders/:user_id", getOrdersController);

// single order by ID
router.get("/order/:orderId", requireSignIn, requireCapability("orders:read"), async (req, res) => {
  try {
    const { orderId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID format"
      });
    }

    const order = await orderModel.findById(orderId)
      .populate({
        path: "buyer",
        select: "user_fullname email_id mobile_no address city state landmark pincode gst"
      })
      .populate({
        path: "products.product",
        select: "name photos gst price unitSet bulkProducts perPiecePrice mrp stock isActive"
      });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error("Error fetching single order:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching order",
      error: error.message
    });
  }
});

//all orders
router.get("/all-orders", requireSignIn, requireCapability("orders:read"), getAllOrdersController);
router.put('/order/:orderId/add', requireSignIn, requireCapability("orders:write"), addProductToOrderController);
// order status update
router.put("/order-status/:orderId", requireSignIn, requireCapability("orders:status"), orderStatusController);

// update order
router.put("/order/:orderId", requireSignIn, requireCapability("orders:write"), updateOrderController);

// remove product from order (editing order items)
router.delete("/order/:orderId/remove-product/:productId", requireSignIn, requireCapability("orders:write"), deleteProductFromOrderController);

export default router;