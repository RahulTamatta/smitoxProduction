/**
 * Fix Database Image URLs
 * This script updates Category and SubCategory records that still have Cloudinary URLs
 * to point to local file paths based on matching filenames in the uploads directory.
 */

import dotenv from 'dotenv';
import fs from 'fs';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URL;
const UPLOADS_DIR = path.join(__dirname, '../uploads');

// Extract public ID from Cloudinary URL
function getPublicIdFromUrl(url) {
    if (!url || !url.includes('cloudinary.com')) return null;
    // URL format: https://res.cloudinary.com/<cloud>/image/upload/<transformations>/<public_id>.<ext>
    const parts = url.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return null;

    // Get everything after 'upload', skip version if present
    let startIndex = uploadIndex + 1;
    if (parts[startIndex] && parts[startIndex].startsWith('v') && !isNaN(parts[startIndex].substring(1))) {
        startIndex++;
    }

    // Join remaining parts and remove extension
    const publicIdWithExt = parts.slice(startIndex).join('/');
    const lastDotIndex = publicIdWithExt.lastIndexOf('.');
    return lastDotIndex !== -1 ? publicIdWithExt.substring(0, lastDotIndex) : publicIdWithExt;
}

// Find local file matching the public ID
function findLocalFile(publicId, subDir) {
    const dirPath = path.join(UPLOADS_DIR, subDir);
    if (!fs.existsSync(dirPath)) return null;

    const files = fs.readdirSync(dirPath);
    // Look for file containing the public ID
    const match = files.find(f => f.includes(publicId));
    if (match) {
        return `uploads/${subDir}/${match}`;
    }
    return null;
}

async function fixDatabaseUrls() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected!\n');

        // Categories
        const Category = mongoose.model('Category', new mongoose.Schema({}, { strict: false }));
        const categories = await Category.find({ photos: { $regex: /cloudinary|imagekit/ } });
        console.log(`Found ${categories.length} categories with external URLs`);

        for (const cat of categories) {
            const publicId = getPublicIdFromUrl(cat.photos);
            if (publicId) {
                const localPath = findLocalFile(publicId, 'categories') || findLocalFile(publicId, 'subcategories');
                if (localPath) {
                    console.log(`  ${cat.name}: ${publicId} -> ${localPath}`);
                    await Category.updateOne({ _id: cat._id }, { $set: { photos: localPath } });
                } else {
                    console.log(`  ${cat.name}: No local file found for ${publicId}`);
                }
            }
        }

        // SubCategories
        const SubCategory = mongoose.model('SubCategory', new mongoose.Schema({}, { strict: false }));
        const subcategories = await SubCategory.find({ photos: { $regex: /cloudinary|imagekit/ } });
        console.log(`\nFound ${subcategories.length} subcategories with external URLs`);

        for (const sub of subcategories) {
            const publicId = getPublicIdFromUrl(sub.photos);
            if (publicId) {
                const localPath = findLocalFile(publicId, 'subcategories') || findLocalFile(publicId, 'categories');
                if (localPath) {
                    console.log(`  ${sub.name}: ${publicId} -> ${localPath}`);
                    await SubCategory.updateOne({ _id: sub._id }, { $set: { photos: localPath } });
                } else {
                    console.log(`  ${sub.name}: No local file found for ${publicId}`);
                }
            }
        }

        // Banners
        const Banner = mongoose.model('Banner', new mongoose.Schema({}, { strict: false }));
        const banners = await Banner.find({ photos: { $regex: /cloudinary|imagekit/ } });
        console.log(`\nFound ${banners.length} banners with external URLs`);

        for (const b of banners) {
            const publicId = getPublicIdFromUrl(b.photos);
            if (publicId) {
                const localPath = findLocalFile(publicId, 'banners');
                if (localPath) {
                    console.log(`  Banner ${b._id}: ${publicId} -> ${localPath}`);
                    await Banner.updateOne({ _id: b._id }, { $set: { photos: localPath } });
                } else {
                    console.log(`  Banner ${b._id}: No local file found for ${publicId}`);
                }
            }
        }

        console.log('\n✅ Database update complete!');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

fixDatabaseUrls();
