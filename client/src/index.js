import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/auth";
import { SearchProvider } from "./context/search";
import { CartProvider } from "./context/cart";
import "antd/dist/reset.css";
import { Toaster } from "react-hot-toast";
import { Provider } from 'react-redux'; // Import Provider
import store from './redux/store'; // Import your Redux store

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
            <Toaster />
            <App />
          </BrowserRouter>
        </CartProvider>
      </SearchProvider>
    </AuthProvider>
  </Provider>
);
