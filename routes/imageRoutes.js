import express from 'express';
import { uploadToImageKit, deleteFromImageKit } from '../utils/imageService.js';
import { uploadImages, uploadToImageKitMiddleware } from '../middlewares/imageUploadMiddleware.js';
import { requireSignIn, isAdmin } from '../middlewares/authMiddleware.js';
import fs from 'fs';

const router = express.Router();

// Route to optimize and upload a single image
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

// Route to delete an image from ImageKit
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

export default router;
