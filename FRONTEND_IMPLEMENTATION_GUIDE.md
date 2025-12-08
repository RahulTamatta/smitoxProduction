# Frontend Implementation Guide - Seller Onboarding Flow

## ✅ COMPLETED COMPONENTS

### 1. RBAC Helper (`client/src/helpers/rbacHelper.js`)
- `getUserCapabilities(auth)` - Extract user capabilities
- `hasCap(auth, capability)` - Check single capability
- `hasAny(auth, capabilities)` - Check if user has any capability
- `hasAll(auth, capabilities)` - Check if user has all capabilities
- `getVisibleMenuItems(auth, allMenuItems)` - Filter menu by capabilities
- `getVisibleSubMenu(auth, submenu)` - Filter submenu by capabilities
- `isSeller(auth)` - Check if user is seller
- `isSuperAdmin(auth)` - Check if user is super admin
- `isAdmin(auth)` - Check if user is admin
- `getUserRole(auth)` - Get user role string
- `needsTokenRefresh(auth, storedTokenVersion)` - Check token version

### 2. API Client (`client/src/services/sellerApi.js`)
- `saveDraftApplication(applicationData, token)` - Save draft
- `submitApplication(applicationId, token)` - Submit application
- `getMyApplication(token)` - Get user's application status
- `getActiveSubscriptionPlans()` - Get public plans
- `retryPayment(applicationId, token)` - Retry failed payment
- `getCheckoutData(applicationId, token)` - Get checkout info
- `getSellerApplications(filters, token)` - Admin: List applications
- `getApplicationById(applicationId, token)` - Admin: Get single application
- `approveApplication(applicationId, reviewerNotes, token)` - Admin: Approve
- `rejectApplication(applicationId, reason, token)` - Admin: Reject

### 3. Pages & Components

#### **SellerWizardV2** (`client/src/pages/Seller/SellerWizardV2.jsx`)
- Step 0: Plan selection (fetch from `/subscription-plans/active`)
- Steps 1-6: Multi-step form with all fields
- Draft saving: `POST /api/v1/sellers/apply`
- Submission: `POST /api/v1/sellers/submit` (locks plan)
- Plan locking: Prevents changes when status is submitted/under_review/approved_pending_payment
- Reapply after rejection: Clears payment object, allows plan change

**Features:**
- Progress tracker (Step X of 7)
- Error/success alerts
- File upload support
- Form validation
- Draft auto-save
- Plan selection UI with features list

#### **ApplicationStatus** (`client/src/pages/Seller/ApplicationStatus.jsx`)
- Fetch: `GET /api/v1/sellers/my-application`
- Status-specific UI:
  - **submitted/under_review**: Show "Under Review" message, plan locked
  - **approved_pending_payment**: Show "Proceed to Payment" button, fetch checkout data
  - **approved_payment_failed**: Show "Retry Payment" button
  - **rejected**: Show rejection reason, "Edit & Reapply" button
  - **approved**: Show "Go to Dashboard" button (free plan)
  - **active**: Show plan details, expiry date, "Go to Dashboard" button

**Features:**
- Polling for payment status (every 3 seconds)
- Timeline showing application progress
- Plan information display
- Payment info display
- Retry payment functionality
- Auto-redirect to dashboard on activation

#### **SellerApplications** (`client/src/pages/Admin/SellerApplications.jsx`)
- List applications with pagination, filtering, search
- Drawer panel showing full application details
- Approve modal: Choose free/paid, add notes
- Reject modal: Enter rejection reason
- Document links (identity, GST, PAN, etc.)

**Features:**
- Tabs: Pending | Approved | Rejected
- Search by name, email, business
- Pagination with page numbers
- Sorting by date
- Approve/Reject actions
- Full application details in drawer
- Document preview links

#### **SellerDashboard** (`client/src/pages/Seller/SellerDashboard.jsx`)
- Show current plan details
- Plan expiry date and days remaining
- Expiry warnings (7 days, expired)
- Current capabilities list
- Plan features display
- Quick action buttons (Products, Orders, Invoices, Support)
- Auto-refresh on token update

**Features:**
- Plan status card with expiry info
- Stat cards (capabilities count, plan price)
- Capabilities grid
- Features list
- Action buttons
- Responsive design

### 4. CSS Files
- `applicationStatus.css` - Status page styling
- `sellerApplications.css` - Admin list styling (drawer, modals, table)
- `sellerDashboard.css` - Dashboard styling

---

## 🔧 INTEGRATION STEPS

### Step 1: Update App.jsx Routes

Add these routes to your `client/src/App.jsx`:

```javascript
import SellerWizardV2 from "./pages/Seller/SellerWizardV2";
import ApplicationStatus from "./pages/Seller/ApplicationStatus";
import SellerDashboard from "./pages/Seller/SellerDashboard";
import SellerApplications from "./pages/Admin/SellerApplications";

// Inside your routes:
<Route path="/seller/apply" element={<SellerWizardV2 />} />
<Route path="/seller/status" element={<ApplicationStatus />} />
<Route path="/seller/dashboard" element={<SellerDashboard />} />
<Route path="/admin/sellers/applications" element={<SellerApplications />} />
```

### Step 2: Update Sidebar/Menu with RBAC

Update your `AdminMenu.jsx` or sidebar component:

```javascript
import { hasCap, getVisibleMenuItems } from "../../helpers/rbacHelper";

const menuItems = [
  {
    label: "Seller Applications",
    path: "/admin/sellers/applications",
    capability: "sellers:applications:read",
  },
  // ... other items
];

const visibleItems = getVisibleMenuItems(auth, menuItems);
```

### Step 3: Update Checkout Page

Modify your existing checkout page to support subscription items:

```javascript
// In CheckoutPage.jsx
const { state } = useLocation();

if (state?.type === "subscription") {
  // Handle subscription checkout
  const { checkoutInfo, applicationId } = state;
  // Show subscription item instead of cart items
}
```

### Step 4: Update Auth Context

Ensure your auth context includes `tokenVersion`:

```javascript
// In your auth context/store
const user = {
  // ... existing fields
  tokenVersion: response.user.tokenVersion,
  permissions: {
    grantedCapabilities: [],
    deniedCapabilities: [],
  },
};
```

### Step 5: Add Token Refresh Logic

After payment success or approval, refresh token:

```javascript
// In ApplicationStatus.jsx or after webhook
const refreshToken = async () => {
  try {
    const response = await axios.get("/api/v1/auth/me", {
      headers: { Authorization: auth?.token },
    });
    
    if (response.data.success) {
      setAuth({
        ...auth,
        user: response.data.user,
        token: response.data.token,
      });
    }
  } catch (err) {
    console.error("Token refresh failed:", err);
  }
};
```

---

## 📱 ROUTE STRUCTURE

```
/seller/apply                    → SellerWizardV2 (plan selection + form)
/seller/status                   → ApplicationStatus (check application status)
/seller/dashboard                → SellerDashboard (view plan & capabilities)
/admin/sellers/applications      → SellerApplications (manage applications)
/checkout                        → CheckoutPage (reuse existing, add subscription support)
```

---

## 🔐 CAPABILITY GUARDS

### Required Capabilities

**Seller Routes:**
- `/seller/apply` - No capability required (authenticated users only)
- `/seller/status` - No capability required (authenticated users only)
- `/seller/dashboard` - Requires seller role or `sellers:*` capability

**Admin Routes:**
- `/admin/sellers/applications` - Requires `sellers:applications:read`
- Approve action - Requires `sellers:applications:approve`
- Reject action - Requires `sellers:applications:reject`

### Implement Route Guards

```javascript
// Create a ProtectedRoute component
const ProtectedRoute = ({ element, requiredCapability }) => {
  const [auth] = useAuth();
  
  if (!auth?.token) {
    return <Navigate to="/login" />;
  }
  
  if (requiredCapability && !hasCap(auth, requiredCapability)) {
    return <Navigate to="/unauthorized" />;
  }
  
  return element;
};

// Use in routes
<Route
  path="/admin/sellers/applications"
  element={
    <ProtectedRoute
      element={<SellerApplications />}
      requiredCapability="sellers:applications:read"
    />
  }
/>
```

---

## 🎯 USER FLOWS

### Flow 1: User Applies for Seller Account

1. User navigates to `/seller/apply`
2. Step 0: Selects a plan from `GET /subscription-plans/active`
3. Steps 1-6: Fills out form, saves draft with `POST /api/v1/sellers/apply`
4. Submits application with `POST /api/v1/sellers/submit` (locks plan)
5. Redirects to `/seller/status`
6. Shows "Submitted" status, plan locked

### Flow 2: Admin Approves Free Plan

1. Admin navigates to `/admin/sellers/applications`
2. Filters by "submitted" status
3. Clicks "View" on application
4. Drawer opens with full details
5. Clicks "Approve" button
6. Approve modal shows "Free plan - instant activation"
7. Clicks "Approve"
8. API returns new token with seller role
9. Application removed from list
10. User sees "Approved" status on `/seller/status`
11. Redirects to `/seller/dashboard`

### Flow 3: Admin Approves Paid Plan

1. Admin navigates to `/admin/sellers/applications`
2. Filters by "submitted" status
3. Clicks "View" on application
4. Drawer opens with full details
5. Clicks "Approve" button
6. Approve modal shows "Paid plan - payment order created"
7. Clicks "Approve"
8. API creates payment order, returns checkoutInfo
9. Application removed from list
10. User sees "Approved - Pending Payment" on `/seller/status`
11. Clicks "Proceed to Payment"
12. Redirects to `/checkout` with subscription item
13. Completes payment
14. Webhook activates seller
15. Status page shows "Active"
16. Redirects to `/seller/dashboard`

### Flow 4: User Reapplies After Rejection

1. User sees "Rejected" status on `/seller/status`
2. Sees rejection reason
3. Clicks "Edit & Reapply"
4. Redirects to `/seller/apply`
5. Plan is not locked (can change)
6. Updates form and resubmits
7. New application created
8. Status shows "Submitted" again

### Flow 5: Payment Retry

1. User sees "Payment Failed" status on `/seller/status`
2. Clicks "Retry Payment"
3. API creates new payment order
4. Returns new checkoutInfo
5. Redirects to `/checkout`
6. Completes payment
7. Webhook activates seller
8. Status page shows "Active"

---

## 🧪 TESTING CHECKLIST

### RBAC Tests
- [ ] Sidebar shows/hides items based on capabilities
- [ ] Admin can access `/admin/sellers/applications`
- [ ] Seller cannot access admin routes
- [ ] Unauthenticated user redirected to login

### Wizard Tests
- [ ] Plans load from `/subscription-plans/active`
- [ ] Plan selection works
- [ ] Draft saves with `POST /api/v1/sellers/apply`
- [ ] Form fields validate
- [ ] Submit locks plan
- [ ] Plan cannot be changed after submit
- [ ] Reapply after rejection works

### Status Page Tests
- [ ] Displays correct status badge
- [ ] Submitted/under_review shows locked message
- [ ] Approved_pending_payment shows payment button
- [ ] Approved_payment_failed shows retry button
- [ ] Rejected shows reason and reapply button
- [ ] Active shows dashboard button
- [ ] Polling updates status on payment success

### Admin List Tests
- [ ] Loads applications with pagination
- [ ] Filters by status work
- [ ] Search by name/email/business works
- [ ] Drawer shows full details
- [ ] Approve button works (free plan)
- [ ] Approve button works (paid plan)
- [ ] Reject button works with reason
- [ ] Documents are clickable

### Dashboard Tests
- [ ] Shows current plan
- [ ] Shows expiry date
- [ ] Shows days remaining
- [ ] Shows capabilities list
- [ ] Shows plan features
- [ ] Action buttons present
- [ ] Responsive on mobile

---

## 📝 ENVIRONMENT SETUP

### Required Environment Variables

```env
# Frontend
REACT_APP_API_BASE_URL=http://localhost:5000
REACT_APP_RAZORPAY_KEY_ID=your_razorpay_key_id

# Backend
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

---

## 🚀 DEPLOYMENT CHECKLIST

- [ ] All routes added to App.jsx
- [ ] RBAC helpers imported and used
- [ ] API client methods working
- [ ] Sidebar updated with capability guards
- [ ] Checkout page supports subscription items
- [ ] Auth context includes tokenVersion
- [ ] Token refresh logic implemented
- [ ] All CSS files imported
- [ ] Error handling in place
- [ ] Loading states working
- [ ] Responsive design tested
- [ ] Payment webhook tested
- [ ] CRON job running for auto-fallback
- [ ] Tests passing

---

## 📊 COMPONENT TREE

```
App.jsx
├── /seller/apply → SellerWizardV2
│   ├── Plan Selection (Step 0)
│   ├── Personal Info (Step 1)
│   ├── Address Info (Step 2)
│   ├── Identity Verification (Step 3)
│   ├── Business Info (Step 4)
│   ├── Banking Info (Step 5)
│   └── Consents (Step 6)
├── /seller/status → ApplicationStatus
│   ├── Plan Info Card
│   ├── Status-Specific Content
│   │   ├── Submitted/Under Review Alert
│   │   ├── Pending Payment Section
│   │   ├── Payment Failed Section
│   │   ├── Rejected Section
│   │   ├── Approved Section
│   │   └── Active Section
│   └── Timeline
├── /seller/dashboard → SellerDashboard
│   ├── Plan Status Card
│   ├── Stat Cards
│   ├── Capabilities Grid
│   ├── Features List
│   └── Action Buttons
└── /admin/sellers/applications → SellerApplications
    ├── Filters (Status, Search, Sort)
    ├── Applications Table
    ├── Pagination
    ├── Drawer (Application Details)
    ├── Approve Modal
    └── Reject Modal
```

---

## 🔗 API ENDPOINTS USED

```
GET  /api/v1/subscription-plans/active
POST /api/v1/sellers/apply
POST /api/v1/sellers/submit
GET  /api/v1/sellers/my-application
GET  /api/v1/payments/checkout-data
POST /api/v1/sellers/applications/:id/retry-payment
GET  /api/v1/sellers/applications
GET  /api/v1/sellers/applications/:id
POST /api/v1/sellers/applications/:id/approve
POST /api/v1/sellers/applications/:id/reject
```

---

## 📚 DOCUMENTATION REFERENCES

- Backend Implementation: `SELLER_ONBOARDING_IMPLEMENTATION.md`
- Complete Specification: `SELLER_ONBOARDING_FLOW.md`
- RBAC System: `RBAC_FINAL_IMPLEMENTATION_SUMMARY.md`

---

**Status**: Ready for integration and testing
**Last Updated**: December 4, 2025
