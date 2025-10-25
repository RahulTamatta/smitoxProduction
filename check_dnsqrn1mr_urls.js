import mongoose from 'mongoose';

// MongoDB connection
const MONGO_URI =
  'mongodb+srv://smitox:JSbWYZGtLBJGWxjO@smitox.rlcilry.mongodb.net/?retryWrites=true&w=majority&appName=smitox';

// Collections that may store Cloudinary image URLs
const collections = [
  'adsbanners', 'banners', 'brands', 'carts', 'categories',
  'minimumorders', 'orders', 'pincodes', 'productforyous', 'products',
  'subcategories', 'users', 'wishlists'
];

// Regex patterns
const cloudinaryAny = 'res\\.cloudinary\\.com\\/';
const cloudinaryDnsqrn1mr = 'res\\.cloudinary\\.com\\/dnsqrn1mr';
const cloudinaryNotDnsqrn1mr = 'res\\.cloudinary\\.com\\\/(?!dnsqrn1mr)'; // negative lookahead

async function checkCloudNameInUrls() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected.');

    let totalDocsWithCloudinary = 0;
    let totalDocsWithDnsqrn1mr = 0;
    let totalDocsWithOtherClouds = 0;

    for (const collName of collections) {
      const collection = mongoose.connection.collection(collName);

      // Count documents that have any Cloudinary URL in either field
      const countAny = await collection.countDocuments({
        $or: [
          { photos: { $regex: cloudinaryAny } },
          { multipleimages: { $elemMatch: { $regex: cloudinaryAny } } },
        ],
      });

      // Count documents that have dnsqrn1mr in either field
      const countDnsCloud = await collection.countDocuments({
        $or: [
          { photos: { $regex: cloudinaryDnsqrn1mr } },
          { multipleimages: { $elemMatch: { $regex: cloudinaryDnsqrn1mr } } },
        ],
      });

      // Find documents that reference Cloudinary but NOT dnsqrn1mr
      const cursor = collection.find({
        $or: [
          { photos: { $regex: cloudinaryNotDnsqrn1mr } },
          { multipleimages: { $elemMatch: { $regex: cloudinaryNotDnsqrn1mr } } },
        ],
      });

      let countOther = 0;
      const offenders = [];
      while (await cursor.hasNext()) {
        const doc = await cursor.next();
        countOther++;
        // Capture minimal offending data for quick inspection
        const photos = doc.photos || null;
        const multi = Array.isArray(doc.multipleimages) ? doc.multipleimages : [];
        const offendingPhotos = [];
        if (typeof photos === 'string' && /res\.cloudinary\.com\/(?!dnsqrn1mr)/.test(photos)) {
          offendingPhotos.push(photos);
        }
        for (const url of multi) {
          if (typeof url === 'string' && /res\.cloudinary\.com\/(?!dnsqrn1mr)/.test(url)) {
            offendingPhotos.push(url);
          }
        }
        offenders.push({ _id: doc._id, offending: offendingPhotos.slice(0, 3) });
      }

      totalDocsWithCloudinary += countAny;
      totalDocsWithDnsqrn1mr += countDnsCloud;
      totalDocsWithOtherClouds += countOther;

      console.log(`\nCollection: ${collName}`);
      console.log(`- Cloudinary URLs (any cloud): ${countAny}`);
      console.log(`- Cloudinary URLs with dnsqrn1mr: ${countDnsCloud}`);
      console.log(`- Cloudinary URLs with other clouds: ${countOther}`);

      if (offenders.length > 0) {
        console.log('- Sample offenders (up to 5):');
        for (const item of offenders.slice(0, 5)) {
          console.log(`  • _id: ${item._id} -> ${item.offending.join(' | ')}`);
        }
      }
    }

    console.log('\n==== Summary ====');
    console.log(`- Total docs with Cloudinary URLs (any cloud): ${totalDocsWithCloudinary}`);
    console.log(`- Total docs with dnsqrn1mr URLs: ${totalDocsWithDnsqrn1mr}`);
    console.log(`- Total docs with other Cloudinary clouds: ${totalDocsWithOtherClouds}`);

    if (totalDocsWithOtherClouds > 0) {
      console.log('\nSome documents still reference Cloudinary URLs not under dnsqrn1mr.');
      process.exitCode = 1; // Non-zero to indicate issues found
    } else {
      console.log('\nAll Cloudinary URLs reference dnsqrn1mr.');
    }
  } catch (err) {
    console.error('Check error:', err);
    process.exitCode = 2;
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
}

await checkCloudNameInUrls();
