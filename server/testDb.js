import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    const productModel = (await import("./models/productModel.js")).default;
    
    // Find products that have multipleimages not empty
    const products = await productModel.find({ multipleimages: { $exists: true, $not: {$size: 0} } }).limit(5);
    
    products.forEach(p => {
        console.log("Found:", p.name);
        console.log("multipleimages:", p.multipleimages);
    });
    
    process.exit(0);
  });
