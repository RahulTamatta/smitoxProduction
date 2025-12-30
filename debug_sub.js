
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import productModel from './models/productModel.js';
import subcategoryModel from './models/subcategoryModel.js';

dotenv.config();

const checkProducts = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('Connected to MongoDB');

        const subId = '6794cccc6bd25c5cff2dcd57'; // Keychain subcategory ID from user log

        const sub = await subcategoryModel.findById(subId);
        console.log('Subcategory info:', sub ? sub.name : 'Not found');

        const count = await productModel.countDocuments({ subcategory: subId });
        console.log(`Products with subcategory ${subId}: ${count}`);

        const someProducts = await productModel.find({ subcategory: subId }).limit(5).select('name');
        console.log('Sample products:', someProducts.map(p => p.name));

        const allCount = await productModel.countDocuments({});
        console.log('Total products:', allCount);

        const nullSubCount = await productModel.countDocuments({ subcategory: { $exists: false } });
        console.log('Products without subcategory field:', nullSubCount);

        // Check if any product has this ID as a string or object
        const stringCount = await productModel.countDocuments({ subcategory: subId });
        console.log('Count with string ID:', stringCount);

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
};

checkProducts();
