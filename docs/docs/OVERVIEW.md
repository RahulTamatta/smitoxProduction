# Smitox Platform Overview

## Introduction
Smitox is a comprehensive E-commerce platform consisting of three major components:
1. **Web Admin & Customer Portal** (React)
2. **Backend REST API** (Node.js / Express)
3. **Mobile Application** (Flutter)

The system supports standard E-commerce flows including product listing, order management, payment processing via Razorpay, and robust search capabilities powered by Elasticsearch.

## Core Components

### 1. Backend Server (`/server`)
A monolithic Node.js application built with Express. It acts as the central source of truth, managing business logic, database operations (MongoDB), caching (Redis), and search indexing (Elasticsearch). It exposes a RESTful API consumed by both the web client and the mobile app.

### 2. Web Client (`/client`)
A single-page application (SPA) built with React 18. It serves dual purposes:
- **Customer Portal**: For browsing products, managing carts, and placing orders.
- **Admin Panel**: For managing inventory, users, orders, and system configurations.

### 3. Mobile App (`/tests` directory)
A cross-platform Flutter application providing a native experience for customers on Android and iOS. It integrates directly with the Backend REST API and utilizes Firebase for notifications.

## Key Features
- **Authentication & Authorization**: Role-based access control (RBAC) using JWT tokens.
- **Payments**: Integrated with Razorpay and Braintree.
- **Search Engine**: High-performance search using Elasticsearch.
- **Media Management**: Imagekit integration for optimized media delivery and Cloudinary for the mobile app.
- **Background Jobs**: Node-cron for scheduled tasks.
- **Observability**: Sentry integration across all three tiers (Server, Web, App) for error tracking and performance profiling.

## Architecture Pattern
The system follows a standard **Client-Server Architecture** with a single monolithic backend serving multiple frontends (Web and Mobile). The backend employs a Controller-Service-Model pattern to separate routing, business logic, and database interactions.
