/**
 * Image Optimization Service
 * Uses Sharp to resize and optimize images
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

class ImageOptimizationService {
  /**
   * Optimizes an image with different sizes and formats
   * @param {Buffer} imageBuffer - The original image buffer
   * @param {Object} options - Optimization options
   * @returns {Promise<Object>} - Optimized image paths
   */
  async optimizeImage(imageBuffer, options = {}) {
    const {
      outputDir, 
      filename,
      sizes = [{ width: 800, height: 600, suffix: 'medium' }, { width: 400, height: 300, suffix: 'small' }],
      quality = 80,
      format = 'webp'
    } = options;

    try {
      // Create output directory if it doesn't exist
      await fs.mkdir(outputDir, { recursive: true });
      
      const optimizedImages = {};
      const baseFilename = path.parse(filename).name;
      
      // Generate original webp version
      const originalPath = path.join(outputDir, `${baseFilename}.${format}`);
      await sharp(imageBuffer)
        .webp({ quality })
        .toFile(originalPath);
      
      optimizedImages.original = originalPath;
      
      // Generate different sizes
      for (const size of sizes) {
        const { width, height, suffix } = size;
        const resizedPath = path.join(outputDir, `${baseFilename}-${suffix}.${format}`);
        
        await sharp(imageBuffer)
          .resize(width, height, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality })
          .toFile(resizedPath);
        
        optimizedImages[suffix] = resizedPath;
      }
      
      return {
        success: true,
        paths: optimizedImages
      };
    } catch (error) {
      console.error('Image optimization failed:', error);
      return {
        success: false,
        error: error.message,
        originalImage: null
      };
    }
  }
  
  /**
   * Fallback method in case optimization fails
   * @param {Buffer} imageBuffer - The original image buffer
   * @param {String} outputPath - Path to save the image
   * @returns {Promise<Object>} - Result of the operation
   */
  async saveOriginalAsFallback(imageBuffer, outputPath) {
    try {
      await fs.writeFile(outputPath, imageBuffer);
      return {
        success: true,
        path: outputPath,
        optimized: false
      };
    } catch (error) {
      console.error('Fallback image save failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new ImageOptimizationService();
