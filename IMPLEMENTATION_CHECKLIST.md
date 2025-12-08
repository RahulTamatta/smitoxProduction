# ✅ SUBSCRIPTION MANAGEMENT - IMPLEMENTATION CHECKLIST

**Status**: 🚨 **CRITICAL MISSING FEATURE IDENTIFIED**  
**Date**: December 7, 2025

---

## 📋 REQUIREMENTS VERIFICATION

### **A) SCHEMAS** 

#### ✅ SubscriptionPlan Model
- [x] name, description, price, currency="INR"
- [x] billingCycle (monthly|quarterly|yearly)
- [x] isFree, isActive
- [x] features[], includedCapabilities[], excludedCapabilities[]
- [x] graceDays (default 30)
- [x] displayOrder
- [x] createdAt, updatedAt

**Status**: ✅ COMPLETE

---

#### ⚠️ SellerApplication Model
- [x] userId, status enum
- [x] lockPlan, submittedAt, reviewedBy, reviewedAt, reviewNotes
- [x] selectedPlanId (ref)
- [ ] **selectedPlanSnapshot** ❌ MISSING - CRITICAL
  - Should store: { _id, name, price, currency, billingCycle, isFree, includedCapabilities, excludedCapabilities, version }
  - Purpose: Immutable snapshot to prevent "N/A" when plan is deleted/changed
- [x] planStartDate, planExpiryDate, gracePeriodEndDate
- [x] renewalHistory with type enum
- [x] payment object with provider, orderId, paymentId, amount, currency, status
- [x] KYC fields

**Status**: ⚠️ **MISSING selectedPlanSnapshot** - MUST ADD

---

#### ✅ SellerProfile Model
- [x] userId (unique), applicationId, currentPlanId
- [x] isActive
- [x] permissions { grantedCapabilities[], deniedCapabilities[] }
- [x] planActivatedAt, planExpiresAt (legacy mirrors)

**Status**: ✅ COMPLETE

---

### **B) API ENDPOINTS**

#### ✅ Public Endpoints
- [x] GET /api/v1/subscription-plans/active
- [x] GET /api/v1/subscription-plans/:id

**Status**: ✅ COMPLETE

---

#### ⚠️ Seller Endpoints
- [x] POST /api/v1/sellers/applications/apply (save draft)
- [x] POST /api/v1/sellers/applications/submit
- [x] GET /api/v1/sellers/applications/my-application
- [x] POST /api/v1/sellers/renew-plan
- [x] POST /api/v1/sellers/upgrade-plan
- [x] GET /api/v1/sellers/available-plans
- [x] POST /api/v1/sellers/applications/:id/retry-payment

**Status**: ✅ COMPLETE

**Issue**: Response doesn't include selectedPlanSnapshot - need to update

---

#### ✅ Admin Endpoints
- [x] GET /api/v1/sellers/applications
- [x] GET /api/v1/sellers/applications/:id
- [x] POST /api/v1/sellers/applications/:id/approve
- [x] POST /api/v1/sellers/applications/:id/reject
- [x] CRUD Plans (POST, GET, PATCH, DELETE, PATCH toggle)

**Status**: ✅ COMPLETE

---

#### ✅ Webhook Endpoints
- [x] POST /api/v1/webhooks/payments/razorpay/success
- [x] POST /api/v1/webhooks/payments/razorpay/failure

**Status**: ✅ COMPLETE

---

### **C) CONTROLLER BEHAVIORS**

#### ✅ Approve Application
- [x] Sets planStartDate = now
- [x] Sets planExpiryDate = add by billingCycle
- [x] Sets gracePeriodEndDate = addDays(expiry, graceDays)
- [x] Writes initial renewalHistory
- [x] Free → active immediately
- [x] Paid → approved_pending_payment + create order

**Status**: ✅ COMPLETE

**Issue**: Doesn't create selectedPlanSnapshot

---

#### ✅ Webhook Success
- [x] Verify signature
- [x] Idempotency guard by paymentId
- [x] Set payment.status = paid
- [x] Set status = active
- [x] Update SellerProfile.currentPlanId & permissions
- [x] Rotate JWT (tokenVersion++)

**Status**: ✅ COMPLETE

**Issue**: Doesn't use selectedPlanSnapshot

---

#### ✅ getMyApplication
- [x] Return full plan dates
- [x] Return payment info
- [x] Derive planStatus

**Status**: ⚠️ **MISSING selectedPlanSnapshot in response**

---

#### ✅ Renewal/Upgrade
- [x] Paid flows create orders
- [x] Webhook success extends expiry or switches plan
- [x] Log renewalHistory with prorationAmount

**Status**: ✅ COMPLETE

**Issue**: Doesn't update selectedPlanSnapshot on upgrade

---

#### ✅ Daily Job
- [x] Scan expired+graceElapsed
- [x] Auto-fallback to Free
- [x] Update capabilities
- [x] Log audit + history

**Status**: ✅ COMPLETE

---

### **D) MIDDLEWARE**

#### ✅ planStatusDerive
- [x] On seller routes, derive status from dates
- [x] Optionally persist to avoid drift

**Status**: ✅ COMPLETE

---

#### ✅ capabilityGuard
- [x] Enforce RBAC from profile permissions snapshot

**Status**: ✅ COMPLETE

---

#### ✅ tokenRefresh
- [x] On capability change

**Status**: ✅ COMPLETE

---

### **E) INDEXES**

#### ✅ Applications
- [x] { userId, status, updatedAt }
- [x] { status, createdAt }
- [x] { selectedPlanId }
- [x] { payment.orderId unique, sparse }
- [x] { payment.paymentId unique, sparse }

**Status**: ✅ COMPLETE

---

#### ✅ Profiles
- [x] { userId unique }
- [x] { currentPlanId }

**Status**: ✅ COMPLETE

---

#### ✅ Plans
- [x] { isActive, displayOrder }
- [x] { name unique }

**Status**: ✅ COMPLETE

---

### **F) FRONTEND**

#### ✅ Plans Gallery
- [x] Card: name, price, billingCycle, features, badge
- [x] "Select Plan" → starts KYC wizard

**Status**: ✅ COMPLETE

---

#### ✅ KYC Wizard
- [x] 6 steps, draft autosave
- [x] lockPlan post-submit

**Status**: ✅ COMPLETE

---

#### ✅ Seller Dashboard
- [x] Current plan name
- [x] Status chip (Active / Expiring Soon / Grace Period / Expired)
- [x] Days remaining, expiry date
- [x] Capabilities list
- [x] Buttons: Renew, Upgrade, Resume Payment

**Status**: ⚠️ **Uses selectedPlanId instead of selectedPlanSnapshot**

---

#### ✅ Admin Plans
- [x] List, search, create/edit
- [x] CRUD operations

**Status**: ✅ COMPLETE

---

#### ✅ Admin Applications
- [x] Table columns: Applicant, Plan, Status, SubmittedAt, Actions
- [x] Detail modal: KYC data, plan info, history, approve/reject

**Status**: ⚠️ **Shows "N/A" if plan deleted - should use selectedPlanSnapshot**

---

### **G) SECURITY & COMPLIANCE**

#### ✅ Validation
- [x] Input validation server-side
- [x] Strip unknown fields

**Status**: ✅ COMPLETE

---

#### ✅ Plan Locking
- [x] Enforce lockPlan after submit

**Status**: ✅ COMPLETE

---

#### ✅ Webhook Security
- [x] Verify signatures pre-DB

**Status**: ✅ COMPLETE

---

#### ✅ Rate Limiting
- [x] Rate limit payment/admin endpoints

**Status**: ✅ COMPLETE

---

#### ✅ Audit Logging
- [x] Every state change logged

**Status**: ✅ COMPLETE

---

### **H) TESTING**

#### ✅ Test Scenarios
- [x] Free approval path end-to-end
- [x] Paid approval → webhook success/failure paths
- [x] Duplicate webhook replay
- [x] Renew & upgrade with expiry adjustments
- [x] Auto-fallback on grace end
- [ ] **Deleted plan still visible in admin/user via snapshot** ❌ NOT TESTED

**Status**: ⚠️ **Missing test for deleted plan scenario**

---

## 🚨 CRITICAL MISSING FEATURE: selectedPlanSnapshot

### **Why It's Critical**
The prompt explicitly states:
> "Admin tables never show 'N/A' if snapshot exists (use snapshot-first)."

Currently, if a plan is deleted:
- Admin table shows "N/A" ❌
- Seller dashboard can't display plan info ❌
- Renewal/upgrade buttons might break ❌

### **What Needs to Be Added**

#### 1. **Update SellerApplication Model**
```javascript
selectedPlanSnapshot: {
  _id: ObjectId,
  name: String,
  price: Number,
  currency: String,
  billingCycle: String,
  isFree: Boolean,
  includedCapabilities: [String],
  excludedCapabilities: [String],
  version: Number,  // Track plan version
  capturedAt: Date
}
```

#### 2. **Update saveDraftApplication**
```javascript
// Capture plan snapshot when saving draft
const planSnapshot = {
  _id: plan._id,
  name: plan.name,
  price: plan.price,
  currency: plan.currency,
  billingCycle: plan.billingCycle,
  isFree: plan.isFree,
  includedCapabilities: plan.includedCapabilities,
  excludedCapabilities: plan.excludedCapabilities,
  version: plan.version || 1,
  capturedAt: new Date()
};

application.selectedPlanSnapshot = planSnapshot;
```

#### 3. **Update submitApplication**
```javascript
// Ensure snapshot is captured at submission
if (!application.selectedPlanSnapshot) {
  application.selectedPlanSnapshot = {
    _id: plan._id,
    name: plan.name,
    price: plan.price,
    currency: plan.currency,
    billingCycle: plan.billingCycle,
    isFree: plan.isFree,
    includedCapabilities: plan.includedCapabilities,
    excludedCapabilities: plan.excludedCapabilities,
    version: plan.version || 1,
    capturedAt: new Date()
  };
}
```

#### 4. **Update approveApplication**
```javascript
// Ensure snapshot is captured at approval
if (!application.selectedPlanSnapshot) {
  application.selectedPlanSnapshot = {
    _id: plan._id,
    name: plan.name,
    price: plan.price,
    currency: plan.currency,
    billingCycle: plan.billingCycle,
    isFree: plan.isFree,
    includedCapabilities: plan.includedCapabilities,
    excludedCapabilities: plan.excludedCapabilities,
    version: plan.version || 1,
    capturedAt: new Date()
  };
}
```

#### 5. **Update getMyApplication Response**
```javascript
res.status(200).send({
  success: true,
  application: {
    // ... other fields ...
    selectedPlan: application.selectedPlanId,  // Live reference
    selectedPlanSnapshot: application.selectedPlanSnapshot,  // Immutable snapshot
    // ... rest of fields ...
  },
});
```

#### 6. **Update Admin Table Display**
```javascript
// Use snapshot-first approach
{app.selectedPlanSnapshot 
  ? app.selectedPlanSnapshot.name 
  : (app.selectedPlanId && typeof app.selectedPlanId === 'object'
      ? app.selectedPlanId.name
      : "No Plan")}
```

#### 7. **Update Seller Dashboard**
```javascript
// Use snapshot for display
const planName = application.selectedPlanSnapshot?.name || 
                 application.selectedPlan?.name || 
                 "Unknown Plan";
```

#### 8. **Update renewalHistory**
```javascript
// When logging renewal, include snapshot
application.renewalHistory.push({
  renewalDate: new Date(),
  previousPlanId: oldPlanId,
  newPlanId: newPlan._id,
  newPlanSnapshot: {
    _id: newPlan._id,
    name: newPlan.name,
    price: newPlan.price,
    // ... other fields ...
  },
  renewalType: "renewal",
  prorationAmount: calculateProration()
});
```

---

## 📊 IMPLEMENTATION PRIORITY

### **CRITICAL (Must Do)**
1. ❌ Add selectedPlanSnapshot to SellerApplication model
2. ❌ Capture snapshot in saveDraftApplication
3. ❌ Capture snapshot in submitApplication
4. ❌ Capture snapshot in approveApplication
5. ❌ Return snapshot in getMyApplication
6. ❌ Use snapshot in admin table display
7. ❌ Use snapshot in seller dashboard

### **HIGH (Should Do)**
8. ⚠️ Update renewalHistory to include snapshot
9. ⚠️ Update upgrade/renewal to capture new plan snapshot
10. ⚠️ Add migration script to backfill snapshots

### **MEDIUM (Nice to Have)**
11. ⚠️ Add plan version tracking
12. ⚠️ Add snapshot comparison in audit logs
13. ⚠️ Add snapshot validation tests

---

## ✅ ACCEPTANCE CRITERIA

- [ ] selectedPlanSnapshot field exists in SellerApplication model
- [ ] Snapshot captured at draft save
- [ ] Snapshot captured at submission
- [ ] Snapshot captured at approval
- [ ] Snapshot returned in all API responses
- [ ] Admin table uses snapshot-first approach
- [ ] Seller dashboard uses snapshot-first approach
- [ ] Deleted plan still shows name in admin table
- [ ] Deleted plan still shows name in seller dashboard
- [ ] All tests pass including deleted plan scenario

---

## 🚀 NEXT STEPS

1. Update SellerApplication model to add selectedPlanSnapshot
2. Update all controllers to capture snapshot
3. Update all API responses to include snapshot
4. Update frontend to use snapshot-first approach
5. Create migration script to backfill existing applications
6. Add tests for deleted plan scenario
7. Deploy and verify

**Estimated Time**: 2-3 hours  
**Risk Level**: LOW (backward compatible, snapshot is optional)

