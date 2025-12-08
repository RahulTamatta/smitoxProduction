# Payment Integration Guide - Razorpay

## Overview
This guide explains the payment integration for subscription plans using Razorpay payment gateway.

---

## 🔧 Setup Instructions

### 1. Environment Variables
Add these to your `.env` file:

```env
# Razorpay Credentials
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Frontend
REACT_APP_RAZORPAY_KEY_ID=your_razorpay_key_id
```

### 2. Install Dependencies
```bash
# Backend
npm install razorpay

# Frontend (already included in package.json)
# Add Razorpay script to public/index.html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

### 3. Database Setup
Ensure MongoDB is running and the payment model is created:
```bash
# The payment model will auto-create on first use
```

---

## 💳 Payment Flow

### Frontend Flow (SellerPlanSelection.jsx)

```
User selects plan
    ↓
Clicks "Pay ₹X" button
    ↓
Backend creates Razorpay order
    ↓
Razorpay payment modal opens
    ↓
User completes payment
    ↓
Frontend receives payment response
    ↓
Backend verifies signature
    ↓
Payment marked as completed
    ↓
Redirect to seller application form
```

### Backend Flow (paymentController.js)

```
POST /api/v1/payments/create-order
    ↓
Validate plan exists
    ↓
Create Razorpay order
    ↓
Save payment record (status: pending)
    ↓
Return order ID to frontend

POST /api/v1/payments/verify-payment
    ↓
Verify Razorpay signature
    ↓
Update payment record (status: completed)
    ↓
Log audit event
    ↓
Return success response
```

---

## 📡 API Endpoints

### 1. Create Payment Order
```http
POST /api/v1/payments/create-order
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 50000,        // Amount in paise (₹500)
  "planId": "plan_id",
  "planName": "Premium Plan"
}

Response:
{
  "success": true,
  "orderId": "order_123456",
  "amount": 50000,
  "currency": "INR",
  "paymentId": "payment_record_id"
}
```

### 2. Verify Payment
```http
POST /api/v1/payments/verify-payment
Authorization: Bearer <token>
Content-Type: application/json

{
  "razorpay_order_id": "order_123456",
  "razorpay_payment_id": "pay_123456",
  "razorpay_signature": "signature_hash",
  "planId": "plan_id"
}

Response:
{
  "success": true,
  "message": "Payment verified successfully",
  "payment": {
    "_id": "payment_id",
    "status": "completed",
    "amount": 500,
    "planId": "plan_id"
  }
}
```

### 3. Get Payment Details
```http
GET /api/v1/payments/:paymentId
Authorization: Bearer <token>

Response:
{
  "success": true,
  "payment": {
    "_id": "payment_id",
    "userId": "user_id",
    "planId": { "name": "Premium", "price": 500 },
    "amount": 500,
    "status": "completed",
    "razorpayPaymentId": "pay_123456",
    "completedAt": "2025-12-04T10:30:00Z"
  }
}
```

### 4. Get User Payment History
```http
GET /api/v1/payments?page=1&limit=10&status=completed
Authorization: Bearer <token>

Response:
{
  "success": true,
  "payments": [
    {
      "_id": "payment_id",
      "planId": { "name": "Premium", "price": 500 },
      "amount": 500,
      "status": "completed",
      "createdAt": "2025-12-04T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "pages": 1
  }
}
```

---

## 🔐 Security Features

### Signature Verification
```javascript
// Backend verifies Razorpay signature
const body = razorpay_order_id + "|" + razorpay_payment_id;
const expectedSignature = crypto
  .createHmac("sha256", RAZORPAY_KEY_SECRET)
  .update(body)
  .digest("hex");

if (expectedSignature !== razorpay_signature) {
  // Payment is fraudulent
  return res.status(400).send({ success: false });
}
```

### Audit Logging
All payment operations are logged:
- Payment order creation
- Payment verification
- Payment status changes
- Refunds (future)

### Authentication
- All payment endpoints require `requireSignIn` middleware
- User can only access their own payment history
- Admin can view all payments

---

## 💰 Payment Statuses

| Status | Description |
|--------|-------------|
| `pending` | Order created, awaiting payment |
| `completed` | Payment verified and successful |
| `failed` | Payment failed or signature invalid |
| `refunded` | Payment refunded to user |

---

## 🧪 Testing

### Test Payment Cards (Razorpay Sandbox)

**Successful Payment:**
- Card: 4111 1111 1111 1111
- Expiry: Any future date
- CVV: Any 3 digits

**Failed Payment:**
- Card: 4222 2222 2222 2220
- Expiry: Any future date
- CVV: Any 3 digits

### Test Flow
1. Go to `/become-seller`
2. Select a paid plan
3. Click "Pay ₹X"
4. Use test card from above
5. Complete payment
6. Verify payment record in database

---

## 📊 Payment Model Schema

```javascript
{
  userId: ObjectId,              // User making payment
  planId: ObjectId,              // Subscription plan
  razorpayOrderId: String,       // Unique order ID from Razorpay
  razorpayPaymentId: String,     // Payment ID after completion
  razorpaySignature: String,     // Signature for verification
  amount: Number,                // Amount in rupees
  currency: String,              // "INR"
  status: String,                // pending, completed, failed, refunded
  paymentMethod: String,         // razorpay, stripe, paypal
  refundAmount: Number,          // Amount refunded
  refundReason: String,          // Reason for refund
  refundedAt: Date,              // When refund was processed
  completedAt: Date,             // When payment was completed
  notes: String,                 // Additional notes
  createdAt: Date,               // Payment creation time
  updatedAt: Date                // Last update time
}
```

---

## 🔄 Integration with Seller Application

### After Successful Payment

1. **Payment Verified**
   ```javascript
   POST /api/v1/payments/verify-payment
   // Returns: { success: true, payment, planId }
   ```

2. **Redirect to Seller Form**
   ```javascript
   navigate("/become-seller", {
     state: { 
       selectedPlanId: planId,
       paymentId: razorpay_payment_id 
     }
   });
   ```

3. **Submit Application**
   ```javascript
   POST /api/v1/sellers/applications/submit
   {
     selectedPlanId: planId,
     paymentId: paymentId,
     // ... other seller details
   }
   ```

4. **Admin Approval**
   ```javascript
   PUT /api/v1/sellers/applications/:id/approve
   // Merges plan capabilities into seller permissions
   // Returns: { success: true, token, user }
   ```

---

## 🚨 Error Handling

### Common Errors

**Invalid Signature**
```json
{
  "success": false,
  "message": "Payment verification failed - Invalid signature"
}
```

**Plan Not Found**
```json
{
  "success": false,
  "message": "Subscription plan not found"
}
```

**Payment Record Not Found**
```json
{
  "success": false,
  "message": "Payment record not found"
}
```

### Frontend Error Handling
```javascript
try {
  const response = await axios.post('/api/v1/payments/verify-payment', data);
  if (response.data.success) {
    toast.success("Payment successful!");
    // Redirect to next step
  } else {
    toast.error(response.data.message);
  }
} catch (error) {
  toast.error("Payment verification failed");
  console.error(error);
}
```

---

## 📈 Monitoring & Analytics

### Payment Metrics
- Total payments processed
- Success rate
- Average payment amount
- Payment method distribution
- Refund rate

### Audit Logs
All payments are logged in the audit log:
```javascript
{
  actor: userId,
  action: "create_payment_order" | "payment_verified",
  resourceType: "payment",
  resourceId: paymentId,
  severity: "medium" | "high",
  description: "Payment order created for plan: Premium",
  ipAddress: "192.168.1.1",
  userAgent: "Mozilla/5.0..."
}
```

---

## 🔄 Refund Process (Future Implementation)

```javascript
// Refund endpoint (to be implemented)
PUT /api/v1/payments/:paymentId/refund
{
  "refundAmount": 500,
  "refundReason": "User requested cancellation"
}

// Process:
// 1. Verify payment is completed
// 2. Call Razorpay refund API
// 3. Update payment record
// 4. Log audit event
// 5. Notify user
```

---

## 🛠️ Troubleshooting

### Payment Modal Not Opening
- Check if Razorpay script is loaded: `window.Razorpay`
- Verify `REACT_APP_RAZORPAY_KEY_ID` is set
- Check browser console for errors

### Signature Verification Failing
- Ensure `RAZORPAY_KEY_SECRET` is correct
- Check order ID and payment ID are correct
- Verify signature format: `order_id|payment_id`

### Payment Not Saved to Database
- Check MongoDB connection
- Verify payment model is imported
- Check for validation errors in payment data

### User Not Redirected After Payment
- Check if verification response is successful
- Verify navigation path is correct
- Check browser console for errors

---

## 📚 References

- [Razorpay Documentation](https://razorpay.com/docs/)
- [Razorpay Payment Gateway](https://razorpay.com/docs/payments/)
- [Razorpay Signature Verification](https://razorpay.com/docs/payments/payment-gateway/verify-signature/)
- [Razorpay Test Cards](https://razorpay.com/docs/payments/payments/test-mode/)

---

## ✅ Checklist

- [ ] Razorpay account created
- [ ] API keys added to .env
- [ ] Razorpay script added to HTML
- [ ] Payment model created
- [ ] Payment controller implemented
- [ ] Payment routes registered
- [ ] Frontend component created
- [ ] Payment flow tested
- [ ] Signature verification working
- [ ] Audit logging enabled
- [ ] Error handling implemented
- [ ] Documentation complete

---

**Payment Integration Guide – Complete ✅**

*Last Updated: December 4, 2025*
