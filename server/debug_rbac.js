
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { getCapabilities } from './config/rbac-policy.js';
import userModel from './models/userModel.js';

dotenv.config();

const checkUserPermissions = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('Connected to DB');

        // ID from the error log: 679ded52f4cbf0230199807e
        const userId = '679ded52f4cbf0230199807e';
        const user = await userModel.findById(userId);

        if (!user) {
            console.log('User not found');
            return;
        }

        console.log('User Role:', user.role);
        console.log('User RoleString:', user.roleString);
        console.log('User Permissions:', JSON.stringify(user.permissions, null, 2));

        const capabilities = getCapabilities(user.roleString, user.permissions);
        console.log('Computed Capabilities:', capabilities);
        console.log('Has products:delete?', capabilities.includes('products:delete'));

    } catch (error) {
        console.error(error);
    } finally {
        mongoose.disconnect();
    }
};

checkUserPermissions();
