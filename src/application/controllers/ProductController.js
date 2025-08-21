export default class ProductController {
  constructor(getProductsUseCase /* , createProductUseCase */) {
    this.getProductsUseCase = getProductsUseCase;
  }

  async getProducts(req, res, next) {
    try {
      const filters = this.extractFilters(req.query);
      const pagination = this.extractPagination(req.query);
      const connectionQuality = req.connectionQuality || '4g';

      const result = await this.getProductsUseCase.execute(
        filters,
        pagination,
        connectionQuality
      );

      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  extractFilters(query) {
    const { category, subcategory, brand, search, minPrice, maxPrice, isActive } = query;
    const filters = {};
    if (category) filters.category = category;
    if (subcategory) filters.subcategory = subcategory;
    if (brand) filters.brand = brand;
    if (isActive !== undefined) filters.isActive = isActive;
    if (search) filters.search = search;
    if (minPrice || maxPrice) filters.price = { min: minPrice, max: maxPrice };
    return filters;
  }

  extractPagination(query) {
    const { page = 1, perPage = 20 } = query;
    return { page: Number(page), perPage: Number(perPage) };
  }
}
