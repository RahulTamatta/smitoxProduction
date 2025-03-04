import axios from 'axios';

/**
 * Helper utility for ImageKit operations
 */

// Constants
const IMAGEKIT_ENDPOINT = 'https://ik.imagekit.io/cvv8mhaiu';
const API_ENDPOINT = '/api/v1/images';

/**
 * Checks if a URL is an ImageKit URL
 * @param {string} url - URL to check
 * @returns {boolean} - True if this is an ImageKit URL
 */
export const isImageKitUrl = (url) => {
  if (!url) return false;
  return url.includes('ik.imagekit.io');
};

/**
 * Ensures an ImageKit URL is properly formatted with domain
 * @param {string} url - URL to check and fix
 * @returns {string} - Valid ImageKit URL
 */
export const ensureImageKitUrl = (url) => {
  if (!url) return '';
  
  // If it's already a complete URL, return it
  if (url.startsWith('http')) return url;
  
  // Remove any leading slash
  const cleanPath = url.replace(/^\//, '');
  
  // Add the ImageKit domain
  return `${IMAGEKIT_ENDPOINT}/${cleanPath}`;
};

/**
 * Extracts file ID from ImageKit URL if available
 * @param {string} url - ImageKit URL
 * @returns {string|null} - File ID or null if not found
 */
export const extractFileIdFromUrl = (url) => {
  if (!url || !isImageKitUrl(url)) return null;
  
  // Try to extract fileId from URL query parameters
  try {
    const urlObj = new URL(url);
    const fileId = urlObj.searchParams.get('fileId');
    if (fileId) return fileId;
    
    // Try to extract from path segments as fallback
    const pathSegments = urlObj.pathname.split('/');
    const lastSegment = pathSegments[pathSegments.length - 1];
    
    // If last segment contains an underscore, it might be the file ID
    if (lastSegment && lastSegment.includes('_')) {
      const parts = lastSegment.split('_');
      return parts[parts.length - 1];
    }
  } catch (error) {
    console.error('Error extracting file ID from URL:', error);
  }
  
  return null;
};

/**
 * Uploads a file to ImageKit using the backend API
 * @param {File} file - File to upload
 * @param {string} folder - Target folder (optional)
 * @returns {Promise<Object>} - Upload result with URL and fileId
 */
export const uploadToImageKit = async (file, folder = 'products') => {
  try {
    const formData = new FormData();
    // Use 'file' as the field name for single uploads
    formData.append('file', file);
    if (folder) formData.append('folder', folder);
    
    const response = await axios.post(
      `${API_ENDPOINT}/upload-single`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    );

    if (!response.data.success) {
      throw new Error(`Upload failed: ${response.data.message}`);
    }

    // Get the image data from the response
    const imageData = response.data.data;
    
    // Ensure URL is properly formatted
    if (imageData.url && !imageData.url.startsWith('http')) {
      imageData.url = ensureImageKitUrl(imageData.url);
    }
    
    return {
      url: imageData.url,
      fileId: imageData.fileId || "",
      name: imageData.name || file.name,
      thumbnailUrl: imageData.thumbnailUrl || null
    };
  } catch (error) {
    console.error('ImageKit upload error:', error);
    throw error;
  }
};

/**
 * Optimizes an ImageKit URL with transformations
 * @param {string} url - Original URL
 * @param {Object} options - Transformation options
 * @returns {string} - Optimized URL
 */
export const optimizeImageKitUrl = (url, options = {}) => {
  if (!url || !isImageKitUrl(url)) return url;
  
  const {
    width,
    height,
    quality = 80,
    format = 'webp'
  } = options;
  
  try {
    // Parse the URL
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // Extract the endpoint and path
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length < 1) return url;
    
    const endpoint = parts[0];
    let imagePath;
    
    // Check if there are already transformations
    if (parts[1] && parts[1].startsWith('tr:')) {
      // If transformations exist, replace them
      imagePath = parts.slice(2).join('/');
    } else {
      imagePath = parts.slice(1).join('/');
    }
    
    // Build the transformation string
    const transforms = [];
    if (width) transforms.push(`w-${width}`);
    if (height) transforms.push(`h-${height}`);
    transforms.push(`q-${quality}`);
    transforms.push(`f-${format}`);
    
    // Build the final URL
    const transformedUrl = `${IMAGEKIT_ENDPOINT}/${endpoint}/tr:${transforms.join(',')}/${imagePath}${urlObj.search}`;
    
    return transformedUrl;
  } catch (error) {
    console.error('Error optimizing ImageKit URL:', error);
    return url;
  }
};

export default {
  uploadToImageKit,
  isImageKitUrl,
  ensureImageKitUrl,
  extractFileIdFromUrl,
  optimizeImageKitUrl
};
