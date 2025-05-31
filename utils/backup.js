import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({ 
  cloud_name: 'ddqfl3zo8', 
  api_key: '719814162117114', 
  api_secret: 'VB_c0DClKeLugYJf9tMMIxXjXRE' 
});

// Function to delete all images
async function deleteAllImages() {
  try {
    let nextCursor = null;
    do {
      // Fetch images in batches
      let result = await cloudinary.api.resources({ max_results: 100, next_cursor: nextCursor });
      
      if (result.resources.length === 0) {
        console.log('No images found.');
        break;
      }
      
      // Extract public IDs
      let publicIds = result.resources.map(img => img.public_id);
      
      // Delete images
      await cloudinary.api.delete_resources(publicIds);
      console.log(`Deleted ${publicIds.length} images.`);
      
      nextCursor = result.next_cursor;
    } while (nextCursor);

    console.log('All images deleted successfully!');
  } catch (error) {
    console.error('Error deleting images:', error);
  }
}

// Run the script
deleteAllImages();