// Client-side RBAC helpers (UI gating)
// Extract capabilities from JWT (auth.token) and provide simple checks

export const decodeJwt = (token) => {
  try {
    if (!token) return {};
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return {};
  }
};

export const getUserCapabilities = (token) => {
  const payload = decodeJwt(token);
  return Array.isArray(payload?.capabilities) ? payload.capabilities : [];
};

export const hasCap = (token, cap) => {
  const caps = getUserCapabilities(token);
  return caps.includes(cap);
};

export const hasAny = (token, caps) => {
  const userCaps = getUserCapabilities(token);
  return caps.some((c) => userCaps.includes(c));
};

// Sidebar menu composition based on capabilities
export const visibleMenu = (token) => {
  const caps = getUserCapabilities(token);
  const items = [
    { id: 'dashboard', label: 'Dashboard', path: '/dashboard/admin', show: true },
    { id: 'products', label: 'Products', path: '/dashboard/admin/products', show: caps.includes('products:read') },
    { id: 'orders', label: 'Orders', path: '/dashboard/admin/orders', show: caps.includes('orders:read') },
    { id: 'users', label: 'Users', path: '/dashboard/admin/users', show: caps.includes('users:read') },
    { id: 'categories', label: 'Categories', path: '/dashboard/admin/create-category', show: caps.includes('categories:read') },
    { id: 'banners', label: 'Banners', path: '/dashboard/admin/create-banner', show: caps.includes('banners:read') },
    { id: 'productforyou', label: 'App Home', path: '/dashboard/admin/productforyou', show: caps.includes('productforyou:read') },
    { id: 'analytics', label: 'Analytics', path: '/dashboard/admin/analytics', show: caps.includes('analytics:read') },
    // Hidden for sellers by design
    { id: 'seller-applications', label: 'Sellers → Applications', path: '/dashboard/admin/sellers/applications', show: caps.includes('sellers:applications:read') },
    { id: 'subscriptions', label: 'Subscriptions', path: '/dashboard/admin/sellers/subscriptions', show: caps.includes('subscriptions:read') },
    { id: 'security', label: 'Security & Roles', path: '/dashboard/admin/settings/security', show: caps.includes('security:roles:read') },
    { id: 'settings', label: 'Global Settings', path: '/dashboard/admin/settings/platform', show: caps.includes('settings:read') },
  ];
  return items.filter((i) => i.show);
};
