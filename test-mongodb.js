// Test script to verify MongoDB installation
try {
    console.log('Testing MongoDB import...');
    const { MongoClient } = require('mongodb');
    console.log('✅ MongoDB imported successfully!');
    console.log('MongoDB version:', require('mongodb/package.json').version);
} catch (error) {
    console.error('❌ MongoDB import failed:', error.message);
    process.exit(1);
}
