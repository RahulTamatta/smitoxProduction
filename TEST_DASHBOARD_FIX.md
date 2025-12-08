# Dashboard Fix - Testing Guide

## Quick Test Steps

### Step 1: Verify Server is Running
```bash
# Check if server is running on port 8080
curl -s http://localhost:8080/api/v1/category/get-category | head -20
# Should return JSON response (not connection error)
```

### Step 2: Test Admin Login & Dashboard Access

**In Browser:**
1. Go to `http://localhost:3000/login`
2. Enter admin phone number (e.g., the one you used for admin account)
3. Click "SEND OTP"
4. Enter OTP
5. Click "Verify"

**Expected Results:**
- ✅ Login successful
- ✅ Redirected to home page
- ✅ User dropdown shows "Dashboard" option
- ✅ "Become a Seller" option visible in header

**Next:**
6. Click user dropdown → Click "Dashboard"

**Expected Results:**
- ✅ Dashboard loads WITHOUT 403 error
- ✅ Admin menu visible (Products, Orders, Categories, etc.)
- ✅ NO logout occurs
- ✅ Page stays on dashboard

### Step 3: Test Regular User Dashboard

**In Browser:**
1. Go to `http://localhost:3000/login`
2. Enter regular user phone number
3. Click "SEND OTP"
4. Enter OTP
5. Click "Verify"

**Expected Results:**
- ✅ Login successful
- ✅ Redirected to home page

**Next:**
6. Click user dropdown → Click "Dashboard"

**Expected Results:**
- ✅ Dashboard loads WITHOUT 403 error
- ✅ User dashboard visible (not admin)
- ✅ NO admin menu items
- ✅ NO logout occurs

### Step 4: Check Server Logs

**In Terminal:**
```bash
# Check last 50 lines of server log
tail -50 /tmp/server.log
```

**Expected Results:**
- ✅ NO "unknown api_key" errors
- ✅ NO "Error fetching resource" messages
- ✅ Clean logs with only API requests
- ✅ GET requests showing 200/304 status codes

### Step 5: Test Browser Console

**In Browser DevTools (F12):**
1. Open Console tab
2. Open Network tab
3. Click Dashboard
4. Watch network requests

**Expected Results:**
- ✅ GET /api/v1/auth/admin-auth returns 200 (not 403)
- ✅ NO console errors
- ✅ NO 403 responses
- ✅ Dashboard page loads successfully

## What to Look For

### ✅ Success Indicators:
- Admin dashboard loads without 403
- User dashboard loads without 403
- No logout on dashboard access
- Clean server logs (no Cloudinary errors)
- Network tab shows 200 responses

### ❌ Failure Indicators:
- 403 error on /admin-auth
- User gets logged out
- "unknown api_key" errors in server logs
- Console errors in browser
- Dashboard doesn't load

## If Tests Fail

### Issue: Still getting 403 on /admin-auth

**Check:**
1. Is user an admin? (role should be 1 or roleString should be "admin")
2. Check server logs for errors
3. Check browser console for errors

**Solution:**
```bash
# Check user in database
# Connect to MongoDB and run:
db.users.findOne({mobile_no: "YOUR_PHONE"})
# Should have: role: 1 OR roleString: "admin"

# If missing, update:
db.users.updateOne(
  {mobile_no: "YOUR_PHONE"},
  {$set: {roleString: "admin"}}
)
```

### Issue: Still seeing Cloudinary errors

**Check:**
1. Are you using the latest code?
2. Did you restart the server?

**Solution:**
```bash
# Kill old server
lsof -ti:8080 | xargs kill -9

# Restart
npm start
```

### Issue: Dashboard still not loading

**Check:**
1. Is frontend running on port 3000?
2. Are there console errors?
3. Is token valid?

**Solution:**
```bash
# Clear browser cache
# Ctrl+Shift+Delete (or Cmd+Shift+Delete on Mac)

# Restart frontend
cd client
npm start
```

## Expected Server Log Output

**Good (After Fix):**
```
Server running in undefined mode on port 8080
Conneted To Mongodb Databse ac-dycqfix-shard-00-02.rlcilry.mongodb.net
✓ ImageKit connected successfully
GET /api/v1/category/get-category 200 35.768 ms - 1234
GET /api/v1/auth/admin-auth 200 38.370 ms - 109
GET /api/v1/product/product-list/1 200 2221.363 ms - 5678
```

**Bad (Before Fix):**
```
Error fetching resource for https://res.cloudinary.com/...: { error: { message: 'unknown api_key', http_code: 401 } }
This error originated either by throwing inside of an async function without a catch block...
GET /api/v1/auth/admin-auth 403 38.370 ms - 109
```

## Browser Network Tab Expected Responses

### Successful Admin Login:
```
POST /api/v1/auth/verify-otp
Response: 200 OK
{
  "success": true,
  "message": "Login successful",
  "user": {
    "_id": "...",
    "user_fullname": "Admin Name",
    "role": 1,
    "roleString": "admin",
    ...
  },
  "token": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

### Successful Admin Auth Check:
```
GET /api/v1/auth/admin-auth
Response: 200 OK
{
  "ok": true
}
```

### Dashboard Page Load:
```
GET /dashboard/admin
Response: 200 OK
(HTML page loads)
```

## Verification Checklist

- [ ] Server starts without errors
- [ ] Server logs are clean (no Cloudinary errors)
- [ ] Admin user can login
- [ ] Admin user can access dashboard
- [ ] Admin dashboard shows admin menu
- [ ] Regular user can login
- [ ] Regular user can access dashboard
- [ ] Regular user dashboard shows user menu (not admin)
- [ ] No 403 errors in network tab
- [ ] No logout on dashboard access
- [ ] Browser console has no errors

## Success!

If all tests pass, the fix is working correctly! 🎉

The dashboard 403 error is fixed and users can now access their dashboards without being logged out.
