/**
 * Database Migration Script for Subscription System V2
 * Run this script to add new fields and indexes
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const runMigration = async () => {
    try {
        console.log('🚀 Starting Subscription System V2 Migration...\n');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const db = mongoose.connection.db;

        // ============================================
        // 1. Seller Applications - Add new fields
        // ============================================
        console.log('📦 Migrating SellerApplications...');

        // Add stateHistory to existing applications
        const appResults = await db.collection('sellerapplications').updateMany(
            { stateHistory: { $exists: false } },
            [
                {
                    $set: {
                        stateHistory: [{
                            fromState: null,
                            toState: '$status',
                            changedAt: '$createdAt',
                            changedBy: 'migration',
                            reason: 'Migration initialization',
                        }],
                    },
                },
            ]
        );
        console.log(`   - Added stateHistory to ${appResults.modifiedCount} applications`);

        // Add payment retryCount if missing
        const retryResults = await db.collection('sellerapplications').updateMany(
            {
                'payment.orderId': { $exists: true },
                'payment.retryCount': { $exists: false },
            },
            {
                $set: { 'payment.retryCount': 0 },
            }
        );
        console.log(`   - Added retryCount to ${retryResults.modifiedCount} applications`);

        console.log('');

        // ============================================
        // 2. Create WebhookEvents collection
        // ============================================
        console.log('📦 Setting up WebhookEvents collection...');

        // Check if collection exists
        const collections = await db.listCollections({ name: 'webhookevents' }).toArray();

        if (collections.length === 0) {
            await db.createCollection('webhookevents');
            console.log('   - Created webhookevents collection');
        } else {
            console.log('   - webhookevents collection already exists');
        }

        // Create indexes
        try {
            await db.collection('webhookevents').createIndex(
                { eventId: 1 },
                { unique: true, background: true }
            );
            console.log('   - Created unique index on eventId');
        } catch (e) {
            console.log('   - eventId index already exists');
        }

        try {
            await db.collection('webhookevents').createIndex(
                { status: 1, nextRetryAt: 1 },
                { background: true }
            );
            console.log('   - Created index on status + nextRetryAt');
        } catch (e) {
            console.log('   - status + nextRetryAt index already exists');
        }

        try {
            await db.collection('webhookevents').createIndex(
                { paymentId: 1, eventType: 1 },
                { background: true }
            );
            console.log('   - Created index on paymentId + eventType');
        } catch (e) {
            console.log('   - paymentId + eventType index already exists');
        }

        // TTL index for automatic cleanup (90 days)
        try {
            await db.collection('webhookevents').createIndex(
                { createdAt: 1 },
                { expireAfterSeconds: 90 * 24 * 60 * 60, background: true }
            );
            console.log('   - Created TTL index (90 days retention)');
        } catch (e) {
            console.log('   - TTL index already exists');
        }

        console.log('');

        // ============================================
        // 3. Create DistributedLocks collection
        // ============================================
        console.log('📦 Setting up DistributedLocks collection...');

        const lockCollections = await db.listCollections({ name: 'distributedlocks' }).toArray();

        if (lockCollections.length === 0) {
            await db.createCollection('distributedlocks');
            console.log('   - Created distributedlocks collection');
        } else {
            console.log('   - distributedlocks collection already exists');
        }

        try {
            await db.collection('distributedlocks').createIndex(
                { key: 1 },
                { unique: true, background: true }
            );
            console.log('   - Created unique index on key');
        } catch (e) {
            console.log('   - key index already exists');
        }

        try {
            await db.collection('distributedlocks').createIndex(
                { expiresAt: 1 },
                { expireAfterSeconds: 0, background: true }
            );
            console.log('   - Created TTL index on expiresAt');
        } catch (e) {
            console.log('   - expiresAt TTL index already exists');
        }

        console.log('');

        // ============================================
        // 4. Update SellerProfiles - Add statusHistory
        // ============================================
        console.log('📦 Migrating SellerProfiles...');

        const profileResults = await db.collection('sellerprofiles').updateMany(
            { statusHistory: { $exists: false } },
            [
                {
                    $set: {
                        statusHistory: [{
                            status: '$subscriptionStatus',
                            changedAt: { $ifNull: ['$planActivatedAt', '$createdAt'] },
                            reason: 'Migration initialization',
                        }],
                    },
                },
            ]
        );
        console.log(`   - Added statusHistory to ${profileResults.modifiedCount} profiles`);

        console.log('');

        // ============================================
        // 5. Add indexes for performance
        // ============================================
        console.log('📦 Adding performance indexes...');

        try {
            await db.collection('sellerapplications').createIndex(
                { status: 1, 'payment.createdAt': 1 },
                { background: true }
            );
            console.log('   - Created index for payment reconciliation queries');
        } catch (e) {
            console.log('   - Payment reconciliation index already exists');
        }

        try {
            await db.collection('sellerprofiles').createIndex(
                { subscriptionStatus: 1, planExpiresAt: 1 },
                { background: true }
            );
            console.log('   - Created index for expiry queries');
        } catch (e) {
            console.log('   - Expiry index already exists');
        }

        console.log('');

        // ============================================
        // Summary
        // ============================================
        console.log('═'.repeat(50));
        console.log('✅ Migration completed successfully!');
        console.log('═'.repeat(50));
        console.log('');
        console.log('Created/Updated:');
        console.log('  • SellerApplications: Added stateHistory, payment.retryCount');
        console.log('  • SellerProfiles: Added statusHistory');
        console.log('  • WebhookEvents: New collection with indexes');
        console.log('  • DistributedLocks: New collection with TTL');
        console.log('');
        console.log('Next steps:');
        console.log('  1. Restart the server to load new services');
        console.log('  2. Add RAZORPAY_WEBHOOK_SECRET to environment');
        console.log('  3. Configure webhook URL in Razorpay dashboard');
        console.log('');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
};

// Run migration
runMigration();
