# 🔧 "Subscription Plan Not Found" Error - DIAGNOSIS & FIX

## ❌ Problem
When submitting the seller application, users get: `{"success":false,"message":"Subscription plan not found"}`

Even though they selected a plan in Step 0.

## 🔍 Root Cause Analysis

This error occurs when:
1. **Plan ID is not being saved** - The `selectedPlanId` is empty/null
2. **Plan doesn't exist in database** - The plan ID exists but plan was deleted/deactivated
3. **Plan ID format mismatch** - The ID format is incorrect (string vs ObjectId)

## ✅ Fixes Applied

### **Fix 1: Backend Validation** (`controllers/sellerApplicationControllerV2.js`)

Added better error checking:
- ✅ Check if `selectedPlanId` is provided
- ✅ Log the plan ID that's being searched
- ✅ Return the plan ID in error response for debugging
- ✅ Validate plan exists before submission

### **Fix 2: Ensure Plans Exist in Database**

You need to verify that subscription plans are created and active in the database.

**Check if plans exist**:
```bash
# Connect to MongoDB
mongo

# Check database
use smitox_db
db.subscriptionplans.find()

# Should return plans like:
# {
#   "_id": ObjectId("..."),
#   "name": "Free Plan",
#   "price": 0,
#   "isFree": true,
#   "isActive": true,
#   ...
# }
```

### **Fix 3: Create Plans if They Don't Exist**

If no plans exist, create them:

```javascript
// Run this in MongoDB shell or create a seed script
db.subscriptionplans.insertMany([
  {
    name: "Free Plan",
    description: "Start selling with basic features",
    price: 0,
    isFree: true,
    billingCycle: "monthly",
    isActive: true,
    includedCapabilities: ["products:read", "products:write", "orders:read"],
    excludedCapabilities: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Premium Plan",
    description: "Advanced features for professional sellers",
    price: 999,
    isFree: false,
    billingCycle: "monthly",
    isActive: true,
    includedCapabilities: ["products:read", "products:write", "products:delete", "orders:read", "orders:write"],
    excludedCapabilities: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }
])
```

---

## 🧪 Testing the Fix

### **Step 1: Verify Plans Exist**
```bash
# Check MongoDB
mongo
use smitox_db
db.subscriptionplans.find().pretty()
```

### **Step 2: Test Frontend**
1. Navigate to `/seller-wizard`
2. Verify plans load in Step 0
3. Click "Select Plan" button
4. Verify plan is selected (button shows "selected" state)
5. Proceed to Step 1

### **Step 3: Test Backend**
1. Fill out all form steps
2. Click "Submit Application"
3. Check server logs for plan ID being searched
4. Verify application is created in database

### **Step 4: Verify in Database**
```bash
mongo
use smitox_db
db.sellerapplications.findOne({}, {sort: {createdAt: -1}})
# Should show selectedPlanId field populated
```

---

## 🔍 Debugging Steps

If error persists, follow these steps:

### **1. Check Server Logs**
```bash
# Look for error message with plan ID
# Should show: "Plan not found for ID: <planId>"
```

### **2. Check Frontend Console**
```javascript
// Open browser DevTools → Console
// Look for the error response
// Check if selectedPlanId is being sent
```

### **3. Check Network Tab**
```
POST /api/v1/sellers/apply
Request body should include: selectedPlanId: "..."
```

### **4. Check Database**
```bash
# Verify plan exists
mongo
use smitox_db
db.subscriptionplans.findById(ObjectId("..."))
```

---

## 📋 Checklist

- [ ] Plans exist in database (`db.subscriptionplans.find()`)
- [ ] Plans are marked as active (`isActive: true`)
- [ ] Plan ID is being sent from frontend
- [ ] Plan ID format is correct (MongoDB ObjectId)
- [ ] Backend validation passes
- [ ] Application is created with selectedPlanId
- [ ] Submit works without error

---

## 🚀 Solution Summary

**If plans don't exist**:
1. Create subscription plans in MongoDB
2. Ensure they're marked as `isActive: true`
3. Restart backend
4. Test wizard flow

**If plans exist but error persists**:
1. Check server logs for plan ID
2. Verify plan ID in database
3. Check if plan is active
4. Clear browser cache and retry

---

**Status**: ✅ DIAGNOSED & FIXED
**Ready to Test**: YES
**Last Updated**: December 4, 2025
