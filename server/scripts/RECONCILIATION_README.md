# Payment Reconciliation Script

## Description
This script checks for Razorpay payments that don't have corresponding orders in your database and helps you reconcile them.

## Usage

### Basic Reconciliation (Last 30 days)
```bash
node scripts/reconcilePayments.js
```

### Reconciliation for Specific Date Range
```bash
node scripts/reconcilePayments.js --from=2026-02-01 --to=2026-02-13
```

### Search for Specific Phone Number
```bash
node scripts/reconcilePayments.js --phone="+91 99023 03240"
# or
node scripts/reconcilePayments.js --phone=9902303240
```

### Auto-Create Missing Orders
```bash
node scripts/reconcilePayments.js --auto-create
```

### Combined Example
```bash
node scripts/reconcilePayments.js --from=2026-02-01 --to=2026-02-13 --phone=9902303240 --auto-create
```

## Parameters

- `--from=YYYY-MM-DD` - Start date for payment search (default: 30 days ago)
- `--to=YYYY-MM-DD` - End date for payment search (default: today)
- `--phone=<number>` - Filter by phone number (supports with/without country code)
- `--auto-create` - Automatically create missing orders instead of just reporting

## Output

The script will:
1. Connect to MongoDB
2. Fetch Razorpay payments for the date range
3. Check each payment against your orders database
4. Generate a report showing:
   - Total payments found
   - Orders that exist
   - Missing orders with details (payment ID, amount, phone, email, user)

## Safety

- Without `--auto-create`, the script only generates a report
- With `--auto-create`, it will create orders in a database transaction
- Stock levels are updated automatically when orders are created
- All operations are logged for audit purposes

## Requirements

- MongoDB connection configured in `.env`
- Razorpay API keys in `.env`
- Node.js with ES modules support
