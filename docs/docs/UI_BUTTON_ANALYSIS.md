# UI & Button Interaction Analysis

This document analyzes the primary user interactions, click handlers, and state changes triggered by key buttons across the web application.

## 1. Authentication Flow (`Auth/Login.jsx`, `Layout/Header.jsx`)

### `[Login]` Button
- **Location**: `client/src/pages/Auth/Login.jsx`
- **Click Handler**: `handleSubmit(e)`
- **API Call**: `POST /api/v1/auth/login`
- **Payload**: `{ email, password }`
- **State Updates**: Updates the global `AuthContext` with the returned User object and JWT.
- **Success State**: Displays a Toast notification ("Login Successful"), saves to `localStorage`, and navigates the user to their respective dashboard (`/dashboard/admin` or `/dashboard/user`) or back to checkout.
- **Error State**: Toast notification displaying the server error.

### `[Logout]` Button
- **Location**: `client/src/components/Layout/Header.jsx`
- **Click Handler**: `handleLogout()`
- **API Call**: None.
- **State Updates**: Calls `setAuth({ user: null, token: "", ... })`, clears `localStorage`, removes Axios interceptor headers, and clears the cart state.
- **Redirect**: Navigates to `/login`.

## 2. Product Browsing & Cart (`ProductDetails.jsx`, `CartPage.jsx`)

### `[Add to Cart]` Button
- **Location**: `client/src/pages/ProductDetails.jsx`
- **Click Handler**: `handleAddToCart()`
- **Triggered Function**: `cartStore.addToCart(product, quantity)`
- **API Call**: `POST /api/v1/carts/users/:userId/cart`
- **Payload**: `{ productId, quantity }`
- **Validation Flow**: Checks if the user is logged in (via `getUserId()`). If not, triggers the `LoginPromptModal`.
- **State Updates**: *Optimistic Update* - The Zustand cart store immediately pushes the item to the UI. If the API fails, it rolls back.
- **Notifications**: Toast notification "Item added to cart".

### `[+] / [-]` Quantity Selectors
- **Location**: `client/src/components/ProductDetails/QuantitySelector.jsx`
- **Click Handler**: `handleQuantityChange(isIncrement)`
- **Triggered Function**: `increaseQuantity` or `decreaseQuantity` in `cart.store.js`.
- **Validation**: Checks `product.stock`. If `newQuantity > stock`, prevents the update and shows "Insufficient stock" error.
- **State Updates**: Dynamically calculates new price tiers if `bulkProducts` pricing is available.

## 3. Order Management (`user/Orders.jsx`, `userOrderModal.jsx`)

### `[Cancel Order]` / `[Return Order]` Buttons
- **Location**: `client/src/pages/user/Orders.jsx`
- **Click Handler**: `updateOrderStatus(status)` -> e.g., `updateOrderStatus('Cancelled')`
- **API Call**: `PUT /api/v1/product/order-status/:orderId`
- **Payload**: `{ status: "Cancelled" }`
- **Permissions**: The user must own the order, or the user must be an Admin/Seller with permissions.
- **Success State**: The order status badge updates in the UI to red/gray, and a Toast notification is shown.

## 4. Admin Workflows (`Admin/CreateCategory.jsx`, `Admin/SellerApplications.jsx`)

### `[Approve Application]` Button
- **Location**: `client/src/pages/Admin/SellerApplications.jsx`
- **Click Handler**: `handleApproveApplication(appId)`
- **API Call**: `PUT /api/v1/seller-application/:id/approve`
- **Permissions Required**: `requireCapability('sellers:moderate')` or Legacy `isAdmin`.
- **Database Impact**: Changes `SellerApplication.status` to `approved`. Creates a new `SellerProfile` document linked to the user. Upgrades the user's `roleString` to `seller`.
- **Notifications**: Likely triggers an email via SendGrid to the vendor.

### `[Save Category]` Button
- **Location**: `client/src/pages/Admin/CreateCategory.jsx`
- **Click Handler**: `handleSubmit(e)`
- **API Call**: `POST /api/v1/category/create-category`
- **Payload**: `FormData` containing `{ name, photo (File) }`
- **Loading State**: Disables button, shows a spinner.
- **Database Impact**: Uploads image to Cloudinary/ImageKit, then saves the URL and Category Name to MongoDB.
