import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';

// Configure OLD Cloudinary account
cloudinary.config({
  cloud_name: 'dz93gmlph', // Old account cloud name
  api_key:  '222712687287543',    // Old account API key
  api_secret: 'tZf0n0vOPtfAM2A64jIuXCEqGfY' // Old account API secret
});

// MongoDB connection
const MONGO_URI =
  'mongodb+srv://smitox:JSbWYZGtLBJGWxjO@smitox.rlcilry.mongodb.net/?retryWrites=true&w=majority&appName=smitox';

// List of collections that store Cloudinary image URLs
const collections = [
  'adsbanners', 'banners', 'brands', 'carts', 'categories',
  'minimumorders', 'orders', 'pincodes', 'productforyous', 'products',
  'subcategories', 'users', 'wishlists'
];

/**
 * Transfer an image from the new Cloudinary account back to the old one.
 * @param {string} newUrl - The URL from the new Cloudinary account.
 * @param {string} folderName - The folder in the old account where the image should be stored.
 * @returns {Promise<string>} - The old URL after uploading to the old Cloudinary account.
 */
async function transferImage(newUrl, folderName) {
  try {
    // Upload the image to the old Cloudinary account into the specified folder
    const result = await cloudinary.uploader.upload(newUrl, {
      folder: folderName
    });
    return result.secure_url; // Return the old Cloudinary URL
  } catch (error) {
    console.error("Error transferring image:", newUrl, error);
    return newUrl; // Fallback: return the new URL if upload fails
  }
}

async function runReverseMigration() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected.');

    let totalUpdated = 0;

    // Regex to match new Cloudinary URLs (Replace 'de9injdhu' with your new Cloudinary cloud name)
    const newUrlPattern = /res\.cloudinary\.com\/djytgqtdb/;

    for (const collName of collections) {
      const collection = mongoose.connection.collection(collName);
      let updateCount = 0;

      // Find documents where the "photos" field contains a new Cloudinary URL.
      const cursor = collection.find({
        photos: { $regex: newUrlPattern }
      });

      while (await cursor.hasNext()) {
        const doc = await cursor.next();
        const newUrl = doc.photos;
        console.log(`Transferring image for document ${doc._id} in ${collName}: ${newUrl}`);
        // Pass the collection name as the folder to transfer into a corresponding folder in the old Cloudinary account
        const oldUrl = await transferImage(newUrl, collName);
        await collection.updateOne({ _id: doc._id }, { $set: { photos: oldUrl } });
        console.log(`Updated document ${doc._id} in ${collName}: ${newUrl} -> ${oldUrl}`);
        updateCount++;
      }

      console.log(`Collection "${collName}" updated ${updateCount} document(s).`);
      totalUpdated += updateCount;
    }

    console.log(`Reverse migration complete. Total documents updated: ${totalUpdated}`);
  } catch (err) {
    console.error('Reverse migration error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
}

await runReverseMigration();
