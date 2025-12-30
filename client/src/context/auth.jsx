import axios from "axios";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const AuthContext = createContext();

// Create axios instance with interceptors
const api = axios.create();

const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(() => {
    const data = localStorage.getItem("auth");
    if (data) {
      try {
        const parseData = JSON.parse(data);
        return {
          user: parseData.user,
          token: parseData.token,
          refreshToken: parseData.refreshToken,
          sessionId: parseData.sessionId || ""
        };
      } catch (error) {
        console.error("Error parsing auth data from localStorage", error);
        localStorage.removeItem("auth");
      }
    }
    return {
      user: null,
      token: "",
      refreshToken: "",
      sessionId: ""
    };
  });
  const [authLoading, setAuthLoading] = useState(false); // No longer loading asynchronously
  const refreshTimeout = useRef(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshSubscribers, setRefreshSubscribers] = useState([]);

  // Logout function
  const logout = useCallback(() => {
    setAuth({ user: null, token: "", refreshToken: "", sessionId: "" });
    localStorage.removeItem("auth");
    api.defaults.headers.common["Authorization"] = "";
    if (refreshTimeout.current) clearTimeout(refreshTimeout.current);
    // Clear refresh subscribers
    setRefreshSubscribers([]);
    setIsRefreshing(false);
  }, []);

  // Add subscriber for waiting on token refresh
  const subscribeTokenRefresh = useCallback((callback) => {
    setRefreshSubscribers(prev => [...prev, callback]);
  }, []);

  // Notify subscribers that token has been refreshed
  const onRefreshed = useCallback((newToken) => {
    refreshSubscribers.forEach(callback => callback(newToken));
    setRefreshSubscribers([]);
  }, [refreshSubscribers]);

  // Refresh token function
  const refreshToken = useCallback(async () => {
    try {
      if (isRefreshing) {
        // If already refreshing, return a promise that resolves when refreshed
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            resolve(token);
          });
        });
      }

      setIsRefreshing(true);

      if (!auth.refreshToken) {
        console.warn("[Auth] No refresh token available, skipping refresh");
        setIsRefreshing(false);
        return null;
      }

      const res = await axios.post("/api/v1/auth/refresh-token", {
        refreshToken: auth.refreshToken
      });

      if (res.data.success && res.data.token) {
        const updatedAuth = {
          ...auth,
          token: res.data.token,
          refreshToken: res.data.refreshToken || auth.refreshToken,
          // Update user payload if server returned fresh user data (e.g., updated order_type)
          user: res.data.user ? { ...(auth.user || {}), ...res.data.user } : auth.user
        };

        setAuth(updatedAuth);
        localStorage.setItem("auth", JSON.stringify(updatedAuth));
        api.defaults.headers.common["Authorization"] = res.data.token;

        // Notify all subscribers about new token
        onRefreshed(res.data.token);

        // Schedule next refresh
        setupTokenRefresh(res.data.token);

        setIsRefreshing(false);
        return res.data.token;
      } else {
        // If refresh failed with a response but not success
        throw new Error("Token refresh server error");
      }
    } catch (error) {
      console.error("Token refresh error:", error);
      setIsRefreshing(false);
      // Only logout if it was a real attempt that failed (e.g. 401/403 from server)
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.warn("[Auth] Session expired or invalid, logging out");
        logout();
      }
      return null;
    }
  }, [auth, isRefreshing, logout, onRefreshed, subscribeTokenRefresh]);

  // Set up axios interceptors
  useEffect(() => {
    // Request interceptor: Add Authorization header
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        if (auth?.token) {
          config.headers.Authorization = auth.token;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor: Handle 401 errors
    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // If error is 401 and we haven't tried to refresh yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Try to refresh the token
            const newToken = await refreshToken();

            if (newToken) {
              // Update the failed request with new token and retry
              originalRequest.headers.Authorization = newToken;
              return api(originalRequest);
            }
          } catch (refreshError) {
            // If refresh fails, logout and reject
            console.error("Failed to refresh token:", refreshError);
            logout();
          }
        }

        return Promise.reject(error);
      }
    );

    // Cleanup function
    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [auth.token, logout, refreshToken]);

  // Decode JWT token and extract expiry time
  const decodeJwt = useCallback((token) => {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return {};
    }
  }, []);

  // Setup token refresh based on expiry
  const setupTokenRefresh = useCallback((token) => {
    // Clear any previous timeouts
    if (refreshTimeout.current) clearTimeout(refreshTimeout.current);

    // JWT expiry logging for access token
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const exp = payload.exp * 1000;
        const now = Date.now();
        const secondsLeft = Math.round((exp - now) / 1000);
        console.log('[AuthContext] Access token expires at:', new Date(exp).toLocaleTimeString(), '| Seconds remaining:', secondsLeft);
      } catch (e) {
        console.log('[AuthContext] Could not decode access token:', e);
      }
    }

    if (token) {
      const decoded = decodeJwt(token);
      const expiry = decoded.exp ? decoded.exp * 1000 : null;
      const now = Date.now();

      // Refresh 5 minutes before expiry to be safe
      if (expiry && expiry > now) {
        // For very short expiry (like 10s), refresh 2s before expiry
        let delay = expiry - now - 2000;
        if (delay < 0) delay = 0;
        refreshTimeout.current = setTimeout(() => {
          refreshToken();
        }, delay);
        console.log('[AuthContext] Scheduled refresh in', delay / 1000, 'seconds');
      } else if (expiry && expiry <= now) {
        // Token already expired
        console.warn("Token already expired, refreshing now");
        refreshToken();
      }
    }
  }, [decodeJwt, refreshTimeout, refreshToken]);

  // No longer needed: Load auth from localStorage on mount (done in useState initializer)
  // MARKED FOR REMOVAL:
  /*
  useEffect(() => {
    const data = localStorage.getItem("auth");
    ...
  }, []);
  */

  // Setup refresh timer when token changes
  useEffect(() => {
    if (auth.token) {
      setupTokenRefresh(auth.token);
    }
    return () => {
      if (refreshTimeout.current) clearTimeout(refreshTimeout.current);
    };
    // eslint-disable-next-line
  }, [auth.token]);

  return (
    <AuthContext.Provider value={[auth, setAuth, logout, refreshToken, api, authLoading]}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook
const useAuth = () => useContext(AuthContext);

export { api, AuthProvider, useAuth };

