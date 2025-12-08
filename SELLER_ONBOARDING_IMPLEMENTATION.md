# Seller Onboarding Flow - Implementation Guide

## ✅ COMPLETED COMPONENTS

### 1. Backend Endpoints (sellerApplicationControllerV2.js)

#### User Endpoints
- **POST /api/v1/sellers/apply** - Save draft application
- **POST /api/v1/sellers/submit** - Finalize and submit (locks plan)
- **GET /api/v1/sellers/my-application** - Get user's application status
- **POST /api/v1/sellers/applications/:id/retry-payment** - Retry failed payment

#### Super Admin Endpoints
- **GET /api/v1/sellers/applications** - List all applications (with pagination, filtering, search)
- **GET /api/v1/sellers/applications/:id** - Get single application
- **POST /api/v1/sellers/applications/:id/approve** - Approve application
- **POST /api/v1/sellers/applications/:id/reject** - Reject application

### 2. Payment Webhook Handler (paymentWebhookController.js)

- **POST /api/v1/payments/webhook** - Razorpay webhook handler
  - Verifies signature
  - Activates seller on success
  - Updates permissions
  - Increments tokenVersion
  - Returns refreshed JWT

- **POST /api/v1/payments/webhook/failure** - Handle payment failures
- **GET /api/v1/payments/checkout-data** - Get checkout info for pending payment

### 3. Auto-Fallback CRON Job (planExpiryJob.js)

- Runs daily at midnight
- Checks for expired plans
- 30-day grace period
- Auto-fallback to Free plan after grace period
- Sends reminder emails (7 days, 1 day, on expiry)
- Logs audit events

---

## 🔧 INTEGRATION STEPS

### Step 1: Update server.js

Replace old routes with new ones:

```javascript
// OLD
import sellerApplicationRoutes from "./routes/sellerApplicationRoutes.js";
app.use('/api/v1/sellers/applications', sellerApplicationRoutes);

// NEW
import sellerApplicationRoutesV2 from "./routes/sellerApplicationRoutesV2.js";
import paymentWebhookRoutes from "./routes/paymentWebhookRoutes.js";

app.use('/api/v1/sellers', sellerApplicationRoutesV2);
app.use('/api/v1/payments', paymentWebhookRoutes);
```

### Step 2: Create paymentWebhookRoutes.js

```javascript
import express from "express";
import {
  handleRazorpayWebhook,
  handlePaymentFailure,
  getCheckoutData,
} from "../controllers/paymentWebhookController.js";
import { requireSignIn } from "../middlewares/rbacMiddleware.js";

const router = express.Router();

// Webhook endpoints (no auth required - verified by signature)
router.post("/webhook", handleRazorpayWebhook);
router.post("/webhook/failure", handlePaymentFailure);

// Get checkout data (authenticated)
router.get("/checkout-data", requireSignIn, getCheckoutData);

export default router;
```

### Step 3: Register CRON Job

Add to server.js startup:

```javascript
import handlePlanExpiry from "./jobs/planExpiryJob.js";
import cron from "node-cron";

// Run plan expiry check daily at midnight
cron.schedule("0 0 * * *", () => {
  console.log("Running plan expiry check...");
  handlePlanExpiry();
});
```

Install cron package:
```bash
npm install node-cron
```

### Step 4: Update .env

```env
# Razorpay
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret

# Email (optional, for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

---

## 📱 FRONTEND SCREENS TO BUILD

### Screen 1: Plan Selection (Wizard Step 0)
**File**: `client/src/pages/Seller/SellerPlanSelection.jsx` (already exists)

**Updates needed**:
- Display plans as cards
- Show: Name, Price, Features, Select button
- On select: Set selectedPlanId
- Button: "Start Application" → Go to Step 1

### Screen 2: Multi-Step Form (Steps 1-6)
**File**: `client/src/pages/Seller/SellerWizard.jsx` (already exists)

**Updates needed**:
- Add progress tracker (Step 1/7, 2/7, etc.)
- Form fields from SellerApplication schema
- Buttons: Save Draft, Next, Back, Submit
- After submit: Show "Pending Review — Plan Change Locked"
- Save draft calls: `POST /api/v1/sellers/apply`
- Submit calls: `POST /api/v1/sellers/submit`

### Screen 3: Application Status Page
**File**: `client/src/pages/Seller/ApplicationStatus.jsx` (NEW)

**Features**:
- Status badge (Submitted, Under Review, Approved — Pending Payment, Active, Rejected)
- If rejected: Show reason + "Edit & Reapply" button
- If approved_pending_payment: Show "Proceed to Payment" button
- If active: Show "Manage Subscription" card with:
  - Plan name and expiry date
  - AutoRenew toggle
  - Invoicing history
  - Current capabilities

**API calls**:
- `GET /api/v1/sellers/my-application` - Get status
- `GET /api/v1/payments/checkout-data?applicationId=...` - Get checkout info
- `POST /api/v1/sellers/applications/:id/retry-payment` - Retry payment

### Screen 4: Admin Applications List
**File**: `client/src/pages/Admin/SellerApplications.jsx` (NEW)

**Features**:
- Tabs: Pending | Approved | Rejected
- Columns: Applicant | Plan | Submitted At | Status | Actions
- Actions: View | Approve | Reject
- Approve modal: Choose "Approve as Free" or "Approve and Create Payment"
- Reject modal: Enter rejection reason

**API calls**:
- `GET /api/v1/sellers/applications?status=&page=&limit=&search=` - List
- `GET /api/v1/sellers/applications/:id` - Get details
- `POST /api/v1/sellers/applications/:id/approve` - Approve
- `POST /api/v1/sellers/applications/:id/reject` - Reject

### Screen 5: Checkout Page (Reuse existing)
**File**: `client/src/pages/cart/CheckoutPage.jsx` (already exists)

**Updates needed**:
- Support subscription items
- Show: "Subscription — Plan Name", price locked
- Razorpay payment widget
- On success: Redirect to `/seller-dashboard`

### Screen 6: Seller Dashboard
**File**: `client/src/pages/Seller/SellerDashboard.jsx` (NEW)

**Features**:
- Plan status card: "Active — Expires on [date]"
- AutoRenew toggle
- Invoicing history
- Current capabilities list
- CTA: Upgrade/Renew

---

## 🧪 TESTS TO CREATE

### Test File: `tests/seller-onboarding.test.js`

**Test Cases**:

1. **Draft Application**
   - Save draft application
   - Verify status = 'draft'
   - Verify lockPlan = false
   - Update draft
   - Verify updated fields

2. **Submit Application**
   - Submit draft application
   - Verify status = 'submitted'
   - Verify lockPlan = true
   - Verify submittedAt is set
   - Try to change plan (should fail)

3. **Approve Free Plan**
   - Admin approves free plan application
   - Verify status = 'approved'
   - Verify SellerProfile created with isActive = true
   - Verify user role = 'seller'
   - Verify permissions merged
   - Verify tokenVersion incremented
   - Verify token returned

4. **Approve Paid Plan**
   - Admin approves paid plan application
   - Verify status = 'approved_pending_payment'
   - Verify payment order created
   - Verify SellerProfile created with isActive = false
   - Verify checkoutInfo returned

5. **Payment Webhook Success**
   - Simulate successful payment webhook
   - Verify signature validation
   - Verify application status = 'active'
   - Verify SellerProfile isActive = true
   - Verify planActivatedAt and planExpiresAt set
   - Verify permissions merged
   - Verify tokenVersion incremented
   - Verify token returned

6. **Payment Webhook Failure**
   - Simulate failed payment webhook
   - Verify application status = 'approved_payment_failed'
   - Verify payment status = 'failed'

7. **Retry Payment**
   - Create failed payment order
   - Call retry-payment endpoint
   - Verify new order created
   - Verify status = 'approved_pending_payment'
   - Verify checkoutInfo returned

8. **Reject Application**
   - Admin rejects application with reason
   - Verify status = 'rejected'
   - Verify reviewNotes = reason
   - Verify lockPlan = false (allow reapply)
   - Verify payment cleared

9. **Reapply After Rejection**
   - Reject application
   - Submit new application
   - Verify new application created
   - Verify old payment cleared

10. **Auto-Fallback to Free Plan**
    - Create active seller profile with expired plan
    - Run CRON job
    - Verify currentPlanId = FreePlanId
    - Verify permissions updated
    - Verify tokenVersion incremented
    - Verify audit log created

11. **Plan Expiry Reminders**
    - Create seller profile expiring in 7 days
    - Run CRON job
    - Verify reminder email sent
    - Repeat for 1 day and 0 days

12. **List Applications (Admin)**
    - Create multiple applications with different statuses
    - List with status filter
    - Verify pagination
    - Verify search by name/email/business
    - Verify sorting

13. **Get Single Application (Admin)**
    - Get application by ID
    - Verify all fields populated
    - Verify user and plan populated

14. **Get My Application (User)**
    - Get user's application
    - Verify only user's application returned
    - Verify seller profile data included if active

15. **Plan Locking**
    - Submit application
    - Try to change plan (should fail)
    - Reject application
    - Try to change plan (should succeed)

---

## 🔐 SECURITY CHECKLIST

- [ ] Payment webhooks verify Razorpay signature
- [ ] All sensitive actions logged to AuditLog
- [ ] Token versioning prevents old tokens
- [ ] Plan locked after submission
- [ ] Super Admin approval required before payment
- [ ] Rejection reason stored for transparency
- [ ] User can only see own application
- [ ] Admin can only approve/reject with capability check
- [ ] Payment amount locked at approval
- [ ] Webhook endpoint doesn't require auth (verified by signature)

---

## 📊 API RESPONSE EXAMPLES

### Save Draft
```json
{
  "success": true,
  "message": "Application draft saved",
  "applicationId": "app_123",
  "status": "draft"
}
```

### Submit Application
```json
{
  "success": true,
  "message": "Application submitted successfully",
  "status": "submitted",
  "submittedAt": "2025-12-04T10:00:00Z",
  "lockPlan": true
}
```

### Approve Free Plan
```json
{
  "success": true,
  "message": "Application approved (Free plan activated)",
  "status": "approved",
  "token": "eyJhbGc...",
  "seller": {
    "_id": "profile_123",
    "isActive": true,
    "planActivatedAt": "2025-12-04T10:00:00Z",
    "permissions": {
      "grantedCapabilities": ["products:read", "products:write", ...],
      "deniedCapabilities": []
    }
  }
}
```

### Approve Paid Plan
```json
{
  "success": true,
  "message": "Application approved (Pending payment)",
  "status": "approved_pending_payment",
  "checkoutInfo": {
    "orderId": "order_123",
    "amount": 499,
    "currency": "INR",
    "planName": "Pro",
    "applicationId": "app_123"
  }
}
```

### Payment Webhook Success
```json
{
  "success": true,
  "message": "Payment verified and seller activated",
  "token": "eyJhbGc...",
  "seller": {
    "_id": "profile_123",
    "isActive": true,
    "planActivatedAt": "2025-12-04T10:00:00Z",
    "planExpiresAt": "2026-01-04T10:00:00Z"
  },
  "planExpiresAt": "2026-01-04T10:00:00Z"
}
```

---

## 🚀 DEPLOYMENT CHECKLIST

- [ ] Update server.js with new routes
- [ ] Create paymentWebhookRoutes.js
- [ ] Register CRON job in server.js
- [ ] Install node-cron: `npm install node-cron`
- [ ] Update .env with Razorpay credentials
- [ ] Build frontend screens
- [ ] Run tests: `npm test -- tests/seller-onboarding.test.js`
- [ ] Test payment flow with Razorpay test cards
- [ ] Test CRON job manually
- [ ] Deploy to production

---

## 📝 NOTES

- All timestamps use UTC
- Plan expiry calculated based on billingCycle (monthly/quarterly/yearly)
- 30-day grace period before auto-fallback
- Reminder emails sent at 7 days, 1 day, and on expiry
- Token versioning ensures old tokens are invalidated
- Payment amount locked at approval to prevent price changes
- Rejection allows reapply with plan change

---

**Status**: Ready for frontend implementation and testing
**Last Updated**: December 4, 2025
