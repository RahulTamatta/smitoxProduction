import userModel from "../models/userModel.js";
import orderModel from "../models/orderModel.js";
import productModel from "../models/productModel.js";
import { comparePassword, hashPassword } from "./../helpers/authHelper.js";
import JWT from "jsonwebtoken";
import axios from "axios";
import Pincode from '../models/pincodeModel.js';

// send OTP
export const sendOTPController = async (req, res) => {
  try {
    let { phoneNumber } = req.body;

    // Convert phoneNumber to an integer
    phoneNumber = parseInt(phoneNumber, 10);

    const API_KEY = process.env.TWO_FACTOR_API_KEY;

    if (!API_KEY) {
      throw new Error('TWO_FACTOR_API_KEY is not defined in the environment variables');
    }

    const response = await axios.get(`https://2factor.in/API/V1/${API_KEY}/SMS/${phoneNumber}/AUTOGEN/OTP%20For%20Verification`);

    if (response.data.Status === "Success") {
      res.status(200).json({
        success: true,
        message: "SMS OTP sent successfully",
        sessionId: response.data.Details,
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Failed to send SMS OTP",
      });
    }
  } catch (error) {
    console.error('Error in sendOTPController:', error.message);
    res.status(500).json({
      success: false,
      message: "Error in sending SMS OTP",
      error: error.message,
    });
  }
};

// verify OTP and login
export const verifyOTPAndLoginController = async (req, res) => {
  try {
    const { sessionId, otp, phoneNumber } = req.body;
    const API_KEY = process.env.TWO_FACTOR_API_KEY;

    if (!phoneNumber || typeof phoneNumber !== 'string' || phoneNumber.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number",
      });
    }

    if (!API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'TWO_FACTOR_API_KEY is not defined in the environment variables',
      });
    }

    const verifyResponse = await axios.get(`https://2factor.in/API/V1/${API_KEY}/SMS/VERIFY/${sessionId}/${otp}`);

    if (verifyResponse.data.Status === "Success") {
      const mobile_no = phoneNumber.trim();

      const user = await userModel.findOne({ mobile_no });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User does not exist, please register",
        });
      }

      const token = JWT.sign({ _id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      return res.status(200).json({
        success: true,
        message: "Login successful",
        user: {
          _id: user._id,
          user_fullname: user.user_fullname,
          email_id: user.email_id,
          mobile_no: user.phone,
          address: user.address,
          role: user.role,
          pincode: user.pincode,
          status: user.status,
          order_type: user.order_type, // return order_type as part of the user profile
          wishlist: user.wishlist,
          cart: user.cart,
        },
        token,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }
  } catch (error) {
    console.error('Error in verifyOTPAndLoginController:', error.message);
    return res.status(500).json({
      success: false,
      message: "Error in login",
      error: error.message,
    });
  }
};

// Register user
export const registerController = async (req, res) => {
  const { 
    user_fullname, 
    email_id, 
    mobile_no, 
    address, 
    pincode, 
    answer, 
    live_product, 
    credit, 
    b_form_status 
  } = req.body;

  try {
    // Check if user already exists
    const existingUser = await userModel.findOne({ email_id });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }


    // Validations
    if (!user_fullname) {
      return res.status(400).send({ error: "Name is Required" });
    }
    if (!email_id) {
      return res.status(400).send({ message: "Email is Required" });
    }
    if (!mobile_no) {
      return res.status(400).send({ message: "Phone no is Required" });
    }
    if (!address) {
      return res.status(400).send({ message: "Address is Required" });
    }
    if (!pincode) {
      return res.status(400).send({ message: "PIN Code is Required" });
    }



    // Check pincode and create if necessary
    let existingPincode = await Pincode.findOne({ code: pincode });
    if (!existingPincode) {
      existingPincode = await new Pincode({ code: pincode, isAvailable: true }).save();
    }



    const newUser = new userModel({
      user_fullname,
      email_id,
      mobile_no,
      address,
      pincode,
    live_product,
      credit,
      b_form_status,
    });

    await newUser.save();

    // Send success response
    res.status(201).json({
      success: true,
      message: "User registered successfully",
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Registration failed. Try again later.",
    });
  }
};

// Login with email_id and password
export const loginController = async (req, res) => {
  try {
    const { email_id, password } = req.body;

    if (!email_id || !password) {
      return res.status(404).send({
        success: false,
        message: "Invalid email_id or password",
      });
    }

    const user = await userModel.findOne({ email_id });
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "Email is not registered",
      });
    }

    const match = await comparePassword(password, user.password);
    if (!match) {
      return res.status(200).send({
        success: false,
        message: "Invalid Password",
      });
    }

    const token = JWT.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).send({
      success: true,
      message: "Login successfully",
      user: {
        _id: user._id,
        user_fullname: user.user_fullname,
        email_id: user.email_id,
        mobile_no: user.phone,
        address: user.address,
        role: user.role,
        pincode: user.pincode,
        order_type: user.order_type, // Include order type
      },
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error in login",
      error,
    });
  }
};

// Forgot Password
export const forgotPasswordController = async (req, res) => {
  try {
    const { email_id, answer, newPassword } = req.body;

    if (!email_id) {
      res.status(400).send({ message: "Email is required" });
    }
    if (!answer) {
      res.status(400).send({ message: "Answer is required" });
    }
    if (!newPassword) {
      res.status(400).send({ message: "New Password is required" });
    }

    const user = await userModel.findOne({ email_id, answer });
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "Wrong Email Or Answer",
      });
    }

    const hashed = await hashPassword(newPassword);
    await userModel.findByIdAndUpdate(user._id, { password: hashed });

    res.status(200).send({
      success: true,
      message: "Password Reset Successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Something went wrong",
      error,
    });
  }
};

// Update Profile
export const updateProfileController = async (req, res) => {
  try {
    const { user_fullname, email_id, password, address, phone } = req.body;
    const user = await userModel.findById(req.user._id);

    if (password && password.length < 6) {
      return res.json({ error: "Password is required and should be 6 characters long" });
    }

    const hashedPassword = password ? await hashPassword(password) : undefined;
    const updatedUser = await userModel.findByIdAndUpdate(
      req.user._id,
      {
        user_fullname: user_fullname || user.user_fullname,
        password: hashedPassword || user.password,
        phone: phone || user.phone,
        address: address || user.address,
      },
      { new: true }
    );

    res.status(200).send({
      success: true,
      message: "Profile Updated Successfully",
      updatedUser,
    });
  } catch (error) {
    console.error(error);
    res.status(400).send({
      success: false,
      message: "Error While Updating Profile",
      error,
    });
  }
};

export const getOrdersController = async (req, res) => {
  try {
    // Get user_id from route params
    const { user_id } = req.params;

    // Fetch orders based on the user_id passed in the route
    const orders = await orderModel
      .find({ buyer: user_id }) // Use the user_id directly
      .populate({
        path: "products.product",
        select: "name photo price images sku"
        // Populate all fields in Product schema
      })
      .populate("buyer", "user_fullname"); // Include only `user_fullname` for the buyer

    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error While Getting Orders",
      error,
    });
  }
};
export const getAllOrdersController = async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};

    if (status && status !== 'all-orders') {
      query.status = status;
    }

    const orders = await orderModel
    .find(query)
    .populate({
      path: "products.product",
      select: "name  gst price " // Ensure name is selected
    })
    .populate("buyer", "name email gst")
    .sort({ createdAt: "-1" });
    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error While Getting Orders",
      error,
    });
  }
};





export const addProductToOrderController = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { productId, quantity, price } = req.body;

    // Validate input
    if (!orderId || !productId || !quantity) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    // Find the existing order
    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Ensure status is valid
    const validStatuses = [
      "Pending", "Confirmed", "Accepted", "Cancelled", 
      "Rejected", "Dispatched", "Delivered", "Returned"
    ];

    // If current status is invalid, set to default "Pending"
    if (!validStatuses.includes(order.status)) {
      order.status = "Pending";
    }

    // Check if product already exists in order
    const existingProductIndex = order.products.findIndex(
      p => p.product.toString() === productId
    );

    if (existingProductIndex !== -1) {
      // Update quantity if product exists
      order.products[existingProductIndex].quantity += quantity;
    } else {
      // Add new product to order
      order.products.push({
        product: productId,
        quantity,
        price
      });
    }

    // Recalculate total amount
    const totalAmount = order.products.reduce(
      (total, product) => total + (product.quantity * product.price), 
      0
    );
    order.amount = totalAmount;

    // Save updated order
    await order.save();

    // Populate the updated order with product details
    const updatedOrder = await orderModel
      .findById(orderId)
      .populate({
        path: "products.product",
        select: "name photo price images sku"
      })
      .populate("buyer", "name email");

    res.json({
      success: true,
      message: "Product added to order successfully",
      order: updatedOrder
    });

  } catch (error) {
    console.error("Error adding product to order:", error);
    res.status(500).json({
      success: false,
      message: "Error adding product to order",
      error: error.message
    });
  }
};
//order status'
export const orderStatusController = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    // console.log("Oder and status",{orderId,status});
    const orders = await orderModel.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );
    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error While Updateing orderModel",
      error,
    });
  }
};

// In your orderController.js file
export const addTrackingInfo = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { company, id } = req.body;

    const updatedOrder = await orderModel.findByIdAndUpdate(
      orderId,
      { tracking: { company, id } },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).send({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).send({
      success: true,
      message: "Tracking information added successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error adding tracking information",
      error,
    });
  }
};

export const updateOrderController = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { deliveryCharges, codCharges, discount, amount, products } = req.body;

    const order = await orderModel.findById(orderId).populate('products.product');

    if (!order) {
      return res.status(404).send({
        success: false,
        message: "Order not found",
      });
    }

    // Update products while preserving existing product details
    order.products = products.map((updatedProduct, index) => {
      const existingProduct = order.products[index];
      return {
        product: existingProduct?.product?._id || updatedProduct.product,
        quantity: updatedProduct.quantity,
        price: updatedProduct.price
      };
    });

    // Calculate total product amount
    const totalProductAmount = products.reduce((total, product) => {
      return total + (Number(product.price) * Number(product.quantity));
    }, 0);

    // Update order fields
    order.deliveryCharges = Number(deliveryCharges) || 0;
    order.codCharges = Number(codCharges) || 0;
    order.discount = Number(discount) || 0;
    order.amount = Number(amount) || 0;

    // Calculate new total amount
    const newTotalAmount = totalProductAmount + order.deliveryCharges + order.codCharges - order.discount;

    // Calculate amount pending
    order.amountPending = newTotalAmount - order.amount;

    // Save the updated order
    const updatedOrder = await order.save();

    res.status(200).send({
      success: true,
      message: "Order updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Error in updating order:", error);
    res.status(500).send({
      success: false,
      message: "Error in updating order",
      error: error.message,
    });
  }
};

export const deleteProductFromOrderController = async (req, res) => {
  try {
    const { orderId, productId } = req.params;

    // Log incoming request
    console.log(`Attempting to delete product from order. Order ID: ${orderId}, Product ID: ${productId}`);

    // Find the order by ID
    const order = await orderModel.findById(orderId);

    if (!order) {
      console.log(`Order not found. ID: ${orderId}`);
      return res.status(404).send({
        success: false,
        message: "Order not found",
      });
    }

    // Check if the product exists in the order
    const productIndex = order.products.findIndex(
      (product) => product._id.toString() === productId
    );

    if (productIndex === -1) {
      console.log(`Product not found in order. Product ID: ${productId}`);
      return res.status(404).send({
        success: false,
        message: "Product not found in the order",
      });
    }

    // Remove the product from the order
    const removedProduct = order.products[productIndex];
    order.products.splice(productIndex, 1);

    // Save the updated order
    await order.save();

    console.log(`Product removed successfully. Product ID: ${productId} from Order ID: ${orderId}`);

    return res.status(200).send({
      success: true,
      message: "Product removed from order successfully",
      removedProduct, // Send back the removed product details
      order, // Updated order with the remaining products
    });
  } catch (error) {
    console.error(`Error deleting product from order. Order ID: ${orderId}, Product ID: ${productId}`, error);
    return res.status(500).send({
      success: false,
      message: "An error occurred while deleting the product from the order",
      error: error.message,
    });
  }
};

// router.get("/order/:orderId/invoice", requireSignIn, async (req, res) => {
//   try {
//     const order = await orderModel.findById(req.params.orderId).populate('buyer').populate('products');
//     if (!order) {
//       return res.status(404).send('Order not found');
//     }

//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Disposition', `attachment; filename=invoice-${order._id}.pdf`);

//     generateInvoicePDF(order, res);
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Error generating invoice');
//   }
// });