import JWT from "jsonwebtoken";
import userModel from "../models/userModel.js";

// Protected Routes token base
export const requireSignIn = async (req, res, next) => {
  try {
    // Check if Authorization header exists
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).send({
        success: false,
        message: "Authorization header is missing"
      });
    }

    // Verify the token
    const decode = JWT.verify(authHeader, process.env.JWT_SECRET);
    
    // Check token expiration manually 
    if (decode.exp && Date.now() >= decode.exp * 1000) {
      return res.status(401).send({
        success: false,
        message: "Token has expired",
        expired: true
      });
    }
    
    // Set user in request
    req.user = decode;
    next();
  } catch (error) {
    console.error("Token verification error:", error.name, error.message);
    
    // Return appropriate error based on error type
    if (error.name === "TokenExpiredError") {
      return res.status(401).send({
        success: false,
        message: "Token has expired",
        expired: true
      });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).send({
        success: false,
        message: "Invalid token format"
      });
    } else {
      return res.status(401).send({
        success: false,
        message: "Authentication failed. Token invalid or expired."
      });
    }
  }
};

// Admin access middleware
export const isAdmin = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.user._id);
    
    // Check if user exists
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found"
      });
    }
    
    // Check if user is admin
    if (user.role !== 1) {
      return res.status(403).send({
        success: false,
        message: "Unauthorized Access. Admin privileges required."
      });
    }
    
    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    res.status(500).send({
      success: false,
      message: "Error in admin middleware",
      error: error.message
    });
  }
};
