import JWT from "jsonwebtoken";
import {
    computeCapabilities,
    hasAnyCapability,
    NUMBER_TO_ROLE,
    ROLE_CAPABILITIES,
    ROLES
} from "../config/rbac-policy.js";
import auditLogModel from "../models/auditLogModel.js";
import userModel from "../models/userModel.js";

/**
 * Enhanced authentication middleware with user enrichment
 */
export const requireSignIn = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).send({
        success: false,
        message: "Authorization header is missing",
      });
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : authHeader;
    const decode = JWT.verify(token, process.env.JWT_SECRET);

    if (decode.exp && Date.now() >= decode.exp * 1000) {
      return res.status(401).send({
        success: false,
        message: "Token has expired",
        expired: true,
      });
    }

    // Fetch full user data for RBAC
    const user = await userModel.findById(decode._id);
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    // Treat users as active by default; only block when isActive is explicitly false
    if (user.isActive === false) {
      return res.status(403).send({
        success: false,
        message: "User account is inactive",
      });
    }

    // Determine role
    // Prefer numeric role (legacy field) so existing admins with role=1 are treated as admin
    let userRole = null;

    if (user.role !== undefined && user.role !== null) {
      userRole = NUMBER_TO_ROLE[user.role] || null;
    }

    // Fallback to roleString if numeric role is not set or not mapped
    if (!userRole && user.roleString) {
      userRole = user.roleString;
    }

    // Final fallback to regular user
    userRole = userRole || ROLES.USER;

    // Compute capabilities with deny-over-grant precedence
    const baseCaps = ROLE_CAPABILITIES[userRole] || [];
    const capabilities = computeCapabilities(
      baseCaps,
      user.permissions?.grantedCapabilities || [],
      user.permissions?.deniedCapabilities || []
    );

    // Enrich request with user data and computed capabilities
    req.user = {
      _id: user._id,
      email: user.email_id,
      role: userRole,
      capabilities: capabilities,
      permissions: user.permissions || {},
      sellerProfileId: user.sellerProfileId,
    };

    next();
  } catch (error) {
    console.error("Token verification error:", error.name, error.message);

    if (error.name === "TokenExpiredError") {
      return res.status(401).send({
        success: false,
        message: "Token has expired",
        expired: true,
      });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).send({
        success: false,
        message: "Invalid token format",
      });
    } else {
      return res.status(401).send({
        success: false,
        message: "Authentication failed",
      });
    }
  }
};

/**
 * Require specific role(s)
 */
export const requireRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).send({
          success: false,
          message: "Authentication required",
        });
      }

      const userRole = req.user.role;
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).send({
          success: false,
          message: `Access denied. Required roles: ${allowedRoles.join(", ")}`,
        });
      }

      next();
    } catch (error) {
      console.error("Role check error:", error);
      res.status(500).send({
        success: false,
        message: "Error checking role",
      });
    }
  };
};

/**
 * Require specific capability or capabilities
 * Uses pre-computed capabilities from req.user.capabilities
 */
export const requireCapability = (capabilities) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).send({
          success: false,
          message: "Authentication required",
        });
      }

      const userRole = req.user.role;
      const userCaps = req.user.capabilities || [];
      const requiredCaps = Array.isArray(capabilities)
        ? capabilities
        : [capabilities];

      // Check if user has all required capabilities
      const hasAllCaps = requiredCaps.every((cap) => userCaps.includes(cap));

      if (!hasAllCaps) {
        const missingCaps = requiredCaps.filter((cap) => !userCaps.includes(cap));

        // Log denied access attempt
        await logAuditEvent({
          actor: req.user._id,
          actorRole: userRole,
          action: "access_denied",
          resourceType: "capability",
          severity: "medium",
          description: `Attempted access to ${requiredCaps.join(", ")}. Missing: ${missingCaps.join(", ")}`,
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
          status: "failure",
        });

        return res.status(403).send({
          success: false,
          message: `Access denied. Required capabilities: ${requiredCaps.join(", ")}`,
          missing: missingCaps,
        });
      }

      next();
    } catch (error) {
      console.error("Capability check error:", error);
      res.status(500).send({
        success: false,
        message: "Error checking capabilities",
      });
    }
  };
};

/**
 * Require any of the given capabilities
 */
export const requireAnyCapability = (capabilities) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).send({
          success: false,
          message: "Authentication required",
        });
      }

      const userRole = req.user.role;
      const userPermissions = req.user.permissions || {};
      const requiredCaps = Array.isArray(capabilities)
        ? capabilities
        : [capabilities];

      const hasAnyCap = hasAnyCapability(
        userRole,
        requiredCaps,
        userPermissions
      );

      if (!hasAnyCap) {
        return res.status(403).send({
          success: false,
          message: `Access denied. Required one of: ${requiredCaps.join(", ")}`,
        });
      }

      next();
    } catch (error) {
      console.error("Capability check error:", error);
      res.status(500).send({
        success: false,
        message: "Error checking capabilities",
      });
    }
  };
};

/**
 * Legacy admin check (for backward compatibility)
 */
export const isAdmin = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.user._id);

    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    // Allow admin and super_admin
    const allowedRoles = [ROLES.ADMIN, ROLES.SUPER_ADMIN];
    if (!allowedRoles.includes(user.roleString || ROLES.USER)) {
      return res.status(403).send({
        success: false,
        message: "Unauthorized Access. Admin privileges required.",
      });
    }

    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    res.status(500).send({
      success: false,
      message: "Error in admin middleware",
      error: error.message,
    });
  }
};

/**
 * Require super admin role
 */
export const requireSuperAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).send({
        success: false,
        message: "Authentication required",
      });
    }

    if (req.user.role !== ROLES.SUPER_ADMIN) {
      return res.status(403).send({
        success: false,
        message: "Super Admin access required",
      });
    }

    next();
  } catch (error) {
    console.error("Super admin check error:", error);
    res.status(500).send({
      success: false,
      message: "Error checking super admin status",
    });
  }
};

/**
 * Require seller role
 */
export const requireSeller = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).send({
        success: false,
        message: "Authentication required",
      });
    }

    if (req.user.role !== ROLES.SELLER) {
      return res.status(403).send({
        success: false,
        message: "Seller access required",
      });
    }

    next();
  } catch (error) {
    console.error("Seller check error:", error);
    res.status(500).send({
      success: false,
      message: "Error checking seller status",
    });
  }
};

/**
 * Log audit event
 */
export const logAuditEvent = async (eventData) => {
  try {
    // Skip if no actor
    if (!eventData.actor) return;

    const auditLog = new auditLogModel({
      actor: eventData.actor,
      actorRole: eventData.actorRole || "unknown", // Provide fallback
      action: eventData.action,
      resourceType: eventData.resourceType,
      resourceId: eventData.resourceId || null,
      changes: eventData.changes || {},
      ipAddress: eventData.ipAddress,
      userAgent: eventData.userAgent,
      status: eventData.status || "success",
      errorMessage: eventData.errorMessage || null,
      severity: eventData.severity || "low",
      description: eventData.description,
      metadata: eventData.metadata,
    });

    await auditLog.save();
    return auditLog;
  } catch (error) {
    console.error("Error logging audit event:", error);
    // Don't throw - audit logging should not break the main flow
  }
};

/**
 * Middleware to log sensitive actions
 */
export const auditLog = (action, resourceType, severity = "medium") => {
  return async (req, res, next) => {
    // Store original send function
    const originalSend = res.send;

    // Override send to capture response
    res.send = function (data) {
      // Log the action
      if (req.user && res.statusCode < 400) {
        logAuditEvent({
          actor: req.user._id,
          actorRole: req.user.role,
          action,
          resourceType,
          resourceId: req.params.id || null,
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
          status: "success",
          severity,
          description: `${action} on ${resourceType}`,
        });
      }

      // Call original send
      originalSend.call(this, data);
    };

    next();
  };
};

export default {
  requireSignIn,
  requireRole,
  requireCapability,
  requireAnyCapability,
  isAdmin,
  requireSuperAdmin,
  requireSeller,
  logAuditEvent,
  auditLog,
};
