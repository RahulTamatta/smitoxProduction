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
  deleteProductFromOrderController,addTrackingInfo // Import your delete controller here
} from '../controllers/authController.js';
import { isAdmin, requireSignIn } from '../middlewares/authMiddleware.js';
import orderModel from '../models/orderModel.js'; // Changed to import
 // Changed to import
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
router.put("/order-status/:orderId", requireSignIn, isAdmin, orderStatusController);

// update order
router.put("/order/:orderId", requireSignIn, isAdmin, updateOrderController);

// remove product from order
router.delete("/order/:orderId/remove-product/:productId", requireSignIn, isAdmin, deleteProductFromOrderController);

export default router;