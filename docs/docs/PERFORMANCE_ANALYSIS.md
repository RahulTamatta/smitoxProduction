# Performance Analysis

This document outlines the performance bottlenecks and optimizations across the platform.

## 1. Web Frontend Performance

### Bottlenecks
- **Bundle Size**: The React application imports multiple massive UI frameworks simultaneously (`bootstrap`, `react-bootstrap`, `antd`, `@mui/material`, `mdb-react-ui-kit`). This causes significant CSS/JS bloat, increasing the Time to Interactive (TTI) and First Contentful Paint (FCP).
- **CSS Conflicts**: Multiple CSS frameworks cause browser rendering engines to spend extra time computing CSS specificity and overrides.

### Optimizations
- **Image Lazy Loading**: The frontend correctly uses `react-lazy-load-image-component` to defer loading off-screen images, saving bandwidth.
- **Image CDN**: Images are served via ImageKit, which automatically compresses images to WebP/AVIF formats based on the browser's `Accept` headers.

## 2. Backend & Database Performance

### Bottlenecks
- **NoSQL Relationships**: Complex aggregations (like fetching orders with populated user, product, and category data) can be slow in MongoDB.
- **N+1 Query Risks**: If ORM populations are not tightly controlled, listing pages might trigger hundreds of secondary database queries.

### Optimizations
- **Elasticsearch**: A massive performance win. By offloading text search and complex filters (price ranges, categories) to Elasticsearch (`@elastic/elasticsearch`), the MongoDB primary instance is spared from heavy `Regex` queries.
- **Redis Caching**: The backend uses `redis` to cache frequent queries and session states, reducing database reads.
- **Snapshotting**: The `Order` model snapshots product names and prices at the time of purchase. This prevents expensive historical `JOIN`-like operations when users view their order history.

## 3. Mobile App (Flutter) Performance

### Bottlenecks
- **Multiple State Managers**: The app imports `provider`, `get`, and `flutter_bloc`. Initializing multiple state management engines increases memory usage and app startup time.

### Optimizations
- **Image Caching**: Uses `cached_network_image` to store product images on the device's local storage. Once an image is downloaded, subsequent loads are instantaneous and cost zero bandwidth.
- **BlurHash**: Implements `blurhash_dart` to show a tiny, blurred placeholder string while the main image downloads over poor cellular networks, vastly improving perceived performance.
- **Sentry Profiling**: Uses `sentry_flutter` to track slow rendering frames and jank on user devices in production.
