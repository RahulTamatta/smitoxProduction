import mongoose from 'mongoose';
import dotenv from 'dotenv';
import userModel from '../models/userModel.js';

dotenv.config();

// Role mapping
const ROLE_MAP = {
  0: 'user',
  1: 'admin',
  2: 'seller',
  3: 'super_admin'
};

async function migrateRoleString() {
  try {
    console.log('🔄 Starting roleString migration...\n');

    // Connect to MongoDB
    await mongoose.connect('mongodb+srv://smitox:JSbWYZGtLBJGWxjO@smitox.rlcilry.mongodb.net/?retryWrites=true&w=majority&appName=smitox');
    console.log('✅ Connected to MongoDB\n');

    // Find all users
    const users = await userModel.find({});
    console.log(`📊 Found ${users.length} users to process\n`);

    let updated = 0;
    let errors = 0;

    // Update ALL users with bulk operation for better performance
    const bulkOps = users.map(user => {
      const roleString = ROLE_MAP[user.role] || 'user';
      return {
        updateOne: {
          filter: { _id: user._id },
          update: { $set: { roleString } }
        }
      };
    });

    if (bulkOps.length > 0) {
      const result = await userModel.bulkWrite(bulkOps);
      updated = result.modifiedCount + result.upsertedCount;
      console.log(`✅ Bulk update completed: ${updated} users updated\n`);
    }

    // Verify the migration
    const verifyUsers = await userModel.find({}, { mobile_no: 1, role: 1, roleString: 1 }).limit(10);
    console.log('� Verification Sample (first 10 users):');
    verifyUsers.forEach(u => {
      const roleString = ROLE_MAP[u.role] || 'user';
      const status = u.roleString === roleString ? '✅' : '❌';
      console.log(`   ${status} ${u.mobile_no || u._id}: role=${u.role}, roleString=${u.roleString} (expected: ${roleString})`);
    });

    // Count by role
    const roleCounts = await userModel.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          roleStrings: { $push: '$roleString' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    console.log('\n� Users by Role:');
    roleCounts.forEach(rc => {
      const roleString = ROLE_MAP[rc._id] || 'user';
      console.log(`   role=${rc._id} (${roleString}): ${rc.count} users`);
    });

    console.log('\n✨ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateRoleString();
