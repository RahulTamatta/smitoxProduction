import ImageOptimizationPolicy from '../../../domain/services/ImageOptimizationPolicy.js';

export default class GetProductsUseCase {
  constructor({ productRepository, bandwidthMonitor }) {
    this.productRepository = productRepository;
    this.bandwidthMonitor = bandwidthMonitor;
  }

  async execute(filters = {}, pagination = {}, connectionQuality = '4g') {
    const validatedPagination = this.validatePagination(pagination);

    const { products, total } = await this.productRepository.findWithFilters(
      filters,
      validatedPagination
    );

    const optimizedProducts = products.map((product) =>
      this.optimizeForConnection(product, connectionQuality)
    );

    if (this.bandwidthMonitor?.recordUsage) {
      await this.bandwidthMonitor.recordUsage(optimizedProducts);
    }

    return { products: optimizedProducts, total, pagination: validatedPagination };
  }

  validatePagination(pagination) {
    const page = Math.max(1, parseInt(pagination.page || 1, 10));
    const perPage = Math.min(100, Math.max(1, parseInt(pagination.perPage || 20, 10)));
    return { page, perPage };
  }

  optimizeForConnection(product, quality) {
    const q = ImageOptimizationPolicy.getOptimalQuality(quality);
    // Non-destructive example: attach hint for front-end/infra
    return {
      ...product,
      optimizedPhoto: product.photo
        ? { ...product.photo, suggestedQuality: q }
        : undefined
    };
  }
}
