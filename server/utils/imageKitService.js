import ImageKit from "imagekit";
import dotenv from 'dotenv';

dotenv.config();

// Initialize ImageKit with proper error handling
let imagekit = null;

try {
  imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY || "public_XxQnBh4c/UCDe8GKiz9RGPfF3pU=",
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "private_w9mQMbhui+mZAeDCB/1v3dGqAf8=",
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || "https://ik.imagekit.io/cvv8mhaiu"
  });

  // Test the connection immediately
  imagekit.listFiles({
    limit: 1,
    skip: 0
  }).then(() => {
    console.log('✓ ImageKit connected successfully');
  }).catch(err => {
    console.error('⚠ ImageKit connection test failed:', err);
  });
} catch (error) {
  console.error('⚠ Error initializing ImageKit:', error);
}

// Helper function to reduce image size before uploading if needed
const optimizeImageBuffer = async (buffer, maxSizeKB = 1024) => {
  // Basic check if buffer is too large
  if (buffer.length > maxSizeKB * 1024) {
    try {
      // Just return as is - in a real implementation you might want to use 
      // a library like sharp to resize the image
      console.log(`Large file detected (${Math.round(buffer.length/1024)}KB), consider optimizing`);
    } catch (err) {
      console.warn('Image optimization failed, using original:', err);
    }
  }
  return buffer;
};

// Add retry logic to the upload function
const uploadToImageKit = async (fileBuffer, fileName, folder = "migrated_from_cloudinary", maxRetries = 3) => {
  if (!imagekit) {
    throw new Error('ImageKit service not initialized');
  }

  let retries = 0;
  let lastError = null;

  while (retries < maxRetries) {
    try {
      if (!fileBuffer || !fileName) {
        throw new Error('File buffer and filename are required');
      }

      console.log(`Uploading file ${fileName} to folder ${folder} (attempt ${retries + 1}/${maxRetries})`);
      
      // Optimize large images if needed
      const optimizedBuffer = await optimizeImageBuffer(fileBuffer);
      
      const result = await imagekit.upload({
        file: optimizedBuffer.toString('base64'),
        fileName: `${Date.now()}_${fileName}`,
        folder: folder,
        useUniqueFileName: true,
      });

      console.log('✓ Upload successful:', result.url);

      return {
        url: result.url,
        fileId: result.fileId,
        name: result.name,
        filePath: result.filePath
      };
    } catch (error) {
      lastError = error;
      retries++;
      console.error(`× Upload attempt ${retries}/${maxRetries} failed:`, error);
      
      if (retries < maxRetries) {
        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, retries) * 1000;
        console.log(`Retrying in ${delay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Failed to upload after ${maxRetries} attempts: ${lastError?.message}`);
};

export { imagekit, uploadToImageKit };
