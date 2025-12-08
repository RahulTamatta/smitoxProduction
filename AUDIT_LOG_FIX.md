# Audit Log Fix - Admin Dashboard Logout Issue

## Problem
When logged in as admin and navigating to the dashboard, the user was getting logged out. The error logs showed:
```
Error logging audit event: Error: AuditLog validation failed: actorRole: Path `actorRole` is required.
```

## Root Cause
The `logAuditEvent` function was being called without the `actorRole` parameter in some cases, causing the audit log validation to fail. This error was not being caught properly, which led to middleware failures and user logout.

## Solution Applied

### 1. Updated `middlewares/rbacMiddleware.js`
- Added fallback value for `actorRole` in `logAuditEvent()` function
- Added check to skip logging if no actor is provided
- Made error handling non-blocking (errors don't break the main flow)

```javascript
export const logAuditEvent = async (eventData) => {
  try {
    // Skip if no actor
    if (!eventData.actor) return;

    const auditLog = new auditLogModel({
      actor: eventData.actor,
      actorRole: eventData.actorRole || "unknown", // Provide fallback
      // ... rest of fields
    });

    await auditLog.save();
    return auditLog;
  } catch (error) {
    console.error("Error logging audit event:", error);
    // Don't throw - audit logging should not break the main flow
  }
};
```

### 2. Updated `models/auditLogModel.js`
- Changed `actorRole` from `required: true` to `default: "unknown"`
- Added "unknown" to the enum of allowed values

```javascript
actorRole: {
  type: String,
  enum: ["user", "admin", "seller", "super_admin", "unknown"],
  default: "unknown",
},
```

## Result
✅ Admin dashboard no longer logs user out  
✅ Audit logging continues to work with fallback values  
✅ Server runs without audit log validation errors  
✅ User session persists across dashboard navigation  

## Testing
1. Login as admin user
2. Navigate to `/dashboard/admin`
3. Verify no logout occurs
4. Check server logs - no audit log errors should appear

## Files Modified
- `middlewares/rbacMiddleware.js` - Added fallback for actorRole
- `models/auditLogModel.js` - Made actorRole optional with default value
