import { useState, useEffect, useContext, createContext, useCallback } from "react";
import axios from "axios";

const AuthContext = createContext();

// Create axios instance with interceptors
const api = axios.create();

const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({
    user: null,
    token: "",
    refreshToken: "",
    sessionId: ""
  });
  const [refreshTimeout, setRefreshTimeout] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshSubscribers, setRefreshSubscribers] = useState([]);

  // Logout function (defined early so it can be used in other functions)
  const logout = useCallback(() => {
    setAuth({ user: null, token: "", refreshToken: "", sessionId: "" });
    localStorage.removeItem("auth");
    api.defaults.headers.common["Authorization"] = "";
    if (refreshTimeout) clearTimeout(refreshTimeout);
    // Clear refresh subscribers
    setRefreshSubscribers([]);
    setIsRefreshing(false);
  }, [refreshTimeout]);

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
        throw new Error("No refresh token available");
      }

      const res = await axios.post("/api/v1/auth/refresh-token", { 
        refreshToken: auth.refreshToken 
      });
      
      if (res.data.success && res.data.token) {
        const updatedAuth = { 
          ...auth, 
          token: res.data.token,
          refreshToken: res.data.refreshToken || auth.refreshToken
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
        // If refresh failed
        throw new Error("Token refresh failed");
      }
    } catch (error) {
      console.error("Token refresh error:", error);
      setIsRefreshing(false);
      logout();
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
    if (refreshTimeout) clearTimeout(refreshTimeout);
    
    if (token) {
      const decoded = decodeJwt(token);
      const expiry = decoded.exp ? decoded.exp * 1000 : null;
      const now = Date.now();
      
      // Refresh 5 minutes before expiry to be safe
      if (expiry && expiry > now) {
        const timeout = setTimeout(() => {
          refreshToken();
        }, expiry - now - 300000); // 5 minutes before expiry
        
        setRefreshTimeout(timeout);
      } else if (expiry && expiry <= now) {
        // Token already expired
        console.warn("Token already expired, refreshing now");
        refreshToken();
      }
    }
  }, [decodeJwt, refreshTimeout, refreshToken]);

  // Load auth from localStorage on mount
  useEffect(() => {
    const data = localStorage.getItem("auth");
    if (data) {
      try {
        const parseData = JSON.parse(data);
        setAuth({
          ...auth,
          user: parseData.user,
          token: parseData.token,
          refreshToken: parseData.refreshToken,
          sessionId: parseData.sessionId || ""
        });
      } catch (error) {
        console.error("Error parsing auth data", error);
        localStorage.removeItem("auth");
      }
    }
    //eslint-disable-next-line
  }, []);

  // Setup refresh timer when token changes
  useEffect(() => {
    if (auth.token) {
      setupTokenRefresh(auth.token);
    }
    
    return () => {
      if (refreshTimeout) clearTimeout(refreshTimeout);
    };
    // eslint-disable-next-line
  }, [auth.token]);

  return (
    <AuthContext.Provider value={[auth, setAuth, logout, refreshToken, api]}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook
const useAuth = () => useContext(AuthContext);

export { useAuth, AuthProvider, api };
