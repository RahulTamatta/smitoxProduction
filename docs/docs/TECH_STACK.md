# Technology Stack

This document details the technologies, frameworks, and libraries used across the Smitox platform.

## 1. Backend (Node.js API)
The backend is a Node.js REST API.
- **Runtime**: Node.js (>= 18.0.0)
- **Framework**: Express.js
- **Database**: MongoDB (via Mongoose ODM)
- **Caching**: Redis
- **Search Engine**: Elasticsearch (`@elastic/elasticsearch`)
- **Authentication**: JWT (`jsonwebtoken`, `bcrypt`)
- **Payments**: Razorpay
- **Email**: SendGrid (`@sendgrid/mail`)
- **File Uploads**: Multer, Formidable, ImageKit
- **Observability**: Sentry (`@sentry/node`, `@sentry/profiling-node`)
- **Task Scheduling**: node-cron

## 2. Web Frontend (React)
The web application is a Single Page Application (SPA) built with Create React App.
- **Library**: React 18
- **Routing**: React Router DOM v6
- **State Management**: A hybrid approach using Zustand, Redux Toolkit (`@reduxjs/toolkit`), and React Query (`@tanstack/react-query`) for server state.
- **UI Frameworks**: The project utilizes multiple UI libraries:
  - Bootstrap 5 & React Bootstrap
  - Ant Design (`antd`)
  - Material UI (`@mui/material`)
  - MDB React UI Kit
- **Data Visualization**: Recharts, DataTables
- **Payments**: Razorpay, Braintree Web Drop-in
- **Observability**: Sentry (`@sentry/react`)

## 3. Mobile App (Flutter)
The mobile application is built with Flutter for iOS and Android.
- **Framework**: Flutter SDK (Dart ^3.7.0)
- **State Management**: The app includes dependencies for Provider, GetX, and Flutter Bloc (indicating potential migrations or a hybrid approach).
- **Networking**: Dio and `http`
- **Local Storage**: Shared Preferences, Flutter Secure Storage
- **Push Notifications**: Firebase Cloud Messaging (`firebase_messaging`, `flutter_local_notifications`)
- **Image Handling**: Cached Network Image, BlurHash, Cloudinary Flutter
- **Payments**: Razorpay Flutter
- **Observability**: Sentry Flutter
- **OTA Updates**: Shorebird (`shorebird.yaml`)

## 4. Infrastructure & Deployment
- **Containerization**: Docker & Docker Compose
- **Platform**: Hostinger (Ubuntu Server) / Railway (implied by `railway.json`)
- **Build Systems**: Nixpacks (implied by `nixpacks.toml`)
