import axios from 'axios';
import ImageKit from 'imagekit';

// Source ImageKit Configuration
const sourceImagekit = new ImageKit({
  publicKey: 'public_XxQnBh4c/UCDe8GKiz9RGPfF3pU=',  // Source ImageKit public key
  privateKey: 'private_w9mQMbhui+mZAeDCB/1v3dGqAf8=', // Source ImageKit private key
  urlEndpoint: 'https://ik.imagekit.io/cvv8mhaiu'     // Source ImageKit URL endpoint
});

// Destination ImageKit Configuration
const destImagekit = new ImageKit({
  publicKey:'public_t9kPQ05xdL3avZ7DaJ8eNsbZVC0=',  // Destination ImageKit public key
  privateKey:'private_ahYaBjbDGyoqnUmLZQrIgYuimtA=', // Destination ImageKit private key
  urlEndpoint: 'https://ik.imagekit.io/smitoxImage' 
});

// Function to list all images from source ImageKit account
const listImages = async () => {
  let allImages = [];
  let skip = 0;
  const limit = 100;
  
  try {
    console.log("Attempting to list files from source ImageKit...");
    let hasMore = true;
    
    while (hasMore) {
      console.log(`Fetching batch: skip=${skip}, limit=${limit}`);
      const result = await sourceImagekit.listFiles({
        skip: skip,
        limit: limit
      });
      
      console.log(`Batch returned ${result.length} files`);
      
      if (result && Array.isArray(result)) {
        allImages = allImages.concat(result);
        
        if (result.length < limit) {
          hasMore = false;
        } else {
          skip += limit;
        }
      } else {
        console.log("Unexpected response format:", result);
        hasMore = false;
      }
    }
    
    console.log(`Total files found: ${allImages.length}`);
    return allImages;
  } catch (error) {
    console.error('Error listing images from source ImageKit:', error.message);
    if (error.response) {
      console.error('API response:', error.response.data);
    }
    // Return empty array instead of throwing to prevent the "Cannot read properties of undefined" error
    return [];
  }
};

// Function to download an image from a URL
const downloadImage = async (url) => {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(response.data);
  } catch (error) {
    console.error('Error downloading image:', error);
    throw error;
  }
};

// Function to upload an image to destination ImageKit
const uploadToDestImageKit = async (fileBuffer, fileName, tags = [], folder = '/migrated_images/') => {
  try {
    const result = await destImagekit.upload({
      file: fileBuffer,
      fileName: fileName,
      folder: folder,
      tags: tags,
      useUniqueFileName: false // Keep original filenames
    });
    return result.url;
  } catch (error) {
    console.error('Error uploading to destination ImageKit:', error);
    throw error;
  }
};

// Main migration function
const migrateImages = async () => {
  try {
    // Step 1: Get all images from source ImageKit
    const images = await listImages();
    
    if (!images || !Array.isArray(images)) {
      console.error('Failed to get a valid list of images');
      return;
    }
    
    console.log(`Found ${images.length} images to migrate.`);

    // Step 2: Process each image
    let successCount = 0;
    let failCount = 0;
    
    for (const image of images) {
      try {
        // Get original file URL from source ImageKit
        const imageUrl = image.url;
        
        // Extract useful metadata to transfer
        const tags = image.tags || [];
        const fileName = image.name;
        
        // Determine folder structure (maintain if possible)
        const folder = image.filePath ? image.filePath : '/migrated_images/';
        
        console.log(`Migrating: ${fileName}`);
        
        // Download the image
        const imageBuffer = await downloadImage(imageUrl);
        
        // Upload to destination ImageKit
        const uploadedUrl = await uploadToDestImageKit(imageBuffer, fileName, tags, folder);
        
        console.log(`Successfully migrated ${fileName} to destination ImageKit: ${uploadedUrl}`);
        successCount++;
      } catch (error) {
        console.error(`Failed to migrate ${image.name || 'unknown'}:`, error);
        failCount++;
      }
    }
    
    console.log('Migration completed.');
    console.log(`Successfully migrated: ${successCount} images`);
    console.log(`Failed to migrate: ${failCount} images`);
  } catch (error) {
    console.error('Migration process failed:', error);
  }
};

// Run the migration
migrateImages();