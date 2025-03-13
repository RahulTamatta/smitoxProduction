// migrate_images.js (ES module version)
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';

// Set up new Cloudinary account configuration
cloudinary.config({
  cloud_name: process.env.NEW_CLOUDINARY_CLOUD_NAME || 'de9injdhu', // New account cloud name
  api_key: process.env.NEW_CLOUDINARY_API_KEY || '398875936491573',    // New account API key
  api_secret: process.env.NEW_CLOUDINARY_API_SECRET || 'm6s2VIo4PQLe6rVCNk941vMQesY' // New account API secret
});

// Update with your actual MongoDB connection string
const MONGO_URI =
  'mongodb+srv://smitox:JSbWYZGtLBJGWxjO@smitox.rlcilry.mongodb.net/?retryWrites=true&w=majority&appName=smitox';

// List of collections that may have photo-related fields.
// Each collection stores the Cloudinary URL in the "photos" field.
const collections = [
  'adsbanners',
  'banners',
  'brands',
  'carts',
  'categories',
  'minimumorders',
  'orders',
  'pincodes',
  'productforyous',
  'products',
  'subcategories',
  'users',
  'wishlists'
];

/**
 * Transfer an image from the old Cloudinary account to the new one.
 * @param {string} oldUrl - The URL from the old Cloudinary account.
 * @returns {Promise<string>} - The new URL after uploading to the new Cloudinary account.
 */
async function transferImage(oldUrl) {
  try {
    // Upload the image by providing the old URL as the source
    const result = await cloudinary.uploader.upload(oldUrl, {
      folder: 'All_images' // Optional: specify a folder for your migrated images
    });
    return result.secure_url; // Return the new URL from Cloudinary
  } catch (error) {
    console.error("Error transferring image:", oldUrl, error);
    return oldUrl; // Fallback: return the old URL if upload fails
  }
}

async function runMigration() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected.');

    let totalUpdated = 0;

    // Adjust the regex to match your old Cloudinary URLs.
    // Here we match URLs containing 'res.cloudinary.com' followed by either "djtiblazd" or djtiblazd without quotes.
    const oldUrlPattern = /res\.cloudinary\.com\/["]?djtiblazd["]?/;

    for (const collName of collections) {
      const collection = mongoose.connection.collection(collName);
      let updateCount = 0;

      // Find documents where the "photos" field contains an old Cloudinary URL.
      const cursor = collection.find({
        photos: { $regex: oldUrlPattern }
      });

      while (await cursor.hasNext()) {
        const doc = await cursor.next();
        const oldUrl = doc.photos;
        console.log(`Transferring image for document ${doc._id} in ${collName}: ${oldUrl}`);
        const newUrl = await transferImage(oldUrl);
        await collection.updateOne({ _id: doc._id }, { $set: { photos: newUrl } });
        console.log(`Updated document ${doc._id} in ${collName}: ${oldUrl} -> ${newUrl}`);
        updateCount++;
      }

      console.log(`Collection "${collName}" updated ${updateCount} document(s).`);
      totalUpdated += updateCount;
    }

    console.log(`Migration complete. Total documents updated: ${totalUpdated}`);
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
}

await runMigration();
