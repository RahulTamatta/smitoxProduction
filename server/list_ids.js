
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import categoryModel from './models/categoryModel.js';
import subcategoryModel from './models/subcategoryModel.js';

dotenv.config();

const listIds = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('--- Categories ---');
        const cats = await categoryModel.find({}).select('name _id slug');
        cats.forEach(c => console.log(`${c.name} : ${c._id} (slug: ${c.slug})`));

        console.log('\n--- Subcategories ---');
        const subs = await subcategoryModel.find({}).select('name _id category slug');
        subs.forEach(s => console.log(`${s.name} : ${s._id} (parent: ${s.category}, slug: ${s.slug})`));

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
};

listIds();
