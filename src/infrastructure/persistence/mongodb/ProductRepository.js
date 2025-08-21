import Product from '../../../domain/entities/Product.js';
import IProductRepository from '../../../domain/repositories/IProductRepository.js';
import mongoose from 'mongoose';

export default class ProductRepository extends IProductRepository {
  constructor({ ProductModel }) {
    super();
    this.ProductModel = ProductModel || mongoose.models.Product;
  }

  async findWithFilters(filters, pagination) {
    const mongoFilters = this.translateFilters(filters);
    const skip = (pagination.page - 1) * pagination.perPage;

    const [docs, total] = await Promise.all([
      this.ProductModel.find(mongoFilters)
        .skip(skip)
        .limit(pagination.perPage)
        .sort({ custom_order: 1, createdAt: -1 })
        .lean(),
      this.ProductModel.countDocuments(mongoFilters)
    ]);

    return { products: docs.map((d) => this.toEntity(d)), total };
  }

  translateFilters(filters) {
    const f = {};
    if (filters.category) f.category = filters.category;
    if (filters.subcategory) f.subcategory = filters.subcategory;
    if (filters.brand) f.brand = filters.brand;
    if (filters.isActive !== undefined) f.isActive = filters.isActive;
    if (filters.search) f.$text = { $search: filters.search };
    if (filters.price?.min || filters.price?.max) {
      f.price = {};
      if (filters.price.min) f.price.$gte = Number(filters.price.min);
      if (filters.price.max) f.price.$lte = Number(filters.price.max);
    }
    return f;
  }

  toEntity(document) {
    return new Product({
      id: document._id,
      name: document.name,
      slug: document.slug,
      description: document.description,
      price: document.price,
      mrp: document.mrp,
      perPiecePrice: document.perPiecePrice,
      custom_order: document.custom_order,
      photo: document.photos
        ? { url: document.photos, bytes: document.photoBytes }
        : undefined,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt
    });
  }
}
