/**
 * RBAC Policy Configuration
 * Defines roles, capabilities, and access control rules
 */

// All available capabilities in the system
export const CAPABILITIES = {
  // Products
  'products:read': 'View products',
  'products:write': 'Create/edit products',
  'products:delete': 'Delete products',
  'products:bulk': 'Bulk operations on products',

  // Orders
  'orders:read': 'View orders',
  'orders:write': 'Create/edit orders',
  'orders:delete': 'Delete orders',
  'orders:refund': 'Process refunds',
  'orders:status': 'Update order status',

  // Users
  'users:read': 'View users',
  'users:write': 'Create/edit users',
  'users:delete': 'Delete users',
  'users:role:update': 'Update user roles',

  // Categories
  'categories:read': 'View categories',
  'categories:write': 'Create/edit categories',
  'categories:delete': 'Delete categories',

  // Banners
  'banners:read': 'View banners',
  'banners:write': 'Create/edit banners',
  'banners:delete': 'Delete banners',

  // ProductForYou
  'productforyou:read': 'View featured products',
  'productforyou:write': 'Manage featured products',
  'productforyou:delete': 'Remove featured products',

  // Analytics
  'analytics:read': 'View analytics and reports',
  'analytics:export': 'Export analytics data',

  // Subscriptions (plans)
  'subscriptions:read': 'View subscription plans',
  'subscriptions:write': 'Create/edit plans',
  'subscriptions:delete': 'Delete plans',
  'subscriptions:toggle': 'Toggle plan active/free status',

  // Seller Applications
  'sellers:applications:read': 'View seller applications',
  'sellers:applications:approve': 'Approve seller applications',
  'sellers:applications:reject': 'Reject seller applications',

  // Settings
  'settings:read': 'View platform settings',
  'settings:write': 'Edit platform settings',

  // Security & Roles
  'security:roles:read': 'View roles and permissions',
  'security:roles:write': 'Create/edit roles',
  'security:permissions:write': 'Assign permissions',
  'security:audit': 'View audit logs',

  // Seller Profile
  'seller:profile:read': 'View own seller profile',
  'seller:profile:write': 'Edit own seller profile',
};

// Seller deny-list: capabilities that sellers CANNOT have
export const SELLER_DENY_LIST = [
  'security:roles:read',
  'security:roles:write',
  'security:permissions:write',
  'security:audit',
  'subscriptions:read',
  'subscriptions:write',
  'subscriptions:delete',
  'subscriptions:toggle',
  'sellers:applications:read',
  'sellers:applications:approve',
  'sellers:applications:reject',
  'users:role:update',
  'users:delete',
  'settings:read',
  'settings:write',
  'orders:delete',
  'orders:refund', // Can be granted via feature flag
];

// Role to capabilities mapping
export const ROLE_CAPABILITIES = {
  super_admin: Object.keys(CAPABILITIES), // All capabilities

  admin: [
    // Products
    'products:read',
    'products:write',
    'products:delete',
    'products:bulk',

    // Orders
    'orders:read',
    'orders:write',
    'orders:status',

    // Users
    'users:read',
    'users:write',

    // Categories
    'categories:read',
    'categories:write',
    'categories:delete',

    // Banners
    'banners:read',
    'banners:write',
    'banners:delete',

    // ProductForYou
    'productforyou:read',
    'productforyou:write',
    'productforyou:delete',

    // Analytics
    'analytics:read',
    'analytics:export',

    // Subscriptions
    'subscriptions:read',
    'subscriptions:write',
    'subscriptions:delete',
    'subscriptions:toggle',

    // Seller Applications
    'sellers:applications:read',
    'sellers:applications:approve',
    'sellers:applications:reject',

    // Settings
    'settings:read',
    'settings:write',
  ],

  seller: Object.keys(CAPABILITIES).filter(
    (cap) => !SELLER_DENY_LIST.includes(cap)
  ), // All except deny-list

  user: [
    'products:read',
    'orders:read', // Own orders only
    'seller:profile:read',
  ],
};

// Role enum values
export const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  SELLER: 'seller',
  SUPER_ADMIN: 'super_admin',
};

// Role numeric values (for backward compatibility)
export const ROLE_NUMBERS = {
  user: 0,
  admin: 1,
  seller: 2,
  super_admin: 3,
};

// Reverse mapping
export const NUMBER_TO_ROLE = {
  0: 'user',
  1: 'admin',
  2: 'seller',
  3: 'super_admin',
};

/**
 * Compute capabilities with deny-over-grant precedence
 * Denied capabilities ALWAYS take priority over granted
 * @param {array} baseCaps - Base capabilities from role
 * @param {array} grantedCaps - Granted capabilities (optional)
 * @param {array} deniedCaps - Denied capabilities (optional)
 * @returns {array} Final computed capabilities
 */
export const computeCapabilities = (baseCaps = [], grantedCaps = [], deniedCaps = []) => {
  const set = new Set([...baseCaps, ...(grantedCaps || [])]);
  
  // DENY ALWAYS WINS: Remove all denied capabilities
  if (deniedCaps && Array.isArray(deniedCaps)) {
    for (const cap of deniedCaps) {
      set.delete(cap);
    }
  }
  
  return Array.from(set);
};

/**
 * Get capabilities for a role
 * Implements deny-over-grant precedence: denied capabilities always take priority
 * @param {string} role - Role name
 * @param {object} permissions - User-specific permissions override
 * @returns {array} Array of capabilities
 */
export const getCapabilities = (role, permissions = {}) => {
  const baseCaps = ROLE_CAPABILITIES[role] || [];

  // Apply permission overrides with deny-over-grant precedence
  if (permissions && typeof permissions === 'object') {
    return computeCapabilities(
      baseCaps,
      permissions.grantedCapabilities || [],
      permissions.deniedCapabilities || []
    );
  }

  return baseCaps;
};

/**
 * Convert roleString to numeric role
 * @param {string} roleString - Role string ('user', 'admin', 'seller', 'super_admin')
 * @returns {number} Numeric role (0, 1, 2, 3)
 */
export const getRoleNumber = (roleString) => {
  return ROLE_NUMBERS[roleString] || ROLE_NUMBERS.user;
};

/**
 * Check if a role has a specific capability
 * @param {string} role - Role name
 * @param {string} capability - Capability to check
 * @param {object} permissions - User-specific permissions
 * @returns {boolean}
 */
export const hasCapability = (role, capability, permissions = {}) => {
  const caps = getCapabilities(role, permissions);
  return caps.includes(capability);
};

/**
 * Check if a role has any of the given capabilities
 * @param {string} role - Role name
 * @param {array} capabilities - Array of capabilities to check
 * @param {object} permissions - User-specific permissions
 * @returns {boolean}
 */
export const hasAnyCapability = (role, capabilities, permissions = {}) => {
  const userCaps = getCapabilities(role, permissions);
  return capabilities.some((cap) => userCaps.includes(cap));
};

/**
 * Check if a role has all of the given capabilities
 * @param {string} role - Role name
 * @param {array} capabilities - Array of capabilities to check
 * @param {object} permissions - User-specific permissions
 * @returns {boolean}
 */
export const hasAllCapabilities = (role, capabilities, permissions = {}) => {
  const userCaps = getCapabilities(role, permissions);
  return capabilities.every((cap) => userCaps.includes(cap));
};

export default {
  CAPABILITIES,
  SELLER_DENY_LIST,
  ROLE_CAPABILITIES,
  ROLES,
  ROLE_NUMBERS,
  NUMBER_TO_ROLE,
  computeCapabilities,
  getCapabilities,
  getRoleNumber,
  hasCapability,
  hasAnyCapability,
  hasAllCapabilities,
};
