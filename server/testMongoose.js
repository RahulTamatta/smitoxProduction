import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    multipleimages: [{
      type: String, // Array of Cloudinary URLs
      required: false
    }]
});

const Product = mongoose.model('TestProduct', productSchema);

const doc = new Product({
    multipleimages: [{url: "uploads/products/1.jpg"}, "uploads/products/new.jpg"]
});

console.log(doc.multipleimages);
