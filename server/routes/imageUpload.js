/**
 * Image Upload Routes
 * Handles image uploads with optimization
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const imageOptimizationService = require('../services/imageOptimization');
const cdnConfig = require('../config/cdn');

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

/**
 * POST /api/upload
 * Uploads and optimizes an image
 */
router.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }
    
    const timestamp = Date.now();
    const filename = `${timestamp}-${req.file.originalname.replace(/\s+/g, '-')}`;
    const outputDir = path.join(process.cwd(), 'public', 'uploads');
    
    // Optimize image
    const result = await imageOptimizationService.optimizeImage(req.file.buffer, {
      outputDir,
      filename,
      sizes: [
        { width: 1200, height: 900, suffix: 'large' },
        { width: 800, height: 600, suffix: 'medium' },
        { width: 400, height: 300, suffix: 'small' },
        { width: 150, height: 150, suffix: 'thumbnail' }
      ],
      quality: 80
    });
    
    if (result.success) {
      // Generate CDN URLs if CDN is enabled
      const urls = {};
      if (cdnConfig.enabled) {
        for (const [key, filepath] of Object.entries(result.paths)) {
          const relativePath = filepath.replace(process.cwd() + '/public', '');
          urls[key] = `${cdnConfig.baseUrl}${relativePath}`;
        }
      } else {
        // Use local URLs
        for (const [key, filepath] of Object.entries(result.paths)) {
          const relativePath = filepath.replace(process.cwd() + '/public', '');
          urls[key] = relativePath;
        }
      }
      
      res.status(200).json({
        success: true,
        urls,
        metadata: {
          originalName: req.file.originalname,
          sizes: Object.keys(result.paths).filter(key => key !== 'original'),
          format: 'webp'
        }
      });
    } else {
      // If optimization failed, try fallback
      const fallbackPath = path.join(outputDir, filename);
      const fallbackResult = await imageOptimizationService.saveOriginalAsFallback(
        req.file.buffer,
        fallbackPath
      );
      
      if (fallbackResult.success) {
        const relativePath = fallbackPath.replace(process.cwd() + '/public', '');
        const url = cdnConfig.enabled ? `${cdnConfig.baseUrl}${relativePath}` : relativePath;
        
        res.status(200).json({
          success: true,
          optimized: false,
          urls: { original: url },
          metadata: {
            originalName: req.file.originalname,
            sizes: [],
            format: path.extname(req.file.originalname).substring(1)
          }
        });
      } else {
        throw new Error('Image processing failed');
      }
    }
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Image upload failed'
    });
  }
});

/**
 * GET /api/images/:filename
 * Retrieves information about an uploaded image
 */
router.get('/api/images/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const outputDir = path.join(process.cwd(), 'public', 'uploads');
    const imagePath = path.join(outputDir, filename);
    
    const exists = await fs.access(imagePath).then(() => true).catch(() => false);
    
    if (!exists) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    // Get image metadata
    const stats = await fs.stat(imagePath);
    const ext = path.extname(filename).substring(1);
    
    res.json({
      filename,
      path: cdnConfig.enabled 
        ? `${cdnConfig.baseUrl}/uploads/${filename}` 
        : `/uploads/${filename}`,
      size: stats.size,
      format: ext,
      lastModified: stats.mtime
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;