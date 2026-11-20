// Pages that render as a full-width "dashboard" (no storefront header, content offset by a fixed sidebar)
const PORTAL_PREFIXES = [
  "/dashboard/admin",
  "/seller/dashboard",
  "/seller/listings",
  "/seller/orders",
  "/seller/store",
];

export const isPortalPath = (pathname = "") => {
  const path = pathname.toLowerCase();
  return PORTAL_PREFIXES.some((prefix) => path.startsWith(prefix));
};
