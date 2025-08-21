import axios from "axios";

export const http = axios.create({
  baseURL: "/api/v1",
  timeout: 30000,
  headers: { "Content-Type": "application/json" }
});

// Global interceptor: attach auth token from localStorage if available
http.interceptors.request.use((config) => {
  try {
    const authRaw = localStorage.getItem("auth");
    if (authRaw) {
      const auth = JSON.parse(authRaw);
      if (auth && auth.token) {
        // Backend expects raw token (no 'Bearer ' prefix)
        config.headers = { ...config.headers, Authorization: auth.token };
      }
    }
  } catch (e) {
    // fail silently if localStorage is unavailable or JSON parse fails
  }
  return config;
});

// Optional helper to attach auth via a custom getter (kept for flexibility)
export const attachAuth = (getToken) => {
  http.interceptors.request.use((config) => {
    const token = typeof getToken === "function" ? getToken() : undefined;
    if (token) {
      // Use raw token to match backend's Authorization expectation
      config.headers = { ...config.headers, Authorization: token };
    }
    return config;
  });
};
