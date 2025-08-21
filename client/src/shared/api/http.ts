import axios from "axios";

export const http = axios.create({
  baseURL: "/api/v1",
  timeout: 30000,
  headers: { "Content-Type": "application/json" }
});

// Global interceptor: attach token from localStorage if present
http.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem("auth");
    if (raw) {
      const parsed = JSON.parse(raw);
      const token: string | undefined = parsed?.token;
      if (token) {
        const headers = (config.headers ?? {}) as any;
        if (typeof headers.set === "function") {
          headers.set("Authorization", token); // raw token, no 'Bearer '
        } else {
          config.headers = { ...headers, Authorization: token } as any;
        }
      }
    }
  } catch {
    // ignore
  }
  return config;
});

export const attachAuth = (getToken?: () => string | undefined) => {
  http.interceptors.request.use((config) => {
    const token = getToken?.();
    if (token) {
      const headers = (config.headers ?? {}) as any;
      if (typeof headers.set === "function") {
        headers.set("Authorization", token);
      } else {
        config.headers = { ...headers, Authorization: token } as any;
      }
    }
    return config;
  });
};
