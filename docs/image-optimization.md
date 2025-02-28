# Image Optimization Guide

This guide explains how the image optimization system works and how to use it in your application.

## Overview

Our image optimization service automatically resizes and compresses images upon upload, creating multiple versions optimized for different use cases. It uses the Sharp library for Node.js, which is one of the fastest image processing libraries available.

## Features

- Automatic image resizing to multiple dimensions
- WebP conversion for better compression and quality
- Quality optimization to reduce file size
- Fallback mechanism if optimization fails

## Usage

### Basic Usage

```javascript
const imageOptimizationService = require('../services/imageOptimization');
const fs = require('fs').promises;

async function handleImageUpload(imagePath, filename) {
  try {
    // Read image file
    const imageBuffer = await fs.readFile(imagePath);
    
    // Optimize image
    const result = await imageOptimizationService.optimizeImage(imageBuffer, {
      outputDir: './public/uploads',
      filename: filename,
      sizes: [
        { width: 1200, height: 900, suffix: 'large' },
        { width: 800, height: 600, suffix: 'medium' },
        { width: 400, height: 300, suffix: 'small' }
      ],
      quality: 80,
      format: 'webp'
    });
    
    if (result.success) {
      return result.paths;
    } else {
      // Use fallback
      const fallback = await imageOptimizationService.saveOriginalAsFallback(
        imageBuffer, 
        `./public/uploads/${filename}`
      );
      return { original: fallback.path };
    }
  } catch (error) {
    console.error('Image upload failed:', error);
    throw error;
  }
}
```

### Express Route Example

```javascript
const express = require('express');
const multer = require('multer');
const imageOptimizationService = require('../services/imageOptimization');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }
    
    const result = await imageOptimizationService.optimizeImage(req.file.buffer, {
      outputDir: './public/uploads',
      filename: req.file.originalname,
      sizes: [
        { width: 800, height: 600, suffix: 'medium' },
        { width: 400, height: 300, suffix: 'small' },
        { width: 200, height: 150, suffix: 'thumbnail' }
      ]
    });
    
    if (result.success) {
      res.json({
        success: true,
        paths: result.paths
      });
    } else {
      // Use fallback
      const fallback = await imageOptimizationService.saveOriginalAsFallback(
        req.file.buffer,
        `./public/uploads/original-${req.file.originalname}`
      );
      
      res.json({
        success: true,
        optimized: false,
        paths: { original: fallback.path }
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Image processing failed' });
  }
});

module.exports = router;
```

## Configuration Options

The `optimizeImage` method accepts the following options:

| Option | Description | Default |
|--------|-------------|---------|
| outputDir | Directory to save optimized images | Required |
| filename | Original filename | Required |
| sizes | Array of size objects with width, height, and suffix | `[{ width: 800, height: 600, suffix: 'medium' }, { width: 400, height: 300, suffix: 'small' }]` |
| quality | Compression quality (0-100) | 80 |
| format | Output format | 'webp' |

## Best Practices

1. **Use WebP format** - It offers better compression than JPEG or PNG
2. **Define appropriate sizes** - Create versions that match your application's layout needs
3. **Set reasonable quality** - Usually 70-85 is a good balance between quality and file size
4. **Implement responsive images** - Use `srcset` to serve different sizes based on device

## Error Handling

The service includes built-in error handling and a fallback mechanism:

1. If optimization fails, use `saveOriginalAsFallback` to save the original file
2. Implement your own additional error handling in controllers
3. Log errors for monitoring and debugging

## Dependencies

- Sharp: ^0.31.0 - For image processing
- fs/promises - For file system operations
