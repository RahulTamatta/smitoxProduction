import express from "express";
import {
  getAppContentController,
  updateAppContentController,
} from "../controllers/appContentController.js";
import { requireSignIn } from "../middlewares/rbacMiddleware.js";

const router = express.Router();

// Middleware to check admin or settings:write capability
const requireAdminOrSettingsWrite = (req, res, next) => {
  if (!req.user) {
    return res.status(401).send({
      success: false,
      message: "Authentication required",
    });
  }

  const userRole = req.user.role;
  const userCaps = req.user.capabilities || [];

  if (
    userRole === "admin" ||
    userRole === "super_admin" ||
    userCaps.includes("settings:write") ||
    userCaps.includes("settings:read")
  ) {
    return next();
  }

  return res.status(403).send({
    success: false,
    message: "Access denied. Admin privileges required.",
  });
};

// Public route to get app content (used by footer, privacy policy, terms pages)
router.get("/get-content", getAppContentController);

// Protected route to update app content (admin only)
router.put(
  "/update-content",
  requireSignIn,
  requireAdminOrSettingsWrite,
  updateAppContentController
);

export default router;
