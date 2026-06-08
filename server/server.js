import * as Sentry from "@sentry/node";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from 'url'; // To convert import.meta.url to a pathname
import connectDB from "./config/db.js";
import { checkConnection as checkElasticsearch, initializeIndex } from "./config/elasticsearch.js";
import { initializeFirebase } from "./utils/firebaseService.js";
import { initializeRedis } from "./config/redis.js";
import { checkPlanExpiry } from "./jobs/planExpiryCheckJob.js";
import { startPlanExpiryJob } from "./jobs/planExpiryJob.js";
import { startPlanExpiryJob as startScheduledPlanExpiryJob } from "./jobs/schedulePlanExpiryJob.js";
import adminAnalyticsRoutes from "./routes/adminAnalyticsRoutes.js";
import adsbannerRoutes from "./routes/adsRoutes.js";
import authRoutes from "./routes/authRoute.js";
import bannerRoutes from "./routes/bannerRoutes.js";
import brandRoutes from "./routes/brandNameRoutes.js";
import { default as cartRoutes, default as usersListsRoutes } from "./routes/cartRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import dashboardAnalyticsRoutes from "./routes/dashboardAnalyticsRoutes.js";
import imageRoutes from "./routes/imageRoutes.js";
import minimumOrderRoutes from "./routes/miniMumRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import paymentWebhookRoutes from "./routes/paymentWebhookRoutes.js";
import pincodeRoutes from "./routes/pincodeRoutes.js";
import productForYou from "./routes/productForYouRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import sellerApplicationRoutes from "./routes/sellerApplicationRoutes.js";
import sellerApplicationRoutesV2 from "./routes/sellerApplicationRoutesV2.js";
import subCategoryRoutes from "./routes/subCategoryRoutes.js";
import subscriptionPlanRoutes from "./routes/subscriptionPlanRoutes.js";

// Configure environment variables
dotenv.config();

// Connect to the database
connectDB();

// Create Express application
const app = express();

// Initialize Sentry with the most basic configuration
Sentry.init({
  dsn: "https://19728acf30c9c6873c0c163ccb56440f@o4508874583179264.ingest.us.sentry.io/4508997290426368",
});

// Skip the handlers for now until we can verify the correct Sentry version

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Middleware
app.use(cors({
  origin: "*", // Or specific origins like in the reference
  credentials: true
})); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Parse incoming JSON requests
app.use(morgan("dev")); // HTTP request logger

// Plan Expiry Check Middleware - Check on every seller request
app.use("/api/v1/sellers", checkPlanExpiry);

// Determine the directory path using import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.resolve();

// Serve static files from the React build directory
app.use(express.static(path.join(__dirname, "../client/build")));

// Serve static files from uploads directory (for Hostinger local storage)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/category", categoryRoutes);
app.use("/api/v1/product", productRoutes);
app.use("/api/v1/subcategory", subCategoryRoutes);
app.use("/api/v1/bannerManagement", bannerRoutes);
app.use("/api/v1/images", imageRoutes); // Change from "image" to "images"
app.use('/api/v1/minimumOrder', minimumOrderRoutes);
app.use("/api/v1/banner-products", bannerRoutes);
app.use("/api/v1/productForYou", productForYou);
app.use("/api/v1/adsbanner", adsbannerRoutes);
app.use("/api/v1/brand", brandRoutes); // Use brand routes
app.use("/api/v1/usersLists", usersListsRoutes);
app.use('/api/v1/pincodes', pincodeRoutes);
app.use('/api/v1/carts', cartRoutes);

// RBAC - Seller Applications & Subscription Plans (V1 - Legacy)
app.use('/api/v1/sellers/applications', sellerApplicationRoutes);
app.use('/api/v1/subscription-plans', subscriptionPlanRoutes);
app.use('/api/v1/payments', paymentRoutes);

// Seller Onboarding V2 - New Flow
app.use('/api/v1/sellers', sellerApplicationRoutesV2);

// Payment Webhooks
app.use('/api/v1/webhooks/payments', paymentWebhookRoutes);

// Admin Analytics
app.use('/api/v1/admin/analytics', adminAnalyticsRoutes);

// Admin Dashboard (Comprehensive Analytics)
app.use('/api/v1/admin/dashboard', dashboardAnalyticsRoutes);

// Search API (Elasticsearch-powered)
app.use('/api/search', searchRoutes);

// Serve React app for any other unknown routes (exclude /uploads and /api)
app.get("*", (req, res, next) => {
  // Skip this for /uploads and /api routes
  if (req.path.startsWith('/uploads') || req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, "../client/build", "index.html"));
});

// Skip the Sentry error handler for now

// Continue with your existing error handlers
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : null
  });
});

// Add error handler for image service
app.use((err, req, res, next) => {
  if (err.message === 'ImageKit service not initialized') {
    console.error('ImageKit service error:', err);
    return res.status(503).json({
      success: false,
      message: 'Image service temporarily unavailable'
    });
  }
  next(err);
});

// Define the port to listen on
const PORT = process.env.PORT || 8080;

// Start the server
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running in ${process.env.DEV_MODE || 'development'} mode on port ${PORT}`.cyan);

  // Initialize Firebase Admin
  initializeFirebase();

  // Start Plan Expiry CRON Jobs
  try {
    startPlanExpiryJob();
    console.log("✅ Plan Expiry CRON Job started successfully".green);

    startScheduledPlanExpiryJob();
    console.log("✅ Scheduled Plan Expiry CRON Job started successfully".green);
  } catch (error) {
    console.error("❌ Failed to start Plan Expiry CRON Job:", error.message);
  }

  // Initialize Search Infrastructure (non-blocking)
  initSearchInfrastructure();
});
server.timeout = 300000; // 5 minute timeout

/**
 * Initialize Elasticsearch and Redis for search functionality
 * This runs asynchronously and doesn't block server startup
 */
async function initSearchInfrastructure() {
  console.log('🔍 Initializing search infrastructure...');

  try {
    // Initialize Redis
    const redisConnected = await initializeRedis();
    if (redisConnected) {
      console.log('✅ Redis cache connected'.green);
    } else {
      console.log('⚠️  Redis not available - search will work without caching'.yellow);
    }
  } catch (error) {
    console.error('❌ Redis initialization failed:', error.message);
  }

  try {
    // Initialize Elasticsearch
    const esConnected = await checkElasticsearch();
    if (esConnected) {
      console.log('✅ Elasticsearch connected'.green);
      await initializeIndex();
      console.log('✅ Elasticsearch index initialized'.green);
    } else {
      console.log('⚠️  Elasticsearch not available - search will fallback to MongoDB'.yellow);
    }
  } catch (error) {
    console.error('❌ Elasticsearch initialization failed:', error.message);
  }
}