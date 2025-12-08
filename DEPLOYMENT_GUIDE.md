# RBAC & Payment System - Deployment Guide

## 📋 Pre-Deployment Checklist

### Environment Setup
- [ ] Node.js v14+ installed
- [ ] MongoDB running and accessible
- [ ] Razorpay account created and API keys obtained
- [ ] All environment variables configured

### Code Review
- [ ] All tests passing
- [ ] No console errors or warnings
- [ ] Code follows project standards
- [ ] Documentation updated

---

## 🔧 Environment Variables

### Backend (.env)
```env
# Server
PORT=8080
NODE_ENV=production

# Database
MONGO_URL=mongodb+srv://user:password@cluster.mongodb.net/dbname

# JWT
JWT_SECRET=your_jwt_secret_key_here

# Razorpay
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Cloudinary (for image uploads)
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Frontend (.env)
```env
REACT_APP_API_URL=https://api.yourdomain.com
REACT_APP_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
```

---

## 🚀 Deployment Steps

### 1. Backend Deployment

#### Step 1.1: Install Dependencies
```bash
cd /path/to/smitoxProduction
npm install
```

#### Step 1.2: Run Tests
```bash
npm test -- tests/rbac.integration.test.js
```

#### Step 1.3: Database Migration
```bash
# If using migration scripts
node scripts/migrateRoleString.js
node scripts/seedRbacData.js
```

#### Step 1.4: Start Server
```bash
# Development
npm run dev

# Production
npm start
```

### 2. Frontend Deployment

#### Step 2.1: Install Dependencies
```bash
cd /path/to/smitoxProduction/client
npm install
```

#### Step 2.2: Build
```bash
npm run build
```

#### Step 2.3: Deploy Build
```bash
# Option 1: Netlify
netlify deploy --prod --dir=build

# Option 2: Vercel
vercel --prod

# Option 3: Traditional Server
# Copy build/ folder to server's public directory
scp -r build/* user@server:/var/www/html/
```

---

## 📝 Database Setup

### 1. Create Collections
MongoDB will auto-create collections, but ensure these models are initialized:

```javascript
// These will be created on first use
- users
- subscriptionplans
- sellerapplications
- sellerprofiles
- payments
- auditlogs
```

### 2. Create Indexes
```bash
# Run this script to create indexes
node scripts/createIndexes.js
```

### 3. Seed Initial Data (Optional)
```bash
# Create default subscription plans
node scripts/seedRbacData.js
```

---

## 🔐 Security Hardening

### 1. HTTPS/SSL
```bash
# Ensure all traffic is encrypted
# Use Let's Encrypt for free SSL certificates
sudo certbot certonly --standalone -d yourdomain.com
```

### 2. Environment Variables
```bash
# Never commit .env file
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
```

### 3. CORS Configuration
```javascript
// In server.js
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

### 4. Rate Limiting
```javascript
// Install: npm install express-rate-limit
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### 5. Input Validation
```javascript
// All inputs are validated in controllers
// Use mongoose schema validation
// Sanitize user inputs
```

---

## 📊 Monitoring & Logging

### 1. Application Logs
```bash
# Use PM2 for process management
npm install -g pm2
pm2 start server.js --name "smitox-api"
pm2 logs smitox-api
```

### 2. Error Tracking
```bash
# Optional: Use Sentry for error tracking
npm install @sentry/node
```

### 3. Database Monitoring
```bash
# Monitor MongoDB
# Use MongoDB Atlas dashboard
# Check connection pool usage
# Monitor query performance
```

### 4. Audit Logs
```bash
# View audit logs
db.auditlogs.find().sort({ createdAt: -1 }).limit(100)
```

---

## 🧪 Post-Deployment Testing

### 1. API Endpoints
```bash
# Test authentication
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email_id":"test@example.com","password":"password"}'

# Test subscription plans
curl http://localhost:8080/api/v1/subscription-plans/active

# Test payment creation
curl -X POST http://localhost:8080/api/v1/payments/create-order \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"amount":50000,"planId":"plan_id","planName":"Premium"}'
```

### 2. Frontend Testing
- [ ] Login flow works
- [ ] Subscription plans display correctly
- [ ] Plan selection works
- [ ] Payment modal opens
- [ ] Payment verification works
- [ ] Seller application form displays
- [ ] Admin dashboard accessible
- [ ] Subscription plan management works

### 3. Payment Testing
- [ ] Use Razorpay test cards
- [ ] Verify payment signature
- [ ] Check payment record in database
- [ ] Verify audit logs created

### 4. RBAC Testing
- [ ] Super admin has all capabilities
- [ ] Admin has limited capabilities
- [ ] Seller cannot access admin features
- [ ] User cannot create products
- [ ] Capability guards working

---

## 🔄 Continuous Deployment

### 1. GitHub Actions (Optional)
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: npm test
      - name: Deploy to production
        run: npm run deploy
```

### 2. Docker Deployment (Optional)
```dockerfile
# Dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8080
CMD ["npm", "start"]
```

```bash
# Build and run
docker build -t smitox-api .
docker run -p 8080:8080 --env-file .env smitox-api
```

---

## 🚨 Troubleshooting

### Issue: Payment Not Verifying
**Solution:**
1. Check Razorpay credentials in .env
2. Verify signature calculation
3. Check order ID and payment ID format
4. Review backend logs

### Issue: Seller Role Not Updating
**Solution:**
1. Verify approveSellerApplication is called
2. Check token refresh is working
3. Verify user permissions are merged
4. Check database for user role update

### Issue: Capabilities Not in Token
**Solution:**
1. Verify computeCapabilities is called
2. Check ROLE_CAPABILITIES mapping
3. Verify user permissions in database
4. Check token payload in JWT

### Issue: Audit Logs Not Created
**Solution:**
1. Verify auditLog middleware is applied
2. Check MongoDB connection
3. Verify AuditLog model is imported
4. Check for errors in logAuditEvent

---

## 📈 Performance Optimization

### 1. Database Optimization
```javascript
// Add indexes
db.users.createIndex({ roleString: 1 });
db.sellerapplications.createIndex({ status: 1, createdAt: -1 });
db.payments.createIndex({ userId: 1, status: 1 });
```

### 2. Caching
```javascript
// Cache subscription plans
const cache = new Map();
const CACHE_TTL = 3600000; // 1 hour

function getCachedPlans() {
  if (cache.has('plans') && Date.now() - cache.get('plans').time < CACHE_TTL) {
    return cache.get('plans').data;
  }
  // Fetch from database
}
```

### 3. API Optimization
- Use pagination on all list endpoints
- Implement field selection
- Use database projections
- Enable response compression

---

## 🔄 Rollback Procedure

### If Deployment Fails
```bash
# 1. Stop current deployment
pm2 stop smitox-api

# 2. Revert to previous version
git revert HEAD
git push origin main

# 3. Reinstall dependencies
npm install

# 4. Restart server
pm2 start smitox-api

# 5. Verify logs
pm2 logs smitox-api
```

---

## 📞 Support Contacts

- **Technical Lead**: [Contact Info]
- **DevOps**: [Contact Info]
- **Database Admin**: [Contact Info]

---

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database backups created
- [ ] Code reviewed and approved
- [ ] Documentation updated

### Deployment
- [ ] Backend deployed
- [ ] Frontend deployed
- [ ] Database migrations run
- [ ] Seed data created
- [ ] SSL certificates configured

### Post-Deployment
- [ ] All endpoints tested
- [ ] Payment flow verified
- [ ] RBAC working correctly
- [ ] Audit logs being created
- [ ] Monitoring enabled
- [ ] Team notified

---

## 📚 Additional Resources

- [RBAC Implementation Guide](./RBAC_FINAL_IMPLEMENTATION_SUMMARY.md)
- [Payment Integration Guide](./PAYMENT_INTEGRATION_GUIDE.md)
- [RBAC Setup Guide](./RBAC_SETUP_GUIDE.md)
- [API Documentation](./API_DOCS.md)

---

**Deployment Guide – Complete ✅**

*Last Updated: December 4, 2025*
*Version: 1.0*
