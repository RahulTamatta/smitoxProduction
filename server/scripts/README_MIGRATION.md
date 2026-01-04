# Order Snapshot Data Migration

## Overview

This migration script populates missing snapshot data for existing orders in the database. The snapshot data ensures that order details remain unchanged even if product information (prices, names, images) is modified after the order is placed.

## What Gets Migrated

For each product in every order, the script populates:

- **unitPrice**: Price per unit at time of order
- **netAmount**: unitPrice × quantity (before tax)
- **taxAmount**: GST amount calculated on netAmount
- **totalAmount**: netAmount + taxAmount
- **gst**: GST percentage at time of order
- **productName**: Product name snapshot
- **productImage**: Product image URL snapshot
- **unitSet**: Unit set value snapshot

## Prerequisites

1. **Backup your database** before running the migration
2. Ensure MongoDB is running
3. Ensure `.env` file has correct `MONGO_URL` configuration

## How to Run

### Step 1: Backup Database (IMPORTANT!)

```bash
# Create a backup of your database
mongodump --uri="your_mongodb_connection_string" --out=./backup_before_migration
```

### Step 2: Run the Migration Script

```bash
# Navigate to the project root directory
cd /Users/MyWork/GitHub/Companies/smitox/smitoxProduction

# Run the migration script
node scripts/migrateOrderSnapshots.js
```

### Step 3: Verify Results

The script will output:
- ✅ Number of orders updated
- ⏭️ Number of orders skipped (already had snapshot data)
- ❌ Number of orders with errors
- 📦 Total orders processed

## What the Script Does

1. **Connects to MongoDB** using the connection string from `.env`
2. **Fetches all orders** with populated product details
3. **For each order product**:
   - Checks if snapshot data already exists (skips if yes)
   - Fetches full product details if needed
   - Calculates unit price (uses existing price or calculates bulk price)
   - Calculates GST and amounts
   - Saves snapshot data to the order
4. **Saves updated orders** back to the database
5. **Displays summary** of migration results

## Bulk Price Calculation Logic

The script uses the same bulk pricing logic that was previously in the admin interface:

1. Checks if product has bulk pricing tiers
2. Sorts bulk tiers by minimum quantity (descending)
3. Finds the applicable tier based on order quantity and unitSet
4. Falls back to regular price if no bulk tier applies

## Example Output

```
🚀 Starting order snapshot migration...

✅ Connected to MongoDB

📦 Found 150 orders to process

✅ Updated order: 507f1f77bcf86cd799439011
✅ Updated order: 507f191e810c19729de860ea
⏭️  Order already has snapshot data: 507f191e810c19729de860eb
...

==================================================
📊 Migration Summary:
==================================================
✅ Orders updated: 145
⏭️  Orders skipped (already had snapshot data): 3
❌ Orders with errors: 2
📦 Total orders processed: 150
==================================================

🎉 Migration completed successfully!
✅ Database connection closed
```

## Troubleshooting

### Error: "Product not found"
- Some orders may reference deleted products
- The script will log these and continue with other orders
- These orders will use basic fallback values

### Error: "Connection refused"
- Check if MongoDB is running
- Verify `MONGO_URL` in `.env` file
- Ensure network connectivity to database

### Error: "Out of memory"
- If you have a very large number of orders, you may need to process in batches
- Contact developer for batch processing version

## After Migration

Once the migration is complete:

1. **Test the admin order interface** to ensure prices display correctly
2. **Verify a few orders** to confirm snapshot data is accurate
3. **Check that editing orders** no longer recalculates bulk prices
4. **The migration is idempotent** - safe to run multiple times (will skip already migrated orders)

## Rollback

If you need to rollback:

```bash
# Restore from backup
mongorestore --uri="your_mongodb_connection_string" ./backup_before_migration
```

## Future Orders

All new orders created after deploying the updated code will automatically include snapshot data. This migration is only needed for existing orders.

## Support

If you encounter issues:
1. Check the console output for specific error messages
2. Verify database connectivity
3. Ensure all dependencies are installed (`npm install`)
4. Contact the development team with the error logs
