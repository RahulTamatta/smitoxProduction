# Dependency Analysis

## Backend Dependencies (`server/package.json`)

The backend relies heavily on standard Node.js libraries, with a few notable additions for search, performance, and monitoring.

### Core Architecture
- **`express` (v4.18.2)**: The web framework.
- **`mongoose` (v6.13.8)**: MongoDB object modeling.
- **`redis` (v4.6.11)**: For caching layers.
- **`@elastic/elasticsearch` (v8.11.0)**: Advanced text search and product filtering.

### Security & Authentication
- **`jsonwebtoken` (v9.0.0)** & **`bcrypt`/`bcryptjs`**: For user authentication, password hashing, and session management.
- **`cors`**: For cross-origin resource sharing with the React client.

### Integrations
- **`razorpay` (v2.9.5)**: Indian payment gateway integration.
- **`imagekit` (v4.1.4)**: Image CDN and optimization.
- **`@sendgrid/mail` (v7.7.0)**: Transactional email delivery.

### File Handling & Utilities
- **`multer`** & **`formidable`**: Handling `multipart/form-data` for file uploads.
- **`csv-writer`** & **`xlsx`**: For exporting/importing data (e.g., admin reports).

### Observability
- **`@sentry/node`**, **`@sentry/tracing`**, **`@sentry/profiling-node`**: Full stack trace error logging and performance monitoring.

---

## Web Frontend Dependencies (`client/package.json`)

The frontend is a heavy React application using multiple UI libraries and state management tools.

### State & Data Fetching
- **`@reduxjs/toolkit`** & **`react-redux`**: For global state management.
- **`zustand`**: A lightweight alternative state manager, indicating a possible migration or separate concern usage.
- **`@tanstack/react-query`**: For server-state fetching, caching, and synchronizing.
- **`axios`**: Promise-based HTTP client for making API requests.

### UI & Styling
- **`bootstrap`** & **`react-bootstrap`**: Core layout and responsive grid.
- **`antd` (Ant Design)**: Likely used for complex admin panel components (tables, date pickers).
- **`@mui/material`**: Material-UI components, potentially used alongside Ant Design.
- **`mdb-react-ui-kit`**: Material Design for Bootstrap.
*Note: Having Bootstrap, Antd, and MUI in the same project significantly increases bundle size and indicates technical debt or multiple developers using their preferred tools.*

### Utilities & Integrations
- **`razorpay`** & **`braintree-web-drop-in-react`**: Frontend payment SDKs.
- **`jspdf`** & **`jspdf-autotable`**: For generating PDF invoices or reports on the client side.
- **`react-lazy-load-image-component`**: For performance optimization of product images.

---

## Mobile App Dependencies (`tests/pubspec.yaml`)

The Flutter application relies on modern packages for state, networking, and platform-specific capabilities.

### State Management
- **`flutter_bloc`**, **`provider`**, **`get`**: Similar to the web client, the app includes multiple state management libraries. BLoC is typically used for complex flows, while Provider might be used for simpler injection. GetX is often used for routing and state, indicating a potentially fragmented architecture.

### Networking & Data
- **`dio`** & **`http`**: For API requests.
- **`cached_network_image`** & **`flutter_cache_manager`**: For efficient image loading and caching.
- **`shared_preferences`** & **`flutter_secure_storage`**: For local data persistence (e.g., auth tokens).

### Native Features
- **`firebase_core`**, **`firebase_messaging`**, **`flutter_local_notifications`**: For push notifications.
- **`razorpay_flutter`**: Native payment gateway integration.
- **`share_plus`**: For sharing products via social media/messaging.
- **`app_links`**: Deep linking support.

### UI & UX
- **`shimmer`**: For loading skeleton screens.
- **`carousel_slider`**: For home screen banners.
- **`lottie`**: For vector animations.
- **`blurhash_dart`**: For blurred image placeholders while loading.
