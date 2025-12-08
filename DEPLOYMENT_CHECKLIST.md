# Deployment Checklist - Seller Onboarding Flow

## ✅ PRE-DEPLOYMENT VERIFICATION

### Backend Setup
- [x] Routes registered in `server.js`
- [x] CRON job imported and started in `server.js`
- [x] Payment webhook routes created
- [x] All controllers implemented
- [x] All models updated
- [x] RBAC middleware configured
- [x] Error handling implemented
- [x] Audit logging configured

### Frontend Setup
- [x] Routes added to `App.jsx`
- [x] All components created
- [x] Checkout page created
- [x] CSS files created
- [x] API client methods created
- [x] RBAC helpers created
- [x] Error handling implemented
- [x] Loading states implemented

### Environment Configuration
- [ ] `.env` file updated with:
  - `RAZORPAY_KEY_ID`
  - `RAZORPAY_KEY_SECRET`
  - `MONGODB_URI`
  - `JWT_SECRET`
  - `NODE_ENV=production`
  - `PORT=8080`

### Dependencies
- [ ] `node-cron` installed: `npm install node-cron`
- [ ] All other dependencies up to date
- [ ] No security vulnerabilities: `npm audit`

---

## 🔧 DEPLOYMENT STEPS

### Step 1: Backend Deployment

```bash
# 1. Install dependencies
npm install

# 2. Verify environment variables
cat .env | grep RAZORPAY
cat .env | grep MONGODB

# 3. Build backend (if needed)
npm run build

# 4. Start backend
npm start

# 5. Verify server started
# Look for: "✅ Plan Expiry CRON Job started successfully"
# Look for: "Server running in production mode on port 8080"
```

### Step 2: Frontend Deployment

```bash
# 1. Navigate to client directory
cd client

# 2. Install dependencies
npm install

# 3. Build frontend
npm run build

# 4. Verify build successful
# Check for: "build" folder created

# 5. Start frontend (if needed)
npm start
```

### Step 3: Database Verification

```bash
# 1. Connect to MongoDB
mongo

# 2. Verify collections exist
use smitox_db
db.sellerApplications.count()
db.sellerprofiles.count()
db.subscriptionplans.count()
db.auditlogs.count()

# 3. Verify indexes
db.sellerApplications.getIndexes()

# 4. Create indexes if needed
db.sellerApplications.createIndex({ userId: 1, status: 1 })
db.sellerprofiles.createIndex({ userId: 1 })
```

### Step 4: Razorpay Configuration

```bash
# 1. Verify Razorpay credentials in .env
echo $RAZORPAY_KEY_ID
echo $RAZORPAY_KEY_SECRET

# 2. Test Razorpay connection
curl -X GET https://api.razorpay.com/v1/orders \
  -H "Authorization: Basic $(echo -n $RAZORPAY_KEY_ID:$RAZORPAY_KEY_SECRET | base64)"

# 3. Configure webhook URL in Razorpay dashboard
# Webhook URL: https://yourdomain.com/api/v1/webhooks/payments/razorpay/success
# Events: payment.authorized, payment.failed
```

### Step 5: Email Service Configuration

```bash
# 1. Configure email service for CRON job notifications
# Update in planExpiryJob.js:
# - sendReminderEmail() function
# - Use your email provider (SendGrid, AWS SES, etc.)

# 2. Test email sending
# Trigger CRON job manually or wait for scheduled time
```

### Step 6: Monitoring Setup

```bash
# 1. Setup error logging
# Configure Sentry or similar service

# 2. Setup performance monitoring
# Configure New Relic or similar

# 3. Setup uptime monitoring
# Configure Uptime Robot or similar

# 4. Setup log aggregation
# Configure ELK Stack or similar
```

---

## 🧪 POST-DEPLOYMENT VERIFICATION

### Health Checks

```bash
# 1. Backend health check
curl http://localhost:8080/api/v1/health

# 2. Frontend health check
curl http://localhost:3000

# 3. Database connection
# Check MongoDB connection logs

# 4. CRON job status
# Check server logs for CRON job messages
```

### API Endpoint Verification

```bash
# 1. Test public endpoint
curl http://localhost:8080/api/v1/subscription-plans/active

# 2. Test authenticated endpoint (with token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8080/api/v1/sellers/my-application

# 3. Test admin endpoint (with admin token)
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  http://localhost:8080/api/v1/sellers/applications
```

### Frontend Verification

```bash
# 1. Test seller routes
# Navigate to http://localhost:3000/seller/apply
# Verify page loads

# 2. Test admin routes
# Navigate to http://localhost:3000/dashboard/admin/sellers/applications
# Verify page loads

# 3. Test checkout route
# Navigate to http://localhost:3000/checkout
# Verify page loads
```

---

## 📊 MONITORING CHECKLIST

### Daily Monitoring

- [ ] Check server logs for errors
- [ ] Verify CRON job ran successfully
- [ ] Check payment webhook calls
- [ ] Monitor database performance
- [ ] Check error rates
- [ ] Monitor API response times

### Weekly Monitoring

- [ ] Review audit logs
- [ ] Check failed payments
- [ ] Review rejected applications
- [ ] Monitor storage usage
- [ ] Check backup status
- [ ] Review security logs

### Monthly Monitoring

- [ ] Performance analysis
- [ ] Cost analysis
- [ ] Security audit
- [ ] Capacity planning
- [ ] Update dependencies
- [ ] Review and optimize queries

---

## 🚨 TROUBLESHOOTING

### Issue: CRON Job Not Running

**Solution**:
```bash
# 1. Check if node-cron is installed
npm list node-cron

# 2. Check server logs
tail -f logs/server.log | grep CRON

# 3. Verify CRON job is started
# Look for: "✅ Plan Expiry CRON Job started successfully"

# 4. Check system time
date

# 5. Restart server
npm restart
```

### Issue: Payment Webhook Not Triggering

**Solution**:
```bash
# 1. Verify webhook URL in Razorpay dashboard
# Should be: https://yourdomain.com/api/v1/webhooks/payments/razorpay/success

# 2. Check webhook logs
tail -f logs/webhook.log

# 3. Verify signature verification
# Check if RAZORPAY_KEY_SECRET is correct

# 4. Test webhook manually
curl -X POST http://localhost:8080/api/v1/webhooks/payments/razorpay/success \
  -H "Content-Type: application/json" \
  -d '{"payload": {"payment": {"entity": {"id": "pay_123"}}}}'
```

### Issue: Routes Not Registered

**Solution**:
```bash
# 1. Verify routes in server.js
grep "app.use" server.js

# 2. Check for import errors
npm start 2>&1 | grep -i error

# 3. Verify route files exist
ls -la routes/sellerApplicationRoutesV2.js
ls -la routes/paymentWebhookRoutes.js

# 4. Restart server
npm restart
```

### Issue: Token Not Refreshing

**Solution**:
```bash
# 1. Check tokenVersion in database
db.users.findOne({ _id: ObjectId("...") }).tokenVersion

# 2. Verify generateToken() function
grep -A 10 "generateToken" helpers/tokenHelper.js

# 3. Check token in browser
# Open DevTools → Application → LocalStorage → auth

# 4. Verify token refresh endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8080/api/v1/auth/me
```

---

## 📋 ROLLBACK PROCEDURE

If deployment fails:

```bash
# 1. Stop current deployment
npm stop

# 2. Revert to previous version
git checkout previous-commit-hash

# 3. Reinstall dependencies
npm install

# 4. Restart server
npm start

# 5. Verify rollback successful
curl http://localhost:8080/api/v1/health
```

---

## 🔐 SECURITY CHECKLIST

- [ ] All environment variables set correctly
- [ ] No sensitive data in code
- [ ] HTTPS enabled in production
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] Input validation implemented
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Authentication tokens secure
- [ ] Payment data encrypted
- [ ] Audit logging enabled

---

## 📞 SUPPORT CONTACTS

**Issues**:
- Backend: Check server logs
- Frontend: Check browser console
- Database: Check MongoDB logs
- Payment: Check Razorpay dashboard
- Email: Check email service logs

**Escalation**:
1. Check logs
2. Review recent changes
3. Check monitoring dashboards
4. Contact development team
5. Contact infrastructure team

---

## ✅ FINAL VERIFICATION

Before marking deployment complete:

- [ ] All tests pass
- [ ] No console errors
- [ ] No network errors
- [ ] CRON job running
- [ ] Webhooks working
- [ ] Email notifications working
- [ ] Monitoring active
- [ ] Backups configured
- [ ] Documentation updated
- [ ] Team notified

---

**Deployment Date**: ___________
**Deployed By**: ___________
**Status**: [ ] SUCCESS [ ] FAILED
**Notes**: ___________

---

**Last Updated**: December 4, 2025
**Version**: 1.0
