# RBAC Implementation Guide - Smitox B2B Platform

## 📋 Overview

This document describes the comprehensive Role-Based Access Control (RBAC) system implemented in Smitox B2B, including Super Admin, Admin, Seller, and User roles with fine-grained capabilities.

---

## 🎯 Roles & Capabilities Model

### Role Hierarchy

```
┌─────────────────────────────────────────────────────┐
│                   SUPER_ADMIN                       │
│  All capabilities - Full platform control           │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│                     ADMIN                           │
│  Core admin features - No seller management         │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│                    SELLER                           │
│  Almost all admin features - Deny-list applied      │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│                     USER                            │
│  Storefront only - Own orders & profile             │
└─────────────────────────────────────────────────────┘
```

### Roles

| Role | Value | Numeric | Description |
|------|-------|---------|-------------|
| **super_admin** | `'super_admin'` | `3` | Full platform access, manages sellers, subscriptions, security |
| **admin** | `'admin'` | `1` | Core admin features (products, orders, users, categories) |
| **seller** | `'seller'` | `2` | Business owner - almost all admin features except deny-list |
| **user** | `'user'` | `0` | Regular customer - storefront only |

### Capabilities

#### Products
- `products:read` - View products
- `products:write` - Create/edit products
- `products:delete` - Delete products
- `products:bulk` - Bulk operations

#### Orders
- `orders:read` - View orders
- `orders:write` - Create/edit orders
- `orders:delete` - Delete orders
- `orders:refund` - Process refunds
- `orders:status` - Update order status

#### Users
- `users:read` - View users
- `users:write` - Create/edit users
- `users:delete` - Delete users
- `users:role:update` - Update user roles

#### Categories & Banners
- `categories:read`, `categories:write`, `categories:delete`
- `banners:read`, `banners:write`, `banners:delete`

#### ProductForYou
- `productforyou:read`, `productforyou:write`, `productforyou:delete`

#### Analytics
- `analytics:read` - View analytics
- `analytics:export` - Export data

#### Subscriptions (Super Admin Only)
- `subscriptions:read`, `subscriptions:write`, `subscriptions:delete`, `subscriptions:toggle`

#### Seller Applications (Super Admin Only)
- `sellers:applications:read`, `sellers:applications:approve`, `sellers:applications:reject`

#### Settings & Security (Super Admin Only)
- `settings:read`, `settings:write`
- `security:roles:read`, `security:roles:write`, `security:permissions:write`, `security:audit`

#### Seller Profile
- `seller:profile:read`, `seller:profile:write`

### Seller Deny-List

Sellers **CANNOT** access:

```javascript
[
  'security:roles:read',
  'security:roles:write',
  'security:permissions:write',
  'security:audit',
  'subscriptions:read',
  'subscriptions:write',
  'subscriptions:delete',
  'subscriptions:toggle',
  'sellers:applications:read',
  'sellers:applications:approve',
  'sellers:applications:reject',
  'users:role:update',
  'users:delete',
  'settings:read',
  'settings:write',
  'orders:delete',
  'orders:refund', // Can be granted via feature flag
]
```

---

## 🗄️ Database Schema Updates

### User Model (Enhanced)

```javascript
{
  // ... existing fields ...
  roleString: String,           // 'user', 'admin', 'seller', 'super_admin'
  role: Number,                 // 0, 1, 2, 3 (backward compatibility)
  permissions: {
    grantedCapabilities: [String],
    deniedCapabilities: [String],
    canModerateSellers: Boolean,
  },
  sellerProfileId: ObjectId,    // Reference to SellerProfile
  isActive: Boolean,
}
```

### SellerApplication Model (New)

```javascript
{
  userId: ObjectId,
  status: 'submitted' | 'under_review' | 'approved' | 'rejected',
  rejectionReason: String,
  selectedPlanId: ObjectId,
  
  // Personal Information
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  
  // Address Information
  addressLine1: String,
  addressLine2: String,
  city: String,
  state: String,
  pincode: String,
  country: String,
  
  // KYC Documents
  identityProofType: 'aadhar' | 'pan' | 'passport' | 'driving_license',
  identityProofNumber: String,
  identityProofImage: String,
  addressProofType: 'aadhar' | 'passport' | 'utility_bill' | 'lease_agreement',
  addressProofNumber: String,
  addressProofImage: String,
  
  // Business Information
  businessName: String,
  businessType: 'sole_proprietor' | 'partnership' | 'pvt_ltd' | 'llp' | 'ngo',
  gstNumber: String,
  gstImage: String,
  panNumber: String,
  panImage: String,
  businessDescription: String,
  
  // Banking Information
  accountHolderName: String,
  accountNumber: String,
  accountType: 'savings' | 'current',
  ifscCode: String,
  bankName: String,
  cancelledCheckImage: String,
  
  // Consents
  termsAccepted: Boolean,
  privacyAccepted: Boolean,
  communicationConsent: Boolean,
  
  // Review Information
  reviewedBy: ObjectId,
  reviewedAt: Date,
  reviewNotes: String,
}
```

### SellerProfile Model (New)

```javascript
{
  userId: ObjectId,
  applicationId: ObjectId,
  subscriptionPlanId: ObjectId,
  
  // Profile Status
  status: 'active' | 'suspended' | 'inactive',
  
  // Business Information
  businessName: String,
  businessType: String,
  gstNumber: String,
  panNumber: String,
  businessDescription: String,
  businessLogo: String,
  businessBanner: String,
  
  // Contact Information
  primaryContactName: String,
  primaryContactEmail: String,
  primaryContactPhone: String,
  
  // Banking Information
  accountHolderName: String,
  accountNumber: String,
  ifscCode: String,
  bankName: String,
  
  // Metrics
  totalProducts: Number,
  totalOrders: Number,
  totalRevenue: Number,
  averageRating: Number,
  totalReviews: Number,
  
  // Wallet & Commission
  walletBalance: Number,
  commissionRate: Number,
  
  // Subscription Info
  subscriptionStartDate: Date,
  subscriptionEndDate: Date,
  isSubscriptionActive: Boolean,
  
  // Verification
  isVerified: Boolean,
  verificationDate: Date,
  
  // Compliance
  complianceStatus: 'compliant' | 'warning' | 'non_compliant',
  complianceNotes: String,
  
  // Suspension/Deactivation
  suspensionReason: String,
  suspensionDate: Date,
  
  // Seller Permissions
  permissions: {
    canRefundOrders: Boolean,
    canDeleteOrders: Boolean,
    canModerateSellers: Boolean,
    grantedCapabilities: [String],
    deniedCapabilities: [String],
  },
}
```

### SubscriptionPlan Model (New)

```javascript
{
  name: String,                    // 'Free Plan', 'Starter', etc.
  description: String,
  price: Number,                   // 0 for free
  currency: String,                // 'INR'
  billingCycle: 'monthly' | 'quarterly' | 'yearly',
  
  // Plan Features
  features: [{
    name: String,
    description: String,
    limit: Number,                 // null for unlimited
  }],
  
  // Limits & Quotas
  maxProducts: Number,             // null for unlimited
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
  
  // Trial & Fees
  trialDays: Number,
  setupFee: Number,
  discountPercentage: Number,
  
  // Support
  supportLevel: 'email' | 'priority' | 'dedicated',
  
  // Metadata
  tags: [String],
  metadata: Mixed,
}
```

### AuditLog Model (New)

```javascript
{
  // Actor Information
  actor: ObjectId,                 // User who performed action
  actorRole: 'user' | 'admin' | 'seller' | 'super_admin',
  
  // Action Details
  action: String,                  // 'create', 'update', 'delete', 'approve', etc.
  resourceType: String,            // 'product', 'order', 'user', etc.
  resourceId: ObjectId,
  
  // Changes
  changes: {
    before: Mixed,
    after: Mixed,
  },
  
  // Request Information
  ipAddress: String,
  userAgent: String,
  
  // Status
  status: 'success' | 'failure',
  errorMessage: String,
  
  // Severity
  severity: 'low' | 'medium' | 'high' | 'critical',
  
  // Additional Context
  description: String,
  metadata: Mixed,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date,
}
```

---

## 🔐 Middleware & Guards

### Enhanced Authentication

```javascript
import { requireSignIn } from '../middlewares/rbacMiddleware.js';

// Enriches req.user with full role and permissions
router.get('/protected', requireSignIn, (req, res) => {
  // req.user now contains:
  // {
  //   _id: ObjectId,
  //   email: String,
  //   role: 'admin' | 'seller' | 'user' | 'super_admin',
  //   permissions: { grantedCapabilities, deniedCapabilities },
  //   sellerProfileId: ObjectId,
  // }
});
```

### Capability Checks

```javascript
import { requireCapability, requireAnyCapability } from '../middlewares/rbacMiddleware.js';

// Require all capabilities
router.delete('/products/:id', 
  requireSignIn, 
  requireCapability(['products:delete']),
  deleteProduct
);

// Require any capability
router.get('/analytics', 
  requireSignIn, 
  requireAnyCapability(['analytics:read', 'analytics:export']),
  getAnalytics
);
```

### Role Checks

```javascript
import { requireRole, requireSuperAdmin, requireSeller } from '../middlewares/rbacMiddleware.js';

// Require specific role
router.post('/subscriptions', 
  requireSignIn, 
  requireSuperAdmin,
  createSubscription
);

// Require seller role
router.get('/seller/dashboard', 
  requireSignIn, 
  requireSeller,
  getSellerDashboard
);
```

### Audit Logging

```javascript
import { auditLog, logAuditEvent } from '../middlewares/rbacMiddleware.js';

// Automatic audit logging middleware
router.delete('/products/:id', 
  requireSignIn, 
  auditLog('delete', 'product', 'high'),
  deleteProduct
);

// Manual audit logging
await logAuditEvent({
  actor: req.user._id,
  actorRole: req.user.role,
  action: 'delete',
  resourceType: 'product',
  resourceId: productId,
  severity: 'high',
  description: 'Product deleted',
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
});
```

---

## 🛣️ API Endpoints

### Seller Applications

```
POST   /api/v1/seller-applications/submit
       Submit seller application (requires auth)

GET    /api/v1/seller-applications/my-application
       Get user's own application (requires auth)

GET    /api/v1/seller-applications
       Get all applications (requires super_admin)

GET    /api/v1/seller-applications/:id
       Get single application (requires super_admin)

PUT    /api/v1/seller-applications/:id/approve
       Approve application (requires sellers:applications:approve)

PUT    /api/v1/seller-applications/:id/reject
       Reject application (requires sellers:applications:reject)
```

### Subscription Plans

```
POST   /api/v1/subscription-plans
       Create plan (requires super_admin)

GET    /api/v1/subscription-plans
       Get all plans (requires super_admin)

GET    /api/v1/subscription-plans/active
       Get active plans (public)

GET    /api/v1/subscription-plans/:id
       Get single plan (public)

PUT    /api/v1/subscription-plans/:id
       Update plan (requires subscriptions:write)

PUT    /api/v1/subscription-plans/:id/toggle
       Toggle plan status (requires subscriptions:toggle)

DELETE /api/v1/subscription-plans/:id
       Delete plan (requires subscriptions:delete)
```

---

## 🎨 Frontend Integration

### Helper Functions

```javascript
import {
  getUserCapabilities,
  userHasCapability,
  userHasAnyCapability,
  userHasAllCapabilities,
  getUserRole,
  isSuperAdmin,
  isAdminOrSuperAdmin,
  isSeller,
  isRegularUser,
  getVisibleMenuItems,
} from '../helpers/rbacHelper.js';

// Check capabilities
if (userHasCapability(user, 'products:delete')) {
  // Show delete button
}

// Get visible menu items
const menuItems = getVisibleMenuItems(user);
```

### Conditional Rendering

```jsx
import { userHasCapability } from '../helpers/rbacHelper.js';

function AdminDashboard({ user }) {
  return (
    <div>
      {userHasCapability(user, 'products:read') && (
        <ProductsSection />
      )}
      
      {userHasCapability(user, 'orders:read') && (
        <OrdersSection />
      )}
      
      {userHasCapability(user, 'subscriptions:read') && (
        <SubscriptionsSection />
      )}
      
      {userHasCapability(user, 'sellers:applications:read') && (
        <SellerApplicationsSection />
      )}
    </div>
  );
}
```

### Sidebar Navigation

```jsx
import { getVisibleMenuItems } from '../helpers/rbacHelper.js';

function AdminMenu({ user }) {
  const menuItems = getVisibleMenuItems(user);
  
  return (
    <nav className="admin-menu">
      {menuItems.map((item) => (
        <div key={item.id}>
          <Link to={item.path}>{item.label}</Link>
          {item.submenu && (
            <ul>
              {item.submenu.map((sub) => (
                <li key={sub.id}>
                  <Link to={sub.path}>{sub.label}</Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </nav>
  );
}
```

---

## 🚀 Seller Onboarding Flow

### Step 0: Plan Selection
- Display active subscription plans
- Show features, pricing, trial period
- User selects a plan

### Step 1: Personal Information
- First name, last name
- Email, phone
- Collect contact details

### Step 2: Address Information
- Address line 1 & 2
- City, state, pincode
- Country (default: India)

### Step 3: KYC Documents
- Identity proof (Aadhar, PAN, Passport, DL)
- Address proof (Aadhar, Passport, Utility Bill, Lease)
- Upload document images

### Step 4: Business Information
- Business name
- Business type (Sole Proprietor, Partnership, Pvt Ltd, LLP, NGO)
- GST number and image
- PAN number and image
- Business description

### Step 5: Banking Information
- Account holder name
- Account number
- Account type (Savings/Current)
- IFSC code
- Bank name
- Cancelled cheque image

### Step 6: Consents
- Terms & conditions
- Privacy policy
- Communication preferences

### Step 7: Review & Submit
- Review all information
- Submit application
- Show confirmation message

### After Submission
- Application status: "submitted"
- Super Admin reviews in Sellers → Applications
- Super Admin approves → Creates SellerProfile, updates User.role='seller'
- On next login, Seller sees expanded admin features

---

## 🔧 Setup & Installation

### 1. Install Dependencies

```bash
npm install bcryptjs jsonwebtoken
```

### 2. Run Seed Script

```bash
node scripts/seedRbacData.js
```

This creates:
- 4 subscription plans (Free, Starter, Professional, Enterprise)
- Super Admin user (superadmin@smitox.com / SuperAdmin@123)
- Updates existing admin users

### 3. Update Auth Controller

Modify your login controller to return the new role structure:

```javascript
export const loginController = async (req, res) => {
  try {
    // ... existing validation ...
    
    const token = JWT.sign(
      {
        _id: user._id,
        email: user.email_id,
        role: user.roleString || 'user',
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(200).send({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        email: user.email_id,
        role: user.roleString || 'user',
      },
    });
  } catch (error) {
    // ... error handling ...
  }
};
```

### 4. Register New Routes

In your main server file:

```javascript
import sellerApplicationRoutes from './routes/sellerApplicationRoutes.js';
import subscriptionPlanRoutes from './routes/subscriptionPlanRoutes.js';

app.use('/api/v1/seller-applications', sellerApplicationRoutes);
app.use('/api/v1/subscription-plans', subscriptionPlanRoutes);
```

---

## 🧪 Testing

### Unit Tests

```javascript
import { hasCapability, getCapabilities } from '../config/rbac-policy.js';

describe('RBAC Policy', () => {
  test('Super Admin has all capabilities', () => {
    expect(hasCapability('super_admin', 'products:delete')).toBe(true);
    expect(hasCapability('super_admin', 'security:roles:write')).toBe(true);
  });

  test('Seller cannot access deny-list', () => {
    expect(hasCapability('seller', 'security:roles:write')).toBe(false);
    expect(hasCapability('seller', 'subscriptions:write')).toBe(false);
  });

  test('User has limited capabilities', () => {
    expect(hasCapability('user', 'products:read')).toBe(true);
    expect(hasCapability('user', 'products:write')).toBe(false);
  });
});
```

### Integration Tests

```javascript
describe('RBAC Middleware', () => {
  test('Seller can access products:read', async () => {
    const response = await request(app)
      .get('/api/v1/products')
      .set('Authorization', sellerToken);
    
    expect(response.status).toBe(200);
  });

  test('Seller cannot access subscriptions:write', async () => {
    const response = await request(app)
      .post('/api/v1/subscription-plans')
      .set('Authorization', sellerToken)
      .send({ name: 'Test Plan' });
    
    expect(response.status).toBe(403);
  });

  test('Super Admin can access everything', async () => {
    const response = await request(app)
      .post('/api/v1/subscription-plans')
      .set('Authorization', superAdminToken)
      .send({ name: 'Test Plan' });
    
    expect(response.status).toBe(201);
  });
});
```

---

## 📊 Audit Trail

All sensitive actions are logged to AuditLog:

```javascript
{
  actor: userId,
  actorRole: 'seller',
  action: 'delete',
  resourceType: 'product',
  resourceId: productId,
  severity: 'high',
  status: 'success',
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
  description: 'Product deleted',
  createdAt: '2024-12-03T...',
}
```

Query audit logs:

```javascript
// Get all actions by a user
const logs = await AuditLog.find({ actor: userId });

// Get all critical actions
const critical = await AuditLog.find({ severity: 'critical' });

// Get all failed attempts
const failed = await AuditLog.find({ status: 'failure' });
```

---

## 🛡️ Security Best Practices

1. **Always check capabilities on backend** - Never rely on frontend checks alone
2. **Log sensitive actions** - Use audit logging for compliance
3. **Validate permissions on every request** - Don't cache permissions
4. **Use HTTPS** - Protect tokens in transit
5. **Implement rate limiting** - Prevent brute force attacks
6. **Rotate secrets regularly** - Update JWT_SECRET periodically
7. **Mask sensitive data** - Don't log passwords or tokens
8. **Implement 2FA** - For admin and super admin accounts

---

## 📝 Migration from Old System

### For Existing Admin Users

```javascript
// Update existing admins
const admins = await User.find({ role: 1 });
for (const admin of admins) {
  admin.roleString = 'admin';
  admin.isActive = true;
  await admin.save();
}
```

### For Existing Regular Users

```javascript
// Update existing users
const users = await User.find({ role: 0 });
for (const user of users) {
  user.roleString = 'user';
  user.isActive = true;
  await user.save();
}
```

---

## 🔄 Feature Flags

Enable/disable capabilities per user:

```javascript
// Grant specific capability to seller
const seller = await User.findById(sellerId);
seller.permissions.grantedCapabilities.push('orders:refund');
await seller.save();

// Deny specific capability
seller.permissions.deniedCapabilities.push('orders:delete');
await seller.save();
```

---

## 📞 Support

For questions or issues:
- Review `config/rbac-policy.js` for capability definitions
- Check `middlewares/rbacMiddleware.js` for middleware implementation
- See `helpers/rbacHelper.js` for frontend utilities
- Review audit logs for troubleshooting

---

**Version**: 1.0  
**Last Updated**: December 2024  
**Status**: Production Ready
