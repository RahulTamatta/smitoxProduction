// Minimal DI container to support Clean Architecture wiring
class Container {
  constructor() {
    this.registry = new Map();
    this.singletons = new Map();
  }

  register(name, factory, { singleton = true } = {}) {
    this.registry.set(name, { factory, singleton });
  }

  resolve(name) {
    const entry = this.registry.get(name);
    if (!entry) throw new Error(`Dependency not found: ${name}`);

    if (entry.singleton) {
      if (!this.singletons.has(name)) {
        this.singletons.set(name, entry.factory(this));
      }
      return this.singletons.get(name);
    }
    return entry.factory(this);
  }
}

export const container = new Container();

// Wiring: register dependencies. This is safe to import; it doesn't hook routes.
export async function setupContainer() {
  // Lazy imports to avoid circulars and heavy deps at boot
  const { default: config } = await import('../config/config.js');

  // Models (Mongoose)
  // Importing from project root models; relies on existing model definitions
  const { default: ProductModel } = await import('../../../models/productModel.js');

  // Infrastructure services
  const { default: ProductRepository } = await import('../../infrastructure/persistence/mongodb/ProductRepository.js');
  const { default: ImageOptimizer } = await import('../../infrastructure/services/image/ImageOptimizer.js');
  const { default: ImageService } = await import('../../infrastructure/services/image/ImageService.js').catch(() => ({ default: class {} }));
  const { imagekit } = await import('../../../utils/imageKitService.js');
  const { default: ImageKitProvider } = await import('../../infrastructure/services/image/providers/ImageKitProvider.js');
  const { default: BandwidthMonitoringService } = await import('../../application/services/BandwidthMonitoringService.js');

  // Use cases and controllers
  const { default: GetProductsUseCase } = await import('../../application/use-cases/products/GetProductsUseCase.js');
  const { default: ProductController } = await import('../../application/controllers/ProductController.js');

  // Config
  container.register('config', () => config);

  // Models
  container.register('ProductModel', () => ProductModel);

  // Repositories
  container.register('productRepository', (c) => new ProductRepository({ ProductModel: c.resolve('ProductModel') }));

  // Image pipeline
  container.register('imageOptimizer', () => new ImageOptimizer());
  container.register('imageProvider', () => new ImageKitProvider(imagekit));
  container.register('imageService', (c) => new ImageService({
    imageProvider: c.resolve('imageProvider'),
    imageOptimizer: c.resolve('imageOptimizer'),
    bandwidthMonitor: c.resolve('bandwidthMonitor')
  }));

  // Bandwidth monitoring
  container.register('bandwidthMonitor', () => new BandwidthMonitoringService({}));

  // Use cases
  container.register('getProductsUseCase', (c) => new GetProductsUseCase({
    productRepository: c.resolve('productRepository'),
    bandwidthMonitor: c.resolve('bandwidthMonitor')
  }));

  // Controllers
  container.register('productController', (c) => new ProductController(c.resolve('getProductsUseCase')));
}
