# Complete Seller Onboarding Flow - Implementation Spec

## Overview
This document outlines the complete seller onboarding flow with subscription management, payment integration, and auto-renewal logic.

---

## 1. Application Status States

```
draft → submitted → under_review → approved_pending_payment (paid) / approved (free)
                                  ↓
                            active (after payment or immediate for free)
                                  ↓
                            expired (after planExpiresAt + 30 days)
                                  ↓
                            fallback to Free plan

OR

submitted → rejected (with reason) → can reapply (clears payment object)
```

---

## 2. Key Rules

### Plan Selection & Locking
- User selects plan in wizard (no payment yet)
- On submit: `lockPlan = true` (prevents plan change)
- Plan unlocked only if: status = draft OR status = rejected

### Payment Flow
- **Free Plans**: Immediate activation on approval
- **Paid Plans**: Payment only after Super Admin approval
  - Create payment order on approval
  - Set status = `approved_pending_payment`
  - Return checkoutInfo to user
  - Webhook activation after payment success

### Rejection & Reapply
- Admin rejects with reason
- User sees reason in UI
- Can edit and resubmit
- Previous payment object cleared

### Auto-Fallback to Free Plan
- Runs daily via CRON job
- If `planExpiresAt <= now` and no renewal:
  - Grace period: 30 days
  - After 30 days: Switch to Free plan
  - Update permissions, increment tokenVersion
  - Send email notification

---

## 3. Database Schema Updates

### SellerApplication
```javascript
{
  _id,
  userId,
  selectedPlanId,
  status: 'draft' | 'submitted' | 'under_review' | 'approved_pending_payment' | 'approved_payment_failed' | 'approved' | 'rejected' | 'active',
  submittedAt,
  reviewedBy,
  reviewedAt,
  reviewNotes,
  lockPlan: Boolean,
  payment: {
    provider: 'razorpay' | 'stripe',
    orderId,
    amount,
    currency: 'INR',
    status: 'pending' | 'paid' | 'failed',
    createdAt
  },
  // ... existing fields
  createdAt,
  updatedAt
}
```

### SellerProfile
```javascript
{
  userId,
  applicationId,
  currentPlanId,
  planActivatedAt,
  planExpiresAt,
  isActive: Boolean,
  autoRenew: Boolean,
  paymentMethodId,
  permissions: {
    grantedCapabilities: [],
    deniedCapabilities: []
  },
  // ... existing fields
  createdAt,
  updatedAt
}
```

---

## 4. API Endpoints

### Applicant Endpoints

#### POST /api/v1/sellers/apply
Save draft application
```json
{
  "selectedPlanId": "plan_id",
  "firstName": "...",
  "lastName": "...",
  // ... other fields
}
```
Response: `{ success: true, applicationId, status: 'draft' }`

#### POST /api/v1/sellers/submit
Finalize and submit application (locks plan)
```json
{
  "applicationId": "app_id"
}
```
Response: `{ success: true, status: 'submitted', submittedAt, lockPlan: true }`

#### GET /api/v1/sellers/my-application
Get user's application status and payment info
Response:
```json
{
  "success": true,
  "application": {
    "status": "approved_pending_payment",
    "selectedPlan": { "name": "Pro", "price": 499, "billingCycle": "monthly" },
    "payment": { "orderId": "...", "status": "pending" },
    "lockPlan": true,
    "reviewNotes": "...",
    "planActivatedAt": "...",
    "planExpiresAt": "..."
  }
}
```

#### GET /api/v1/subscription-plans/active
Public endpoint - get active plans for wizard
Response: `{ success: true, plans: [...] }`

#### GET /api/v1/payments/checkout-data?applicationId=...
Get checkout info for approved_pending_payment application
Response:
```json
{
  "success": true,
  "checkoutInfo": {
    "orderId": "...",
    "amount": 499,
    "currency": "INR",
    "planName": "Pro",
    "applicationId": "..."
  }
}
```

#### POST /api/v1/sellers/applications/:id/retry-payment
Create new payment order if previous failed
Response: `{ success: true, checkoutInfo: {...} }`

### Super Admin Endpoints

#### GET /api/v1/sellers/applications?status=&page=&limit=&search=
List applications with filtering
Query params:
- `status`: submitted, under_review, approved, rejected
- `page`: 1
- `limit`: 10
- `search`: applicant name/email/business

Response:
```json
{
  "success": true,
  "applications": [...],
  "pagination": { "page": 1, "limit": 10, "total": 50, "pages": 5 }
}
```

#### GET /api/v1/sellers/applications/:id
Get single application details

#### POST /api/v1/sellers/applications/:id/approve
Approve application
```json
{
  "reviewerNotes": "Approved"
}
```

**If Free Plan:**
- Create SellerProfile with isActive=true
- Merge plan capabilities
- Increment tokenVersion
- Return: `{ success: true, token, seller }`

**If Paid Plan:**
- Create SellerProfile with isActive=false
- Create payment order
- Set status = approved_pending_payment
- Return: `{ success: true, checkoutInfo, applicationId }`

#### POST /api/v1/sellers/applications/:id/reject
Reject application
```json
{
  "reason": "Documents not clear"
}
```
Response: `{ success: true, status: 'rejected', reviewNotes }`

### Payment Endpoints

#### POST /api/v1/payments/order (internal)
Create payment order for subscription
```json
{
  "type": "SUBSCRIPTION_PLAN",
  "itemRefId": "plan_id",
  "amount": 499,
  "currency": "INR",
  "buyerId": "user_id",
  "metadata": { "applicationId": "app_id" }
}
```

#### POST /api/v1/payments/webhook
Payment provider webhook (Razorpay/Stripe)
```json
{
  "orderId": "...",
  "status": "paid",
  "provider": "razorpay",
  "signature": "..."
}
```

On success:
- Verify signature
- Find SellerApplication by orderId
- Set payment.status = 'paid'
- Create SellerProfile with isActive=true
- Merge plan capabilities
- Set planActivatedAt, planExpiresAt
- Increment tokenVersion
- Return refreshed JWT

---

## 5. Frontend Screens

### Screen A: Plan Selection (Step 0)
- Display active plans as cards
- Show: Name, Price, Features, Select button
- On select: Set selectedPlanId, enable "Start Application"
- No payment shown

### Screen B: Multi-Step Form (Steps 1-6)
- Progress tracker at top
- Form fields from SellerApplication schema
- Buttons: Save Draft, Next, Back, Submit
- After submit: Show "Pending Review — Plan Change Locked"

### Screen C: Application Status Page
- Status badge (Submitted, Under Review, Approved — Pending Payment, Active, Rejected)
- If rejected: Show reason, "Edit & Reapply" button
- If approved_pending_payment: Show "Proceed to Payment" button
- If active: Show "Manage Subscription" (plan expires, autoRenew toggle)

### Screen D: Super Admin Applications List
- Tabs: Pending | Approved | Rejected
- Columns: Applicant | Plan | Submitted At | Status | Actions
- Actions: View | Approve | Reject
- Approve modal: Choose "Approve as Free" or "Approve and Create Payment"

### Screen E: Checkout Page (shared with cart)
- Single line-item: "Subscription — Plan Name"
- Price locked at approval
- Razorpay payment widget
- On success: Redirect to Seller Dashboard

### Screen F: Seller Dashboard
- Plan status card: "Active — Expires on [date]"
- AutoRenew toggle
- Invoicing history
- Current capabilities
- CTA: Upgrade/Renew

---

## 6. Backend Logic

### On Approve (Super Admin)

**Free Plan:**
```javascript
// Create SellerProfile
const profile = new SellerProfile({
  userId,
  applicationId,
  currentPlanId: plan._id,
  isActive: true,
  planActivatedAt: new Date(),
  planExpiresAt: null, // or computed based on plan
  permissions: {
    grantedCapabilities: plan.includedCapabilities,
    deniedCapabilities: plan.excludedCapabilities
  }
});
await profile.save();

// Update user
user.roleString = 'seller';
user.permissions = {
  grantedCapabilities: plan.includedCapabilities,
  deniedCapabilities: plan.excludedCapabilities
};
user.tokenVersion++;
await user.save();

// Update application
app.status = 'approved';
app.reviewedBy = adminId;
app.reviewedAt = new Date();
await app.save();

// Return new JWT
const token = generateToken(user);
return { success: true, token, seller: profile };
```

**Paid Plan:**
```javascript
// Create SellerProfile (inactive)
const profile = new SellerProfile({
  userId,
  applicationId,
  currentPlanId: plan._id,
  isActive: false,
  permissions: {
    grantedCapabilities: [],
    deniedCapabilities: []
  }
});
await profile.save();

// Create payment order
const order = await createPaymentOrder({
  type: 'SUBSCRIPTION_PLAN',
  itemRefId: plan._id,
  amount: plan.price,
  buyerId: userId,
  metadata: { applicationId: app._id }
});

// Update application
app.status = 'approved_pending_payment';
app.payment = {
  provider: 'razorpay',
  orderId: order.id,
  amount: plan.price,
  currency: 'INR',
  status: 'pending',
  createdAt: new Date()
};
app.reviewedBy = adminId;
app.reviewedAt = new Date();
await app.save();

return {
  success: true,
  checkoutInfo: {
    orderId: order.id,
    amount: plan.price,
    currency: 'INR',
    planName: plan.name,
    applicationId: app._id
  }
};
```

### On Payment Webhook

```javascript
// Verify signature
const isValid = verifyRazorpaySignature(signature);
if (!isValid) return { success: false };

// Find application
const app = await SellerApplication.findOne({ 'payment.orderId': orderId });
if (!app) return { success: false };

// Update payment
app.payment.status = 'paid';
app.status = 'active';
await app.save();

// Get plan
const plan = await SubscriptionPlan.findById(app.selectedPlanId);

// Update SellerProfile
const profile = await SellerProfile.findOne({ applicationId: app._id });
profile.isActive = true;
profile.planActivatedAt = new Date();
profile.planExpiresAt = addDays(new Date(), getDaysFromBillingCycle(plan.billingCycle));
profile.permissions = {
  grantedCapabilities: plan.includedCapabilities,
  deniedCapabilities: plan.excludedCapabilities
};
await profile.save();

// Update user
const user = await User.findById(app.userId);
user.roleString = 'seller';
user.permissions = profile.permissions;
user.tokenVersion++;
await user.save();

// Log audit
await logAuditEvent({
  actor: app.userId,
  action: 'payment_successful',
  resourceType: 'seller_application',
  severity: 'high'
});

return { success: true };
```

### Auto-Fallback CRON Job

```javascript
// Runs daily
async function checkPlanExpiry() {
  const now = new Date();
  const expiredProfiles = await SellerProfile.find({
    isActive: true,
    planExpiresAt: { $lte: now }
  });

  for (const profile of expiredProfiles) {
    const daysSinceExpiry = Math.floor((now - profile.planExpiresAt) / (1000 * 60 * 60 * 24));

    if (daysSinceExpiry >= 30) {
      // Fallback to Free plan
      const freePlan = await SubscriptionPlan.findOne({ isFree: true, isActive: true });
      
      profile.currentPlanId = freePlan._id;
      profile.planActivatedAt = new Date();
      profile.planExpiresAt = null;
      profile.permissions = {
        grantedCapabilities: freePlan.includedCapabilities,
        deniedCapabilities: freePlan.excludedCapabilities
      };
      await profile.save();

      // Update user
      const user = await User.findById(profile.userId);
      user.permissions = profile.permissions;
      user.tokenVersion++;
      await user.save();

      // Log audit
      await logAuditEvent({
        actor: null,
        action: 'auto_fallback_to_free',
        resourceType: 'seller_profile',
        severity: 'medium',
        description: `Seller ${profile.userId} auto-fallback to Free plan after expiry`
      });

      // Send email
      await sendEmail(user.email_id, 'Plan Expired', 'Your subscription has expired. You are now on the Free plan.');
    } else if (daysSinceExpiry >= 0) {
      // Send reminder emails
      if (daysSinceExpiry === 0) {
        // On expiry
        await sendEmail(user.email_id, 'Plan Expired Today', '...');
      } else if (daysSinceExpiry === -7) {
        // 7 days before
        await sendEmail(user.email_id, 'Plan Expires in 7 Days', '...');
      } else if (daysSinceExpiry === -1) {
        // 1 day before
        await sendEmail(user.email_id, 'Plan Expires Tomorrow', '...');
      }
    }
  }
}
```

---

## 7. Implementation Checklist

- [ ] Update SellerApplication model with new fields
- [ ] Update SellerProfile model with new fields
- [ ] Create POST /api/v1/sellers/apply endpoint
- [ ] Create POST /api/v1/sellers/submit endpoint
- [ ] Create GET /api/v1/sellers/my-application endpoint
- [ ] Create POST /api/v1/sellers/applications/:id/approve endpoint
- [ ] Create POST /api/v1/sellers/applications/:id/reject endpoint
- [ ] Create POST /api/v1/sellers/applications/:id/retry-payment endpoint
- [ ] Update payment webhook to activate seller
- [ ] Create CRON job for auto-fallback
- [ ] Create frontend: Plan selection screen
- [ ] Create frontend: Multi-step form with draft saving
- [ ] Create frontend: Application status page
- [ ] Create frontend: Admin applications list
- [ ] Create frontend: Admin approve/reject modal
- [ ] Create frontend: Seller dashboard subscription card
- [ ] Add tests for all flows
- [ ] Update documentation

---

## 8. Security Considerations

- [ ] Payment webhooks verify provider signature
- [ ] All sensitive actions logged to AuditLog
- [ ] Token versioning prevents old tokens from working
- [ ] Plan locked after submission prevents manipulation
- [ ] Super Admin approval required before payment
- [ ] Rejection reason stored for transparency

---

**Status**: Ready for implementation
**Last Updated**: December 4, 2025
