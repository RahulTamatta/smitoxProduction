import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { uploadToImageKit, imagekit } from '../utils/imageKitService.js';
import { uploadImages, uploadToImageKitMiddleware } from '../middlewares/imageUploadMiddleware.js';
import { requireSignIn, isAdmin } from '../middlewares/authMiddleware.js';
import uploadMiddleware, { handleImageUpload } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

// Add health check endpoint
router.get('/health', (req, res) => {
  if (!imagekit) {
    return res.status(503).json({
      success: false,
      message: 'ImageKit service not initialized'
    });
  }

  res.json({
    success: true,
    message: 'Image service is operational'
  });
});

// Setup multer for single file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const tempDir = path.join(dirname(fileURLToPath(import.meta.url)), '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const singleUpload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
}).single('file');

// Update the single upload route to use uploadFields from uploadMiddleware
router.post('/upload-single', uploadMiddleware.uploadFields, handleImageUpload, (req, res) => {
  try {
    if (!req.imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: req.imageUrl
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading image',
      error: error.message
    });
  }
});

// Update the multiple upload route
router.post('/upload-multiple', uploadMiddleware.uploadMultiple, handleImageUpload, (req, res) => {
  try {
    if (!req.imageUrls || !req.imageUrls.length) {
      return res.status(400).json({
        success: false,
        message: 'No images uploaded'
      });
    }

    res.json({
      success: true,
      message: 'Images uploaded successfully',
      data: {
        urls: req.imageUrls
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading images',
      error: error.message
    });
  }
});

// Existing routes
router.post('/upload', requireSignIn, isAdmin, uploadImages, uploadToImageKitMiddleware, async (req, res) => {
  try {
    // If the middleware successfully uploaded to ImageKit
    if (req.imagekit && (req.imagekit.photo || req.imagekit.images)) {
      return res.status(200).json({
        success: true,
        message: 'Image uploaded successfully',
        data: {
          photo: req.imagekit.photo,
          images: req.imagekit.images
        }
      });
    }
    
    return res.status(400).json({
      success: false,
      message: 'No images were uploaded'
    });
  } catch (error) {
    console.error('Error in image upload route:', error);
    return res.status(500).json({
      success: false,
      message: 'Error uploading image',
      error: error.message
    });
  }
});

router.delete('/delete/:fileId', requireSignIn, isAdmin, async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const result = await deleteFromImageKit(fileId);
    
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Image deleted successfully'
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error in image delete route:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting image',
      error: error.message
    });
  }
});

// Add a test route to check ImageKit configuration
router.get('/test', async (req, res) => {
  try {
    const imageDetails = await imagekit.getFileDetails('sample-file-id');
    res.json({
      success: true,
      message: 'ImageKit connected successfully',
      details: imageDetails
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'ImageKit connection failed',
      error: error.message
    });
  }
});

// Required for optimization API
router.get('/optimize', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'URL parameter is required'
      });
    }
    
    // Basic optimization response
    res.json({
      success: true,
      optimizedUrl: url,
      placeholder: url
    });
  } catch (error) {
    console.error('Error optimizing URL:', error);
    res.status(500).json({
      success: false,
      message: 'Error optimizing URL',
      error: error.message
    });
  }
});

// Health status endpoint
router.get('/status', (req, res) => {
  res.json({
    success: true,
    message: 'Image service is operational',
    service: 'ImageKit'
  });
});

export default router;
