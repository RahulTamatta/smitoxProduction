import JWT from "jsonwebtoken";
import { computeCapabilities, ROLE_CAPABILITIES, NUMBER_TO_ROLE } from "../config/rbac-policy.js";

/**
 * Generate new JWT token with capabilities
 * @param {object} user - User object with _id, email_id, roleString, permissions
 * @returns {string} JWT token
 */
export const generateToken = (user) => {
  // Determine role: prefer roleString, fallback to numeric role conversion
  let userRole = user.roleString;
  if (!userRole && user.role !== undefined && user.role !== null) {
    userRole = NUMBER_TO_ROLE[user.role];
  }
  userRole = userRole || "user";

  // Compute capabilities with deny-over-grant precedence
  const baseCaps = ROLE_CAPABILITIES[userRole] || [];
  const capabilities = computeCapabilities(
    baseCaps,
    user.permissions?.grantedCapabilities || [],
    user.permissions?.deniedCapabilities || []
  );

  return JWT.sign(
    {
      _id: user._id,
      email: user.email_id,
      role: userRole,
      capabilities: capabilities,
      tokenVersion: user.tokenVersion || 0,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

/**
 * Refresh token after role or permission changes
 * Used when user role is updated, permissions are granted/denied, or plan is changed
 * @param {object} user - Updated user object
 * @returns {object} New token and user data
 */
export const refreshTokenAfterUpdate = (user) => {
  const newToken = generateToken(user);

  return {
    success: true,
    message: "Token refreshed after update",
    token: newToken,
    user: {
      _id: user._id,
      email: user.email_id,
      role: user.roleString || "user",
    },
  };
};

/**
 * Invalidate token (client-side: remove from localStorage)
 * Server-side: can implement token blacklist if needed
 * @param {string} token - Token to invalidate
 * @returns {object} Invalidation confirmation
 */
export const invalidateToken = (token) => {
  // In a production system, you might:
  // 1. Add token to a blacklist in Redis
  // 2. Store in database with expiration
  // 3. Client removes from localStorage

  return {
    success: true,
    message: "Token invalidated. Please login again.",
  };
};

/**
 * Verify and decode token
 * @param {string} token - JWT token
 * @returns {object} Decoded token or null if invalid
 */
export const verifyToken = (token) => {
  try {
    const decoded = JWT.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error("Token verification error:", error.message);
    return null;
  }
};

export default {
  generateToken,
  refreshTokenAfterUpdate,
  invalidateToken,
  verifyToken,
};
