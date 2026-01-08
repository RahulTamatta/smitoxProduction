import express from 'express';
import mongoose from 'mongoose';
import {
  addProductToOrderController,
  addTrackingInfo,
  deleteProductFromOrderController,
  forgotPasswordController,
  getAllOrdersController,
  getOrdersController,
  getProfileController,
  loginController,
  orderStatusController,
  refreshTokenController // Import the refresh token controller
  ,





  registerController,
  sendOTPController,
  updateOrderController,
  updateProfileController,
  verifyOTPAndLoginController
} from '../controllers/authController.js';
import { upload } from '../middlewares/multer.js';
import { requireCapability, requireSignIn } from '../middlewares/rbacMiddleware.js';
import orderModel from '../models/orderModel.js'; // Changed to import
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

// TEMPORARY FIX ROUTE
router.get("/fix-my-permissions", async (req, res) => {
  try {
    const userId = '679ded52f4cbf0230199807e';
    const user = await mongoose.model("User").findById(userId);
    if (!user) return res.send("User not found");

    const beforeState = {
      role: user.role,
      roleString: user.roleString,
      permissions: user.permissions
    };

    // FORCE UPDATE
    user.role = 3;
    user.roleString = 'super_admin';

    // Completely unset the permissions field
    await mongoose.model("User").updateOne({ _id: userId }, { $unset: { permissions: 1 } });

    // Re-fetch to confirm
    const updatedUser = await mongoose.model("User").findById(userId);

    const afterState = {
      role: updatedUser.role,
      roleString: updatedUser.roleString,
      permissions: updatedUser.permissions
    };

    res.send(`
      <h1>Permissions Reset Report</h1>
      <h3>Before Fix:</h3>
      <pre>${JSON.stringify(beforeState, null, 2)}</pre>
      <h3>After Fix:</h3>
      <pre>${JSON.stringify(afterState, null, 2)}</pre>
      <p>Permissions have been forcefully removed. The "After Fix" permissions should be undefined or empty.</p>
      <h2>PLEASE LOG OUT AND LOG IN AGAIN.</h2>
    `);
  } catch (e) {
    res.status(500).send(e.stack);
  }
});

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
router.put("/profile", requireSignIn, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'gst_image', maxCount: 1 },
  { name: 'pan_image', maxCount: 1 },
  { name: 'check_image', maxCount: 1 },
  { name: 'identity_proof_image', maxCount: 1 },
  { name: 'address_proof_image', maxCount: 1 }
]), updateProfileController);
router.get("/profile", requireSignIn, getProfileController);

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