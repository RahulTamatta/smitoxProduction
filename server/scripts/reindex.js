#!/usr/bin/env node
/**
 * Search Reindex Script
 * 
 * Indexes all active products from MongoDB to Elasticsearch.
 * Run this script for initial migration or to rebuild the search index.
 * 
 * Usage: npm run search:reindex
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import { checkConnection, initializeIndex } from './config/elasticsearch.js';
import { fullReindex } from './services/syncService.js';

// Load environment variables
dotenv.config();

async function main() {
    console.log('='.repeat(50));
    console.log('🔍 PRODUCT SEARCH REINDEX SCRIPT');
    console.log('='.repeat(50));
    console.log();

    try {
        // Connect to MongoDB
        console.log('📦 Connecting to MongoDB...');
        await connectDB();
        console.log('✅ MongoDB connected');
        console.log();

        // Check Elasticsearch connection
        console.log('🔎 Checking Elasticsearch connection...');
        const esConnected = await checkConnection();

        if (!esConnected) {
            console.error('❌ Elasticsearch is not available');
            console.log();
            console.log('Please ensure Elasticsearch is running:');
            console.log('  docker run -d --name elasticsearch \\');
            console.log('    -p 9200:9200 \\');
            console.log('    -e "discovery.type=single-node" \\');
            console.log('    -e "xpack.security.enabled=false" \\');
            console.log('    docker.elastic.co/elasticsearch/elasticsearch:8.11.0');
            console.log();
            process.exit(1);
        }
        console.log('✅ Elasticsearch connected');
        console.log();

        // Initialize index (create if not exists)
        console.log('📋 Initializing search index...');
        await initializeIndex();
        console.log('✅ Index ready');
        console.log();

        // Run full reindex
        console.log('🔄 Starting full reindex...');
        console.log('   This may take a while for large catalogs.');
        console.log();

        const result = await fullReindex();

        console.log();
        console.log('='.repeat(50));
        if (result.success) {
            console.log('✅ REINDEX COMPLETE');
            console.log(`   Documents indexed: ${result.indexed}`);
            console.log(`   Errors: ${result.errors}`);
            console.log(`   Duration: ${result.duration}`);
        } else {
            console.log('❌ REINDEX FAILED');
            console.log(`   Error: ${result.error}`);
        }
        console.log('='.repeat(50));

    } catch (error) {
        console.error('❌ Script failed:', error.message);
        process.exit(1);
    } finally {
        // Close MongoDB connection
        await mongoose.connection.close();
        console.log();
        console.log('👋 Done. MongoDB connection closed.');
        process.exit(0);
    }
}

main();
