import axios from 'axios';

// Add these from your Cloudinary dashboard
const CLOUDINARY_UPLOAD_PRESET = "smitoxphoto";     // Your upload preset name
const CLOUDINARY_CLOUD_NAME = "daabaruau";             // Your cloud name
const CLOUDINARY_API_KEY = "119598853346493";     // Your API key from Cloudinary dashboard
// api_key:  '119598853346493',    // Old account API key
// api_secret: 'WR6abBlUvmedVLOiybbuUneX12k' // Old account API secret
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

export const uploadToCloudinary = async (file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("cloud_name", CLOUDINARY_CLOUD_NAME);
    formData.append("api_key", CLOUDINARY_API_KEY);


    const { data } = await axios.post(CLOUDINARY_URL, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return data.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || "Image upload failed");
  }
};

export const uploadMultipleToCloudinary = async (files) => {
    try {
      const uploadPromises = files.map(file => uploadToCloudinary(file));
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error("Multiple uploads error:", error);
      throw new Error("Multiple images upload failed");
    }
  };