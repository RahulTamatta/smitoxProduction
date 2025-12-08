# RBAC System Setup & Integration Guide

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
npm install bcryptjs jsonwebtoken
```

### Step 2: Register Routes in Server

Update your main `server.js` file:

```javascript
import sellerApplicationRoutes from './routes/sellerApplicationRoutes.js';
import subscriptionPlanRoutes from './routes/subscriptionPlanRoutes.js';

// Add these lines in your route registration section
app.use('/api/v1/seller-applications', sellerApplicationRoutes);
app.use('/api/v1/subscription-plans', subscriptionPlanRoutes);
```

### Step 3: Run Seed Script

```bash
node scripts/seedRbacData.js
```

This creates:
- 4 subscription plans (Free, Starter, Professional, Enterprise)
- Super Admin user: `superadmin@smitox.com` / `SuperAdmin@123`
- Updates existing admin users

### Step 4: Update Auth Controller

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

### Step 5: Update Existing Routes with Capability Guards

Example: Protect product deletion

```javascript
import { requireCapability } from '../middlewares/rbacMiddleware.js';

// Before
router.delete('/delete-product/:id', isAdmin, deleteProductController);

// After
router.delete(
  '/delete-product/:id',
  requireSignIn,
  requireCapability('products:delete'),
  deleteProductController
);
```

### Step 6: Update Sidebar Navigation

In your `AdminMenu.jsx`:

```javascript
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

## 📁 Files Created

### Configuration
- `config/rbac-policy.js` - Central RBAC policy with capabilities and role mappings

### Models
- `models/sellerApplicationModel.js` - Seller application schema
- `models/sellerProfileModel.js` - Seller profile schema
- `models/subscriptionPlanModel.js` - Subscription plan schema
- `models/auditLogModel.js` - Audit log schema
- `models/userModel.js` - Updated with RBAC fields

### Middleware
- `middlewares/rbacMiddleware.js` - Enhanced auth and capability checks

### Helpers
- `helpers/rbacHelper.js` - Frontend/backend utilities

### Controllers
- `controllers/sellerApplicationController.js` - Application management
- `controllers/subscriptionPlanController.js` - Plan management

### Routes
- `routes/sellerApplicationRoutes.js` - Application endpoints
- `routes/subscriptionPlanRoutes.js` - Plan endpoints

### Scripts
- `scripts/seedRbacData.js` - Data seeding script

### Frontend Components
- `client/src/pages/Seller/SellerWizard.jsx` - Multi-step seller onboarding
- `client/src/pages/Seller/sellerWizard.css` - Wizard styling

### Documentation
- `RBAC_IMPLEMENTATION.md` - Comprehensive RBAC documentation
- `RBAC_SETUP_GUIDE.md` - This file

---

## 🔐 Protecting Existing Routes

### Example 1: Product Routes

```javascript
import { requireCapability } from '../middlewares/rbacMiddleware.js';

// Get all products
router.get('/get-product', requireSignIn, requireCapability('products:read'), getAllProducts);

// Create product
router.post('/create-product', 
  requireSignIn, 
  requireCapability('products:write'),
  formidable(),
  createProduct
);

// Update product
router.put('/update-product/:id',
  requireSignIn,
  requireCapability('products:write'),
  formidable(),
  updateProduct
);

// Delete product
router.delete('/delete-product/:id',
  requireSignIn,
  requireCapability('products:delete'),
  auditLog('delete', 'product', 'high'),
  deleteProduct
);
```

### Example 2: Order Routes

```javascript
// Get orders
router.get('/get-orders', 
  requireSignIn, 
  requireCapability('orders:read'),
  getOrders
);

// Create order
router.post('/create-order',
  requireSignIn,
  requireCapability('orders:write'),
  createOrder
);

// Update order status
router.put('/update-order/:id',
  requireSignIn,
  requireCapability('orders:status'),
  updateOrderStatus
);

// Process refund
router.post('/refund-order/:id',
  requireSignIn,
  requireCapability('orders:refund'),
  auditLog('refund', 'order', 'high'),
  refundOrder
);

// Delete order
router.delete('/delete-order/:id',
  requireSignIn,
  requireCapability('orders:delete'),
  auditLog('delete', 'order', 'critical'),
  deleteOrder
);
```

### Example 3: User Routes

```javascript
// Get users
router.get('/get-users',
  requireSignIn,
  requireCapability('users:read'),
  getUsers
);

// Update user role
router.put('/update-user-role/:id',
  requireSignIn,
  requireCapability('users:role:update'),
  auditLog('update_role', 'user', 'critical'),
  updateUserRole
);

// Delete user
router.delete('/delete-user/:id',
  requireSignIn,
  requireCapability('users:delete'),
  auditLog('delete', 'user', 'critical'),
  deleteUser
);
```

---

## 🎨 Frontend Integration

### Conditional Rendering

```jsx
import { userHasCapability } from '../helpers/rbacHelper.js';

function ProductsPage({ user }) {
  return (
    <div>
      {userHasCapability(user, 'products:read') && (
        <ProductsTable />
      )}
      
      {userHasCapability(user, 'products:write') && (
        <CreateProductButton />
      )}
      
      {userHasCapability(user, 'products:delete') && (
        <BulkDeleteButton />
      )}
    </div>
  );
}
```

### Permission-Denied Screen

```jsx
import { userHasCapability } from '../helpers/rbacHelper.js';

function ProtectedPage({ user, requiredCapability }) {
  if (!userHasCapability(user, requiredCapability)) {
    return (
      <div className="permission-denied">
        <h2>Access Denied</h2>
        <p>You don't have permission to access this page.</p>
        <Link to="/dashboard">Go to Dashboard</Link>
      </div>
    );
  }
  
  return <PageContent />;
}
```

---

## 🧪 Testing

### Test Super Admin Access

```bash
# Login as super admin
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@smitox.com",
    "password": "SuperAdmin@123"
  }'

# Should return token with role: 'super_admin'
```

### Test Seller Restrictions

```bash
# Try to access subscriptions as seller (should fail)
curl -X GET http://localhost:8080/api/v1/subscription-plans \
  -H "Authorization: <seller-token>"

# Response: 403 Forbidden
# Message: "Access denied. Required capabilities: subscriptions:read"
```

### Test Audit Logging

```javascript
// Query audit logs
const logs = await AuditLog.find({ 
  actor: userId,
  severity: 'high'
}).sort({ createdAt: -1 });

console.log(logs);
```

---

## 📊 Role Capabilities Matrix

| Capability | Super Admin | Admin | Seller | User |
|------------|:-----------:|:-----:|:------:|:----:|
| products:read | ✅ | ✅ | ✅ | ✅ |
| products:write | ✅ | ✅ | ✅ | ❌ |
| products:delete | ✅ | ✅ | ✅ | ❌ |
| orders:read | ✅ | ✅ | ✅ | ✅* |
| orders:write | ✅ | ✅ | ✅ | ❌ |
| orders:delete | ✅ | ✅ | ❌ | ❌ |
| orders:refund | ✅ | ✅ | ❌** | ❌ |
| users:read | ✅ | ✅ | ✅ | ❌ |
| users:write | ✅ | ✅ | ✅ | ❌ |
| users:delete | ✅ | ✅ | ❌ | ❌ |
| users:role:update | ✅ | ✅ | ❌ | ❌ |
| subscriptions:* | ✅ | ❌ | ❌ | ❌ |
| sellers:applications:* | ✅ | ❌ | ❌ | ❌ |
| security:* | ✅ | ❌ | ❌ | ❌ |
| settings:* | ✅ | ❌ | ❌ | ❌ |

*User can only see own orders  
**Can be granted via feature flag

---

## 🔄 Migration from Old System

### Update Existing Admin Users

```javascript
import userModel from './models/userModel.js';
import { ROLES, ROLE_NUMBERS } from './config/rbac-policy.js';

const migrateAdmins = async () => {
  const admins = await userModel.find({ role: 1 });
  
  for (const admin of admins) {
    admin.roleString = ROLES.ADMIN;
    admin.isActive = true;
    await admin.save();
  }
  
  console.log(`Migrated ${admins.length} admin users`);
};
```

### Update Existing Regular Users

```javascript
const migrateUsers = async () => {
  const users = await userModel.find({ role: 0 });
  
  for (const user of users) {
    user.roleString = ROLES.USER;
    user.isActive = true;
    await user.save();
  }
  
  console.log(`Migrated ${users.length} regular users`);
};
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

## 🔧 Feature Flags

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

## 📞 Troubleshooting

### Issue: "Capability not found"

**Solution**: Check that the capability is defined in `config/rbac-policy.js`

### Issue: Seller can access denied capabilities

**Solution**: Ensure middleware is applied to all routes. Check that `requireCapability` is used, not just `isAdmin`.

### Issue: Audit logs not being created

**Solution**: Verify that `logAuditEvent` is being called. Check MongoDB connection and AuditLog model.

### Issue: Sidebar showing all items to seller

**Solution**: Update sidebar to use `getVisibleMenuItems()` helper instead of hardcoded role checks.

---

## 📈 Next Steps

1. ✅ Run seed script
2. ✅ Register routes in server
3. ✅ Update auth controller
4. ✅ Protect existing routes with capability guards
5. ✅ Update sidebar navigation
6. ✅ Create admin pages for seller applications
7. ✅ Create admin pages for subscriptions
8. ✅ Add seller wizard to public navbar
9. ✅ Test all flows
10. ✅ Deploy to production

---

## 📚 Additional Resources

- See `RBAC_IMPLEMENTATION.md` for detailed documentation
- See `config/rbac-policy.js` for capability definitions
- See `helpers/rbacHelper.js` for utility functions
- See `middlewares/rbacMiddleware.js` for middleware implementation

---

**Version**: 1.0  
**Last Updated**: December 2024  
**Status**: Production Ready
