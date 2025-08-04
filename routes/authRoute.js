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
import { isAdmin, requireSignIn } from '../middlewares/authMiddleware.js';
import orderModel from '../models/orderModel.js'; // Changed to import
 // Changed to import
// import { addTrackingInfo } from "../controllers/orderController.js";

//router object
const router = express.Router();

// Fetch single order (Admin only)
router.get("/order/:orderId", requireSignIn, isAdmin, async (req, res) => {
  try {
    const order = await orderModel
      .findById(req.params.orderId)
      .populate({
        path: "products.product",
        select: "name photo photos multipleimages price images sku gst isActive stock"
      })
      .populate("buyer", "user_fullname mobile_no address city state landmark pincode");

    if (!order) {
      return res.status(404).send({
        success: false,
        message: "Order not found"
      });
    }

    res.send({
      success: true,
      order
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).send({
      success: false,
      message: "Error fetching order",
      error: error.message
    });
  }
});

// Public order preview route (no authentication required)
router.get("/order/:orderId/preview", async (req, res) => {
  try {
    const order = await orderModel
      .findById(req.params.orderId)
      .populate({
        path: "products.product",
        select: "name photo photos multipleimages price images sku gst isActive stock"
      })
      .populate("buyer", "user_fullname mobile_no address city state landmark pincode");

    if (!order) {
      return res.status(404).send({
        success: false,
        message: "Order not found"
      });
    }

    res.send({
      success: true,
      order
    });
  } catch (error) {
    console.error("Error fetching order preview:", error);
    res.status(500).send({
      success: false,
      message: "Error fetching order preview",
      error: error.message
    });
  }
});

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
router.put("/order/:orderId/tracking", requireSignIn, isAdmin, addTrackingInfo);

//protected User route auth
router.get("/user-auth", requireSignIn, (req, res) => {
  res.status(200).send({ ok: true });
});
//protected Admin route auth
router.get("/admin-auth", requireSignIn, isAdmin, (req, res) => {
  res.status(200).send({ ok: true });
});

//update profile
router.put("/profile", requireSignIn, updateProfileController);

//orders
router.get("/orders/:user_id", getOrdersController);

//all orders
router.get("/all-orders", requireSignIn, isAdmin, getAllOrdersController);
router.put('/order/:orderId/add', requireSignIn,isAdmin, addProductToOrderController);
// order status update
router.put("/order-status/:orderId", orderStatusController);

// update order
router.put("/order/:orderId", requireSignIn, isAdmin, updateOrderController);

// remove product from order
router.delete("/order/:orderId/remove-product/:productId", requireSignIn, isAdmin, deleteProductFromOrderController);

// Generate PDF invoice (public route for preview)
router.get("/order/:orderId/invoice", async (req, res) => {
  try {
    const order = await orderModel
      .findById(req.params.orderId)
      .populate({
        path: "products.product",
        select: "name photo photos multipleimages price images sku gst isActive stock"
      })
      .populate("buyer", "user_fullname mobile_no address city state landmark pincode");

    if (!order) {
      return res.status(404).send({
        success: false,
        message: "Order not found"
      });
    }

    // Set headers to display PDF in browser instead of downloading
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="invoice.pdf"');
    
    // For now, we'll return JSON response since PDF generation is not implemented
    // This can be extended later with proper PDF generation library like puppeteer or pdfkit
    res.json({
      success: true,
      message: "PDF generation not implemented yet",
      order: order
    });
  } catch (error) {
    console.error("Error generating invoice:", error);
    res.status(500).send({
      success: false,
      message: "Error generating invoice",
      error: error.message
    });
  }
});

export default router;