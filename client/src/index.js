import React from "react";
import axios from "axios";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/auth";
import { SearchProvider } from "./context/search";
import { CartProvider } from "./context/cart";
import "antd/dist/reset.css";
import { Provider } from 'react-redux'; // Import Provider
import store from './redux/store'; // Import your Redux store

// Attach the stored auth token to same-origin API calls made with the global axios
// instance (many pages call axios directly instead of services/api.js).
axios.interceptors.request.use((config) => {
  const url = config.url || "";
  const isSameOriginApi = url.startsWith("/api/") || url.startsWith(`${window.location.origin}/api/`);
  if (isSameOriginApi && !config.headers?.Authorization) {
    try {
      const token = JSON.parse(localStorage.getItem("auth") || "null")?.token;
      if (token) config.headers.Authorization = token;
    } catch (e) {
      // ignore malformed auth storage
    }
  }
  return config;
});

// Enable browser's automatic scroll restoration using window.history
if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'auto';
}

// Force light theme for admin design tokens for now
document.documentElement.setAttribute('data-theme', 'light');

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <Provider store={store}> {/* Wrap your app with Provider */}
    <AuthProvider>
      <SearchProvider>
        <CartProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </CartProvider>
      </SearchProvider>
    </AuthProvider>
  </Provider>
);
