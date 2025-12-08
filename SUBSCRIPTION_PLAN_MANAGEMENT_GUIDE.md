# Subscription Plan Management System - Implementation Guide

## 🎯 Overview

This guide documents the new subscription plan management system with plan expiry tracking, renewal flow, and permission-based capability display for sellers.

## ✅ Completed Features

### 1. **Seed Script - Free Plan Only**
- **File**: `/scripts/seedRbacData.js`
- **Changes**:
  - Deleted all existing plans (Starter, Professional, Enterprise)
  - Kept only **Free Plan** as default
  - Free Plan features:
    - ₹0 price
    - 50 products max
    - 5 categories max
    - Email support
    - Basic capabilities: `products:read`, `products:write`, `orders:read`

### 2. **Model Updates - Plan Expiry Tracking**
- **File**: `/models/sellerApplicationModel.js`
- **New Fields Added**:
  ```javascript
  planStartDate: Date          // When plan was activated
  planExpiryDate: Date         // 30 days from start
  planStatus: String           // active | expiring_soon | expired | grace_period
  gracePeriodEndDate: Date     // 30 days after expiry
  renewalHistory: Array        // Track all renewals/upgrades
  ```

### 3. **Enhanced Seller Dashboard**
- **File**: `/client/src/pages/Seller/SellerDashboard.jsx`
- **Features**:
  - Display current plan with expiry date
  - Show days remaining until expiry
  - Display plan status badge (Active, Expiring Soon, Grace Period, Expired)
  - Show all capabilities allowed by admin
  - Show plan features and limits
  - Renewal and upgrade buttons (UI ready)

### 4. **Plan Status Tracking**
- **Active**: Plan is valid and all features available
- **Expiring Soon**: Less than 7 days remaining (warning banner)
- **Grace Period**: Expired but within 30-day grace period (warning banner)
- **Expired**: Grace period ended, fallback to Free Plan (danger banner)

## 📋 Remaining Implementation

### Step 1: Renewal & Upgrade API Endpoints
**Location**: `/controllers/sellerApplicationControllerV2.js`

```javascript
// Renew current plan
POST /api/v1/sellers/:id/renew
- Extend planExpiryDate by 30 days
- Update planStatus to "active"
- Log renewal in renewalHistory

// Upgrade to different plan
POST /api/v1/sellers/:id/upgrade
- Change selectedPlanId
- Set new planExpiryDate
- Update planStatus to "active"
- Log upgrade in renewalHistory with type: "upgrade"
```

### Step 2: Plan Expiry Check Middleware
**Location**: `/middlewares/rbacMiddleware.js`

```javascript
// Check plan expiry on every request
export const checkPlanExpiry = async (req, res, next) => {
  // Get seller application
  // Check planExpiryDate
  // If expired:
  //   - If within grace period: set planStatus = "grace_period"
  //   - If past grace period: fallback to Free Plan
  // Update req.user.capabilities based on current plan
  // Continue to next middleware
}
```

### Step 3: Capability Filtering
**Location**: `/client/src/pages/Seller/SellerDashboard.jsx`

```javascript
// Show only capabilities allowed by admin
- Display includedCapabilities from current plan
- Hide excludedCapabilities
- Show feature limits (maxProducts, maxCategories, etc.)
- Compare with actual usage
```

### Step 4: Admin Plan Management
**Location**: `/client/src/pages/Admin/SubscriptionManagement.jsx`

```javascript
// Already implemented:
- Create new plans
- Edit plans
- Delete plans
- Toggle plan status (active/inactive)

// Features shown:
- Plan name, price, billing cycle
- Included/excluded capabilities
- Plan features and limits
- Display order and badges
```

## 🔄 Plan Expiry Flow

### Scenario 1: Plan Expires (Paid Plan)
```
Day 1-23: Active (no warning)
Day 24-30: Expiring Soon (warning banner, 7 days left)
Day 31-60: Grace Period (warning banner, "renew to avoid losing access")
Day 61+: Expired (danger banner, "fallback to Free Plan")
```

### Scenario 2: Free Plan
```
- No expiry date
- Always active
- Can't be downgraded
- Can upgrade to paid plan anytime
```

### Scenario 3: Renewal
```
User clicks "Renew Subscription"
→ Shows available plans
→ User selects plan
→ Payment (if paid plan)
→ planExpiryDate extended by 30 days
→ planStatus = "active"
→ Renewal logged in renewalHistory
```

## 📊 Database Schema Changes

### SellerApplication Model
```javascript
{
  // ... existing fields ...
  selectedPlanId: ObjectId,
  planStartDate: Date,
  planExpiryDate: Date,
  planStatus: String,
  gracePeriodEndDate: Date,
  renewalHistory: [
    {
      renewalDate: Date,
      previousPlanId: ObjectId,
      newPlanId: ObjectId,
      renewalType: String // "renewal" | "upgrade" | "downgrade"
    }
  ]
}
```

## 🛠️ Implementation Checklist

- [x] Remove default plans, keep Free Plan only
- [x] Add expiry fields to SellerApplication model
- [x] Update seller dashboard to show expiry info
- [x] Display plan status badges
- [x] Show grace period warnings
- [ ] Create renewal API endpoint
- [ ] Create upgrade API endpoint
- [ ] Add plan expiry check middleware
- [ ] Filter capabilities in seller dashboard
- [ ] Add renewal history tracking
- [ ] Create renewal/upgrade payment flow
- [ ] Add admin plan creation UI
- [ ] Add plan capability toggle UI
- [ ] Create CRON job for auto-fallback to Free Plan

## 🔐 Security Considerations

1. **Capability Validation**: Always check capabilities from current plan, not user input
2. **Plan Ownership**: Verify seller owns the application before allowing renewal/upgrade
3. **Payment Verification**: Confirm payment before activating paid plans
4. **Grace Period Enforcement**: Enforce grace period limits via middleware
5. **Audit Logging**: Log all plan changes for compliance

## 📝 API Endpoints (To Be Implemented)

### Renewal
```
POST /api/v1/sellers/:id/renew
Headers: Authorization: token
Body: { planId: ObjectId }
Response: { success: true, application: {...}, newToken: "..." }
```

### Upgrade
```
POST /api/v1/sellers/:id/upgrade
Headers: Authorization: token
Body: { planId: ObjectId }
Response: { success: true, application: {...}, paymentRequired: boolean }
```

### Get Available Plans
```
GET /api/v1/subscription-plans/active
Response: { success: true, plans: [...] }
```

### Get Plan Details
```
GET /api/v1/subscription-plans/:id
Response: { success: true, plan: {...} }
```

## 🎨 UI Components

### Seller Dashboard
- ✅ Plan status card with expiry date
- ✅ Days remaining counter
- ✅ Status badges (Active, Expiring, Grace Period, Expired)
- ✅ Warning banners for expiry/grace period
- ✅ Capabilities list (filtered by plan)
- ✅ Plan features display
- ⏳ Renew button (functional)
- ⏳ Upgrade button (functional)

### Admin Dashboard
- ✅ Plan list with status
- ✅ Create plan form
- ✅ Edit plan form
- ✅ Delete plan button
- ✅ Toggle plan status
- ✅ Capability selection (included/excluded)
- ⏳ View seller applications with plan info
- ⏳ Approve/reject applications

## 🚀 Next Steps

1. **Implement Renewal Endpoint**: Allow sellers to renew their plan
2. **Implement Upgrade Endpoint**: Allow sellers to upgrade to better plan
3. **Add Expiry Middleware**: Check and update plan status on every request
4. **Create Payment Flow**: Integrate with Razorpay for paid plan renewals
5. **Add CRON Job**: Auto-fallback to Free Plan after grace period
6. **Create Admin UI**: Plan creation and management interface
7. **Add Notifications**: Email alerts for plan expiry warnings

## 📞 Support

For questions or issues, refer to:
- `/SUBSCRIPTION_MANAGEMENT_GUIDE.md` - Original implementation guide
- `/SUBSCRIPTION_MANAGEMENT_UPDATE.md` - Previous updates
- Backend: `/controllers/sellerApplicationControllerV2.js`
- Frontend: `/client/src/pages/Seller/SellerDashboard.jsx`
