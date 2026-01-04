import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { uploadToImageKit } from '../utils/imageKitService.js';

// Setup temporary storage for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const tempDir = path.join(process.cwd(), 'temp');
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

// Filter for images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};

// Initialize multer with settings
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// ImageKit upload middleware - enhanced for low bandwidth
export const uploadToImageKitMiddleware = async (req, res, next) => {
  try {
    // If no files were uploaded, continue
    if (!req.files) {
      return next();
    }

    // Detect connection quality to adjust optimization level
    const connectionQuality = detectConnectionQuality(req);
    const quality = connectionQuality === 'low' ? 50 : 
                   connectionQuality === 'medium' ? 70 : 80;

    // Handle photo field (single image)
    if (req.files.photo) {
      const file = req.files.photo[0]; // Access the file correctly from multer
      
      // Apply optimization with adaptive quality
      const optimizedBuffer = await optimizeImage(file.path, quality, connectionQuality);
      
      const fileName = `product_${Date.now()}_${path.basename(file.path)}`;
      
      const result = await uploadToImageKit(optimizedBuffer, fileName, 'products', quality);
      
      // Clean up temp file
      fs.unlinkSync(file.path);
      
      // Add ImageKit URL and fileId to request - make sure URL is stored correctly
      req.imagekit = req.imagekit || {};
      req.imagekit.photo = result;

      // Ensure we have a valid URL
      if (!result.url.startsWith('http')) {
        console.warn('Invalid ImageKit URL returned:', result.url);
        // Fix URL if needed
        result.url = `https://ik.imagekit.io/cvv8mhaiu/${result.url.replace(/^\//, '')}`;
        req.imagekit.photo.url = result.url;
      }
    }
    
    // Handle images field (multiple images)
    if (req.files.images) {
      const imageFiles = req.files.images;
      
      req.imagekit = req.imagekit || {};
      req.imagekit.images = [];
      
      // Process each image with adaptive quality
      for (const file of imageFiles) {
        // Optimize each image based on connection quality
        const optimizedBuffer = await optimizeImage(file.path, quality, connectionQuality);
        
        const fileName = `product_${Date.now()}_${path.basename(file.path)}`;
        
        const result = await uploadToImageKit(optimizedBuffer, fileName, 'products', quality);
        
        // Ensure we have a valid URL
        if (!result.url.startsWith('http')) {
          console.warn('Invalid ImageKit URL returned:', result.url);
          // Fix URL if needed
          result.url = `https://ik.imagekit.io/cvv8mhaiu/${result.url.replace(/^\//, '')}`;
          result.url = result.url;
        }
        
        req.imagekit.images.push(result);
        
        // Clean up temp file
        fs.unlinkSync(file.path);
      }
    }
    
    next();
  } catch (error) {
    console.error('Error in ImageKit upload middleware:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Error uploading images',
      error: error.message
    });
  }
};

// Export multer middleware
export const uploadImages = upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'images', maxCount: 10 }
]);

export default { uploadImages, uploadToImageKitMiddleware };
