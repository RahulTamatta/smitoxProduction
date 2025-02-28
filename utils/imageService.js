import ImageKit from 'imagekit';

// ImageKit Configuration
const imagekit = new ImageKit({
  publicKey: 'public_XxQnBh4c/UCDe8GKiz9RGPfF3pU=',
  privateKey: 'private_w9mQMbhui+mZAeDCB/1v3dGqAf8=',
  urlEndpoint: "https://ik.imagekit.io/cvv8mhaiu"
});

// Function to upload an image to ImageKit
export const uploadToImageKit = async (fileBuffer, fileName, folder = 'products') => {
  try {
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
    throw error;
  }
};

// Function to delete an image from ImageKit
export const deleteFromImageKit = async (fileId) => {
  if (!fileId) return { success: false, message: 'No file ID provided' };
  
  try {
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
