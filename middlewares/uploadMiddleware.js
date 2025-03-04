import multer from 'multer';
import { uploadToImageKit } from '../utils/imageKitService.js';

// Configure multer for memory storage
const storage = multer.memoryStorage();

// Create multer instance with file size limits
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Export the middleware functions
export const uploadSingle = upload.single('image');
export const uploadPhoto = upload.single('photo');
export const uploadMultiple = upload.array('images', 5);
export const uploadFields = upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'image', maxCount: 1 },
  { name: 'file', maxCount: 1 },
  { name: 'images', maxCount: 5 }
]);

// Main image upload handler
export const handleImageUpload = async (req, res, next) => {
  // Set a timeout for the request
  const uploadTimeout = setTimeout(() => {
    const error = new Error('Upload timed out - request took too long');
    error.status = 408;
    next(error);
  }, 240000); // 4 minutes timeout

  try {
    console.log('Files received:', req.files || req.file);
    
    // Handle single file upload (from single() middleware)
    if (req.file) {
      // Add file size check
      if (req.file.size > 5 * 1024 * 1024) { // 5MB
        clearTimeout(uploadTimeout);
        return res.status(413).json({ 
          success: false,
          message: 'File too large, maximum size is 5MB'
        });
      }

      const result = await uploadToImageKit(
        req.file.buffer,
        req.file.originalname
      );
      req.imageUrl = result.url;
    }

    // Handle multiple files upload (from fields() middleware)
    if (req.files) {
      // Handle photo/image/file field (single image)
      const singleFile = req.files.photo?.[0] || req.files.image?.[0] || req.files.file?.[0];
      if (singleFile) {
        // Add file size check
        if (singleFile.size > 5 * 1024 * 1024) { // 5MB
          clearTimeout(uploadTimeout);
          return res.status(413).json({ 
            success: false,
            message: 'File too large, maximum size is 5MB'
          });
        }

        const result = await uploadToImageKit(
          singleFile.buffer,
          singleFile.originalname
        );
        req.imageUrl = result.url;
      }

      // Handle multiple images, with size checks
      if (req.files.images) {
        // Check total size of all files
        const totalSize = req.files.images.reduce((sum, file) => sum + file.size, 0);
        if (totalSize > 20 * 1024 * 1024) { // 20MB total
          clearTimeout(uploadTimeout);
          return res.status(413).json({ 
            success: false,
            message: 'Total file size too large, maximum is 20MB'
          });
        }

        const uploadPromises = req.files.images.map(file => 
          uploadToImageKit(file.buffer, file.originalname)
        );
        const results = await Promise.all(uploadPromises);
        req.imageUrls = results.map(r => r.url);
      }
    }

    clearTimeout(uploadTimeout);
    next();
  } catch (error) {
    clearTimeout(uploadTimeout);
    console.error('Upload middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading image',
      error: error.message
    });
  }
};

// Export the object with all middlewares
const uploadMiddleware = {
  uploadSingle,
  uploadPhoto,
  uploadMultiple,
  uploadFields,
  handleImageUpload
};

export default uploadMiddleware;
