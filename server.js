import express from "express";
import colors from "colors";
import dotenv from "dotenv";
import morgan from "morgan";
import { fileURLToPath } from 'url'; // To convert import.meta.url to a pathname
import { dirname } from 'path'; // To get the directory name from a file path
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoute.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import subCategoryRoutes from "./routes/subCategoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import bannerRoutes from "./routes/bannerRoutes.js";
import productForYou from "./routes/productForYouRoutes.js";
import cors from "cors";
import path from "path";
import adsbannerRoutes from "./routes/adsRoutes.js";
import brandRoutes from "./routes/brandNameRoutes.js"; 
import usersListsRoutes from "./routes/cartRoutes.js"; 
import pincodeRoutes from "./routes/pincodeRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import minimumOrderRoutes from "./routes/miniMumRoutes.js";
import imageRoutes from "./routes/imageRoutes.js";
import * as Sentry from "@sentry/node";
// Clean Architecture additions (non-breaking)
import { setupContainer } from "./src/core/di/container.js";
import productsV1Route from "./src/presentation/routes/api/v1/products.js";
import { errorHandler } from "./src/core/errors/errorHandler.js";

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
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Parse incoming JSON requests
app.use(morgan("dev")); // HTTP request logger

// Determine the directory path using import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.resolve();

// Serve static files from the React build directory
app.use(express.static(path.join(__dirname, "./client/build")));

// Initialize DI container (non-blocking, best-effort)
await setupContainer();

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

// New v2 route namespace (Clean Architecture-backed). Safe, additive.
app.use('/api/v2/products', productsV1Route);

// Serve React app for any other unknown routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "./client/build", "index.html"));
});

// Skip the Sentry error handler for now

// Centralized error formatter (for CustomError & DomainError)
app.use(errorHandler);

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
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.cyan);
});
server.timeout = 300000; // 5 minute timeout