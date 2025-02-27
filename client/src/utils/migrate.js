import axios from 'axios';
import { v2 as cloudinary } from 'cloudinary';
import ImageKit from 'imagekit';

// Cloudinary Configuration
const CLOUDINARY_CLOUD_NAME = 'djtiblazd';            // From your query
const CLOUDINARY_API_KEY = '719814162117114';        // From your query
const CLOUDINARY_API_SECRET = 'VB_c0DClKeLugYJf9tMMIxXjXRE';     // Replace with your actual API secret

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET
});

// ImageKit Configuration
const imagekit = new ImageKit({
  publicKey: 'public_XxQnBh4c/UCDe8GKiz9RGPfF3pU=',                      // Replace with your ImageKit public key
  privateKey: 'private_w9mQMbhui+mZAeDCB/1v3dGqAf8=',                    // Replace with your ImageKit private key
  urlEndpoint:  "https://ik.imagekit.io/cvv8mhaiu"// Replace with your ImageKit URL endpoint
});

// Function to list all images from Cloudinary
const listImages = async () => {
  let allImages = [];
  let nextCursor = null;
  try {
    do {
      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: '', // Optional: specify a folder, e.g., 'your_folder/'
        max_results: 500,
        next_cursor: nextCursor
      });
      allImages = allImages.concat(result.resources);
      nextCursor = result.next_cursor;
    } while (nextCursor);
    return allImages;
  } catch (error) {
    console.error('Error listing images from Cloudinary:', error);
    throw error;
  }
};

// Function to download an image from a URL
const downloadImage = async (url) => {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return response.data;
  } catch (error) {
    console.error('Error downloading image:', error);
    throw error;
  }
};

// Function to upload an image to ImageKit
const uploadToImageKit = async (fileBuffer, fileName) => {
  try {
    const result = await imagekit.upload({
      file: fileBuffer,
      fileName: fileName,
      folder: '/migrated_from_cloudinary/' // Optional: organize in a folder
    });
    return result.url;
  } catch (error) {
    console.error('Error uploading to ImageKit:', error);
    throw error;
  }
};

// Main migration function
const migrateImages = async () => {
  try {
    // Step 1: Get all images from Cloudinary
    const images = await listImages();
    console.log(`Found ${images.length} images to migrate.`);

    // Step 2: Process each image
    for (const image of images) {
      try {
        const imageUrl = image.secure_url;
        const imageBuffer = await downloadImage(imageUrl);
        const uploadedUrl = await uploadToImageKit(imageBuffer, image.public_id);
        console.log(`Successfully migrated ${image.public_id} to ImageKit: ${uploadedUrl}`);
      } catch (error) {
        console.error(`Failed to migrate ${image.public_id}:`, error);
      }
    }
    console.log('Migration completed.');
  } catch (error) {
    console.error('Migration process failed:', error);
  }
};

// Run the migration
migrateImages();
