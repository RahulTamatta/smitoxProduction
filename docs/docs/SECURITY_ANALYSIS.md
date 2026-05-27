# Security Audit & Analysis

This document outlines the security posture, vulnerabilities, and protections implemented across the Smitox platform based on the codebase analysis.

## 1. Authentication & JWT Security

### Implementation
- **Tokens**: The platform uses JSON Web Tokens (JWT) signed with a secret (`JWT_SECRET`).
- **Storage**: 
  - *Web*: Tokens are stored in `localStorage` (`auth` key).
  - *Mobile*: Tokens are stored in `SharedPreferences`.

### Vulnerability Analysis
- **Severity**: **Medium**
- **Risk**: Storing JWTs in `localStorage` makes the web application vulnerable to Cross-Site Scripting (XSS). If an attacker injects a malicious script, they can easily read `localStorage` and steal the user's session token.
- **Recommendation**: Move the JWT to an `httpOnly`, `secure` cookie. The backend `authRoutes.js` should set this cookie, preventing JavaScript from accessing the token directly.

## 2. Role-Based Access Control (RBAC)

### Implementation
- The backend uses middlewares like `isAdmin`, `isSeller`, and `requireCapability` to protect routes.

### Vulnerability Analysis
- **Severity**: **Low / Informational**
- **Risk**: The transition from legacy integer roles (`role: 1`) to string roles (`roleString: 'admin'`) and fine-grained capabilities (`requireCapability`) is actively in progress. Mixing legacy and modern RBAC can lead to permission bypasses if a route relies on an outdated check.
- **Recommendation**: Fully deprecate `isAdmin` and `isSeller` in favor of strict `requireCapability` checks across all `server/routes/*`.

## 3. Webhook Security

### Implementation
- Razorpay callbacks (`/api/v1/webhooks/razorpay/success`) use HMAC SHA256 signatures to verify authenticity.
- Webhook events are stored in MongoDB with an idempotency key (`eventId`) to prevent double-processing.

### Vulnerability Analysis
- **Severity**: **Low**
- **Risk**: The system correctly verifies signatures using `RAZORPAY_WEBHOOK_SECRET` and prevents replay attacks using the idempotency keys. This is robust.

## 4. Input Validation & Data Sanitization

### Implementation
- Express routes generally expect JSON or `multipart/form-data`.

### Vulnerability Analysis
- **Severity**: **High**
- **Risk**: No centralized input sanitization middleware (e.g., `express-validator` or `joi`) was heavily observed in the core routes. Passing raw `req.body` directly to Mongoose queries or creation methods can expose the app to NoSQL Injection attacks.
- **Recommendation**: Implement strict schema validation (using Joi or Zod) on all incoming requests before they hit the controller logic.

## 5. File Upload Security

### Implementation
- Uses `multer` and `formidable` for receiving images, which are then synced to ImageKit or Cloudinary.

### Vulnerability Analysis
- **Severity**: **Medium**
- **Risk**: If file types are not strictly validated by MIME type (not just extension) before upload, attackers could upload malicious scripts disguised as images.
- **Recommendation**: Ensure the upload middleware asserts the magic bytes of the file and enforces a strict whitelist of MIME types (`image/jpeg`, `image/png`, `image/webp`).

## 6. CORS & Rate Limiting

### Implementation
- `cors` middleware is applied in the backend.

### Vulnerability Analysis
- **Severity**: **High**
- **Risk**: No API Rate Limiting (e.g., `express-rate-limit`) was observed in the `server.js` dependencies. This leaves the login, OTP, and checkout endpoints highly vulnerable to Brute Force and Denial of Service (DoS) attacks.
- **Recommendation**: Immediately implement rate limiting, especially on `/api/v1/auth/*` routes.
