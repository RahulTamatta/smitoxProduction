# Seller Subscription System - Complete Architecture Documentation

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [Database Models](#3-database-models)
4. [State Machine](#4-state-machine)
5. [Payment Flow](#5-payment-flow)
6. [Service Layer](#6-service-layer)
7. [Webhook Processing](#7-webhook-processing)
8. [Background Jobs](#8-background-jobs)
9. [Error Handling](#9-error-handling)
10. [Scenario Walkthroughs](#10-scenario-walkthroughs)
11. [Configuration](#11-configuration)
12. [Migration Guide](#12-migration-guide)
13. [API Reference](#13-api-reference)

---

## 1. Executive Summary

The Smitox Seller Subscription System manages the complete lifecycle of seller onboarding, plan selection, payment processing, and subscription management. The system is built with **production-grade reliability** featuring:

- **Snapshot-based architecture** - Plan details frozen at application time
- **Distributed locking** - Prevents race conditions in concurrent operations
- **Idempotent processing** - Safe retry of failed operations
- **Transaction safety** - MongoDB transactions for multi-document operations
- **Circuit breaker pattern** - Resilient payment gateway integration
- **Comprehensive state machine** - Clear state transitions with validation

### Key Components

| Component | Purpose |
|-----------|---------|
| `subscriptionConfig.js` | Central configuration for states, timing, payment |
| `stateMachine.js` | Validates all state transitions |
| `subscriptionServiceV2.js` | Core business logic with transactions |
| `paymentService.js` | Razorpay integration with circuit breaker |
| `distributedLock.js` | MongoDB-based locking mechanism |
| `razorpayWebhook.js` | Idempotent webhook handler |
| `paymentReconciliation.js` | Periodic sync verification |
| `webhookRetryWorker.js` | Failed webhook retry processing |

---

## 2. System Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER JOURNEY                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌──────┐    ┌──────────┐    ┌──────────┐    ┌─────────┐    ┌───────┐ │
│   │Draft │───▶│Submitted │───▶│ Approved │───▶│ Payment │───▶│Active │ │
│   └──────┘    └──────────┘    └──────────┘    └─────────┘    └───────┘ │
│                    │                ▲               │             │      │
│                    ▼                │               ▼             ▼      │
│              ┌──────────┐     ┌─────────┐    ┌──────────┐  ┌─────────┐ │
│              │ Rejected │     │  Admin  │    │ Webhook  │  │ Expiry  │ │
│              └──────────┘     │ Review  │    │  Handler │  │  Flow   │ │
│                               └─────────┘    └──────────┘  └─────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Component Interaction

```
┌──────────────────────────────────────────────────────────────────┐
│                         API Layer                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ Application API │  │  Payment API    │  │  Webhook API    │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
└───────────┼─────────────────────┼─────────────────────┼──────────┘
            │                     │                     │
            ▼                     ▼                     ▼
┌──────────────────────────────────────────────────────────────────┐
│                      Service Layer                                │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                  Subscription Service V2                     │ │
│  │  • activateSubscription()   • handlePaymentFailure()        │ │
│  │  • autoDowngrade()          • suspendSeller()               │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    Payment Service                          │ │
│  │  • createOrder()            • verifySignature()             │ │
│  │  • fetchPayment()           • Circuit Breaker               │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
            │                     │                     │
            ▼                     ▼                     ▼
┌──────────────────────────────────────────────────────────────────┐
│                      Infrastructure Layer                         │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────┐ │
│  │ Distributed    │  │ State Machine  │  │ Structured Logger  │ │
│  │ Lock Manager   │  │ Validator      │  │ with Correlation   │ │
│  └────────────────┘  └────────────────┘  └────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
            │                     │                     │
            ▼                     ▼                     ▼
┌──────────────────────────────────────────────────────────────────┐
│                        Data Layer                                 │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐ │
│  │ Seller     │  │ Seller     │  │ Subscription│  │ Webhook    │ │
│  │ Application│  │ Profile    │  │ Plan        │  │ Event      │ │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. Database Models

### 3.1 SellerApplication

**Purpose**: Tracks the state of a user's request to become a seller.

**Key Fields**:
| Field | Type | Description |
|-------|------|-------------|
| `status` | String (Enum) | Current application state |
| `selectedPlanId` | ObjectId | Reference to SubscriptionPlan |
| `selectedPlanSnapshot` | Object | Frozen plan details at submission |
| `payment` | Object | Payment transaction details |
| `planStartDate` | Date | When subscription started |
| `planExpiryDate` | Date | When subscription expires |
| `planStatus` | String | Lifecycle status (active/expired) |
| `stateHistory` | Array | Audit trail of all state changes |
| `renewalHistory` | Array | History of all renewals |
| `isImmutable` | Boolean | Locked after activation |

### 3.2 SellerProfile

**Purpose**: Represents the operational state of an active seller.

**Key Fields**:
| Field | Type | Description |
|-------|------|-------------|
| `userId` | ObjectId | Reference to User |
| `currentPlanId` | ObjectId | Active subscription plan |
| `isActive` | Boolean | Whether seller can operate |
| `planExpiresAt` | Date | Subscription expiry |
| `subscriptionStatus` | String | Current status |
| `permissions` | Object | Granted/denied capabilities |
| `statusHistory` | Array | Status change audit trail |

### 3.3 WebhookEvent

**Purpose**: Tracks processed webhooks for idempotency and retry.

**Key Fields**:
| Field | Type | Description |
|-------|------|-------------|
| `eventId` | String (Unique) | Razorpay event identifier |
| `eventType` | String | Event type (payment.captured, etc.) |
| `status` | String | pending/processing/completed/failed |
| `payload` | Mixed | Raw webhook payload |
| `processingAttempts` | Number | Retry count |
| `nextRetryAt` | Date | When to retry failed event |
| `signatureValid` | Boolean | Signature verification result |

---

## 4. State Machine

### 4.1 Application States

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        APPLICATION STATE MACHINE                          │
└──────────────────────────────────────────────────────────────────────────┘

                              ┌─────────┐
                              │  DRAFT  │◄────────────────────┐
                              └────┬────┘                     │
                                   │ submit                   │ reapply
                                   ▼                          │
                              ┌──────────┐               ┌────┴────┐
                              │SUBMITTED │──────────────▶│REJECTED │
                              └────┬─────┘    reject     └─────────┘
                                   │
                                   │ admin review
                                   ▼
                       ┌──────────────────────────┐
                       │      UNDER_REVIEW        │
                       └───────────┬──────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
            free plan│                     paid plan│
                    ▼                             ▼
              ┌──────────┐            ┌─────────────────────────┐
              │ APPROVED │            │APPROVED_PENDING_PAYMENT │◄──┐
              └────┬─────┘            └───────────┬─────────────┘   │
                   │                              │                 │
                   │                    ┌─────────┴─────────┐      │ retry
                   │                    │                   │      │
                   │              success│             fail │      │
                   │                    ▼                   ▼      │
                   │              ┌──────┐    ┌────────────────────┴──┐
                   │              │      │    │APPROVED_PAYMENT_FAILED│
                   │              │      │    └───────────┬───────────┘
                   │              │      │                │
                   │              │      │        max retries exceeded
                   │              │      │                ▼
                   │              │      │    ┌───────────────────────┐
                   │              │      │    │PAYMENT_RETRY_EXHAUSTED│
                   │              │      │    └───────────┬───────────┘
                   │              │      │                │
                   └──────────────┴──────┴────────────────┘
                                         │
                                         ▼
                                   ┌──────────┐
                                   │  ACTIVE  │◄───────────┐
                                   └────┬─────┘            │
                                        │                  │ renew
                              warning   │                  │
                                        ▼                  │
                               ┌───────────────┐           │
                               │ EXPIRING_SOON │───────────┤
                               └───────┬───────┘           │
                                       │                   │
                              no renew │                   │
                                       ▼                   │
                                  ┌─────────┐              │
                                  │ EXPIRED │──────────────┤
                                  └────┬────┘              │
                                       │                   │
                              grace    │                   │
                                       ▼                   │
                              ┌──────────────┐             │
                              │ GRACE_PERIOD │─────────────┘
                              └───────┬──────┘
                                      │
                           no renew   │
                                      ▼
                               ┌───────────┐
                               │ SUSPENDED │
                               └───────────┘
```

### 4.2 Valid Transitions

```javascript
const STATE_TRANSITIONS = {
  'draft': ['submitted'],
  'submitted': ['under_review', 'rejected'],
  'under_review': ['approved_pending_payment', 'approved', 'rejected'],
  'approved_pending_payment': ['active', 'approved_payment_failed', 'cancelled'],
  'approved_payment_failed': ['approved_pending_payment', 'payment_retry_exhausted', 'cancelled'],
  'payment_retry_exhausted': ['approved_pending_payment', 'cancelled'],
  'approved': ['active'],
  'active': ['expiring_soon', 'suspended', 'cancelled'],
  'expiring_soon': ['active', 'expired', 'suspended'],
  'expired': ['grace_period', 'active'],
  'grace_period': ['active', 'suspended'],
  'suspended': ['active'],
  'cancelled': [],  // Terminal state
  'rejected': ['draft'],  // Can reapply
};
```

---

## 5. Payment Flow

### 5.1 Payment Creation (Admin Approves Paid Plan)

```
Admin ──▶ approveApplication() ──▶ PaymentService.createOrder()
                                            │
                                            ▼
                                  ┌──────────────────┐
                                  │ Razorpay Order   │
                                  │ Created          │
                                  └────────┬─────────┘
                                           │
                                           ▼
                              Application.status = 
                              'approved_pending_payment'
                                           │
                                           ▼
                              Return checkout details
                              to frontend
```

### 5.2 Payment Verification (User Pays)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    DUAL PAYMENT CONFIRMATION                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  PATH A: Synchronous (verifyPayment API call)                           │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                            │
│                                                                          │
│  User Payment ──▶ Frontend ──▶ /api/verify-payment                      │
│                                       │                                  │
│                                       ▼                                  │
│                              Verify Signature                            │
│                                       │                                  │
│                                       ▼                                  │
│                              Acquire Lock                                │
│                                       │                                  │
│                                       ▼                                  │
│                              Start Transaction                           │
│                                       │                                  │
│                                       ▼                                  │
│                              Activate Subscription                       │
│                                                                          │
│  PATH B: Asynchronous (Webhook from Razorpay)                           │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                              │
│                                                                          │
│  Razorpay ──▶ /webhooks/razorpay ──▶ payment.captured                   │
│                                              │                           │
│                                              ▼                           │
│                                    Check Idempotency                     │
│                                    (WebhookEvent exists?)                │
│                                              │                           │
│                              ┌───────────────┴───────────────┐          │
│                              ▼                               ▼          │
│                         New Event                     Already Processed │
│                              │                               │          │
│                              ▼                               ▼          │
│                    Store WebhookEvent                   Skip (200 OK)   │
│                              │                                          │
│                              ▼                                          │
│                    Acquire Lock                                         │
│                              │                                          │
│                              ▼                                          │
│                    Check if already activated                           │
│                              │                                          │
│                    ┌─────────┴─────────┐                               │
│                    ▼                   ▼                               │
│               Not Active           Already Active                       │
│                    │                   │                               │
│                    ▼                   ▼                               │
│           Activate Subscription   Skip (idempotent)                    │
│                                                                          │
│  RECONCILIATION (Fallback)                                              │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━                                              │
│                                                                          │
│  paymentReconciliation.js runs every 5 minutes:                         │
│  1. Find applications with 'approved_pending_payment' > 5 min old       │
│  2. Query Razorpay API for order status                                 │
│  3. If paid but not activated → Activate                                │
│  4. If expired → Mark as failed                                         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Circuit Breaker Pattern

```
                    ┌─────────────────────────────────────┐
                    │         CIRCUIT BREAKER             │
                    ├─────────────────────────────────────┤
                    │                                     │
                    │  State: CLOSED (normal operation)   │
                    │         ▼                           │
                    │  ┌──────────────┐                   │
                    │  │ API Request  │                   │
                    │  └──────┬───────┘                   │
                    │         │                           │
                    │  ┌──────┴──────┐                    │
                    │  ▼             ▼                    │
                    │ Success      Failure                │
                    │  │             │                    │
                    │  ▼             ▼                    │
                    │ failures=0   failures++             │
                    │              │                      │
                    │              ▼                      │
                    │        failures >= 5?               │
                    │              │                      │
                    │        ┌─────┴─────┐               │
                    │        ▼           ▼               │
                    │       No          Yes               │
                    │        │           │               │
                    │        │           ▼               │
                    │        │    State: OPEN            │
                    │        │    (reject all calls)    │
                    │        │           │               │
                    │        │           ▼               │
                    │        │    Wait 30 seconds        │
                    │        │           │               │
                    │        │           ▼               │
                    │        │    State: HALF_OPEN       │
                    │        │    (allow test calls)    │
                    │        │           │               │
                    │        └───────────┘               │
                    │                                     │
                    └─────────────────────────────────────┘
```

---

## 6. Service Layer

### 6.1 Subscription Service V2

The enhanced subscription service provides:

1. **Transaction Safety**
   - All multi-document updates wrapped in MongoDB transactions
   - Automatic rollback on any failure
   - Session-based operations for consistency

2. **Distributed Locking**
   - Acquires lock before any subscription modification
   - Prevents race conditions between verify API and webhook
   - Auto-releases on completion or timeout

3. **Idempotent Operations**
   - Checks if already activated before processing
   - Safe to call multiple times with same parameters
   - Returns success for duplicate calls

4. **Audit Trail**
   - Records all state changes in stateHistory
   - Logs to subscription history table
   - Structured logging with correlation IDs

### 6.2 Key Methods

```javascript
// Activate subscription (handles new + renewal)
await subscriptionService.activateSubscription({
  userId,
  applicationId,
  planId,
  paymentId,        // Optional for free plans
  triggeredBy,      // 'user' | 'admin' | 'webhook' | 'system'
  correlationId,    // For request tracing
});

// Handle payment failure
await subscriptionService.handlePaymentFailure({
  applicationId,
  reason,           // Failure reason
  correlationId,
});

// Auto-downgrade after grace period
await subscriptionService.autoDowngrade({
  userId,
  reason: 'Grace period expired',
});

// Admin suspend seller
await subscriptionService.suspendSeller({
  userId,
  reason,
  adminId,
});
```

---

## 7. Webhook Processing

### 7.1 Idempotency Mechanism

```
Webhook Received
       │
       ▼
┌──────────────────┐
│ Extract eventId  │  (payment.id or order.id)
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ WebhookEvent.findOne({ eventId,      │
│   status: ['completed', 'processing']│
│ })                                   │
└────────┬─────────────────────────────┘
         │
   ┌─────┴─────┐
   ▼           ▼
 Found      Not Found
   │           │
   ▼           ▼
 Return     Create WebhookEvent
 200 OK     status: 'processing'
               │
               ▼
         Process Event
               │
         ┌─────┴─────┐
         ▼           ▼
      Success     Failure
         │           │
         ▼           ▼
   status:      status: 'failed'
   'completed'  nextRetryAt: calculated
```

### 7.2 Handled Events

| Event | Action |
|-------|--------|
| `payment.captured` | Activate subscription |
| `payment.failed` | Mark payment as failed, allow retry |
| `order.paid` | Activate subscription (alternative) |
| `refund.created` | Mark refund, consider suspension |
| `payment.dispute.created` | Flag for review |

---

## 8. Background Jobs

### 8.1 Payment Reconciliation

**Purpose**: Catch missed webhooks and fix inconsistent states

**Frequency**: Every 5 minutes

**Actions**:
1. Find `approved_pending_payment` applications older than 5 minutes
2. Query Razorpay API for actual payment status
3. If paid → Activate subscription
4. If expired → Mark as failed
5. Find incomplete activations (user role not updated) → Complete them

### 8.2 Webhook Retry Worker

**Purpose**: Retry failed webhook processing

**Frequency**: Every 1 minute

**Retry Schedule**:
- Attempt 1: Wait 1 minute
- Attempt 2: Wait 5 minutes
- Attempt 3: Wait 15 minutes
- Attempt 4: Wait 1 hour
- Attempt 5: Wait 2 hours
- After 5 attempts: Mark as permanently failed

### 8.3 Plan Expiry Job

**Purpose**: Handle subscription lifecycle transitions

**Actions**:
1. Find subscriptions expiring in 7 days → Send warning email
2. Find expired subscriptions → Start grace period
3. Find grace period ended → Auto-downgrade to free

---

## 9. Error Handling

### 9.1 Error Categories

| Category | Handling |
|----------|----------|
| **Validation** | Return 400 with clear message |
| **Not Found** | Return 404 |
| **Authorization** | Return 403 |
| **Lock Conflict** | Return 423 with retry-after |
| **Payment Gateway** | Retry with backoff, circuit breaker |
| **Database** | Transaction rollback, log and alert |
| **Unexpected** | Log with full stack, return 500 |

### 9.2 Retry Strategy

```javascript
const retryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,      // 1 second
  maxDelay: 10000,      // 10 seconds
  backoffMultiplier: 2, // Exponential backoff
};

// Retry pattern:
// Attempt 1: immediate
// Attempt 2: wait 1 second
// Attempt 3: wait 2 seconds
// Attempt 4: wait 4 seconds (capped at 10)
```

---

## 10. Scenario Walkthroughs

### Scenario A: Happy Path - Paid Plan

```
1. User fills application form
   └─▶ saveDraftApplication() → status: 'draft'

2. User submits application
   └─▶ submitApplication() → status: 'submitted'
       └─▶ Plan snapshot captured and locked

3. Admin reviews and approves
   └─▶ approveApplication()
       └─▶ Create Razorpay order
       └─▶ status: 'approved_pending_payment'

4. User completes payment on Razorpay checkout
   └─▶ Razorpay redirects back to app

5. Frontend calls verifyPayment()
   └─▶ Verify signature ✓
   └─▶ Acquire lock on application
   └─▶ Start MongoDB transaction
   └─▶ Update Application (status: 'active')
   └─▶ Create/Update SellerProfile
   └─▶ Update User (roleString: 'seller')
   └─▶ Increment tokenVersion
   └─▶ Commit transaction
   └─▶ Release lock
   └─▶ Return success + new token version

6. Webhook arrives (payment.captured)
   └─▶ Check WebhookEvent for idempotency
   └─▶ Already processed by verifyPayment
   └─▶ Skip with 200 OK
```

### Scenario B: Payment Failure Recovery

```
1. User pays → Payment fails midway
   └─▶ verifyPayment() times out

2. Webhook arrives (payment.captured)
   └─▶ Check idempotency → Not processed
   └─▶ Create WebhookEvent
   └─▶ Acquire lock
   └─▶ activateSubscription()
   └─▶ User role updated to 'seller'

3. User's frontend still has old token
   └─▶ API calls return 403 (old permissions)
   └─▶ Frontend redirects to login
   └─▶ New JWT issued with seller role
```

### Scenario C: Concurrent Operations

```
Timeline:
─────────────────────────────────────────────────────────────
T0: verifyPayment() called, acquires lock
T1: Webhook arrives, tries to acquire lock (waiting...)
T2: verifyPayment() completes activation
T3: verifyPayment() releases lock
T4: Webhook acquires lock
T5: Webhook checks status → already 'active'
T6: Webhook skips activation (idempotent)
T7: Webhook releases lock
─────────────────────────────────────────────────────────────

Result: Only one activation occurs, no duplicate processing
```

### Scenario D: Plan Price Changed During Approval

```
1. User submits application for Plan A ($99/month)
   └─▶ Snapshot captured: { price: 99, name: 'Plan A', ... }

2. 5 days pass, admin delays review

3. Admin updates Plan A price to $149/month

4. Admin approves application
   └─▶ System uses SNAPSHOT price ($99), not current ($149)
   └─▶ Razorpay order created for $99
   └─▶ User pays $99

5. Decision: We HONOR the locked price
   └─▶ User gets Plan A at $99
   └─▶ Next renewal will be at current price ($149)
   └─▶ Warning logged for audit
```

### Scenario E: System Crash During Activation

```
1. Payment verified
2. Transaction started
3. SellerProfile created ✓
4. Server crashes before User.roleString update

5. On next startup, reconciliation job runs
   └─▶ Find applications with status: 'approved'/'active'
   └─▶ Lookup user.roleString
   └─▶ If not 'seller' → Incomplete activation detected

6. Re-run activateSubscription()
   └─▶ Already has SellerProfile
   └─▶ Updates only missing fields (User role)
   └─▶ Completes activation
```

### Scenario F: Webhook Signature Failure

```
1. Webhook arrives
   └─▶ Extract signature from header

2. Verify signature
   └─▶ Compute expected signature using webhook secret
   └─▶ Compare with received signature
   └─▶ MISMATCH ✗

3. Response: 200 OK (acknowledge receipt)
   └─▶ But DO NOT process

4. Log with severity: ERROR
   └─▶ signatureValid: false in WebhookEvent
   └─▶ Store payload for investigation

5. Alert ops team
   └─▶ Possible: wrong webhook secret
   └─▶ Possible: man-in-the-middle attack
   └─▶ Possible: Razorpay bug
```

---

## 11. Configuration

### Environment Variables

```bash
# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxx

# Database
MONGODB_URI=mongodb://localhost:27017/smitox

# Logging
LOG_LEVEL=info  # debug | info | warn | error

# Optional
NODE_ENV=production
```

### Timing Configuration

```javascript
const SUBSCRIPTION_CONFIG = {
  timing: {
    gracePeriodDays: 30,          // Days after expiry
    expiryWarningDays: 7,         // Days before expiry to warn
    paymentRetryMaxAttempts: 3,   // Max payment retries
    paymentRetryWindow: 72,       // Hours to retry payment
    lockTimeout: 30000,           // 30 seconds
  },
  billingCycles: {
    monthly: 30,
    quarterly: 90,
    yearly: 365,
  },
};
```

---

## 12. Migration Guide

### Database Migrations

```javascript
// Add stateHistory to existing applications
db.sellerapplications.updateMany(
  { stateHistory: { $exists: false } },
  { 
    $set: { 
      stateHistory: [{
        fromState: null,
        toState: '$status',
        changedAt: '$createdAt',
        changedBy: 'migration',
        reason: 'Migration initialization'
      }]
    }
  }
);

// Create WebhookEvent collection indexes
db.webhookevents.createIndex({ eventId: 1 }, { unique: true });
db.webhookevents.createIndex({ status: 1, nextRetryAt: 1 });
db.webhookevents.createIndex({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

// Create DistributedLock collection indexes
db.distributedlocks.createIndex({ key: 1 }, { unique: true });
db.distributedlocks.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
```

### Rollback Plan

1. Revert code deployment
2. Keep new collections (webhookevents, distributedlocks) - they don't affect old code
3. Old code will work with existing application statuses
4. New states (payment_retry_exhausted, etc.) will be handled as unknown by old code

---

## 13. API Reference

### Verify Payment

```
POST /api/v2/seller-application/verify-payment

Headers:
  Authorization: Bearer <jwt>

Body:
{
  "razorpay_order_id": "order_xxxxx",
  "razorpay_payment_id": "pay_xxxxx",
  "razorpay_signature": "xxxxx"
}

Response (Success):
{
  "success": true,
  "message": "Payment verified and subscription activated",
  "status": "active",
  "tokenVersion": 5
}

Response (Already Processed):
{
  "success": true,
  "alreadyActive": true,
  "status": "active"
}
```

### Razorpay Webhook

```
POST /webhooks/razorpay

Headers:
  X-Razorpay-Signature: xxxxx
  Content-Type: application/json

Body: (Raw Razorpay webhook payload)

Response:
{
  "status": "received"
}
```

### Get Subscription Status

```
GET /api/v2/seller/subscription/status

Headers:
  Authorization: Bearer <jwt>

Response:
{
  "success": true,
  "data": {
    "status": "active",
    "plan": {
      "name": "Premium",
      "price": 999
    },
    "expiresAt": "2024-02-19T00:00:00Z",
    "daysUntilExpiry": 25,
    "permissions": {
      "grantedCapabilities": ["bulk_upload", "analytics"],
      "deniedCapabilities": []
    }
  }
}
```

---

## Summary

This implementation provides a **production-grade seller subscription system** with:

✅ **State Machine** - Clear, validated state transitions  
✅ **Distributed Locking** - No race conditions  
✅ **Idempotency** - Safe duplicate processing  
✅ **Transaction Safety** - Atomic multi-document updates  
✅ **Circuit Breaker** - Resilient payment gateway calls  
✅ **Retry Logic** - Automatic recovery from failures  
✅ **Reconciliation** - Catches missed webhooks  
✅ **Audit Trail** - Complete history of all changes  
✅ **Structured Logging** - Correlation IDs for debugging  

The system is designed to handle high concurrency, network failures, and system crashes while maintaining data consistency and providing a seamless user experience.
