# Quick Start Guide - Order Snapshot Migration

## ⚡ TL;DR - Run This Now

```bash
# 1. Backup database (REQUIRED!)
mongodump --uri="mongodb://localhost:27017/smitox" --out=./backup_$(date +%Y%m%d_%H%M%S)

# 2. Run migration
node scripts/migrateOrderSnapshots.js

# 3. Done! Check the output for summary
```

---

## 📋 What This Does

- Adds missing price/product snapshot data to existing orders
- Ensures order prices don't change when product prices are updated
- Safe to run multiple times (skips already migrated orders)

---

## ⚠️ Before Running

1. **BACKUP YOUR DATABASE** (see command above)
2. Make sure MongoDB is running
3. Verify `.env` has correct `MONGO_URL`

---

## 🎯 Expected Output

```
🚀 Starting order snapshot migration...
✅ Connected to MongoDB
📦 Found 150 orders to process

✅ Updated order: 507f1f77bcf86cd799439011
✅ Updated order: 507f191e810c19729de860ea
...

==================================================
📊 Migration Summary:
==================================================
✅ Orders updated: 145
⏭️  Orders skipped: 3
❌ Orders with errors: 2
📦 Total orders processed: 150
==================================================

🎉 Migration completed successfully!
```

---

## 🔍 Verify Migration

After running, check a few orders in the admin panel:
- Prices should display correctly
- Product names should show even if product is deleted
- Editing quantities shouldn't recalculate bulk prices

---

## 🆘 If Something Goes Wrong

```bash
# Restore from backup
mongorestore --uri="mongodb://localhost:27017/smitox" ./backup_YYYYMMDD_HHMMSS
```

---

## 📞 Need Help?

Check `README_MIGRATION.md` for detailed documentation.
