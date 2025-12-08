# Smitox B2B E-Commerce Platform - Architecture & Wireframe Documentation

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Diagram](#architecture-diagram)
4. [Database Schema](#database-schema)
5. [Frontend Architecture](#frontend-architecture)
6. [Backend Architecture](#backend-architecture)
7. [API Endpoints](#api-endpoints)
8. [User Flows & Wireframes](#user-flows--wireframes)
9. [Future Enhancements](#future-enhancements)

---

## 🎯 System Overview

**Smitox B2B Wholesale** is a comprehensive e-commerce platform designed for B2B wholesale transactions. The platform enables:

- **Buyers**: Browse products, manage cart, place orders, track shipments
- **Sellers**: Manage inventory, process orders, handle bulk operations
- **Admins**: Oversee entire platform, manage users, products, orders, and analytics

### Key Features
- Multi-tier product pricing (bulk discounts)
- Real-time order management
- Advanced search and filtering
- Responsive design (mobile, tablet, desktop)
- Role-based access control (RBAC)
- Payment gateway integration (COD, Online)
- Invoice generation (PDF)
- WhatsApp integration for order updates

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18.x
- **State Management**: Context API + Custom Hooks
- **UI Components**: React-Bootstrap, Ant Design, Lucide Icons
- **Styling**: TailwindCSS, CSS Modules, Inline Styles
- **HTTP Client**: Axios
- **Routing**: React Router v6
- **Notifications**: React Hot Toast
- **PDF Generation**: jsPDF, html2canvas
- **Form Handling**: React Hook Form (implicit)

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Express-Formidable
- **Middleware**: Custom auth, CORS, error handling
- **API Style**: RESTful

### DevOps & Deployment
- **Version Control**: Git
- **Package Manager**: npm
- **Build Tool**: Webpack (via Create React App)
- **Environment**: Docker-ready (optional)

---

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER (React)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │  Public Pages    │  │  Admin Dashboard │  │  Auth Pages  │  │
│  │  - Home          │  │  - Products      │  │  - Login     │  │
│  │  - Products      │  │  - Orders        │  │  - Register  │  │
│  │  - Cart          │  │  - Users         │  │  - Forgot PW │  │
│  │  - Checkout      │  │  - Analytics     │  │              │  │
│  │  - Orders        │  │  - Settings      │  │              │  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
│           │                     │                     │          │
│           └─────────────────────┼─────────────────────┘          │
│                                 │                                │
│                    ┌────────────▼────────────┐                   │
│                    │   Context API + Hooks   │                   │
│                    │  - Auth Context         │                   │
│                    │  - Global State         │                   │
│                    └────────────┬────────────┘                   │
│                                 │                                │
└─────────────────────────────────┼────────────────────────────────┘
                                  │
                    ┌─────────────▼──────────────┐
                    │   HTTP Layer (Axios)       │
                    │   - Request/Response       │
                    │   - Error Handling         │
                    │   - Token Management       │
                    └─────────────┬──────────────┘
                                  │
┌─────────────────────────────────┼────────────────────────────────┐
│                    API GATEWAY (Express.js)                       │
├─────────────────────────────────┼────────────────────────────────┤
│                                 │                                │
│  ┌──────────────────────────────▼──────────────────────────────┐ │
│  │              Route Handlers & Middleware                    │ │
│  │  - Authentication Middleware                               │ │
│  │  - Authorization (RBAC)                                    │ │
│  │  - Request Validation                                      │ │
│  │  - Error Handling                                          │ │
│  └──────────────────────────────┬──────────────────────────────┘ │
│                                 │                                │
│  ┌──────────────────────────────▼──────────────────────────────┐ │
│  │           Controller Layer (Business Logic)                 │ │
│  │  - authController                                           │ │
│  │  - productController                                        │ │
│  │  - orderController                                          │ │
│  │  - userController                                           │ │
│  │  - categoryController                                       │ │
│  │  - productForYouController                                  │ │
│  └──────────────────────────────┬──────────────────────────────┘ │
│                                 │                                │
│  ┌──────────────────────────────▼──────────────────────────────┐ │
│  │           Service Layer (Data Operations)                   │ │
│  │  - Validation Logic                                         │ │
│  │  - Business Rules                                           │ │
│  │  - External API Calls                                       │ │
│  └──────────────────────────────┬──────────────────────────────┘ │
│                                 │                                │
└─────────────────────────────────┼────────────────────────────────┘
                                  │
┌─────────────────────────────────┼────────────────────────────────┐
│                    DATA LAYER (MongoDB)                           │
├─────────────────────────────────┼────────────────────────────────┤
│                                 │                                │
│  ┌──────────────────────────────▼──────────────────────────────┐ │
│  │         Mongoose Models & Schemas                           │ │
│  │  - User Model                                               │ │
│  │  - Product Model                                            │ │
│  │  - Order Model                                              │ │
│  │  - Category Model                                           │ │
│  │  - Subcategory Model                                        │ │
│  │  - ProductForYou Model                                      │ │
│  │  - Cart Model                                               │ │
│  │  - Banner Model                                             │ │
│  └──────────────────────────────┬──────────────────────────────┘ │
│                                 │                                │
│  ┌──────────────────────────────▼──────────────────────────────┐ │
│  │         MongoDB Collections                                 │ │
│  │  - users                                                    │ │
│  │  - products                                                 │ │
│  │  - orders                                                   │ │
│  │  - categories                                               │ │
│  │  - subcategories                                            │ │
│  │  - productforyous                                           │ │
│  │  - carts                                                    │ │
│  │  - banners                                                  │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Database Schema

### User Model
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  address: String,
  city: String,
  state: String,
  pincode: String,
  role: Enum ['user', 'admin', 'seller'],
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Product Model
```javascript
{
  _id: ObjectId,
  name: String,
  slug: String (unique),
  description: String,
  category: ObjectId (ref: Category),
  subcategory: ObjectId (ref: Subcategory),
  price: Number,
  perPiecePrice: Number,
  stock: Number,
  photos: [String],
  isActive: Enum ['0', '1'],
  custom_order: Number,
  unitSet: Number,
  bulkProducts: [{
    minimum: Number,
    maximum: Number,
    selling_price_set: Number
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### Order Model
```javascript
{
  _id: ObjectId,
  orderId: String (unique),
  buyer: ObjectId (ref: User),
  products: [{
    product: ObjectId (ref: Product),
    quantity: Number,
    price: Number
  }],
  totalAmount: Number,
  taxAmount: Number,
  gst: Number,
  paymentMethod: Enum ['COD', 'Online'],
  paymentStatus: Enum ['Pending', 'Completed', 'Failed'],
  orderStatus: Enum ['Pending', 'Confirmed', 'Accepted', 'Dispatched', 'Delivered', 'Cancelled', 'Rejected'],
  shippingAddress: String,
  trackingId: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Category Model
```javascript
{
  _id: ObjectId,
  name: String,
  slug: String (unique),
  description: String,
  image: String,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### ProductForYou Model
```javascript
{
  _id: ObjectId,
  categoryId: ObjectId (ref: Category),
  subcategoryId: ObjectId (ref: Subcategory),
  productId: ObjectId (ref: Product),
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🎨 Frontend Architecture

### Directory Structure
```
client/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── Header.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── Layout.jsx
│   │   │   ├── AdminMenu.jsx
│   │   │   └── Spinner.jsx
│   │   ├── ProductDetails/
│   │   │   ├── ProductImageGallery.jsx
│   │   │   ├── ProductInfo.jsx
│   │   │   ├── QuantitySelector.jsx
│   │   │   ├── BulkPricingTable.jsx
│   │   │   ├── ProductsForYou.jsx
│   │   │   ├── modals/
│   │   │   │   ├── LoginPromptModal.jsx
│   │   │   │   ├── YouTubePopupModal.jsx
│   │   │   │   └── ImageZoomModal.jsx
│   │   │   └── hooks/
│   │   │       ├── useProductData.js
│   │   │       ├── useCartOperations.js
│   │   │       └── useUIState.js
│   │   ├── OrderDetails/
│   │   │   ├── OrderHeader.jsx
│   │   │   ├── ProductTable.jsx
│   │   │   ├── StatusButtons.jsx
│   │   │   ├── ActionButtons.jsx
│   │   │   └── ErrorModal.jsx
│   │   ├── InvoiceGenerator.jsx
│   │   ├── WhatsAppShare.jsx
│   │   └── orderModal.jsx
│   ├── pages/
│   │   ├── Admin/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Products.jsx
│   │   │   ├── CreateProduct.jsx
│   │   │   ├── EditProduct.jsx
│   │   │   ├── Orders.jsx
│   │   │   ├── Users.jsx
│   │   │   ├── ProductForYou.jsx
│   │   │   ├── subCategory.jsx
│   │   │   ├── Category.jsx
│   │   │   ├── userCartLists.jsx
│   │   │   └── Admin order/
│   │   │       └── AdminOrders.jsx
│   │   ├── Auth/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── ForgotPassword.jsx
│   │   ├── Home.jsx
│   │   ├── ProductDetails.jsx
│   │   ├── Cart.jsx
│   │   ├── Checkout.jsx
│   │   ├── Orders.jsx
│   │   ├── PageNotFound.jsx
│   │   └── PrivateRoute.jsx
│   ├── context/
│   │   ├── auth.js
│   │   └── search.js
│   ├── styles/
│   │   ├── admin-theme.css
│   │   └── index.css
│   ├── App.js
│   ├── index.js
│   └── index.css
├── package.json
└── .env
```

### Component Hierarchy

```
App
├── Layout
│   ├── Header
│   ├── Footer
│   └── Main Content
│       ├── Public Pages
│       │   ├── Home
│       │   ├── Products
│       │   ├── ProductDetails
│       │   ├── Cart
│       │   ├── Checkout
│       │   └── Orders
│       └── Admin Pages
│           ├── AdminMenu (Sidebar)
│           ├── Dashboard
│           ├── Products Management
│           ├── Orders Management
│           ├── Users Management
│           ├── Categories Management
│           └── ProductForYou Management
```

### State Management
- **Auth Context**: User authentication, role-based access
- **Search Context**: Global search state
- **Custom Hooks**: Component-level state management

---

## 🔧 Backend Architecture

### Directory Structure
```
server/
├── controllers/
│   ├── authController.js
│   ├── productController.js
│   ├── orderController.js
│   ├── userController.js
│   ├── categoryController.js
│   ├── subcategoryController.js
│   ├── cartController.js
│   ├── productForYouController.js
│   └── bannerController.js
├── models/
│   ├── userModel.js
│   ├── productModel.js
│   ├── orderModel.js
│   ├── categoryModel.js
│   ├── subcategoryModel.js
│   ├── cartModel.js
│   ├── productForYouModel.js
│   └── bannerModel.js
├── routes/
│   ├── authRoutes.js
│   ├── productRoutes.js
│   ├── orderRoutes.js
│   ├── userRoutes.js
│   ├── categoryRoutes.js
│   ├── subcategoryRoutes.js
│   ├── cartRoutes.js
│   ├── productForYouRoutes.js
│   └── bannerRoutes.js
├── middlewares/
│   ├── authMiddleware.js
│   ├── errorHandler.js
│   └── corsMiddleware.js
├── config/
│   ├── db.js
│   └── env.js
├── server.js
├── package.json
└── .env
```

### Request Flow
```
HTTP Request
    ↓
Route Handler (routes/*.js)
    ↓
Middleware (auth, validation)
    ↓
Controller (controllers/*.js)
    ↓
Service Logic (business rules)
    ↓
Model (models/*.js)
    ↓
MongoDB Database
    ↓
Response (JSON)
```

---

## 📡 API Endpoints

### Authentication Endpoints
```
POST   /api/v1/auth/register        - Register new user
POST   /api/v1/auth/login           - Login user
POST   /api/v1/auth/logout          - Logout user
POST   /api/v1/auth/forgot-password - Request password reset
POST   /api/v1/auth/reset-password  - Reset password
GET    /api/v1/auth/user-auth       - Check user authentication
GET    /api/v1/auth/admin-auth      - Check admin authentication
```

### Product Endpoints
```
GET    /api/v1/product/get-product           - Get all products (paginated)
GET    /api/v1/product/get-product/:id       - Get single product
POST   /api/v1/product/create-product        - Create product (admin)
PUT    /api/v1/product/update-product/:id    - Update product (admin)
DELETE /api/v1/product/delete-product/:id    - Delete product (admin)
GET    /api/v1/product/product-photo/:pid    - Get product photo
PUT    /api/v1/product/updateStatus/products/:id - Update product status
```

### Order Endpoints
```
GET    /api/v1/order/get-orders              - Get all orders (user)
GET    /api/v1/order/get-orders/:orderId     - Get single order
POST   /api/v1/order/create-order            - Create new order
PUT    /api/v1/order/update-order/:orderId   - Update order status (admin)
DELETE /api/v1/order/delete-order/:orderId   - Delete order (admin)
GET    /api/v1/order/admin-orders            - Get all orders (admin)
POST   /api/v1/order/add-product-to-order    - Add product to order (admin)
DELETE /api/v1/order/delete-product-from-order - Remove product from order (admin)
```

### User Endpoints
```
GET    /api/v1/user/get-users                - Get all users (admin)
GET    /api/v1/user/get-user/:id             - Get single user
PUT    /api/v1/user/update-user/:id          - Update user profile
DELETE /api/v1/user/delete-user/:id          - Delete user (admin)
```

### Category Endpoints
```
GET    /api/v1/category/get-category         - Get all categories
POST   /api/v1/category/create-category      - Create category (admin)
PUT    /api/v1/category/update-category/:id  - Update category (admin)
DELETE /api/v1/category/delete-category/:id  - Delete category (admin)
```

### ProductForYou Endpoints
```
GET    /api/v1/productForYou/get-products-for-you           - Get products for you
POST   /api/v1/productForYou/createProductForYou            - Create single entry
POST   /api/v1/productForYou/bulk-create                    - Bulk create entries
DELETE /api/v1/productForYou/delete-product/:id             - Delete single entry
POST   /api/v1/productForYou/bulk-delete                    - Bulk delete entries
```

---

## 🎯 User Flows & Wireframes

### 1. Customer User Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    CUSTOMER JOURNEY                          │
└─────────────────────────────────────────────────────────────┘

START
  ↓
┌─────────────────────┐
│   Visit Website     │
└──────────┬──────────┘
           ↓
    ┌──────────────┐
    │  Logged In?  │
    └──┬───────────┘
       │
   NO  │  YES
   ┌───┴────┐
   ↓        ↓
┌─────────┐ ┌──────────────┐
│ Login   │ │ Browse Home  │
│ Register│ │ Page         │
└────┬────┘ └──────┬───────┘
     │             │
     └──────┬──────┘
            ↓
    ┌──────────────────┐
    │ Browse Products  │
    │ - Search         │
    │ - Filter         │
    │ - Sort           │
    └────────┬─────────┘
             ↓
    ┌──────────────────┐
    │ View Product     │
    │ Details          │
    │ - Images         │
    │ - Pricing        │
    │ - Bulk Discount  │
    │ - Reviews        │
    └────────┬─────────┘
             ↓
    ┌──────────────────┐
    │ Add to Cart      │
    │ - Select Qty     │
    │ - Apply Discount │
    └────────┬─────────┘
             ↓
    ┌──────────────────┐
    │ View Cart        │
    │ - Edit Qty       │
    │ - Remove Items   │
    │ - View Total     │
    └────────┬─────────┘
             ↓
    ┌──────────────────┐
    │ Proceed to       │
    │ Checkout         │
    └────────┬─────────┘
             ↓
    ┌──────────────────┐
    │ Enter Shipping   │
    │ Address          │
    └────────┬─────────┘
             ↓
    ┌──────────────────┐
    │ Select Payment   │
    │ Method           │
    │ - COD            │
    │ - Online         │
    └────────┬─────────┘
             ↓
    ┌──────────────────┐
    │ Review Order     │
    │ - Items          │
    │ - Total          │
    │ - Address        │
    └────────┬─────────┘
             ↓
    ┌──────────────────┐
    │ Place Order      │
    └────────┬─────────┘
             ↓
    ┌──────────────────┐
    │ Order Confirmed  │
    │ - Order ID       │
    │ - Invoice PDF    │
    │ - Tracking Link  │
    └────────┬─────────┘
             ↓
    ┌──────────────────┐
    │ Track Order      │
    │ - Status Updates │
    │ - Delivery Est.  │
    └────────┬─────────┘
             ↓
    ┌──────────────────┐
    │ Order Delivered  │
    │ - Download Inv.  │
    │ - View Receipt   │
    └────────┬─────────┘
             ↓
           END
```

### 2. Admin User Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    ADMIN DASHBOARD                           │
└─────────────────────────────────────────────────────────────┘

LOGIN
  ↓
┌──────────────────────────────────────────────┐
│         ADMIN DASHBOARD HOME                 │
│  - KPI Cards (Orders, Revenue, Users)        │
│  - Recent Orders                             │
│  - Top Products                              │
│  - Sales Chart                               │
└──────────┬───────────────────────────────────┘
           ↓
    ┌──────────────────────────────────────┐
    │ MAIN MENU OPTIONS                    │
    ├──────────────────────────────────────┤
    │ 1. Products Management               │
    │ 2. Orders Management                 │
    │ 3. Users Management                  │
    │ 4. Categories Management             │
    │ 5. ProductForYou Management          │
    │ 6. Analytics & Reports               │
    │ 7. Settings                          │
    └──────────────────────────────────────┘
           ↓
    ┌──────────────────────────────────────┐
    │ PRODUCTS MANAGEMENT                  │
    ├──────────────────────────────────────┤
    │ - View All Products                  │
    │ - Create New Product                 │
    │ - Edit Product Details               │
    │ - Manage Bulk Pricing                │
    │ - Delete Products                    │
    │ - Bulk Actions (Activate/Deactivate) │
    │ - Search & Filter                    │
    └──────────────────────────────────────┘
           ↓
    ┌──────────────────────────────────────┐
    │ ORDERS MANAGEMENT                    │
    ├──────────────────────────────────────┤
    │ - View All Orders                    │
    │ - Filter by Status                   │
    │ - Edit Order Details                 │
    │ - Add/Remove Products                │
    │ - Update Order Status                │
    │ - Generate Invoice PDF               │
    │ - Send WhatsApp Updates              │
    │ - Track Shipment                     │
    └──────────────────────────────────────┘
           ↓
    ┌──────────────────────────────────────┐
    │ USERS MANAGEMENT                     │
    ├──────────────────────────────────────┤
    │ - View All Users                     │
    │ - Search Users                       │
    │ - View User Details                  │
    │ - Manage User Roles                  │
    │ - Deactivate Users                   │
    │ - View User Orders                   │
    └──────────────────────────────────────┘
           ↓
    ┌──────────────────────────────────────┐
    │ PRODUCTFORYOU MANAGEMENT             │
    ├──────────────────────────────────────┤
    │ - Select Category & Subcategory      │
    │ - View Available Products            │
    │ - Add Products (Single/Bulk)         │
    │ - Remove Products (Single/Bulk)      │
    │ - Reorder Products                   │
    │ - Preview on Frontend                │
    └──────────────────────────────────────┘
           ↓
           END
```

### 3. Wireframe: Products Page (Desktop)

```
┌─────────────────────────────────────────────────────────────────┐
│                        HEADER                                    │
│  Logo  |  Search  |  Cart  |  Account  |  Logout                │
└─────────────────────────────────────────────────────────────────┘

┌────────────┬──────────────────────────────────────────────────────┐
│            │                                                      │
│  SIDEBAR   │            PRODUCTS PAGE                            │
│  ├─ Home   │  ┌──────────────────────────────────────────────┐  │
│  ├─ Prod   │  │ Products                                     │  │
│  ├─ Orders │  │ Manage and view all your products.           │  │
│  ├─ Users  │  └──────────────────────────────────────────────┘  │
│  ├─ Cat    │                                                     │
│  └─ Set    │  ┌──────────────────────────────────────────────┐  │
│            │  │ All Products │ Active │ Inactive │ OutStock │  │
│            │  └──────────────────────────────────────────────┘  │
│            │                                                     │
│            │  ┌──────────────────────────────────────────────┐  │
│            │  │ Search... │ [Delete] [Activate] [Deactivate]│  │
│            │  └──────────────────────────────────────────────┘  │
│            │                                                     │
│            │  ┌──────────────────────────────────────────────┐  │
│            │  │ ☑ │ # │ Photo │ Name │ Cat │ SubCat │ Price │  │
│            │  ├──────────────────────────────────────────────┤  │
│            │  │ ☐ │ 1 │ [IMG] │ Prod1│ Mob │ Access │ ₹220  │  │
│            │  │ ☐ │ 2 │ [IMG] │ Prod2│ Mob │ Access │ ₹110  │  │
│            │  │ ☐ │ 3 │ [IMG] │ Prod3│ Elec│ Appli  │ ₹450  │  │
│            │  │ ☐ │ 4 │ [IMG] │ Prod4│ Mob │ Access │ ₹315  │  │
│            │  │ ☐ │ 5 │ [IMG] │ Prod5│ Mob │ Access │ ₹650  │  │
│            │  │ ☐ │ 6 │ [IMG] │ Prod6│ Mob │ Access │ ₹590  │  │
│            │  └──────────────────────────────────────────────┘  │
│            │                                                     │
│            │  Showing 1 to 6 of 150 products                    │
│            │  [Previous] [1] [2] [3] ... [25] [Next]           │
│            │                                                     │
└────────────┴──────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        FOOTER                                    │
│  About  |  Contact  |  Privacy  |  Terms  |  © 2024 Smitox     │
└─────────────────────────────────────────────────────────────────┘
```

### 4. Wireframe: Orders Page (Desktop)

```
┌─────────────────────────────────────────────────────────────────┐
│                        HEADER                                    │
└─────────────────────────────────────────────────────────────────┘

┌────────────┬──────────────────────────────────────────────────────┐
│            │                                                      │
│  SIDEBAR   │            ORDERS PAGE                              │
│            │  ┌──────────────────────────────────────────────┐  │
│            │  │ Orders                                       │  │
│            │  │ View and manage all customer orders.         │  │
│            │  └──────────────────────────────────────────────┘  │
│            │                                                     │
│            │  ┌──────────────────────────────────────────────┐  │
│            │  │ All │ Pending │ Confirmed │ Accepted │ ...  │  │
│            │  └──────────────────────────────────────────────┘  │
│            │                                                     │
│            │  ┌──────────────────────────────────────────────┐  │
│            │  │ Search orders by ID, buyer name...          │  │
│            │  └──────────────────────────────────────────────┘  │
│            │                                                     │
│            │  ┌──────────────────────────────────────────────┐  │
│            │  │ # │ ORDER ID │ TOTAL │ PAYMENT │ STATUS │   │  │
│            │  ├──────────────────────────────────────────────┤  │
│            │  │ 1 │ 692ef0b3d7 │ 8700 │ COD │ Pending │ View │  │
│            │  │   │ 890472021B │      │     │         │      │  │
│            │  │   │ [Add Tracking ID] │     │         │      │  │
│            │  ├──────────────────────────────────────────────┤  │
│            │  │ 2 │ 692ed5a0b7 │ 26290│ COD │ Pending │ View │  │
│            │  │   │ 9337086885 │      │     │         │      │  │
│            │  └──────────────────────────────────────────────┘  │
│            │                                                     │
│            │  Showing 1 to 2 of 150 orders                      │
│            │  [Previous] [1] [2] [3] ... [75] [Next]           │
│            │                                                     │
└────────────┴──────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        FOOTER                                    │
└─────────────────────────────────────────────────────────────────┘
```

### 5. Wireframe: ProductForYou Page (Desktop)

```
┌────────────┬──────────────────────────────────────────────────────┐
│            │                                                      │
│  SIDEBAR   │         PRODUCTFORYOU MANAGEMENT                    │
│            │  ┌──────────────────────────────────────────────┐  │
│            │  │ Product For You                              │  │
│            │  │ Manage featured products for homepage.       │  │
│            │  └──────────────────────────────────────────────┘  │
│            │                                                     │
│  LEFT      │  ┌──────────────────────────────────────────────┐  │
│  PANEL     │  │ FILTERS & SELECTION                          │  │
│  ┌──────┐ │  ├──────────────────────────────────────────────┤  │
│  │ Cat: │ │  │ Category: [Dropdown ▼]                       │  │
│  │ ────┤ │  │ Subcategory: [Dropdown ▼]                     │  │
│  │ Mob  │ │  │                                              │  │
│  │ Elec │ │  │ Search products...                           │  │
│  │ Home │ │  │                                              │  │
│  └──────┘ │  │ ┌────────────────────────────────────────┐  │  │
│           │  │ │ Available Products (Scrollable)        │  │  │
│           │  │ ├────────────────────────────────────────┤  │  │
│           │  │ │ ☐ Product 1 [Choose]                  │  │  │
│           │  │ │ ☐ Product 2 [Choose]                  │  │  │
│           │  │ │ ☐ Product 3 [Choose]                  │  │  │
│           │  │ │ ☐ Product 4 [Choose]                  │  │  │
│           │  │ │ ☐ Product 5 [Choose]                  │  │  │
│           │  │ │ ☐ Product 6 [Choose]                  │  │  │
│           │  │ │ ☐ Product 7 [Choose]                  │  │  │
│           │  │ │ ☐ Product 8 [Choose]                  │  │  │
│           │  │ └────────────────────────────────────────┘  │  │
│           │  │                                              │  │
│           │  │ [Add Selected] [Clear Selection]             │  │
│           │  └──────────────────────────────────────────────┘  │
│           │                                                     │
│           │  ┌──────────────────────────────────────────────┐  │
│           │  │ RIGHT PANEL: FEATURED PRODUCTS              │  │
│           │  ├──────────────────────────────────────────────┤  │
│           │  │ ☑ │ Photo │ Name │ Category │ Actions       │  │
│           │  ├──────────────────────────────────────────────┤  │
│           │  │ ☐ │ [IMG] │ Prod1│ Mobile   │ [Delete]      │  │
│           │  │ ☐ │ [IMG] │ Prod2│ Mobile   │ [Delete]      │  │
│           │  │ ☐ │ [IMG] │ Prod3│ Electron │ [Delete]      │  │
│           │  │ ☐ │ [IMG] │ Prod4│ Mobile   │ [Delete]      │  │
│           │  │ ☐ │ [IMG] │ Prod5│ Mobile   │ [Delete]      │  │
│           │  │                                              │  │
│           │  │ [Delete Selected]                            │  │
│           │  └──────────────────────────────────────────────┘  │
│           │                                                     │
└────────────┴──────────────────────────────────────────────────────┘
```

---

## 🚀 Future Enhancements

### Phase 2 (Q1 2025)
- [ ] Advanced Analytics Dashboard
  - Sales trends by category
  - Customer behavior analysis
  - Inventory forecasting
  - Revenue reports

- [ ] Enhanced Search
  - Elasticsearch integration
  - AI-powered recommendations
  - Search history & suggestions
  - Advanced filters

- [ ] Mobile App
  - React Native implementation
  - Offline support
  - Push notifications
  - Biometric authentication

### Phase 3 (Q2 2025)
- [ ] Multi-language Support
  - i18n implementation
  - RTL support for Arabic
  - Regional pricing

- [ ] Payment Gateway Expansion
  - Stripe integration
  - PayPal integration
  - UPI payments
  - Wallet system

- [ ] Seller Portal
  - Seller dashboard
  - Inventory management
  - Performance analytics
  - Payout management

### Phase 4 (Q3 2025)
- [ ] AI & Machine Learning
  - Product recommendations
  - Demand forecasting
  - Fraud detection
  - Chatbot support

- [ ] Marketplace Features
  - Multi-seller support
  - Commission management
  - Seller ratings & reviews
  - Dispute resolution

- [ ] Integration APIs
  - Accounting software (Tally, QuickBooks)
  - Shipping providers (Shiprocket, Delhivery)
  - CRM integration
  - ERP integration

### Phase 5 (Q4 2025)
- [ ] Subscription Model
  - Membership tiers
  - Recurring orders
  - Loyalty program
  - Referral rewards

- [ ] Advanced Logistics
  - Real-time tracking
  - Multi-warehouse support
  - Route optimization
  - Last-mile delivery

- [ ] Compliance & Security
  - GDPR compliance
  - PCI DSS certification
  - Two-factor authentication
  - Advanced encryption

---

## 📝 Development Guidelines

### Code Standards
- Follow ESLint configuration
- Use Prettier for code formatting
- Write meaningful commit messages
- Document complex logic with comments

### Testing Strategy
- Unit tests for utilities and hooks
- Integration tests for API endpoints
- E2E tests for critical user flows
- Manual testing on multiple devices

### Performance Optimization
- Code splitting and lazy loading
- Image optimization and CDN
- Database query optimization
- Caching strategies (Redis)
- API response compression

### Security Best Practices
- Input validation and sanitization
- SQL injection prevention (Mongoose)
- XSS protection
- CSRF tokens
- Rate limiting
- Secure password hashing (bcrypt)

---

## 📞 Support & Contact

For questions or clarifications about the architecture:
- **Email**: support@smitox.com
- **Documentation**: /docs
- **Issue Tracker**: GitHub Issues
- **Wiki**: Project Wiki

---

**Last Updated**: December 2024
**Version**: 1.0
**Status**: Production Ready
