import { useState, useEffect, useContext, createContext } from "react";
import axios from "axios";

const AuthContext = createContext();
const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({
    user: null,
    token: "",
    sessionId: ""
  });
  const [refreshTimeout, setRefreshTimeout] = useState(null);

  // Set default axios header
  axios.defaults.headers.common["Authorization"] = auth?.token;

  // Load auth from localStorage on mount
  useEffect(() => {
    const data = localStorage.getItem("auth");
    if (data) {
      const parseData = JSON.parse(data);
      setAuth({
        ...auth,
        user: parseData.user,
        token: parseData.token,
        sessionId: parseData.sessionId || ""
      });
    }
    //eslint-disable-next-line
  }, []);

  // Token refresh logic
  useEffect(() => {
    // Clear any previous timeouts
    if (refreshTimeout) clearTimeout(refreshTimeout);
    // Only set if token exists
    if (auth.token) {
      // Decode token to get expiry (assume JWT, exp in seconds)
      const decodeJwt = (token) => {
        try {
          return JSON.parse(atob(token.split('.')[1]));
        } catch {
          return {};
        }
      };
      const decoded = decodeJwt(auth.token);
      const expiry = decoded.exp ? decoded.exp * 1000 : null;
      const now = Date.now();
      // Refresh 1 minute before expiry
      if (expiry && expiry > now) {
        const timeout = setTimeout(() => {
          refreshToken();
        }, expiry - now - 60000);
        setRefreshTimeout(timeout);
      }
    }
    // Cleanup
    return () => {
      if (refreshTimeout) clearTimeout(refreshTimeout);
    };
    // eslint-disable-next-line
  }, [auth.token]);

  // Refresh token function
  const refreshToken = async () => {
    try {
      const res = await axios.post("/api/v1/auth/refresh-token", { token: auth.token });
      if (res.data.success && res.data.token) {
        const updatedAuth = { ...auth, token: res.data.token };
        setAuth(updatedAuth);
        localStorage.setItem("auth", JSON.stringify(updatedAuth));
        axios.defaults.headers.common["Authorization"] = res.data.token;
      } else {
        logout();
      }
    } catch {
      logout();
    }
  };

  // Logout function
  const logout = () => {
    setAuth({ user: null, token: "", sessionId: "" });
    localStorage.removeItem("auth");
    axios.defaults.headers.common["Authorization"] = "";
    if (refreshTimeout) clearTimeout(refreshTimeout);
  };

  return (
    <AuthContext.Provider value={[auth, setAuth, logout, refreshToken]}>
      {children}
    </AuthContext.Provider>
  );
};

// custom hook
const useAuth = () => useContext(AuthContext);

export { useAuth, AuthProvider };
