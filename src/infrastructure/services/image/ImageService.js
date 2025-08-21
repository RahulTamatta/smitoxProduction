import ImageOptimizationPolicy from '../../../domain/services/ImageOptimizationPolicy.js';

export default class ImageService {
  constructor({ imageProvider, imageOptimizer, bandwidthMonitor }) {
    this.imageProvider = imageProvider;
    this.imageOptimizer = imageOptimizer;
    this.bandwidthMonitor = bandwidthMonitor;
  }

  async uploadImage(buffer, metadata = {}, options = {}) {
    const quality = options.quality ?? ImageOptimizationPolicy.getOptimalQuality(options.connection || '4g');
    const optimizedBuffer = await this.imageOptimizer.optimize(
      buffer,
      quality,
      options.size
    );

    this.bandwidthMonitor?.recordUpload?.(buffer.length, optimizedBuffer.length);

    return this.imageProvider.upload(optimizedBuffer, metadata);
  }

  async generateOptimizedUrl(imageId, options = {}) {
    return this.imageProvider.generateUrl(imageId, options);
  }
}
