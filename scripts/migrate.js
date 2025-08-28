import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';

<<<<<<< HEAD
// 1) Configure NEW Cloudinary account
cloudinary.config({
  cloud_name: 'daabaruau', 
  // Old account cloud name
  api_key:  '144839262481772',    // Old account API key
  api_secret: 'w6ZBxrKfA6H4rQ2EuYWq0TSn-kA'    // ← new account API secret
});

// cloud_name: 'drz6y0abq', // Old account cloud name
// api_key:  '682972296546191',    // Old account API key
// api_secret: 'MDi4OGFCzxH3LohfXQZW-ePDCbU' 
// // 2) MongoDB connection
const MONGO_URI =
  'mongodb+srv://smitox:JSbWYZGtLBJGWxjO@smitox.rlcilry.mongodb.net/?retryWrites=true&w=majority&appName=smitox';

// 3) Collections to scan
=======
// Configure OLD Cloudinary account
cloudinary.config({
  cloud_name: 'daabaruau', 
  // Old account cloud name
  api_key:  '381637723934762',    // Old account API key
  api_secret: 'f3URVJGzLjg6Q8NeaVSnUpoR6t0' // Old account API secret
});

// MongoDB connection
const MONGO_URI =
  'mongodb+srv://smitox:JSbWYZGtLBJGWxjO@smitox.rlcilry.mongodb.net/?retryWrites=true&w=majority&appName=smitox';

// List of collections that store Cloudinary image URLs
>>>>>>> 4dfcbaf53792781327558b6f61c9b00ac93c8749
const collections = [
  'adsbanners', 'banners', 'brands', 'carts', 'categories',
  'minimumorders', 'orders', 'pincodes', 'productforyous', 'products',
  'subcategories', 'users', 'wishlists'
];

/**
<<<<<<< HEAD
 * Re-upload an image from the old Cloudinary into the new one.
 * @param {string} oldUrl    - URL in the OLD Cloudinary account.
 * @param {string} folder    - folder name to use in the new account.
 * @returns {Promise<string>} - the new Cloudinary URL.
 */
async function transferImageToNew(oldUrl, folder) {
  try {
    const res = await cloudinary.uploader.upload(oldUrl, {
      folder
    });
    return res.secure_url;
  } catch (err) {
    console.error('Upload to NEW Cloudinary failed for', oldUrl, err);
    return oldUrl;  // leave as-is on failure
  }
}

async function runMigrationOldToNew() {
  await mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  console.log('✔️  MongoDB connected.');

  // Match URLs pointing at your OLD account
  const oldCloudPattern = /res\.cloudinary\.com\/do3y11hpa/;

  let grandTotal = 0;

  for (const name of collections) {
    const coll = mongoose.connection.collection(name);
    const cursor = coll.find({ photos: { $regex: oldCloudPattern } });
    let count = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      const oldUrl = doc.photos;
      console.log(`→ [${name}] re-uploading ${oldUrl}`);

      // do the transfer
      const newUrl = await transferImageToNew(oldUrl, name);
      await coll.updateOne(
        { _id: doc._id },
        { $set: { photos: newUrl } }
      );

      console.log(`✔️  Updated ${doc._id}: ${oldUrl} → ${newUrl}`);
      count++;
    }

    console.log(`-- ${name}: ${count} docs updated`);
    grandTotal += count;
  }

  console.log(`🎉 Migration complete! Total images moved: ${grandTotal}`);
  await mongoose.disconnect();
  console.log('✖️  MongoDB disconnected.');
}

runMigrationOldToNew().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
=======
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
    const newUrlPattern = /res\.cloudinary\.com\/do3y11hpa/;

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
>>>>>>> 4dfcbaf53792781327558b6f61c9b00ac93c8749
