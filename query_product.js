const mongoose = require('mongoose');
require('dotenv').config({ path: 'server/.env' });

mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    const productModel = require('./server/models/productModel.js').default || require('./server/models/productModel.js');
    const prod = await productModel.findOne({ slug: "BUNNY-Dott-Umbrella" }).lean();
    console.log(JSON.stringify(prod.multipleimages, null, 2));
    mongoose.disconnect();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
