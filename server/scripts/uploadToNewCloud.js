
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const UPLOADS_DIR = path.join(__dirname, '../uploads');

async function getFiles(dir) {
    const dirents = await fs.promises.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(dirents.map((dirent) => {
        const res = path.resolve(dir, dirent.name);
        return dirent.isDirectory() ? getFiles(res) : res;
    }));
    return files.flat();
}

function getPublicIdFromFilename(filename) {
    // Format: <timestamp>_<public_id>.<ext>
    const name = path.basename(filename);
    const underscoreIndex = name.indexOf('_');
    const lastDotIndex = name.lastIndexOf('.');
    if (underscoreIndex === -1) return null;

    return name.substring(underscoreIndex + 1, lastDotIndex !== -1 ? lastDotIndex : name.length);
}

async function uploadFiles() {
    try {
        console.log(`Starting upload to ${cloudinary.config().cloud_name}...`);
        const allFiles = await getFiles(UPLOADS_DIR);
        const imageFiles = allFiles.filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));

        console.log(`Found ${imageFiles.length} image files to upload.`);

        for (let i = 0; i < imageFiles.length; i++) {
            const filePath = imageFiles[i];
            const publicId = getPublicIdFromFilename(filePath);

            if (!publicId) {
                console.log(`Skipping ${filePath} (Could not parse public ID)`);
                continue;
            }

            try {
                process.stdout.write(`Uploading ${i + 1}/${imageFiles.length}: ${publicId}... `);
                await cloudinary.uploader.upload(filePath, {
                    public_id: publicId,
                    overwrite: true,
                    resource_type: 'image'
                });
                process.stdout.write('Done\n');
            } catch (err) {
                process.stdout.write(`Failed: ${err.message}\n`);
            }
        }

        console.log('All uploads completed!');
    } catch (err) {
        console.error('Upload process failed:', err);
    }
}

uploadFiles();
