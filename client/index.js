import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/auth";
import { SearchProvider } from "./context/search";
import { CartProvider } from "./context/cart";
import "antd/dist/reset.css";
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

Sentry.init({
  dsn: "YOUR_SENTRY_FRONTEND_DSN", // Replace with your frontend DSN
  integrations: [new BrowserTracing()],
  tracesSampleRate: 1.0, // Adjust sample rate as needed
  environment: "production",
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <Sentry.ErrorBoundary fallback={"An unexpected error occurred"}>
    <AuthProvider>
      <SearchProvider>
        <CartProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </CartProvider>
      </SearchProvider>
    </AuthProvider>
  </Sentry.ErrorBoundary>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
