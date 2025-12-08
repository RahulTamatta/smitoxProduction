/**
 * Seed script to initialize RBAC data
 * Run with: node scripts/seedRbacData.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import subscriptionPlanModel from "../models/subscriptionPlanModel.js";
import userModel from "../models/userModel.js";
import { ROLES, ROLE_NUMBERS } from "../config/rbac-policy.js";
import bcrypt from "bcryptjs";

dotenv.config();

const seedData = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || "mongodb+srv://smitox:JSbWYZGtLBJGWxjO@smitox.rlcilry.mongodb.net/?retryWrites=true&w=majority&appName=smitox";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    // 1. Create subscription plans - Only Free Plan by default
    console.log("\n📋 Creating subscription plans...");

    // Delete existing plans first
    await subscriptionPlanModel.deleteMany({});
    console.log("✅ Cleared existing plans");

    const plans = [
      {
        name: "Free Plan",
        description: "Perfect for getting started with Smitox",
        price: 0,
        currency: "INR",
        billingCycle: "monthly",
        isFree: true,
        isActive: true,
        isRecommended: false,
        displayOrder: 1,
        includedCapabilities: ["products:read", "products:write", "orders:read"],
        excludedCapabilities: ["products:delete", "orders:write", "analytics:read"],
        features: [
          {
            name: "Products",
            description: "Manage up to 50 products",
            limit: 50,
          },
          {
            name: "Orders",
            description: "Unlimited orders",
            limit: null,
          },
          {
            name: "Categories",
            description: "Up to 5 categories",
            limit: 5,
          },
          {
            name: "Support",
            description: "Email support",
            limit: null,
          },
        ],
        maxProducts: 50,
        maxOrders: null,
        maxCategories: 5,
        supportLevel: "email",
        trialDays: 0,
        setupFee: 0,
      }
    ];

    // Create new plans
    const createdPlans = await subscriptionPlanModel.insertMany(plans);
    console.log(`✅ Created ${createdPlans.length} subscription plans`);

    // 2. Create/Update Super Admin user
    console.log("\n👤 Setting up Super Admin user...");

    const superAdminEmail = "superadmin@smitox.com";
    let superAdmin = await userModel.findOne({ email_id: superAdminEmail });

    if (!superAdmin) {
      const hashedPassword = await bcrypt.hash("SuperAdmin@123", 10);
      superAdmin = new userModel({
        user_id: "SA001",
        email_id: superAdminEmail,
        user_fullname: "Super Administrator",
        password: hashedPassword,
        roleString: ROLES.SUPER_ADMIN,
        role: ROLE_NUMBERS.super_admin,
        isActive: true,
      });
      await superAdmin.save();
      console.log(`✅ Created Super Admin user: ${superAdminEmail}`);
    } else {
      superAdmin.roleString = ROLES.SUPER_ADMIN;
      superAdmin.role = ROLE_NUMBERS.super_admin;
      superAdmin.isActive = true;
      await superAdmin.save();
      console.log(`✅ Updated existing Super Admin user: ${superAdminEmail}`);
    }

    // 3. Update existing admin users
    console.log("\n👥 Updating existing admin users...");

    const adminUsers = await userModel.find({ role: 1 });
    for (const admin of adminUsers) {
      admin.roleString = ROLES.ADMIN;
      admin.isActive = true;
      await admin.save();
    }
    console.log(`✅ Updated ${adminUsers.length} admin users`);

    console.log("\n✨ RBAC data seeding completed successfully!");
    console.log("\n📝 Default credentials:");
    console.log(`   Email: ${superAdminEmail}`);
    console.log(`   Password: SuperAdmin@123`);
    console.log("\n⚠️  Please change the password after first login!\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding data:", error);
    process.exit(1);
  }
};

seedData();
