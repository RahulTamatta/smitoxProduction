# Directory Structure

This document outlines the high-level file and folder structure of the Smitox platform, highlighting where key components of the system live.

## Web / Backend Codebase (`/smitoxProduction`)

```text
smitoxProduction/
├── client/                   # React Web Application
│   ├── public/               # Static assets (index.html, manifest.json)
│   └── src/
│       ├── api/              # Axios instances and API call definitions
│       ├── components/       # Reusable UI components
│       ├── context/          # React Context providers
│       ├── features/         # Feature-based slices (likely Redux Toolkit)
│       ├── hooks/            # Custom React hooks
│       ├── pages/            # Top-level route components/views
│       ├── redux/            # Legacy or global Redux store configuration
│       ├── store/            # Zustand or alternative store configurations
│       ├── styles/           # Global CSS/SCSS files
│       └── utils/            # Helper functions and constants
├── server/                   # Node.js Express Backend
│   ├── config/               # Configuration files (DB connection, third-party)
│   ├── controllers/          # Request handlers and business logic
│   ├── helpers/              # Reusable utility functions
│   ├── jobs/                 # Cron jobs and background tasks
│   ├── middleware/           # Express middlewares (Auth, Validation, Error handling)
│   ├── models/               # Mongoose schemas and models
│   ├── routes/               # Express API route definitions
│   ├── scripts/              # Utility scripts for migrations/setup
│   ├── services/             # Abstraction layer for third-party integrations (e.g., Razorpay, Elasticsearch)
│   ├── uploads/              # Local file storage (if not using ImageKit/S3 exclusively)
│   └── utils/                # General utilities
├── deployment/               # Nginx and other deployment configurations
└── docker-compose.yml        # Docker orchestration file
```

## Mobile App Codebase (`/tests`)

*Note: The app folder is historically named `tests`, but it contains the complete Flutter mobile application.*

```text
tests/
├── android/                  # Android native project files
├── ios/                      # iOS native project files
├── assets/                   # Local images, fonts, and static files
├── lib/                      # Main Dart source code
│   ├── bloc/                 # BLoC state management implementations
│   ├── core/                 # Core configurations, networking, and error handling
│   │   ├── config/
│   │   ├── error/
│   │   ├── network/
│   │   ├── services/
│   │   └── usecases/
│   ├── features/             # Feature-first architecture folders (e.g., Auth, Cart, Home)
│   ├── models/               # Dart data models and serialization
│   ├── screens/              # Top-level UI views
│   ├── services/             # API services and local storage wrappers
│   ├── shared/               # Shared widgets, providers, and utilities
│   │   ├── models/
│   │   ├── providers/
│   │   ├── utils/
│   │   └── widgets/
│   ├── viewmodels/           # ViewModels (for Provider/MVVM pattern)
│   └── widgets/              # Reusable Flutter widgets
├── test/                     # Unit and widget tests
└── pubspec.yaml              # Flutter dependencies and asset declarations
```
