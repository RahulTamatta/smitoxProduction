
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import userModel from '../models/userModel.js';

// Load env from one directory up
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const resetPermissions = async () => {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(process.env.MONGO_URL);
        console.log('Connected.');

        const userId = '679ded52f4cbf0230199807e';

        console.log(`Resetting permissions for user ${userId}...`);

        const result = await userModel.findByIdAndUpdate(
            userId,
            {
                role: 3,
                roleString: 'super_admin',
                $unset: { permissions: 1 } // Remove custom permissions so it falls back to role defaults
            },
            { new: true }
        );

        if (result) {
            console.log('SUCCESS: User updated.');
            console.log('New Role:', result.roleString);
            console.log('Permissions cleared.');
        } else {
            console.log('ERROR: User not found.');
        }

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected');
        process.exit();
    }
};

resetPermissions();
