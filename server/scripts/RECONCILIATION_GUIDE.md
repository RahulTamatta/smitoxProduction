# Payment Reconciliation Guide

## Overview

The payment reconciliation system has two components:

1. **Automatic Logging**: Failed payments are automatically logged to the `FailedPaymentLog` database collection
2. **Reconciliation Script**: Processes failed payments and attempts to create missing orders

## Running Reconciliation

### Quick Start

Process failed payment logs only (recommended for daily runs):

```bash
cd server
node scripts/reconcilePayments.js --failed-logs-only --auto-create
```

### Command Options

| Flag | Description |
|------|-------------|
| `--failed-logs-only` | Only process failed payment logs from database (skip Razorpay API scan) |
| `--auto-create` | Automatically create missing orders (without this, script only generates report) |
| `--from YYYY-MM-DD` | Start date for Razorpay payment scan (default: 30 days ago) |
| `--to YYYY-MM-DD` | End date for Razorpay payment scan (default: today) |
| `--phone PHONE_NUMBER` | Filter by customer phone number |

### Usage Examples

**1. Daily Reconciliation (Recommended)**
```bash
# Process failed payment logs and auto-create orders
node scripts/reconcilePayments.js --failed-logs-only --auto-create
```

**2. Full Scan + Failed Logs**
```bash
# Scan Razorpay for last 7 days AND process failed logs
node scripts/reconcilePayments.js --from 2026-02-07 --auto-create
```

**3. Report Only (No Auto-Create)**
```bash
# Generate report without creating orders
node scripts/reconcilePayments.js --failed-logs-only
```

**4. Specific Customer**
```bash
# Process payments for specific phone number
node scripts/reconcilePayments.js --phone 9876543210 --auto-create
```

## Setting Up Cron Job

For automatic daily reconciliation, add to crontab:

```bash
# Open crontab editor
crontab -e
```

Add this line to run every 5 minutes:

```cron
*/5 * * * * cd /path/to/server && node scripts/reconcilePayments.js --failed-logs-only --auto-create >> /var/log/reconcile.log 2>&1
```

Or run once daily at 2 AM:

```cron
0 2 * * * cd /path/to/server && node scripts/reconcilePayments.js --failed-logs-only --auto-create >> /var/log/reconcile.log 2>&1
```

## Monitoring Failed Payments

### View Failed Payments via API

Get unresolved failed payments:

```bash
curl 'http://your-server.com/api/v1/webhooks/payments/razorpay/customer-order/failed-payments?resolved=false'
```

Get all failed payments (with pagination):

```bash
curl 'http://your-server.com/api/v1/webhooks/payments/razorpay/customer-order/failed-payments?limit=50&skip=0'
```

### Query Database Directly

```javascript
// MongoDB query
db.failedpaymentlogs.find({ resolved: false }).sort({ timestamp: -1 })
```

## Environment Variables Required

Ensure these are set in your `.env`:

```env
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxx  # CRITICAL: Must be configured!
MONGO_URL=mongodb://...
```

> **⚠️ IMPORTANT**: `RAZORPAY_WEBHOOK_SECRET` must be configured or webhooks will be rejected!

## Reconciliation Workflow

1. **Payment Succeeds on Razorpay** ✅
2. **Webhook/Verify-Payment Fails** ❌
   - Network timeout
   - Token expiration  
   - Database conflict
   - etc.
3. **Failed Payment Logged to Database** 📝
4. **Reconciliation Script Runs** (cron)
   - Fetches unresolved logs
   - Checks if order exists
   - Verifies payment status on Razorpay
   - Creates missing order
   - Updates stock
   - Marks log as resolved ✅

## Troubleshooting

### Script Fails with "Module not found"

```bash
cd server
npm install
```

### "RAZORPAY_WEBHOOK_SECRET not configured"

Add the secret to `.env`:
1. Go to Razorpay Dashboard → Settings → Webhooks
2. Copy the webhook secret
3. Add to `.env`: `RAZORPAY_WEBHOOK_SECRET=your_secret_here`

### Orders Still Not Created

1. Check failed payment logs:
   ```bash
   curl 'http://your-server.com/api/v1/webhooks/payments/razorpay/customer-order/failed-payments?resolved=false'
   ```

2. Look for `attemptCount` field - if > 3, manual intervention needed

3. Check `errorMessage` for specific issue

### Testing the Script

```bash
# Dry run (no auto-create)
node scripts/reconcilePayments.js --failed-logs-only

# Expected output:
# Found X unresolved failed payments
# Processing failed payment: pay_xxxxx
# ✅ Order created successfully: order_xxxxx
```

## Success Metrics

After setup, monitor these:

- **Failed Payment Logs**: Should trend towards 0
- **Auto-Recovery Rate**: Should be > 90%
- **Unresolved Payments**: Should be < 5 at any time

## Manual Recovery

For payments that cannot be auto-recovered:

1. Check the `FailedPaymentLog` entry for details
2. Verify payment on Razorpay Dashboard
3. Contact customer if needed
4. Manually create order in admin panel
5. Mark log as resolved:
   ```javascript
   await FailedPaymentLog.findByIdAndUpdate(logId, {
     resolved: true,
     resolvedBy: 'manual',
     resolvedNote: 'Created via admin panel'
   });
   ```
