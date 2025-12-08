# Verification Guide - Login & Dashboard Fixes

## Quick Summary of Fixes

| Issue | Root Cause | Fix | Status |
|-------|-----------|-----|--------|
| Admin instant logout on dashboard | Missing `roleString` in login response | Added `roleString` to both login endpoints | ✅ FIXED |
| "Become a Seller" option missing | No link in header | Added link to `/seller-wizard` in header | ✅ FIXED |
| Cloudinary API key errors | API key exposed in client code | Removed API key, using unsigned upload | ✅ FIXED |
| Audit log validation error | Missing `actorRole` | Added fallback value "unknown" | ✅ FIXED (previous session) |

## How to Test

### Test 1: Admin Login & Dashboard Access

**Steps:**
```
1. Open http://localhost:3000/login
2. Enter an admin user's phone number
3. Click "SEND OTP"
4. Enter the OTP
5. Click "Verify"
```

**Expected Results:**
- ✅ Login successful
- ✅ Redirected to home page
- ✅ "Become a Seller" option visible in header
- ✅ User dropdown shows "Dashboard" option
- ✅ Click "Dashboard" → loads admin dashboard
- ✅ NO logout occurs
- ✅ Admin can see admin menu items

**What Changed:**
- Login response now includes `roleString: "admin"`
- RBAC middleware computes `products:read` capability
- Admin auth endpoint passes capability check
- Dashboard loads without logout

---

### Test 2: Regular User Login

**Steps:**
```
1. Open http://localhost:3000/login
2. Enter a regular user's phone number
3. Click "SEND OTP"
4. Enter the OTP
5. Click "Verify"
```

**Expected Results:**
- ✅ Login successful
- ✅ Redirected to home page
- ✅ "Become a Seller" option visible in header
- ✅ User dropdown shows "Dashboard" option
- ✅ Click "Dashboard" → loads user dashboard
- ✅ NO admin menu items visible

**What Changed:**
- Login response now includes `roleString: "user"`
- RBAC middleware computes user-level capabilities
- User dashboard loads (not admin)

---

### Test 3: Become a Seller Link

**Steps:**
```
1. Login as any user
2. Look for "Become a Seller" option in header
3. Click on it
```

**Expected Results:**
- ✅ "Become a Seller" option visible (with 📦 icon)
- ✅ Clicking it navigates to `/seller-wizard`
- ✅ Seller wizard form loads
- ✅ Works on both desktop and mobile

**What Changed:**
- Header now has link to seller wizard
- Available for all logged-in users
- Visible on both desktop and mobile navigation

---

### Test 4: Cloudinary Errors (Server Logs)

**Steps:**
```
1. Check server logs: tail -f /tmp/server.log
2. Upload an image through the app
3. Look for Cloudinary errors
```

**Expected Results:**
- ✅ NO "unknown api_key" errors
- ✅ Image uploads work normally
- ✅ Clean server logs

**What Changed:**
- Removed API key from client-side code
- Using unsigned upload with preset
- No API key exposed in requests

---

## Technical Details

### 1. Login Response Changes

**File:** `/controllers/authController.js`

**Before:**
```javascript
user: {
  _id: user._id,
  user_fullname: user.user_fullname,
  email_id: user.email_id,
  mobile_no: user.mobile_no,
  address: user.address,
  role: user.role,
  // ❌ NO roleString
}
```

**After:**
```javascript
user: {
  _id: user._id,
  user_fullname: user.user_fullname,
  email_id: user.email_id,
  mobile_no: user.mobile_no,
  address: user.address,
  role: user.role,
  roleString: user.roleString || "user", // ✅ ADDED
}
```

**Impact:**
- Client receives `roleString` in JWT
- RBAC middleware can compute capabilities
- Admin auth endpoint passes for admin users

---

### 2. Header Changes

**File:** `/client/src/components/Layout/Header.jsx`

**Added to Desktop Navigation:**
```javascript
<li className="nav-item">
  <NavLink to="/seller-wizard" className="nav-link d-flex align-items-center">
    <span style={{ marginRight: "5px", color: "white" }}>📦</span>
    Become a Seller
  </NavLink>
</li>
```

**Added to Mobile Navigation:**
```javascript
<li className="nav-item">
  <NavLink to="/seller-wizard" className="nav-link p-1" style={{ color: "white", padding: "0.25rem 0.5rem" }}>
    <span style={{ color: "white", fontSize: "16px" }}>📦</span>
  </NavLink>
</li>
```

**Impact:**
- Logged-in users see seller wizard link
- Works on all screen sizes
- Easy access to become a seller

---

### 3. Cloudinary Security Fix

**File:** `/client/src/utils/cloudinary.jsx`

**Before:**
```javascript
const CLOUDINARY_API_KEY = "119598853346493"; // ❌ EXPOSED
formData.append("api_key", CLOUDINARY_API_KEY); // ❌ SENT IN REQUEST
```

**After:**
```javascript
// NOTE: Do NOT include api_key or api_secret in client-side code
// Use unsigned upload with upload_preset instead
// ✅ Only upload_preset sent, no API key
```

**Impact:**
- API key not exposed in client code
- No "unknown api_key" errors
- Improved security

---

## RBAC Flow After Login

```
User Login
    ↓
OTP Verification
    ↓
Server returns JWT with roleString
    ↓
Client stores JWT in localStorage
    ↓
Client makes request to /admin-auth
    ↓
Backend requireSignIn middleware:
  - Verifies JWT
  - Fetches user from DB
  - Gets user.roleString (e.g., "admin")
  - Computes capabilities based on roleString
  - Stores in req.user.capabilities
    ↓
Backend requireCapability("products:read"):
  - Checks if "products:read" in req.user.capabilities
  - Admin has it → ✅ PASS
  - User doesn't have it → ❌ FAIL
    ↓
Admin Dashboard Loads Successfully
```

---

## Troubleshooting

### Issue: Still getting logged out on dashboard

**Check:**
1. Server logs for errors
2. Network tab in browser DevTools
3. JWT token in localStorage
4. User's `roleString` in database

**Solution:**
```bash
# Check user in database
db.users.findOne({mobile_no: "YOUR_PHONE"})
# Should have: roleString: "admin"

# If missing, update:
db.users.updateOne(
  {mobile_no: "YOUR_PHONE"},
  {$set: {roleString: "admin"}}
)
```

### Issue: "Become a Seller" not showing

**Check:**
1. Are you logged in? (Check localStorage for auth)
2. Browser console for errors
3. Header component rendering

**Solution:**
- Clear browser cache: Ctrl+Shift+Delete
- Restart frontend: npm start
- Check if Header component is rendering

### Issue: Still seeing Cloudinary errors

**Check:**
1. Server logs for error details
2. Network tab for failed requests
3. Cloudinary upload preset configuration

**Solution:**
- Verify upload preset exists in Cloudinary dashboard
- Check cloud name is correct: `daabaruau`
- Restart server: npm start

---

## Files Modified Summary

| File | Changes | Lines |
|------|---------|-------|
| `/controllers/authController.js` | Added `roleString` to login responses | 102, 311 |
| `/client/src/components/Layout/Header.jsx` | Added "Become a Seller" link | 212-216, 296-300 |
| `/client/src/utils/cloudinary.jsx` | Removed API key from client code | 1-24 |
| `/middlewares/rbacMiddleware.js` | Added fallback for `actorRole` | 325, 329 |
| `/models/auditLogModel.js` | Made `actorRole` optional | 11-14 |

---

## Deployment Checklist

- [ ] Test admin login and dashboard access
- [ ] Test regular user login
- [ ] Test "Become a Seller" link
- [ ] Check server logs for Cloudinary errors
- [ ] Verify no audit log validation errors
- [ ] Test on mobile and desktop
- [ ] Clear browser cache before testing
- [ ] Restart server after code changes

---

## Success Criteria

✅ **All of these should be true:**
1. Admin users can log in and access dashboard without logout
2. "Become a Seller" option visible in header for logged-in users
3. Clicking "Become a Seller" navigates to seller wizard
4. No Cloudinary API key errors in server logs
5. No audit log validation errors
6. RBAC capabilities properly computed
7. Works on mobile and desktop

---

## Next Steps

If all tests pass:
1. ✅ Deploy to production
2. ✅ Monitor server logs for errors
3. ✅ Gather user feedback

If any test fails:
1. Check troubleshooting section
2. Review server logs
3. Check browser DevTools console
4. Verify database user records
