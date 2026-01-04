import {
  getCapabilities,
  hasCapability,
  hasAnyCapability,
  hasAllCapabilities,
  ROLES,
  ROLE_NUMBERS,
  NUMBER_TO_ROLE,
} from "../config/rbac-policy.js";

/**
 * Get user capabilities
 */
export const getUserCapabilities = (user) => {
  if (!user) return [];
  const role = user.roleString || NUMBER_TO_ROLE[user.role] || ROLES.USER;
  const permissions = user.permissions || {};
  return getCapabilities(role, permissions);
};

/**
 * Check if user has capability
 */
export const userHasCapability = (user, capability) => {
  if (!user) return false;
  const role = user.roleString || NUMBER_TO_ROLE[user.role] || ROLES.USER;
  const permissions = user.permissions || {};
  return hasCapability(role, capability, permissions);
};

/**
 * Check if user has any capability
 */
export const userHasAnyCapability = (user, capabilities) => {
  if (!user) return false;
  const role = user.roleString || NUMBER_TO_ROLE[user.role] || ROLES.USER;
  const permissions = user.permissions || {};
  return hasAnyCapability(role, capabilities, permissions);
};

/**
 * Check if user has all capabilities
 */
export const userHasAllCapabilities = (user, capabilities) => {
  if (!user) return false;
  const role = user.roleString || NUMBER_TO_ROLE[user.role] || ROLES.USER;
  const permissions = user.permissions || {};
  return hasAllCapabilities(role, capabilities, permissions);
};

/**
 * Get user role string
 */
export const getUserRole = (user) => {
  if (!user) return ROLES.USER;
  return user.roleString || NUMBER_TO_ROLE[user.role] || ROLES.USER;
};

/**
 * Check if user is super admin
 */
export const isSuperAdmin = (user) => {
  return getUserRole(user) === ROLES.SUPER_ADMIN;
};

/**
 * Check if user is admin or super admin
 */
export const isAdminOrSuperAdmin = (user) => {
  const role = getUserRole(user);
  return role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN;
};

/**
 * Check if user is seller
 */
export const isSeller = (user) => {
  return getUserRole(user) === ROLES.SELLER;
};

/**
 * Check if user is regular user
 */
export const isRegularUser = (user) => {
  return getUserRole(user) === ROLES.USER;
};

/**
 * Get visible menu items based on user capabilities
 */
export const getVisibleMenuItems = (user) => {
  const capabilities = getUserCapabilities(user);
  const role = getUserRole(user);

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      path: "/dashboard/admin",
      icon: "LayoutDashboard",
      visible: isAdminOrSuperAdmin(user) || isSeller(user),
    },
    {
      id: "products",
      label: "Products",
      path: "/dashboard/admin/products",
      icon: "Package",
      visible: capabilities.includes("products:read"),
    },
    {
      id: "orders",
      label: "Orders",
      path: "/dashboard/admin/orders",
      icon: "ShoppingCart",
      visible: capabilities.includes("orders:read"),
    },
    {
      id: "users",
      label: "Users",
      path: "/dashboard/admin/users",
      icon: "Users",
      visible: capabilities.includes("users:read"),
    },
    {
      id: "categories",
      label: "Categories",
      path: "/dashboard/admin/categories",
      icon: "Grid",
      visible: capabilities.includes("categories:read"),
    },
    {
      id: "banners",
      label: "Banners",
      path: "/dashboard/admin/banners",
      icon: "Image",
      visible: capabilities.includes("banners:read"),
    },
    {
      id: "productforyou",
      label: "Product For You",
      path: "/dashboard/admin/productforyou",
      icon: "Star",
      visible: capabilities.includes("productforyou:read"),
    },
    {
      id: "analytics",
      label: "Analytics",
      path: "/dashboard/admin/analytics",
      icon: "BarChart3",
      visible: capabilities.includes("analytics:read"),
    },
    {
      id: "sellers",
      label: "Sellers",
      icon: "Store",
      visible: isSuperAdmin(user),
      submenu: [
        {
          id: "sellers-applications",
          label: "Applications",
          path: "/dashboard/admin/sellers/applications",
          visible: capabilities.includes("sellers:applications:read"),
        },
        {
          id: "sellers-subscriptions",
          label: "Subscriptions",
          path: "/dashboard/admin/sellers/subscriptions",
          visible: capabilities.includes("subscriptions:read"),
        },
      ],
    },
    {
      id: "settings",
      label: "Settings",
      icon: "Settings",
      visible: isSuperAdmin(user),
      submenu: [
        {
          id: "settings-security",
          label: "Security & Roles",
          path: "/dashboard/admin/settings/security",
          visible: capabilities.includes("security:roles:read"),
        },
        {
          id: "settings-platform",
          label: "Platform Settings",
          path: "/dashboard/admin/settings/platform",
          visible: capabilities.includes("settings:read"),
        },
        {
          id: "settings-audit",
          label: "Audit Logs",
          path: "/dashboard/admin/settings/audit",
          visible: capabilities.includes("security:audit"),
        },
      ],
    },
  ];

  // Filter visible items
  return menuItems.filter((item) => {
    if (!item.visible) return false;
    if (item.submenu) {
      item.submenu = item.submenu.filter((sub) => sub.visible);
      return item.submenu.length > 0;
    }
    return true;
  });
};

/**
 * Check if action requires confirmation
 */
export const isDestructiveAction = (action, resourceType) => {
  const destructiveActions = [
    "products:delete",
    "orders:delete",
    "users:delete",
    "categories:delete",
    "banners:delete",
  ];

  return destructiveActions.includes(`${resourceType}:${action}`);
};

/**
 * Get confirmation message for destructive action
 */
export const getDestructiveActionMessage = (action, resourceType, resourceName) => {
  const messages = {
    "products:delete": `Are you sure you want to delete the product "${resourceName}"? This action cannot be undone.`,
    "orders:delete": `Are you sure you want to delete the order "${resourceName}"? This action cannot be undone.`,
    "users:delete": `Are you sure you want to delete the user "${resourceName}"? This action cannot be undone.`,
    "categories:delete": `Are you sure you want to delete the category "${resourceName}"? This action cannot be undone.`,
    "banners:delete": `Are you sure you want to delete the banner "${resourceName}"? This action cannot be undone.`,
  };

  return messages[`${resourceType}:${action}`] || "Are you sure? This action cannot be undone.";
};

/**
 * Check if action requires audit logging
 */
export const shouldAuditLog = (action, resourceType) => {
  const auditableActions = [
    "products:delete",
    "orders:delete",
    "orders:refund",
    "users:delete",
    "users:role:update",
    "sellers:applications:approve",
    "sellers:applications:reject",
    "subscriptions:toggle",
    "settings:write",
  ];

  return auditableActions.includes(`${resourceType}:${action}`);
};

/**
 * Get audit log severity
 */
export const getAuditLogSeverity = (action, resourceType) => {
  const criticalActions = [
    "users:delete",
    "users:role:update",
    "settings:write",
    "security:roles:write",
  ];

  const highActions = [
    "products:delete",
    "orders:delete",
    "orders:refund",
    "sellers:applications:approve",
    "sellers:applications:reject",
  ];

  const key = `${resourceType}:${action}`;

  if (criticalActions.includes(key)) return "critical";
  if (highActions.includes(key)) return "high";
  return "medium";
};

export default {
  getUserCapabilities,
  userHasCapability,
  userHasAnyCapability,
  userHasAllCapabilities,
  getUserRole,
  isSuperAdmin,
  isAdminOrSuperAdmin,
  isSeller,
  isRegularUser,
  getVisibleMenuItems,
  isDestructiveAction,
  getDestructiveActionMessage,
  shouldAuditLog,
  getAuditLogSeverity,
};
