// migrate.js (ES module version)
import mongoose from 'mongoose';

// Update with your actual MongoDB connection string
const MONGO_URI = 'mongodb+srv://smitox:JSbWYZGtLBJGWxjO@smitox.rlcilry.mongodb.net/?retryWrites=true&w=majority&appName=smitox';

// List of collections that may have photo-related fields
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

// Function to convert URL to new Cloudinary format
function convertCloudinaryUrl(originalUrl) {
  if (!originalUrl || typeof originalUrl !== 'string' || !originalUrl.includes('migrated_from_cloudinary')) {
    return originalUrl;
  }

  // Remove any query parameters (e.g., ?updatedAt=...)
  const [urlWithoutQuery] = originalUrl.split('?');

  // Extract the file name (everything after the last '/')
  const fileName = urlWithoutQuery.substring(urlWithoutQuery.lastIndexOf('/') + 1);

  // Extract the public ID by splitting on '_' and taking the first part
  const [publicId] = fileName.split('_');

  // Construct the new Cloudinary URL
  return `https://res.cloudinary.com/djtiblazd/image/upload/v1737552540/${publicId}.jpg`;
}

async function runMigration() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected.');

    let totalUpdated = 0;

    for (const collName of collections) {
      const collection = mongoose.connection.collection(collName);
      let updateCount = 0;
      
      // 1. Check for "photos" field (string field in schema, not array)
      const photosCursor = collection.find({
        photos: { $regex: /migrated_from_cloudinary/ }
      });

      while (await photosCursor.hasNext()) {
        const doc = await photosCursor.next();
        const storedUrl = doc.photos;
        console.log(`Processing document ${doc._id} with photos (string): ${storedUrl}`);

        const newCloudinaryUrl = convertCloudinaryUrl(storedUrl);
        
        // Update the document with the new URL
        await collection.updateOne(
          { _id: doc._id },
          { $set: { photos: newCloudinaryUrl } }
        );
        updateCount++;
        console.log(`Updated document ${doc._id} photos to: ${newCloudinaryUrl}`);
      }

      // 2. Check for "multipleimages" array
      const multipleImagesCursor = collection.find({
        multipleimages: { $elemMatch: { $regex: /migrated_from_cloudinary/ } }
      });

      while (await multipleImagesCursor.hasNext()) {
        const doc = await multipleImagesCursor.next();
        console.log(`Processing document ${doc._id} with multipleimages array`);
        
        if (Array.isArray(doc.multipleimages)) {
          const updatedImages = doc.multipleimages.map(url => {
            if (typeof url === 'string' && url.includes('migrated_from_cloudinary')) {
              const newUrl = convertCloudinaryUrl(url);
              console.log(`  Updated multipleimages URL: ${url} -> ${newUrl}`);
              return newUrl;
            }
            return url;
          });
          
          // Update the document with the new array
          await collection.updateOne(
            { _id: doc._id },
            { $set: { multipleimages: updatedImages } }
          );
          updateCount++;
          console.log(`Updated document ${doc._id} multipleimages array`);
        }
      }

      // 3. Try a more direct approach for line 34 in the screenshot (photos array)
      const directCheckCursor = collection.find({});
      
      while (await directCheckCursor.hasNext()) {
        const doc = await directCheckCursor.next();
        let updated = false;
        
        // Check if photos is a string that contains our target URL
        if (doc.photos && typeof doc.photos === 'string' && doc.photos.includes('migrated_from_cloudinary')) {
          const newUrl = convertCloudinaryUrl(doc.photos);
          await collection.updateOne(
            { _id: doc._id },
            { $set: { photos: newUrl } }
          );
          console.log(`Updated document ${doc._id} photos string: ${doc.photos} -> ${newUrl}`);
          updated = true;
        }
        
        // Check if multipleimages exists and has at least one URL to update
        if (Array.isArray(doc.multipleimages) && doc.multipleimages.some(url => 
          typeof url === 'string' && url.includes('migrated_from_cloudinary'))) {
          
          const updatedImages = doc.multipleimages.map(url => {
            if (typeof url === 'string' && url.includes('migrated_from_cloudinary')) {
              return convertCloudinaryUrl(url);
            }
            return url;
          });
          
          await collection.updateOne(
            { _id: doc._id },
            { $set: { multipleimages: updatedImages } }
          );
          console.log(`Updated document ${doc._id} multipleimages array`);
          updated = true;
        }
        
        if (updated) {
          updateCount++;
        }
      }

      console.log(`Collection "${collName}" updated ${updateCount} documents.`);
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