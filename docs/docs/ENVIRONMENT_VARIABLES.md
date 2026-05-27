# Environment Variables

This document outlines the required environment variables for running the Smitox platform.

## Backend Service (`smitoxProduction/server/.env`)

The Node.js backend requires the following variables to be configured. **Never commit the actual `.env` file containing secrets.**

| Variable Name | Description | Example Value / Format |
|---------------|-------------|------------------------|
| `PORT` | The port the Express server will listen on. | `8080` |
| `DEV_MODE` | Current environment mode. | `development` or `production` |
| `MONGO_URL` | The MongoDB connection string. | `mongodb://<user>:<pwd>@<cluster_url>/...` |
| `JWT_SECRET` | Secret key used for signing JWT tokens. | `your_super_secret_jwt_key` |
| `TWO_FACTOR_API_KEY` | API Key for 2FA service (e.g., Msg91 or similar). | `uuid-format-key` |
| `RAZORPAY_KEY_ID` | Public Key ID from Razorpay Dashboard. | `rzp_live_...` or `rzp_test_...` |
| `RAZORPAY_KEY_SECRET` | Secret Key from Razorpay Dashboard. | `...` |
| `RAZORPAY_WEBHOOK_SECRET` | Secret used to verify Razorpay webhook signatures. | `your_webhook_secret_here` |
| `IMAGEKIT_PUBLIC_KEY` | Public key for ImageKit integration. | `public_...` |
| `IMAGEKIT_PRIVATE_KEY`| Private key for ImageKit integration. | `private_...` |
| `IMAGEKIT_URL_ENDPOINT`| The base URL endpoint for serving ImageKit media. | `https://ik.imagekit.io/<id>` |
| `CLOUDINARY_CLOUD_NAME`| Cloud name for Cloudinary (Mobile App media). | `...` |
| `CLOUDINARY_API_KEY` | API Key from Cloudinary Dashboard. | `...` |
| `CLOUDINARY_API_SECRET`| API Secret from Cloudinary Dashboard. | `...` |
| `SKIP_PREFLIGHT_CHECK` | Used by React/Node to bypass certain CORS/build checks. | `true` |

## Web Client (`smitoxProduction/client/.env`)

*Note: React environment variables typically must be prefixed with `REACT_APP_` to be bundled. The current setup might pass some of these implicitly or through the build process.*

Expected standard React variables:
- `REACT_APP_API_URL`: Points to the backend server (e.g., `http://localhost:8080/api/v1`).
- `REACT_APP_RAZORPAY_KEY`: Public Razorpay key for frontend initialization.

## Mobile App (Flutter)

The Flutter application might use a `.env` file (via `flutter_dotenv`) or hardcoded config classes. Given the presence of Cloudinary in the backend `.env`, it's highly likely the Flutter app requires corresponding API keys or relies solely on the backend to sign uploads.
