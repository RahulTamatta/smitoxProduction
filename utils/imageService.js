let ImageKit;
let imagekit;

// Add this function to handle ImageKit uploads
const uploadToImageKit = async (file) => {
  console.log('Starting ImageKit upload for file:', file.name);
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('publicKey', 'public_XxQnBh4c/UCDe8GKiz9RGPfF3pU=');
    formData.append('folder', '/migrated_from_cloudinary/');
    formData.append('fileName', `${Date.now()}_${file.name.replace(/\s+/g, '_')}`);
    formData.append('useUniqueFileName', 'true');
    formData.append('transformation', JSON.stringify([{ quality: 80, format: 'webp' }]));
    
    const response = await fetch(
      'https://upload.imagekit.io/api/v1/files/upload',
      {
        method: 'POST',
        body: formData,
      }
    );
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Upload successful, URL:', data.url);
    return data.url;
  } catch (error) {
    console.error('ImageKit upload error:', error);
    throw error;
  }
};

// Modify the handleCreate function to use ImageKit
const handleCreate = async (e) => {
  e.preventDefault();
  try {
    toast.loading("Creating product...");
    const productData = new FormData();

    // Upload photos in parallel if they exist
    const uploadPromises = [];
    
    if (photo) {
      uploadPromises.push(
        uploadToImageKit(photo).then(url => {
          productData.append("photos", url);
        })
      );
    }

    // Handle multiple images in parallel
    let allImageUrls = [...(multipleimages || [])];
    
    if (images?.length) {
      const newImagePromises = images.map(uploadToImageKit);
      const newUrls = await Promise.all(newImagePromises);
      allImageUrls.push(...newUrls);
    }
    
    productData.append("multipleimages", JSON.stringify(allImageUrls));

    // Add all other form fields
    const formFields = {
      name, description, price, quantity, category, subcategory, brand,
      shipping: shipping ? "1" : "0", hsn, unit, unitSet, purchaseRate,
      mrp, perPiecePrice, totalsetPrice, weight, stock, gst,
      additionalUnit, sku, fk_tags: fk_tags ? JSON.stringify(fk_tags.split(',').map(tag => tag.trim()).filter(Boolean)) : "",
      youtubeUrl,
      bulkProducts: JSON.stringify(bulkProducts.map(p => ({
        minimum: parseFloat(p.minimum) || 0,
        maximum: parseFloat(p.maximum) || 0,
        discount_mrp: parseFloat(p.discount_mrp) || 0,
        selling_price_set: parseFloat(p.selling_price_set) || 0
      })))
    };

    Object.entries(formFields).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        productData.append(key, value);
      }
    });

    // Wait for all uploads to complete
    await Promise.all(uploadPromises);

    const { data } = await axios.post(
      "/api/v1/product/create-product",
      productData,
      {
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    );

    if (data?.success) {
      toast.dismiss();
      toast.success("Product Created Successfully");
      navigate("/dashboard/admin/products");
    } else {
      toast.dismiss();
      toast.error(data?.message || "Error creating product");
    }
  } catch (error) {
    toast.dismiss();
    toast.error(error.message || "Error creating product");
    console.error('Create error:', error);
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
