import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';

// Configure OLD Cloudinary account
// cloudinary.config({
//   cloud_name: 'do3y11hpa', 
//   // Old account cloud name
//   api_key:  '119598853346493',    // Old account API key
//   api_secret: 'WR6abBlUvmedVLOiybbuUneX12k' // Old account API secret
// });


// Configure OLD Cloudinary account
cloudinary.config({
  cloud_name: 'dp3nfw7nc', 
  // Old account cloud name
  api_key:  '931387325789757',    // Old account API key
  api_secret: 'he0in0pTFmt2oxntMul2KNwHEHg' // Old account API secret
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
    const newUrlPattern = /res\.cloudinary\.com\/daabaruau/;

    for (const collName of collections) {
      const collection = mongoose.connection.collection(collName);
      let updateCount = 0;

      // Find documents where the "photos" field contains a new Cloudinary URL.
      const cursor = collection.find({
        $or: [
          { photos: { $regex: newUrlPattern } },
          { multipleimages: { $elemMatch: { $regex: newUrlPattern } } }
        ]
      });

      while (await cursor.hasNext()) {
        const doc = await cursor.next();
        let updateFields = {};

        // Handle single photo field
        if (doc.photos && newUrlPattern.test(doc.photos)) {
          console.log(`Transferring single image for document ${doc._id} in ${collName}: ${doc.photos}`);
          const oldUrl = await transferImage(doc.photos, collName);
          updateFields.photos = oldUrl;
          console.log(`Updated single image ${doc._id} in ${collName}: ${doc.photos} -> ${oldUrl}`);
        }

        // Handle multiple images array
        if (doc.multipleimages && Array.isArray(doc.multipleimages)) {
          const updatedMultipleImages = [];
          let hasUpdates = false;

          for (const imageUrl of doc.multipleimages) {
            if (imageUrl && newUrlPattern.test(imageUrl)) {
              console.log(`Transferring multiple image for document ${doc._id} in ${collName}: ${imageUrl}`);
              const oldUrl = await transferImage(imageUrl, collName);
              updatedMultipleImages.push(oldUrl);
              console.log(`Updated multiple image ${doc._id} in ${collName}: ${imageUrl} -> ${oldUrl}`);
              hasUpdates = true;
            } else {
              updatedMultipleImages.push(imageUrl);
            }
          }

          if (hasUpdates) {
            updateFields.multipleimages = updatedMultipleImages;
          }
        }

        // Update document if there are changes
        if (Object.keys(updateFields).length > 0) {
          await collection.updateOne({ _id: doc._id }, { $set: updateFields });
          updateCount++;
        }
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
