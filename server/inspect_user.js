
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import userModel from './models/userModel.js';

// Load env from one directory up
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const inspectUser = async () => {
    try {
        const mongoUrl = 'mongodb+srv://smitoxJSbWYZGtLBJGWxjO@smitox.rlcilry.mongodb.net/?retryWrites=true&w=majority&appName=smitox';
        console.log('Connecting to DB...');
        await mongoose.connect(mongoUrl);
        console.log('Connected.');

        const userId = '679ded52f4cbf0230199807e';

        const user = await userModel.findById(userId);
        if (!user) {
            console.log('User not found');
            return;
        }

        console.log('--- USER RECORD ---');
        console.log('Role:', user.role);
        console.log('RoleString:', user.roleString);
        console.log('Permissions (Raw):', user.permissions);
        console.log('Permissions (JSON):', JSON.stringify(user.permissions, null, 2));

        // Check if permissions is actually undefined/null or an empty object
        if (user.permissions === undefined) console.log('Permissions is undefined');
        if (user.permissions === null) console.log('Permissions is null');
        if (typeof user.permissions === 'object' && Object.keys(user.permissions).length === 0) console.log('Permissions is empty object');

    } catch (error) {
        console.error('Inspection failed:', error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

inspectUser();
