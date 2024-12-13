import mongoose from "mongoose";
const { Schema } = mongoose;

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    category: {
      type: mongoose.ObjectId,
      ref: "Category",
      required: true,
    },
    subcategory: {
      type: mongoose.ObjectId,
      ref: "SubCategory",
      required: true,
    },
    brand: {
      type: Schema.Types.ObjectId,
      ref: "Brands",
    },
    quantity: {
      type: Number,
    },
    stock: {
      type: Number,
      default: 0,
    },
    photo: {
      data: Buffer,
      contentType: String,
    },
    images: [
      {
        data: Buffer,
        contentType: String,
      },
    ],
    shipping: {
      type: Boolean,
    },
    hsn: {
      type: String,
    },
    tag: [{
      type: String,
    }],
    unit: {
      type: String,
    },
    additionalUnit: {
      type: mongoose.Schema.Types.Mixed,
      default: "",
    },
    purchaseRate: {
      type: Number,
    },
    mrp: {
      type: Number,
    },
    perPiecePrice: {
      type: Number,
    },
    totalsetPrice: {
      type: Number,
    },
    weight: {
      type: Number,
    },
    unitSet: {
      type: Number,
    },
    gst: {
      type: String,
    },
    gstType: {
      type: String,
    },
    allowCOD: {
      type: Boolean,
    },
    returnProduct: {
      type: Boolean,
    },
    bulkProducts: [
      {
        minimum: Number,
        maximum: Number,
        discount_mrp: Number,
        selling_price_set: Number,
      },
    ],
    isActive: {
      type: String,
      enum: ["0", "1", "2"],
      default: "1",
    },
    userId: {
      type: String,
    },
    fk_tags: [
      {
        type: String, // Array of tag strings
      },
    ],
    sku: {
      type: String,
    },
  },
  { timestamps: true }
);

// Index for faster queries
productSchema.index({ name: 'text' });

// Virtual for full image URL
productSchema.virtual('imageUrls').get(function() {
  return this.images.map(image => `${process.env.BASE_URL}/assets/images/product/${image}`);
});

// Method to check if SKU exists
productSchema.statics.checkSKU = async function(sku) {
  const count = await this.countDocuments({ sku: sku });
  return count > 0;
};

productSchema.statics.getLastSKU = async function(userId) {
  const product = await this.findOne({ userId: userId })
    .sort({ sku: -1 })
    .select('sku')
    .lean();
  return product ? product.sku : null;
};

productSchema.statics.generateSKU = async function(name, category, subcategory) {
  const getPrefix = (str) => str.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase();

  const namePrefix = getPrefix(name);
  const categoryPrefix = getPrefix(category);
  const subcategoryPrefix = getPrefix(subcategory);

  const basePrefix = `${namePrefix}-${categoryPrefix}-${subcategoryPrefix}`;

  const lastProduct = await this.findOne({ sku: new RegExp(`^${basePrefix}-\\d+$`) })
                               .sort({ sku: -1 })
                               .select('sku')
                               .lean();

  let newNumber = 1;
  if (lastProduct) {
    const lastNumber = parseInt(lastProduct.sku.split('-').pop(), 10);
    newNumber = lastNumber + 1;
  }

  return `${basePrefix}-${newNumber.toString().padStart(5, '0')}`;
};

export default mongoose.model("Product", productSchema);
