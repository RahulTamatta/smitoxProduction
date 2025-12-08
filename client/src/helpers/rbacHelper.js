/**
 * RBAC Helper - Client-side capability checking
 */

/**
 * Get user capabilities from auth context
 */
export const getUserCapabilities = (auth) => {
  if (!auth || !auth.user) return [];
  
  const permissions = auth.user.permissions || {};
  const grantedCapabilities = permissions.grantedCapabilities || [];
  const deniedCapabilities = permissions.deniedCapabilities || [];

  // Deny-over-grant: Remove denied from granted
  return grantedCapabilities.filter(cap => !deniedCapabilities.includes(cap));
};

/**
 * Check if user has a specific capability
 */
export const hasCap = (auth, capability) => {
  const caps = getUserCapabilities(auth);
  return caps.includes(capability);
};

/**
 * Check if user has any of the given capabilities
 */
export const hasAny = (auth, capabilities) => {
  if (!Array.isArray(capabilities)) return false;
  const userCaps = getUserCapabilities(auth);
  return capabilities.some(cap => userCaps.includes(cap));
};

/**
 * Check if user has all of the given capabilities
 */
export const hasAll = (auth, capabilities) => {
  if (!Array.isArray(capabilities)) return false;
  const userCaps = getUserCapabilities(auth);
  return capabilities.every(cap => userCaps.includes(cap));
};

/**
 * Get visible menu items based on user capabilities
 */
export const getVisibleMenuItems = (auth, allMenuItems) => {
  if (!Array.isArray(allMenuItems)) return [];

  return allMenuItems.filter(item => {
    // If no capability required, always show
    if (!item.capability) return true;

    // If capability required, check if user has it
    if (typeof item.capability === 'string') {
      return hasCap(auth, item.capability);
    }

    // If array of capabilities, check if user has any
    if (Array.isArray(item.capability)) {
      return hasAny(auth, item.capability);
    }

    return false;
  });
};

/**
 * Filter submenu items by capability
 */
export const getVisibleSubMenu = (auth, submenu) => {
  if (!Array.isArray(submenu)) return [];

  return submenu.filter(item => {
    if (!item.capability) return true;
    
    if (typeof item.capability === 'string') {
      return hasCap(auth, item.capability);
    }

    if (Array.isArray(item.capability)) {
      return hasAny(auth, item.capability);
    }

    return false;
  });
};

/**
 * Check if user is seller
 */
export const isSeller = (auth) => {
  return auth?.user?.roleString === 'seller' || auth?.user?.role === 2;
};

/**
 * Check if user is super admin
 */
export const isSuperAdmin = (auth) => {
  return auth?.user?.roleString === 'super_admin' || auth?.user?.role === 1;
};

/**
 * Check if user is admin
 */
export const isAdmin = (auth) => {
  return auth?.user?.roleString === 'admin' || auth?.user?.role === 3;
};

/**
 * Get user role string
 */
export const getUserRole = (auth) => {
  return auth?.user?.roleString || 'user';
};

/**
 * Check if token needs refresh (version mismatch)
 */
export const needsTokenRefresh = (auth, storedTokenVersion) => {
  if (!auth?.user) return false;
  return auth.user.tokenVersion !== storedTokenVersion;
};

export default {
  getUserCapabilities,
  hasCap,
  hasAny,
  hasAll,
  getVisibleMenuItems,
  getVisibleSubMenu,
  isSeller,
  isSuperAdmin,
  isAdmin,
  getUserRole,
  needsTokenRefresh,
};
