import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/authContext";
import { SearchProvider } from "./context/search";
import { CartProvider } from "./context/cartContext";
import "antd/dist/reset.css";
import { Toaster } from "react-hot-toast";

// Redux imports
import { Provider } from 'react-redux';
import store from './store/store';
if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'auto';
}

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
