# 📚 SUBSCRIPTION MANAGEMENT SYSTEM - COMPLETE GUIDE

**Version**: 2.1 - Full Implementation with Fixes  
**Status**: ✅ PRODUCTION READY  
**Last Updated**: December 7, 2025

---

## 📖 TABLE OF CONTENTS

1. [System Overview](#system-overview)
2. [Complete Flow Diagram](#complete-flow-diagram)
3. [API Endpoints](#api-endpoints)
4. [Database Schema](#database-schema)
5. [Frontend Components](#frontend-components)
6. [Backend Controllers](#backend-controllers)
7. [Middleware & Jobs](#middleware--jobs)
8. [Error Handling](#error-handling)
9. [Testing Guide](#testing-guide)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 SYSTEM OVERVIEW

### **Purpose**
Complete subscription plan management system for Smitox B2B platform enabling:
- Plan selection during seller onboarding
- Admin approval workflow
- Payment processing via Razorpay
- Plan expiry tracking and auto-fallback
- Renewal and upgrade functionality
- Capability-based feature access

### **Key Components**
- **Backend**: Node.js/Express with MongoDB
- **Frontend**: React with Axios
- **Payment**: Razorpay integration
- **Scheduling**: Node-cron for daily jobs
- **Security**: JWT tokens, RBAC, audit logging

---

## 🔄 COMPLETE FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                    SELLER ONBOARDING FLOW                       │
└─────────────────────────────────────────────────────────────────┘

STEP 1: PLAN SELECTION
├─ User navigates to /seller/apply
├─ SellerWizardV2 fetches active plans from /api/v1/subscription-plans/active
├─ User selects plan (Free or Paid)
└─ Plan ID stored in formData.selectedPlanId

STEP 2: APPLICATION FORM
├─ User fills 6-step form (personal, address, KYC, business, banking, consents)
├─ Draft saved via saveDraftApplication (selectedPlanId included)
├─ User can change plan until submission
└─ User submits form

STEP 3: SUBMISSION
├─ submitApplication called with applicationId
├─ All required fields validated
├─ Application status changed to "submitted"
├─ lockPlan = true (prevents plan change)
└─ Response sent to frontend

STEP 4: ADMIN REVIEW
├─ Admin views applications at /admin/sellers/applications
├─ getSellerApplications API called
├─ Backend populates selectedPlanId with full plan details
├─ Admin reviews application details
└─ Admin clicks "Approve" or "Reject"

STEP 5A: FREE PLAN APPROVAL ✅
├─ approveApplication called
├─ ✅ planStartDate SET to now
├─ ✅ planExpiryDate SET to now + 30 days
├─ ✅ gracePeriodEndDate SET to now + 60 days
├─ ✅ planStatus SET to "active"
├─ ✅ renewalHistory logged with "initial" entry
├─ Application status = "approved"
├─ SellerProfile created (isActive = true)
├─ User role changed to "seller"
├─ User permissions updated with plan capabilities
├─ New JWT token issued
└─ Seller activated IMMEDIATELY

STEP 5B: PAID PLAN APPROVAL ✅
├─ approveApplication called
├─ ✅ planStartDate SET to now
├─ ✅ planExpiryDate SET to now + 30 days
├─ ✅ gracePeriodEndDate SET to now + 60 days
├─ ✅ planStatus SET to "active"
├─ ✅ renewalHistory logged with "initial" entry
├─ Razorpay order created
├─ Application status = "approved_pending_payment"
├─ SellerProfile created (isActive = false)
├─ Payment info stored in application.payment
└─ User sees "Proceed to Payment" button

STEP 6: PAYMENT (PAID PLANS ONLY)
├─ User redirected to /checkout
├─ Razorpay modal opens
├─ User completes payment
├─ Webhook called: /api/v1/webhooks/payments/razorpay/success
├─ Signature verified
├─ ✅ SellerApplication updated with plan dates
├─ ✅ SellerProfile updated (isActive = true)
├─ Application status = "active"
├─ User permissions updated
├─ New JWT token issued
└─ User redirected to /seller/dashboard

STEP 7: SELLER DASHBOARD
├─ Seller navigates to /seller/dashboard
├─ getMyApplication called
├─ ✅ Returns planExpiryDate
├─ ✅ Returns planStatus
├─ ✅ Returns planStartDate
├─ ✅ Returns gracePeriodEndDate
├─ Dashboard displays:
│  ├─ Current plan name
│  ├─ Days until expiry
│  ├─ Status badge (Active, Expiring Soon, Grace Period, Expired)
│  ├─ Warning banners if needed
│  ├─ Allowed capabilities
│  ├─ Plan features
│  ├─ Renew button
│  └─ Upgrade button
└─ Seller can manage subscription

STEP 8: RENEWAL (FREE PLAN)
├─ Seller clicks "Renew Subscription"
├─ Renewal modal opens
├─ Seller confirms
├─ renewPlan API called
├─ planExpiryDate extended by 30 days
├─ planStatus = "active"
├─ renewalHistory logged with "renewal" entry
└─ Dashboard refreshes

STEP 9: RENEWAL (PAID PLAN)
├─ Seller clicks "Renew Subscription"
├─ Renewal modal opens
├─ Seller confirms
├─ renewPlan API called
├─ Razorpay order created
├─ User redirected to /checkout
├─ Payment completed
├─ Webhook updates plan dates
└─ Seller dashboard refreshes

STEP 10: UPGRADE
├─ Seller clicks "Upgrade Plan"
├─ Upgrade modal opens (shows all available plans)
├─ Seller selects new plan
├─ upgradePlan API called
├─ If free plan: Immediate switch
├─ If paid plan: Razorpay order created → Checkout
├─ After payment: Plan switched
├─ Capabilities updated
├─ renewalHistory logged with "upgrade" entry
└─ Dashboard refreshes

STEP 11: AUTO-FALLBACK (DAILY CRON)
├─ CRON job runs daily at midnight
├─ Finds all expired applications
├─ For each expired application:
│  ├─ Check if grace period ended
│  ├─ If yes: Switch to Free Plan
│  ├─ Update planStatus = "expired"
│  ├─ Update planExpiryDate to now + 30 days
│  ├─ Update user capabilities to Free Plan capabilities
│  ├─ Log auto-fallback in renewalHistory
│  └─ Log audit event
└─ Seller sees "Fallback to Free" message on dashboard

STEP 12: PLAN EXPIRY CHECK (ON EVERY REQUEST)
├─ Middleware runs on every seller request
├─ Checks application.planExpiryDate
├─ Updates planStatus based on days remaining:
│  ├─ 0-23 days: "active"
│  ├─ 24-30 days: "expiring_soon"
│  ├─ 31-60 days: "grace_period"
│  └─ 61+ days: "expired"
├─ Updates user capabilities if needed
└─ Continues to next middleware
```

---

## 🔌 API ENDPOINTS

### **Public Endpoints** (No Auth Required)

#### **Get Active Plans**
```
GET /api/v1/subscription-plans/active
Response:
{
  success: true,
  plans: [
    {
      _id: ObjectId,
      name: "Free Plan",
      price: 0,
      isFree: true,
      billingCycle: "monthly",
      description: "...",
      includedCapabilities: [...],
      excludedCapabilities: [...]
    }
  ]
}
```

#### **Get Plan by ID**
```
GET /api/v1/subscription-plans/:id
Response:
{
  success: true,
  plan: { /* full plan object */ }
}
```

---

### **Seller Endpoints** (Auth Required)

#### **Save Draft Application**
```
POST /api/v1/sellers/applications/apply
Headers: Authorization: Bearer {token}
Body: {
  selectedPlanId: ObjectId,
  firstName: "...",
  lastName: "...",
  email: "...",
  ... (all form fields)
}
Response:
{
  success: true,
  message: "Application draft saved",
  applicationId: ObjectId,
  status: "draft"
}
```

#### **Submit Application**
```
POST /api/v1/sellers/applications/submit
Headers: Authorization: Bearer {token}
Body: {
  applicationId: ObjectId
}
Response:
{
  success: true,
  message: "Application submitted successfully",
  status: "submitted",
  submittedAt: Date,
  lockPlan: true
}
```

#### **Get My Application**
```
GET /api/v1/sellers/applications/my-application
Headers: Authorization: Bearer {token}
Response:
{
  success: true,
  application: {
    _id: ObjectId,
    status: "submitted",
    selectedPlan: { /* populated plan */ },
    selectedPlanId: ObjectId,
    payment: { /* payment info */ },
    lockPlan: true,
    submittedAt: Date,
    reviewNotes: "...",
    ✅ planStartDate: Date,
    ✅ planExpiryDate: Date,
    ✅ planStatus: "active",
    ✅ gracePeriodEndDate: Date,
    ✅ renewalHistory: [...]
  }
}
```

#### **Renew Plan**
```
POST /api/v1/sellers/renew-plan
Headers: Authorization: Bearer {token}
Body: {
  planId: ObjectId (optional, defaults to current plan)
}
Response (Free Plan):
{
  success: true,
  message: "Plan renewed successfully",
  application: { /* updated application */ }
}
Response (Paid Plan):
{
  success: true,
  message: "Renewal payment order created",
  checkoutInfo: {
    orderId: "order_xxx",
    amount: 4999,
    currency: "INR",
    planName: "Starter Plan",
    renewalType: "renewal"
  }
}
```

#### **Upgrade Plan**
```
POST /api/v1/sellers/upgrade-plan
Headers: Authorization: Bearer {token}
Body: {
  planId: ObjectId
}
Response (Free Plan):
{
  success: true,
  message: "Plan changed successfully",
  application: { /* updated application */ }
}
Response (Paid Plan):
{
  success: true,
  message: "Upgrade payment order created",
  checkoutInfo: {
    orderId: "order_xxx",
    amount: 9999,
    currency: "INR",
    planName: "Professional Plan",
    renewalType: "upgrade"
  }
}
```

#### **Get Available Plans**
```
GET /api/v1/sellers/available-plans
Response:
{
  success: true,
  plans: [
    {
      _id: ObjectId,
      name: "Free Plan",
      price: 0,
      isFree: true,
      ... (all plan fields)
    }
  ]
}
```

#### **Retry Payment**
```
POST /api/v1/sellers/applications/:id/retry-payment
Headers: Authorization: Bearer {token}
Response:
{
  success: true,
  message: "New payment order created",
  checkoutInfo: { /* payment info */ }
}
```

---

### **Admin Endpoints** (Auth + Capability Required)

#### **Get All Applications**
```
GET /api/v1/sellers/applications?page=1&limit=10&status=submitted&search=name&sort=-createdAt
Headers: Authorization: Bearer {token}
Capability: sellers:applications:read
Response:
{
  success: true,
  applications: [
    {
      _id: ObjectId,
      firstName: "...",
      lastName: "...",
      email: "...",
      selectedPlanId: { /* populated plan */ },
      status: "submitted",
      createdAt: Date,
      ...
    }
  ],
  pagination: {
    page: 1,
    limit: 10,
    total: 50,
    pages: 5
  }
}
```

#### **Get Application by ID**
```
GET /api/v1/sellers/applications/:id
Headers: Authorization: Bearer {token}
Capability: sellers:applications:read
Response:
{
  success: true,
  application: { /* full application with populated fields */ }
}
```

#### **Approve Application**
```
POST /api/v1/sellers/applications/:id/approve
Headers: Authorization: Bearer {token}
Capability: sellers:applications:approve
Body: {
  reviewerNotes: "Approved"
}
Response (Free Plan):
{
  success: true,
  message: "Application approved (Free plan activated)",
  status: "approved",
  token: "new_jwt_token",
  seller: { /* seller profile */ }
}
Response (Paid Plan):
{
  success: true,
  message: "Application approved (Pending payment)",
  status: "approved_pending_payment",
  checkoutInfo: {
    orderId: "order_xxx",
    amount: 4999,
    currency: "INR",
    planName: "Starter Plan",
    applicationId: ObjectId
  }
}
```

#### **Reject Application**
```
POST /api/v1/sellers/applications/:id/reject
Headers: Authorization: Bearer {token}
Capability: sellers:applications:reject
Body: {
  reason: "Rejection reason"
}
Response:
{
  success: true,
  message: "Application rejected",
  status: "rejected",
  reviewNotes: "Rejection reason"
}
```

---

### **Webhook Endpoints**

#### **Payment Success Webhook**
```
POST /api/v1/webhooks/payments/razorpay/success
Body: {
  razorpay_order_id: "order_xxx",
  razorpay_payment_id: "pay_xxx",
  razorpay_signature: "signature_xxx",
  applicationId: ObjectId
}
Response:
{
  success: true,
  message: "Payment verified and seller activated",
  token: "new_jwt_token",
  seller: { /* seller profile */ },
  planExpiresAt: Date
}
```

#### **Payment Failure Webhook**
```
POST /api/v1/webhooks/payments/razorpay/failure
Body: {
  razorpay_order_id: "order_xxx",
  error_code: "...",
  error_description: "..."
}
Response:
{
  success: true,
  message: "Payment failure recorded",
  status: "approved_payment_failed"
}
```

---

## 💾 DATABASE SCHEMA

### **SellerApplication Model**
```javascript
{
  // User & Application
  userId: ObjectId (ref: User),
  status: String (enum: draft, submitted, under_review, approved, approved_pending_payment, approved_payment_failed, active, rejected),
  lockPlan: Boolean,
  submittedAt: Date,
  reviewedBy: ObjectId (ref: User),
  reviewedAt: Date,
  reviewNotes: String,
  
  // Plan Selection
  selectedPlanId: ObjectId (ref: SubscriptionPlan),
  
  // ✅ Plan Expiry & Renewal Tracking
  planStartDate: Date,
  planExpiryDate: Date,
  planStatus: String (enum: active, expiring_soon, expired, grace_period),
  gracePeriodEndDate: Date,
  renewalHistory: [
    {
      renewalDate: Date,
      previousPlanId: ObjectId,
      newPlanId: ObjectId,
      renewalType: String (enum: initial, renewal, upgrade, downgrade, auto_fallback)
    }
  ],
  
  // Payment
  payment: {
    provider: String,
    orderId: String,
    amount: Number,
    currency: String,
    status: String (enum: pending, paid, failed),
    createdAt: Date
  },
  
  // Personal Information
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  dateOfBirth: Date,
  
  // Address
  addressLine1: String,
  addressLine2: String,
  city: String,
  state: String,
  pincode: String,
  country: String,
  
  // KYC
  identityProofType: String,
  identityProofNumber: String,
  identityProofImage: String,
  addressProofImage: String,
  
  // Business
  businessName: String,
  businessType: String,
  gstNumber: String,
  panNumber: String,
  gstImage: String,
  panImage: String,
  
  // Banking
  accountHolderName: String,
  accountNumber: String,
  ifscCode: String,
  bankName: String,
  cancelledCheckImage: String,
  
  // Consents
  termsAccepted: Boolean,
  privacyAccepted: Boolean,
  dataProcessingAccepted: Boolean,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### **SubscriptionPlan Model**
```javascript
{
  // Basic Info
  name: String (unique),
  description: String,
  price: Number,
  currency: String (default: "INR"),
  billingCycle: String (enum: monthly, quarterly, yearly),
  
  // Features
  features: [
    {
      name: String,
      description: String,
      limit: Number
    }
  ],
  
  // Limits & Quotas
  maxProducts: Number,
  maxOrders: Number,
  maxCategories: Number,
  maxBulkPricingTiers: Number,
  
  // Capabilities
  includedCapabilities: [String],
  excludedCapabilities: [String],
  
  // Status
  isActive: Boolean,
  isFree: Boolean,
  isRecommended: Boolean,
  
  // Display
  displayOrder: Number,
  badgeText: String,
  badgeColor: String,
  
  // Trial & Discounts
  trialDays: Number,
  setupFee: Number,
  discountPercentage: Number,
  
  // Support
  supportLevel: String (enum: email, priority, dedicated),
  
  // Metadata
  tags: [String],
  metadata: Mixed,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### **SellerProfile Model**
```javascript
{
  userId: ObjectId (ref: User),
  applicationId: ObjectId (ref: SellerApplication),
  currentPlanId: ObjectId (ref: SubscriptionPlan),
  
  // Status
  isActive: Boolean,
  
  // Plan Dates (Legacy - use SellerApplication fields)
  planActivatedAt: Date,
  planExpiresAt: Date,
  
  // Permissions
  permissions: {
    grantedCapabilities: [String],
    deniedCapabilities: [String]
  },
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🎨 FRONTEND COMPONENTS

### **SellerWizardV2.jsx**
- **Path**: `/client/src/pages/Seller/SellerWizardV2.jsx`
- **Purpose**: Multi-step seller onboarding wizard
- **Steps**:
  - Step 0: Plan Selection
  - Step 1: Personal Information
  - Step 2: Address
  - Step 3: KYC
  - Step 4: Business
  - Step 5: Banking
  - Step 6: Consents & Review
- **Features**:
  - Draft auto-save
  - Plan locking after submission
  - Form validation
  - File uploads

### **SellerDashboard.jsx**
- **Path**: `/client/src/pages/Seller/SellerDashboard.jsx`
- **Purpose**: Seller dashboard with plan management
- **Features**:
  - Display current plan
  - Show expiry date and days remaining
  - Status badges (Active, Expiring, Grace Period, Expired)
  - Warning banners
  - Capabilities list
  - Plan features
  - Renewal modal
  - Upgrade modal
  - Quick actions

### **SubscriptionManagement.jsx**
- **Path**: `/client/src/pages/Admin/SubscriptionManagement.jsx`
- **Purpose**: Admin panel for subscription management
- **Tabs**:
  - Plans: Create, edit, delete, toggle plans
  - Subscriptions: View seller applications, approve/reject
- **Features**:
  - Plan CRUD operations
  - Application list with filtering
  - Application detail modal
  - Approve/reject functionality
  - Search and pagination

---

## 🔧 BACKEND CONTROLLERS

### **sellerApplicationControllerV2.js**
- **saveDraftApplication**: Save draft application
- **submitApplication**: Submit application for review
- **getMyApplication**: Get current user's application
- **getSellerApplications**: Get all applications (admin)
- **getApplicationById**: Get specific application (admin)
- **approveApplication**: Approve application (admin)
- **rejectApplication**: Reject application (admin)
- **retryPayment**: Retry failed payment
- **renewPlan**: Renew current plan
- **upgradePlan**: Upgrade to different plan
- **getAvailablePlans**: Get all active plans

### **paymentWebhookController.js**
- **handleRazorpayWebhook**: Handle successful payment
- **handlePaymentFailure**: Handle failed payment

### **subscriptionPlanController.js**
- **createSubscriptionPlan**: Create new plan (admin)
- **getSubscriptionPlans**: Get all plans (admin)
- **getActiveSubscriptionPlans**: Get active plans (public)
- **getPlanById**: Get plan by ID (public)
- **updateSubscriptionPlan**: Update plan (admin)
- **deleteSubscriptionPlan**: Delete plan (admin)
- **togglePlanStatus**: Toggle plan active/inactive (admin)

---

## 🔄 MIDDLEWARE & JOBS

### **Plan Expiry Check Middleware**
- **File**: `/jobs/planExpiryCheckJob.js`
- **Function**: `checkPlanExpiry`
- **Runs**: On every seller request
- **Actions**:
  - Check plan expiry date
  - Update plan status
  - Auto-fallback to Free Plan if grace period ended
  - Update user capabilities

### **CRON Job Scheduler**
- **File**: `/jobs/schedulePlanExpiryJob.js`
- **Function**: `startPlanExpiryJob`
- **Schedule**: Daily at 00:00 (midnight)
- **Actions**:
  - Find expired applications
  - Check grace period
  - Auto-fallback to Free Plan
  - Update user capabilities
  - Log audit events

---

## ⚠️ ERROR HANDLING

### **Common Errors**

#### **Plan Not Found**
```
Status: 404
{
  success: false,
  message: "Subscription plan not found"
}
```

#### **Application Not Found**
```
Status: 404
{
  success: false,
  message: "Application not found"
}
```

#### **Unauthorized**
```
Status: 403
{
  success: false,
  message: "Unauthorized"
}
```

#### **Invalid Status**
```
Status: 400
{
  success: false,
  message: "Application cannot be submitted in current status"
}
```

#### **Missing Fields**
```
Status: 400
{
  success: false,
  message: "Please fill all required fields before submitting",
  missingFields: ["firstName", "email", ...]
}
```

#### **Payment Service Not Configured**
```
Status: 503
{
  success: false,
  message: "Payment service not configured"
}
```

---

## 🧪 TESTING GUIDE

### **Unit Tests**
```bash
# Test plan creation
npm test -- tests/subscription.test.js

# Test application workflow
npm test -- tests/application.test.js

# Test payment webhook
npm test -- tests/webhook.test.js
```

### **Integration Tests**
```bash
# Full flow test
npm test -- tests/subscription.integration.test.js
```

### **Manual Testing Scenarios**

#### **Scenario 1: Free Plan Approval**
1. Create seller application with Free Plan
2. Admin approves
3. Verify:
   - ✅ planStartDate is set
   - ✅ planExpiryDate is set (30 days from now)
   - ✅ gracePeriodEndDate is set (60 days from now)
   - ✅ planStatus = "active"
   - ✅ Seller activated immediately
   - ✅ Dashboard shows plan info

#### **Scenario 2: Paid Plan Approval & Payment**
1. Create seller application with Paid Plan
2. Admin approves
3. Verify:
   - ✅ Plan dates are set
   - ✅ Razorpay order created
   - ✅ Status = "approved_pending_payment"
4. Complete payment
5. Verify:
   - ✅ Webhook updates SellerApplication
   - ✅ Status = "active"
   - ✅ Seller activated
   - ✅ Dashboard shows plan info

#### **Scenario 3: Plan Renewal**
1. Seller with active plan clicks "Renew"
2. Renewal modal opens
3. Seller confirms
4. Verify:
   - ✅ planExpiryDate extended by 30 days
   - ✅ planStatus = "active"
   - ✅ renewalHistory logged

#### **Scenario 4: Plan Upgrade**
1. Seller with Free Plan clicks "Upgrade"
2. Upgrade modal opens
3. Seller selects Paid Plan
4. Verify:
   - ✅ Razorpay order created
   - ✅ User redirected to checkout
   - ✅ After payment: Plan switched
   - ✅ Capabilities updated

#### **Scenario 5: Auto-Fallback**
1. Create seller with plan expiring in 1 day
2. Wait for expiry
3. Verify:
   - ✅ Dashboard shows "Expiring Soon" (days 24-30)
   - ✅ Dashboard shows "Grace Period" (days 31-60)
4. Wait for grace period to end
5. CRON job runs
6. Verify:
   - ✅ Plan switched to Free Plan
   - ✅ planStatus = "expired"
   - ✅ Capabilities updated
   - ✅ renewalHistory logged

---

## 🔍 TROUBLESHOOTING

### **Issue: Plan not showing in admin table**
**Solution**:
- Check if plan exists in database
- Verify selectedPlanId is populated
- Check browser console for API errors
- Check server logs for backend errors

### **Issue: Plan dates not set**
**Solution**:
- Verify approveApplication is setting dates
- Check database for planStartDate, planExpiryDate
- Verify webhook is updating SellerApplication

### **Issue: Seller dashboard not showing expiry**
**Solution**:
- Verify getMyApplication returns planExpiryDate
- Check browser console for API response
- Verify SellerApplication has plan dates

### **Issue: Renewal/Upgrade not working**
**Solution**:
- Verify application status is "active"
- Check if Razorpay is configured
- Verify plan exists
- Check server logs for errors

### **Issue: CRON job not running**
**Solution**:
- Verify node-cron is installed
- Check server logs for CRON initialization
- Verify system time is correct
- Check database for expired applications

---

## ✅ VERIFICATION CHECKLIST

- [ ] All plan dates set on approval
- [ ] getMyApplication returns all fields
- [ ] Webhook updates both models
- [ ] Admin table displays plan correctly
- [ ] Renewal works for free plans
- [ ] Renewal works for paid plans
- [ ] Upgrade works for free plans
- [ ] Upgrade works for paid plans
- [ ] CRON job runs daily
- [ ] Auto-fallback works correctly
- [ ] Plan expiry middleware works
- [ ] Dashboard displays expiry info
- [ ] Status badges display correctly
- [ ] Warning banners show correctly
- [ ] Capabilities updated after plan change

---

## 🚀 DEPLOYMENT CHECKLIST

- [ ] Install dependencies: `npm install node-cron`
- [ ] Set Razorpay credentials in .env
- [ ] Run seed script: `node scripts/seedRbacData.js`
- [ ] Restart backend server
- [ ] Test complete flow
- [ ] Monitor logs for errors
- [ ] Verify CRON job starts
- [ ] Test renewal/upgrade
- [ ] Verify webhook works
- [ ] Check database for plan dates

---

**Status**: ✅ PRODUCTION READY  
**Last Updated**: December 7, 2025

