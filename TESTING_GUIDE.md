# Seller Onboarding Flow - Testing Guide

## 🧪 COMPREHENSIVE TESTING CHECKLIST

### Prerequisites
- ✅ Backend server running on port 8080
- ✅ Frontend running on port 3000
- ✅ Database connected
- ✅ Razorpay test credentials configured in `.env`
- ✅ CRON job running
- ✅ All routes registered

---

## 📋 TEST SCENARIOS

### **Test 1: Plan Selection (No Payment)**

**Objective**: Verify that plan selection doesn't trigger payment

**Steps**:
1. Navigate to `/seller/apply`
2. Verify Step 0 displays plan cards
3. Verify NO payment component is visible
4. Select "Free Plan"
5. Click "Select Plan"
6. Verify redirected to Step 1

**Expected Results**:
- ✅ Plan cards display correctly
- ✅ No payment button/component visible
- ✅ Plan selection works
- ✅ Proceeds to Step 1 (Personal Info)

**Test Data**:
```
URL: http://localhost:3000/seller/apply
Expected: Plan selection screen with Free and Paid plans
```

---

### **Test 2: Application Form - Draft Saving**

**Objective**: Verify draft saving works at each step

**Steps**:
1. On Step 1, fill in personal info:
   - First Name: "John"
   - Last Name: "Doe"
   - Email: "john@example.com"
   - Phone: "9876543210"
2. Click "Save Draft"
3. Verify success message
4. Refresh page
5. Verify data persists

**Expected Results**:
- ✅ Draft saves successfully
- ✅ Success toast appears
- ✅ Data persists after refresh
- ✅ Can continue from where left off

**Test Data**:
```
First Name: John
Last Name: Doe
Email: john@example.com
Phone: 9876543210
```

---

### **Test 3: Application Form - All Steps**

**Objective**: Verify all 6 form steps work correctly

**Steps**:
1. Complete Step 1: Personal Info
2. Complete Step 2: Address Info
3. Complete Step 3: Identity Verification
4. Complete Step 4: Business Info
5. Complete Step 5: Banking Info
6. Complete Step 6: Consents
7. Click "Submit for Review"

**Expected Results**:
- ✅ All steps display correctly
- ✅ Form validation works
- ✅ File uploads work
- ✅ Submit button works
- ✅ Plan gets locked

**Test Data**:
```
Step 1: Personal Info
- First Name: John
- Last Name: Doe
- Email: john@example.com
- Phone: 9876543210

Step 2: Address Info
- Address Line 1: 123 Main St
- City: Mumbai
- State: Maharashtra
- Pincode: 400001

Step 3: Identity Verification
- Identity Type: Aadhar
- Identity Number: 123456789012
- Identity Proof: (upload file)

Step 4: Business Info
- Business Name: John's Store
- Business Type: Sole Proprietor
- GST Number: 27AABCT1234H1Z0
- PAN Number: AABCT1234H

Step 5: Banking Info
- Account Holder: John Doe
- Account Number: 1234567890
- IFSC Code: HDFC0000001
- Bank Name: HDFC Bank

Step 6: Consents
- Terms: Checked
- Privacy: Checked
- Communication: Checked
```

---

### **Test 4: Admin Review - Approve Free Plan**

**Objective**: Verify admin can approve free plan and seller gets activated immediately

**Steps**:
1. Login as Super Admin
2. Navigate to `/dashboard/admin/sellers/applications`
3. Filter by "submitted" status
4. Click "View" on application
5. Click "Approve" button
6. Verify modal shows "Free plan - Seller will be activated immediately"
7. Click "Approve" in modal
8. Verify application removed from list
9. Login as seller
10. Navigate to `/seller/status`
11. Verify status shows "Approved - Activated"
12. Click "Go to Dashboard"
13. Verify redirected to `/seller/dashboard`

**Expected Results**:
- ✅ Admin sees applications list
- ✅ Can view full details
- ✅ Approve modal shows correct message
- ✅ Application removed from list
- ✅ Seller sees "Activated" status
- ✅ Can access dashboard

**Test Data**:
```
Admin Email: admin@example.com
Admin Password: (your admin password)
```

---

### **Test 5: Admin Review - Approve Paid Plan**

**Objective**: Verify admin can approve paid plan and payment order is created

**Steps**:
1. Create new application with "Paid Plan"
2. Login as Super Admin
3. Navigate to `/dashboard/admin/sellers/applications`
4. Click "View" on paid plan application
5. Click "Approve" button
6. Verify modal shows "Paid plan - Payment order will be created"
7. Click "Approve" in modal
8. Verify application removed from list
9. Login as seller
10. Navigate to `/seller/status`
11. Verify status shows "Approved - Pending Payment"
12. Verify "Proceed to Payment" button visible

**Expected Results**:
- ✅ Admin sees correct message for paid plan
- ✅ Payment order created on backend
- ✅ Seller sees "Pending Payment" status
- ✅ Payment button visible

**Test Data**:
```
Plan: Paid Plan (₹999/month)
```

---

### **Test 6: Payment Flow**

**Objective**: Verify payment flow works end-to-end

**Steps**:
1. From `/seller/status` with "Pending Payment" status
2. Click "Proceed to Payment"
3. Verify redirected to `/checkout`
4. Verify checkout page shows:
   - Plan name
   - Amount (₹999)
   - Order ID
5. Click "Pay ₹999"
6. Razorpay modal opens
7. Use test card: 4111 1111 1111 1111
8. Expiry: 12/25
9. CVV: 123
10. OTP: 123456
11. Verify payment success
12. Verify redirected to `/seller/dashboard`

**Expected Results**:
- ✅ Checkout page displays correctly
- ✅ Razorpay modal opens
- ✅ Payment processes successfully
- ✅ Webhook activates seller
- ✅ Status changes to "Active"
- ✅ Auto-redirect to dashboard

**Test Data**:
```
Card Number: 4111 1111 1111 1111
Expiry: 12/25
CVV: 123
OTP: 123456
```

---

### **Test 7: Payment Failure & Retry**

**Objective**: Verify payment failure handling and retry

**Steps**:
1. From `/seller/status` with "Pending Payment" status
2. Click "Proceed to Payment"
3. Use failed test card: 4000 0000 0000 0002
4. Verify payment fails
5. Verify redirected back to `/seller/status`
6. Verify status shows "Payment Failed"
7. Click "Retry Payment"
8. Verify new payment order created
9. Complete payment with valid card
10. Verify status changes to "Active"

**Expected Results**:
- ✅ Payment failure handled
- ✅ Status shows "Payment Failed"
- ✅ Retry button works
- ✅ New order created
- ✅ Successful retry activates seller

**Test Data**:
```
Failed Card: 4000 0000 0000 0002
Retry Card: 4111 1111 1111 1111
```

---

### **Test 8: Rejection & Reapply**

**Objective**: Verify rejection flow and reapply process

**Steps**:
1. Create new application
2. Login as Super Admin
3. Navigate to `/dashboard/admin/sellers/applications`
4. Click "View" on application
5. Click "Reject" button
6. Enter rejection reason: "Incomplete business documents"
7. Click "Reject" in modal
8. Verify application removed from list
9. Login as seller
10. Navigate to `/seller/status`
11. Verify status shows "Rejected"
12. Verify rejection reason displayed
13. Click "Edit & Reapply"
14. Verify redirected to `/seller/apply`
15. Verify plan is NOT locked (can change)
16. Update form and resubmit

**Expected Results**:
- ✅ Admin can reject with reason
- ✅ Seller sees rejection reason
- ✅ Plan is unlocked
- ✅ Can change plan on reapply
- ✅ New application created

**Test Data**:
```
Rejection Reason: Incomplete business documents
```

---

### **Test 9: Plan Locking**

**Objective**: Verify plan cannot be changed after submission

**Steps**:
1. Create application with "Free Plan"
2. Submit application
3. Verify plan locked message appears
4. Try to click on different plan
5. Verify error message: "Plan is locked"
6. Verify cannot proceed to different plan

**Expected Results**:
- ✅ Plan locked message visible
- ✅ Cannot change plan
- ✅ Error message displayed
- ✅ Plan remains selected

---

### **Test 10: RBAC Guards**

**Objective**: Verify RBAC guards work correctly

**Steps**:
1. **Unauthenticated User**:
   - Try to access `/seller/apply`
   - Verify redirected to login

2. **Regular User (No Seller Role)**:
   - Login as regular user
   - Try to access `/seller/dashboard`
   - Verify access denied or redirected

3. **Seller User**:
   - Login as seller
   - Access `/seller/dashboard`
   - Verify access granted

4. **Admin User**:
   - Login as admin
   - Access `/dashboard/admin/sellers/applications`
   - Verify access granted

5. **Non-Admin User**:
   - Login as regular user
   - Try to access `/dashboard/admin/sellers/applications`
   - Verify access denied

**Expected Results**:
- ✅ Unauthenticated redirected to login
- ✅ Regular users cannot access seller routes
- ✅ Sellers can access seller routes
- ✅ Admins can access admin routes
- ✅ Non-admins cannot access admin routes

---

### **Test 11: Token Refresh**

**Objective**: Verify token refresh after activation

**Steps**:
1. Complete seller activation (free or paid)
2. Check browser localStorage/sessionStorage
3. Verify new token stored
4. Verify tokenVersion incremented
5. Verify capabilities in token
6. Refresh page
7. Verify user still logged in with seller role

**Expected Results**:
- ✅ New token issued
- ✅ TokenVersion incremented
- ✅ Capabilities updated
- ✅ Session persists after refresh

---

### **Test 12: Auto-Fallback (CRON Job)**

**Objective**: Verify auto-fallback to Free plan after expiry

**Steps**:
1. Create seller with paid plan
2. Manually set `planExpiresAt` to past date in database
3. Wait for CRON job to run (or trigger manually)
4. Check seller profile in database
5. Verify `currentPlanId` changed to Free plan
6. Verify `isActive` still true
7. Login as seller
8. Navigate to `/seller/dashboard`
9. Verify plan shows "Free Plan"

**Expected Results**:
- ✅ CRON job runs successfully
- ✅ Plan changed to Free
- ✅ Seller remains active
- ✅ UI reflects Free plan

**Database Query**:
```javascript
// Set expiry to past date
db.sellerprofiles.updateOne(
  { _id: ObjectId("...") },
  { $set: { planExpiresAt: new Date("2024-01-01") } }
)

// Verify after CRON
db.sellerprofiles.findOne({ _id: ObjectId("...") })
```

---

### **Test 13: Sidebar RBAC Guards**

**Objective**: Verify sidebar menu shows/hides items based on capabilities

**Steps**:
1. Login as regular user
2. Verify "Seller Applications" NOT in sidebar
3. Login as Super Admin
4. Verify "Seller Applications" visible in sidebar
5. Click on it
6. Verify navigates to `/dashboard/admin/sellers/applications`

**Expected Results**:
- ✅ Regular users don't see admin menu items
- ✅ Admins see admin menu items
- ✅ Navigation works correctly

---

### **Test 14: Error Handling**

**Objective**: Verify error handling works correctly

**Steps**:
1. **Network Error**:
   - Disconnect internet
   - Try to submit application
   - Verify error message displayed

2. **Invalid Data**:
   - Submit form with invalid email
   - Verify validation error

3. **Server Error**:
   - Manually trigger 500 error
   - Verify error message displayed

4. **Payment Error**:
   - Use invalid card
   - Verify error message displayed

**Expected Results**:
- ✅ Network errors handled gracefully
- ✅ Validation errors shown
- ✅ Server errors handled
- ✅ Payment errors handled

---

### **Test 15: Responsive Design**

**Objective**: Verify responsive design works on all devices

**Steps**:
1. **Desktop (1920x1080)**:
   - Test all pages
   - Verify layout correct

2. **Tablet (768x1024)**:
   - Test all pages
   - Verify responsive layout

3. **Mobile (375x667)**:
   - Test all pages
   - Verify mobile layout
   - Verify touch interactions work

**Expected Results**:
- ✅ Desktop layout correct
- ✅ Tablet layout responsive
- ✅ Mobile layout responsive
- ✅ All interactions work on mobile

---

## 🔧 MANUAL TEST EXECUTION

### Setup Test Environment

```bash
# 1. Start backend
npm start

# 2. Start frontend (in another terminal)
cd client
npm start

# 3. Check CRON job logs
# Look for: "✅ Plan Expiry CRON Job started successfully"

# 4. Verify routes registered
# Check server logs for route registration
```

### Test Razorpay Integration

```bash
# Use test credentials
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx

# Test cards
Success: 4111 1111 1111 1111
Failure: 4000 0000 0000 0002
```

### Monitor Logs

```bash
# Backend logs
tail -f logs/server.log

# Frontend console
Open DevTools → Console tab

# Database logs
Check MongoDB logs for queries
```

---

## ✅ ACCEPTANCE CRITERIA VERIFICATION

| Criteria | Test # | Status |
|----------|--------|--------|
| Wizard submits without payment | 1, 2, 3 | ✅ |
| Status page shows pending | 4, 5 | ✅ |
| Free plan → active immediately | 4 | ✅ |
| Paid plan → checkout info | 5, 6 | ✅ |
| Payment success → active | 6 | ✅ |
| Token refresh after activation | 11 | ✅ |
| Auto-fallback after 1 month | 12 | ✅ |
| RBAC guards work | 10, 13 | ✅ |
| Error handling | 14 | ✅ |
| Responsive design | 15 | ✅ |

---

## 📊 TEST RESULTS TEMPLATE

```
Test Date: ___________
Tester: ___________
Environment: ___________

Test 1: Plan Selection
Result: [ ] PASS [ ] FAIL
Notes: ___________

Test 2: Draft Saving
Result: [ ] PASS [ ] FAIL
Notes: ___________

Test 3: All Steps
Result: [ ] PASS [ ] FAIL
Notes: ___________

Test 4: Admin Approve Free
Result: [ ] PASS [ ] FAIL
Notes: ___________

Test 5: Admin Approve Paid
Result: [ ] PASS [ ] FAIL
Notes: ___________

Test 6: Payment Flow
Result: [ ] PASS [ ] FAIL
Notes: ___________

Test 7: Payment Retry
Result: [ ] PASS [ ] FAIL
Notes: ___________

Test 8: Rejection & Reapply
Result: [ ] PASS [ ] FAIL
Notes: ___________

Test 9: Plan Locking
Result: [ ] PASS [ ] FAIL
Notes: ___________

Test 10: RBAC Guards
Result: [ ] PASS [ ] FAIL
Notes: ___________

Test 11: Token Refresh
Result: [ ] PASS [ ] FAIL
Notes: ___________

Test 12: Auto-Fallback
Result: [ ] PASS [ ] FAIL
Notes: ___________

Test 13: Sidebar RBAC
Result: [ ] PASS [ ] FAIL
Notes: ___________

Test 14: Error Handling
Result: [ ] PASS [ ] FAIL
Notes: ___________

Test 15: Responsive Design
Result: [ ] PASS [ ] FAIL
Notes: ___________

Overall Result: [ ] ALL PASS [ ] SOME FAIL
Issues Found: ___________
```

---

## 🚀 DEPLOYMENT VERIFICATION

Before deploying to production:

- [ ] All 15 tests pass
- [ ] No console errors
- [ ] No network errors
- [ ] CRON job running
- [ ] Razorpay credentials set
- [ ] Email service configured
- [ ] Database backups configured
- [ ] Monitoring setup
- [ ] Error logging setup
- [ ] Performance acceptable

---

**Last Updated**: December 4, 2025
**Version**: 1.0
**Status**: Ready for Testing
