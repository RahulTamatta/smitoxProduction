import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let folder = 'others';

        // Determine folder based on route or fieldname
        // IMPORTANT: Check 'subcategory' BEFORE 'category' since 'category' is a substring of 'subcategory'
        if (req.baseUrl.includes('product')) {
            folder = 'products';
        } else if (req.baseUrl.includes('subcategory')) {
            folder = 'subcategories';
        } else if (req.baseUrl.includes('category')) {
            folder = 'categories';
        } else if (req.baseUrl.includes('banner')) {
            folder = 'banners';
        } else if (req.baseUrl.includes('auth') || req.baseUrl.includes('user')) {
            folder = 'users';
        } else if (req.baseUrl.includes('seller')) {
            folder = 'sellers';
        }

        const uploadPath = path.join(__dirname, '../uploads', folder);

        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only images are allowed!'), false);
    }
};

export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});
