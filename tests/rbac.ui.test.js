/**
 * Minimal frontend RBAC tests (Node-only)
 * Verifies sidebar visibility by capabilities and token decode helpers
 */

import { visibleMenu, getUserCapabilities, hasCap, hasAny } from "../client/src/utils/rbacHelper.js";

// Polyfill atob for Node test environment
if (typeof global.atob === "undefined") {
  global.atob = (b64) => Buffer.from(b64, "base64").toString("binary");
}

const buildJwt = (payloadObj) => {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64");
  const payload = Buffer.from(JSON.stringify(payloadObj)).toString("base64");
  return `${header}.${payload}.signature`;
};

describe("Client RBAC helper - visibleMenu", () => {
  test("Seller menu hides subscriptions and seller applications", () => {
    const token = buildJwt({ role: "seller", capabilities: [
      "products:read", "orders:read", "users:read", "categories:read", "banners:read", "analytics:read"
    ] });

    const menu = visibleMenu(token);
    const ids = menu.map(m => m.id);

    expect(ids).toContain("products");
    expect(ids).toContain("orders");
    expect(ids).not.toContain("subscriptions");
    expect(ids).not.toContain("seller-applications");
    expect(ids).not.toContain("security");
  });

  test("Super admin sees subscriptions and seller applications", () => {
    const token = buildJwt({ role: "super_admin", capabilities: [
      "products:read","orders:read","users:read","categories:read","banners:read","analytics:read",
      "subscriptions:read","sellers:applications:read","security:roles:read","settings:read"
    ] });

    const menu = visibleMenu(token);
    const ids = menu.map(m => m.id);

    expect(ids).toContain("subscriptions");
    expect(ids).toContain("seller-applications");
    expect(ids).toContain("security");
    expect(ids).toContain("settings");
  });
});

describe("Client RBAC helper - capability checks", () => {
  test("getUserCapabilities returns caps from token", () => {
    const token = buildJwt({ capabilities: ["orders:read","products:write"] });
    const caps = getUserCapabilities(token);
    expect(caps).toEqual(expect.arrayContaining(["orders:read","products:write"]));
  });

  test("hasCap and hasAny", () => {
    const token = buildJwt({ capabilities: ["orders:read","products:write"] });
    expect(hasCap(token, "orders:read")).toBe(true);
    expect(hasCap(token, "orders:write")).toBe(false);
    expect(hasAny(token, ["users:read","orders:read"]))
      .toBe(true);
  });
});
