let ImageKit;
let imagekit;

try {
  ImageKit = require('imagekit');

  // ImageKit Configuration
  imagekit = new ImageKit({
    publicKey: 'public_XxQnBh4c/UCDe8GKiz9RGPfF3pU=',
    privateKey: 'private_w9mQMbhui+mZAeDCB/1v3dGqAf8=',
    urlEndpoint: "https://ik.imagekit.io/cvv8mhaiu"
  });
} catch (error) {
  console.warn("ImageKit module not found, using fallback methods");
  // Create a mock implementation if package is not available
  imagekit = {
    upload: () => Promise.reject(new Error("ImageKit not available")),
    deleteFile: () => Promise.reject(new Error("ImageKit not available"))
  };
}

// Function to upload an image to ImageKit
export const uploadToImageKit = async (fileBuffer, fileName, folder = 'products') => {
  try {
    if (!ImageKit) {
      console.warn("ImageKit module not available, returning direct URL");
      return { 
        url: `/api/v1/product/product-photo/${fileName}`, 
        fileId: null,
        name: fileName
      };
    }
    
    const result = await imagekit.upload({
      file: fileBuffer,
      fileName: fileName || `product_${Date.now()}`,
      folder: `/${folder}/`
    });
    
    return {
      url: result.url,
      fileId: result.fileId,
      name: result.name
    };
  } catch (error) {
    console.error('Error uploading to ImageKit:', error);
    // Return a fallback URL that uses the existing API
    return { 
      url: `/api/v1/product/product-photo/${fileName}`, 
      fileId: null,
      name: fileName
    };
  }
};

// Function to delete an image from ImageKit
export const deleteFromImageKit = async (fileId) => {
  if (!fileId) return { success: false, message: 'No file ID provided' };
  
  try {
    if (!ImageKit) {
      return { success: false, message: 'ImageKit not available' };
    }
    
    await imagekit.deleteFile(fileId);
    return { success: true, message: 'Image deleted successfully' };
  } catch (error) {
    console.error('Error deleting from ImageKit:', error);
    return { success: false, message: error.message };
  }
};

// Enhanced function to get optimized image URL with transformations
export const getOptimizedImageUrl = (url, { width, height, quality = 80, format = 'auto' } = {}) => {
  if (!url) return '/placeholder-image.jpg';
  
  // Handle base64 encoded images (return as is)
  if (url.startsWith('data:')) return url;

  // Check if URL is already an ImageKit URL
  const isImageKitUrl = url.includes('ik.imagekit.io');
  
  if (!isImageKitUrl) return url;
  
  try {
    // Parse the URL properly to handle the transformations
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // Extract the endpoint and the actual path
    // Format: /endpoint/path-to-image
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length < 1) return url;
    
    const endpoint = parts[0];
    const imagePath = parts.slice(1).join('/');
    
    // Create transformation parameters
    const transforms = [];
    if (width) transforms.push(`w-${width}`);
    if (height) transforms.push(`h-${height}`);
    transforms.push(`q-${quality}`);
    transforms.push(`f-${format}`);
    
    // Construct the new URL with transformations
    // Format: https://ik.imagekit.io/endpoint/tr:transformations/path-to-image
    const transformedUrl = `https://ik.imagekit.io/${endpoint}/tr:${transforms.join(',')}/${imagePath}${urlObj.search}`;
    
    return transformedUrl;
  } catch (error) {
    console.error('Error generating optimized ImageKit URL:', error);
    return url; // Return original URL on error
  }
};

export default {
  uploadToImageKit,
  deleteFromImageKit,
  getOptimizedImageUrl
};
