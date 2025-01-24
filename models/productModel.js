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
    custom_order: { type: Number, default: 0 },
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
    photos: {
      type: String, // Changed from Buffer to String to store Cloudinary URL
      required: false
    },
    multipleimages: [{
      type: String, // Array of Cloudinary URLs
      required: false
    }],
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
    youtubeUrl: {
      type: String, // URL of the YouTube video related to the product
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
// Custom Order Management Service
class CustomOrderService {
  static async assignCustomOrder(proposedOrder) {
    // If no proposed order, auto-generate last+1
    if (!proposedOrder) {
      const lastProduct = await productModel
        .findOne()
        .sort({ custom_order: -1 })
        .select('custom_order');
      
      return lastProduct 
        ? lastProduct.custom_order + 1 
        : 1;
    }

    // Check if proposed order already exists
    const existingProduct = await productModel.findOne({ 
      custom_order: proposedOrder 
    });

    if (!existingProduct) {
      return proposedOrder; // Order available
    }

    // Order exists - shift existing products
    await productModel.updateMany(
      { custom_order: { $gte: proposedOrder } },
      { $inc: { custom_order: 1 } }
    );

    return proposedOrder;
  }
}

// In Product Controller
export const createProductController = async (req, res) => {
  try {
    const { custom_order, /* other fields */ } = req.fields;

    // Get unique custom order
    const finalCustomOrder = await CustomOrderService.assignCustomOrder(custom_order);

    const newProduct = new productModel({
      // ... other fields
      custom_order: finalCustomOrder
    });

    await newProduct.save();

    res.status(201).send({
      success: true,
      message: "Product Created Successfully",
      product: newProduct,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in creating product",
      error: error.message
    });
  }
};

export default mongoose.model("Product", productSchema);
