import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';

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
const collections = [
  'adsbanners', 'banners', 'brands', 'carts', 'categories',
  'minimumorders', 'orders', 'pincodes', 'productforyous', 'products',
  'subcategories', 'users', 'wishlists'
];

/**
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
