# API Reference & Endpoints

This document outlines the primary RESTful API routes provided by the Express backend. The backend is modularized into several route files within `server/routes`.

## Authentication & Authorization (`/api/v1/auth`)

Handles user registration, login, JWT issuance, and RBAC profile fetching.

| Endpoint | Method | Middleware | Description |
|----------|--------|------------|-------------|
| `/register` | POST | None | Registers a new user. |
| `/login` | POST | None | Authenticates user, returns JWT and user profile. |
| `/test` | GET | `requireSignIn`, `isAdmin` | Verifies admin token access. |
| `/user-auth` | GET | `requireSignIn` | Validates standard user session. |
| `/admin-auth` | GET | `requireSignIn`, `isAdmin` | Validates admin session. |
| `/seller-auth` | GET | `requireSignIn`, `isSeller` | Validates seller session. |
| `/profile` | PUT | `requireSignIn` | Updates user's personal details. |

## Product Management (`/api/v1/product`)

Manages the core catalog.

| Endpoint | Method | Middleware | Description |
|----------|--------|------------|-------------|
| `/create-product` | POST | `requireSignIn`, `isAdmin`/`isSeller`, `formidable` | Creates a new product with image uploads. |
| `/get-product` | GET | None | Retrieves paginated product list. |
| `/get-product/:slug` | GET | None | Retrieves a single product by slug. |
| `/update-product/:pid` | PUT | `requireSignIn`, `isAdmin`/`isSeller`, `formidable` | Updates product details/images. |
| `/delete-product/:pid` | DELETE | `requireSignIn`, `isAdmin` | Soft or hard deletes a product. |
| `/product-filters` | POST | None | Fetches products based on price/category filters. |
| `/search/:keyword` | GET | None | Deprecated in favor of Elasticsearch. |

## Elasticsearch Engine (`/api/v1/search`)

High-performance text search and indexing capabilities.

| Endpoint | Method | Middleware | Description |
|----------|--------|------------|-------------|
| `/` | GET | None | Performs a fuzzy search across product titles and tags. |
| `/autocomplete` | GET | None | Returns instant suggestions for search bars. |
| `/admin` | GET | `requireSignIn`, `requireCapability('products:read')` | Admin portal search. |
| `/reindex` | POST | `requireSignIn`, `requireCapability('products:write')` | Forces sync between MongoDB and Elasticsearch. |

## Categories & Subcategories (`/api/v1/category`, `/api/v1/subcategory`)

| Endpoint | Method | Middleware | Description |
|----------|--------|------------|-------------|
| `/create-category` | POST | `requireSignIn`, `isAdmin` | Creates a parent category. |
| `/get-category` | GET | None | Fetches all categories. |
| `/create-subcategory` | POST | `requireSignIn`, `isAdmin` | Creates a subcategory linked to a parent. |

## Orders & Cart (`/api/v1/auth` / `/api/v1/product`)

| Endpoint | Method | Middleware | Description |
|----------|--------|------------|-------------|
| `/cart` | GET/POST | `requireSignIn` | Adds to or fetches current cart state. |
| `/orders` | GET | `requireSignIn` | Fetches a user's past orders. |
| `/all-orders` | GET | `requireSignIn`, `isAdmin` | Fetches all orders for the admin dashboard. |
| `/order-status/:orderId` | PUT | `requireSignIn`, `isAdmin`/`isSeller` | Updates order state (e.g., Dispatched, Delivered). |

## Seller Onboarding & Subscriptions (`/api/v1/seller-application`)

Manages the complex onboarding flow.

| Endpoint | Method | Middleware | Description |
|----------|--------|------------|-------------|
| `/` | POST | `requireSignIn` | Submits a new vendor KYC application. |
| `/my-application` | GET | `requireSignIn` | Gets the status of the current user's application. |
| `/:id/approve` | PUT | `requireSignIn`, `requireCapability('sellers:moderate')` | Admin approval of a seller. |
| `/:id/reject` | PUT | `requireSignIn`, `requireCapability('sellers:moderate')` | Admin rejection of a seller. |

## Payment Webhooks (`/api/v1/webhooks`)

Handles third-party callbacks asynchronously.

| Endpoint | Method | Middleware | Description |
|----------|--------|------------|-------------|
| `/razorpay/success` | POST | Verification logic | Captures successful payment, creates Subscription/Order. |
| `/razorpay/failure` | POST | Verification logic | Logs failed payment attempts. |

---

### Standard Response Format
Almost all API routes adhere to the following JSON structure:

```json
{
  "success": true, // or false
  "message": "Human readable message",
  "data": { ... } // Payload (omitted if error)
}
```
