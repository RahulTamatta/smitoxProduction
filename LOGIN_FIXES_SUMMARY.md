# Login & Dashboard Issues - Fixed

## Problems Identified

### 1. **Admin Dashboard Instant Logout**
- **Issue**: User logs in successfully but gets logged out when navigating to dashboard
- **Root Cause**: Admin auth endpoint (`/api/v1/auth/admin-auth`) returns 403 because user lacks `products:read` capability
- **Why**: User's `roleString` was not being returned from login endpoints, so RBAC middleware couldn't compute capabilities

### 2. **"Become a Seller" Option Missing**
- **Issue**: After login, users don't see "Become a Seller" option in header
- **Root Cause**: Header component didn't have the link to seller wizard

### 3. **Cloudinary API Errors**
- **Issue**: Server logs show "unknown api_key" errors from Cloudinary
- **Root Cause**: Client-side code was exposing API key in requests (security vulnerability)

## Solutions Applied

### 1. **Fixed Login Response - Added roleString**

#### File: `/controllers/authController.js`

**verifyOTPAndLoginController (Line 102):**
```javascript
user: {
  _id: user._id,
  user_fullname: user.user_fullname,
  email_id: user.email_id,
  mobile_no: user.mobile_no,
  address: user.address,
  role: user.role,
  roleString: user.roleString || "user", // ✅ ADDED - Include roleString for RBAC
  pincode: user.pincode,
  city: user.city,
  landmark: user.landmark,
  state: user.state,
  status: user.status,
  order_type: user.order_type,
  wishlist: user.wishlist,
  cart: user.cart,
}
```

**loginController (Line 311):**
```javascript
user: {
  _id: user._id,
  user_fullname: user.user_fullname,
  email_id: user.email_id,
  mobile_no: user.mobile_no,
  address: user.address,
  role: user.role,
  roleString: user.roleString || "user", // ✅ ADDED - Include roleString for RBAC
  pincode: user.pincode,
  order_type: user.order_type,
}
```

**Why This Fixes It:**
- RBAC middleware (`requireSignIn`) uses `user.roleString` to compute capabilities
- Without `roleString`, middleware defaults to "user" role
- "user" role doesn't have `products:read` capability
- Admin auth endpoint requires `products:read` capability
- Now admin users with `roleString: "admin"` will have `products:read` capability

### 2. **Added "Become a Seller" Link to Header**

#### File: `/client/src/components/Layout/Header.jsx`

**Desktop Navigation (Line 212-216):**
```javascript
<li className="nav-item">
  <NavLink to="/seller-wizard" className="nav-link d-flex align-items-center">
    <span style={{ marginRight: "5px", color: "white" }}>📦</span>
    Become a Seller
  </NavLink>
</li>
```

**Mobile Navigation (Line 296-300):**
```javascript
<li className="nav-item">
  <NavLink to="/seller-wizard" className="nav-link p-1" style={{ color: "white", padding: "0.25rem 0.5rem" }}>
    <span style={{ color: "white", fontSize: "16px" }}>📦</span>
  </NavLink>
</li>
```

**Why This Fixes It:**
- Now logged-in users see "Become a Seller" option in header
- Clicking it takes them to `/seller-wizard` page
- Works on both desktop and mobile views

### 3. **Removed Cloudinary API Key from Client Code**

#### File: `/client/src/utils/cloudinary.jsx`

**Before:**
```javascript
const CLOUDINARY_API_KEY = "119598853346493"; // ❌ EXPOSED
formData.append("api_key", CLOUDINARY_API_KEY); // ❌ SENT IN REQUEST
```

**After:**
```javascript
// NOTE: Do NOT include api_key or api_secret in client-side code
// Use unsigned upload with upload_preset instead
```

**Why This Fixes It:**
- Client-side code should NEVER expose API keys
- Uses unsigned upload with `upload_preset` instead
- Prevents "unknown api_key" errors in server logs
- Improves security

## How RBAC Now Works After Login

### Flow:
1. **User logs in** → OTP verification or password check
2. **Server returns JWT** with user data including `roleString`
3. **Client stores JWT** in localStorage
4. **Client makes request** to protected endpoint (e.g., `/admin-auth`)
5. **Backend middleware** (`requireSignIn`):
   - Verifies JWT
   - Fetches user from DB
   - Computes capabilities based on `roleString`
   - Stores capabilities in `req.user.capabilities`
6. **Capability check** (`requireCapability("products:read")`):
   - Checks if user has capability
   - Admin users have `products:read` → ✅ PASS
   - Regular users don't → ❌ FAIL
7. **Dashboard loads** for admin users

## Testing Steps

### 1. **Test Admin Login & Dashboard**
```
1. Go to http://localhost:3000/login
2. Enter admin phone number
3. Verify OTP
4. Should see "Become a Seller" option in header
5. Click "Dashboard" in user dropdown
6. Should NOT get logged out
7. Admin dashboard should load successfully
```

### 2. **Test Regular User**
```
1. Go to http://localhost:3000/login
2. Enter regular user phone number
3. Verify OTP
4. Should see "Become a Seller" option in header
5. Click "Dashboard" in user dropdown
6. Should load user dashboard (not admin)
```

### 3. **Test Seller Wizard**
```
1. After login, click "Become a Seller" in header
2. Should navigate to /seller-wizard
3. Form should load without errors
```

## Files Modified

1. **`/controllers/authController.js`**
   - Added `roleString` to login response (2 places)

2. **`/client/src/components/Layout/Header.jsx`**
   - Added "Become a Seller" link to desktop nav
   - Added "Become a Seller" link to mobile nav

3. **`/client/src/utils/cloudinary.jsx`**
   - Removed API key from client code
   - Removed API key from form data

## Verification

✅ **Audit Log Fix**: Already applied in previous session
- `actorRole` now has fallback value "unknown"
- Audit logging won't break the flow

✅ **RBAC Middleware**: Already configured
- Computes capabilities on every request
- Uses `roleString` as source of truth

✅ **User Model**: Already has `roleString` field
- Enum: ["user", "admin", "seller", "super_admin"]
- Default: "user"

## Expected Results

After these fixes:
- ✅ Admin users can log in and access dashboard without logout
- ✅ "Become a Seller" option visible in header for all logged-in users
- ✅ No Cloudinary API key errors in server logs
- ✅ Seller wizard accessible from header
- ✅ RBAC capabilities properly computed for all users
- ✅ Audit logging works without validation errors
