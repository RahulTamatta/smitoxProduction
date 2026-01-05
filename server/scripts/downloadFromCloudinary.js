import axios from 'axios';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import fs from 'fs';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const MONGO_URI = process.env.MONGO_URL || 'mongodb+srv://smitox:JSbWYZGtLBJGWxjO@smitox.rlcilry.mongodb.net/?retryWrites=true&w=majority&appName=smitox';
const UPLOADS_DIR = path.join(__dirname, '../uploads');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dvqh6a3gh',
    api_key: process.env.CLOUDINARY_API_KEY || '719814162117114',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'VB_c0DClKeLugYJf9tMMIxXjXRE'
});

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Extracts public ID from a Cloudinary URL
 */
/**
 * Extracts public ID and cloud name from a Cloudinary URL
 */
function parseCloudinaryUrl(url) {
    try {
        if (!url.includes('cloudinary.com')) return null;
        const parts = url.split('/');
        const uploadIndex = parts.indexOf('upload');
        if (uploadIndex === -1) return null;

        let cloudName = null;
        // Typically https://res.cloudinary.com/<cloud_name>/image/upload/...
        const resIndex = parts.indexOf('res.cloudinary.com');
        if (resIndex !== -1 && parts.length > resIndex + 1) {
            cloudName = parts[resIndex + 1];
        }

        // Skip version if present (v123456789)
        let startIndex = uploadIndex + 1;
        if (parts[startIndex] && parts[startIndex].startsWith('v') && !isNaN(parts[startIndex].substring(1))) {
            startIndex++;
        }

        // Join remaining parts and remove extension
        const publicIdWithExt = parts.slice(startIndex).join('/');
        // Remove the last extension (e.g. .jpg, .png)
        const lastDotIndex = publicIdWithExt.lastIndexOf('.');
        const publicId = lastDotIndex !== -1 ? publicIdWithExt.substring(0, lastDotIndex) : publicIdWithExt;

        return { cloudName, publicId };
    } catch (e) {
        return null;
    }
}

/**
 * Downloads an image from a URL and saves it locally.
 * Returns the local relative path.
 * Naming: [sanitized_name]_[yyyy-mm-dd]_[timestamp]_[original_ext]
 */
async function downloadImage(url, folder, baseName = '', entityDate = null) {
    if (!url || !url.startsWith('http')) return url;

    try {
        const folderPath = path.join(UPLOADS_DIR, folder);
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }

        const dateToUse = entityDate ? new Date(entityDate) : new Date();
        const dateStr = dateToUse.toISOString().split('T')[0]; // YYYY-MM-DD
        const sanitizedName = baseName.toLowerCase().trim().replace(/[^a-z0-9]/g, '_').substring(0, 50);
        const timestamp = Date.now();
        const extension = path.extname(url.split('?')[0]) || '.jpg';

        const fileName = sanitizedName
            ? `${sanitizedName}_${dateStr}_${timestamp}${extension}`
            : `${timestamp}${extension}`;

        const filePath = path.join(folderPath, fileName);
        const relativePath = `uploads/${folder}/${fileName}`;

        console.log(`Downloading: ${url} -> ${relativePath}`);

        let downloadUrl = url;

        // If it's a Cloudinary URL, try to generate a signed URL to avoid 401 errors
        // If it's a Cloudinary URL, try to generate a signed URL to avoid 401 errors
        const cloudinaryInfo = parseCloudinaryUrl(url);
        // Only sign if we have credentials for THIS cloud account
        if (cloudinaryInfo && cloudinaryInfo.cloudName === cloudinary.config().cloud_name) {
            // console.log(`Signing URL for ${cloudinaryInfo.publicId} (cloud: ${cloudinaryInfo.cloudName})`);
            downloadUrl = cloudinary.url(cloudinaryInfo.publicId, { secure: true, sign_url: true });
        } else if (cloudinaryInfo) {
            console.log(`Skipping signature for ${url} (Cloud name mismatch: ${cloudinaryInfo.cloudName} vs ${cloudinary.config().cloud_name})`);
        }

        const response = await axios({
            url: downloadUrl,
            method: 'GET',
            responseType: 'stream',
            timeout: 10000 // 10s timeout
        });

        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => resolve(relativePath));
            writer.on('error', (err) => {
                console.error(`Write error for ${url}:`, err.message);
                reject(err);
            });
        });
    } catch (error) {
        console.error(`Failed to download ${url}: ${error.message}${error.response ? ' (Status: ' + error.response.status + ')' : ''}`);
        return url; // Keep original URL if download fails
    }
}

async function runMigration() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB connected.');

        // 1. Products
        const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
        const products = await Product.find({
            $or: [
                { photos: { $regex: /cloudinary|imagekit/ } },
                { multipleimages: { $elemMatch: { $regex: /cloudinary|imagekit/ } } }
            ]
        });

        console.log(`Found ${products.length} products to migrate.`);
        for (const p of products) {
            let updated = false;

            if (p.photos && p.photos.startsWith('http')) {
                p.photos = await downloadImage(p.photos, 'products', p.name || 'product', p.createdAt);
                updated = true;
            }

            if (p.multipleimages && Array.isArray(p.multipleimages)) {
                const newImages = [];
                for (let i = 0; i < p.multipleimages.length; i++) {
                    const img = p.multipleimages[i];
                    if (img && img.startsWith('http')) {
                        newImages.push(await downloadImage(img, 'products/gallery', `${p.name || 'product'}_gallery_${i}`, p.createdAt));
                        updated = true;
                    } else {
                        newImages.push(img);
                    }
                }
                p.multipleimages = newImages;
            }

            if (updated) {
                await Product.updateOne({ _id: p._id }, {
                    $set: {
                        photos: p.photos,
                        multipleimages: p.multipleimages
                    }
                });
            }
        }

        // 2. Categories
        const Category = mongoose.model('Category', new mongoose.Schema({}, { strict: false }));
        const categories = await Category.find({ photos: { $regex: /cloudinary|imagekit/ } });
        console.log(`Found ${categories.length} categories to migrate.`);
        for (const c of categories) {
            const localPath = await downloadImage(c.photos, 'categories', c.name || 'category', c.createdAt);
            await Category.updateOne({ _id: c._id }, { $set: { photos: localPath } });
        }

        // 3. SubCategories
        const SubCategory = mongoose.model('SubCategory', new mongoose.Schema({}, { strict: false }));
        const subcategories = await SubCategory.find({ photos: { $regex: /cloudinary|imagekit/ } });
        console.log(`Found ${subcategories.length} subcategories to migrate.`);
        for (const sc of subcategories) {
            const localPath = await downloadImage(sc.photos, 'subcategories', sc.name || 'subcategory', sc.createdAt);
            await SubCategory.updateOne({ _id: sc._id }, { $set: { photos: localPath } });
        }

        // 4. Banners
        const Banner = mongoose.model('Banner', new mongoose.Schema({}, { strict: false }));
        const banners = await Banner.find({ photos: { $regex: /cloudinary|imagekit/ } });
        console.log(`Found ${banners.length} banners to migrate.`);
        for (const b of banners) {
            const localPath = await downloadImage(b.photos, 'banners', 'banner', b.createdAt);
            await Banner.updateOne({ _id: b._id }, { $set: { photos: localPath } });
        }

        // 5. Users (various image fields)
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        const userImageFields = ['image', 'gst_image', 'pan_image', 'check_image', 'identity_proof_image', 'address_proof_image'];

        for (const field of userImageFields) {
            const query = {};
            query[field] = { $regex: /cloudinary|imagekit/ };
            const users = await User.find(query);
            console.log(`Found ${users.length} users with ${field} to migrate.`);

            for (const u of users) {
                const localPath = await downloadImage(u[field], `users/${field}`, `${u.name || 'user'}_${field}`, u.createdAt);
                const update = {};
                update[field] = localPath;
                await User.updateOne({ _id: u._id }, { $set: update });
            }
        }

        console.log('Migration complete!');
    } catch (err) {
        console.error('Migration error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

runMigration();
