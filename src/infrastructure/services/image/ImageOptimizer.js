// ImageOptimizer with graceful fallback if sharp is unavailable
export default class ImageOptimizer {
  async optimize(buffer, quality = 80, sizeOptions = null) {
    let sharp;
    try {
      // Dynamic import to avoid hard dependency at boot
      const mod = await import('sharp');
      sharp = mod.default || mod;
    } catch (e) {
      console.warn('sharp not installed; skipping optimization');
      return buffer;
    }

    try {
      let pipeline = sharp(buffer);
      if (sizeOptions?.width || sizeOptions?.height) {
        pipeline = pipeline.resize(sizeOptions.width, sizeOptions.height, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }
      pipeline = pipeline.webp({ quality });
      return await pipeline.toBuffer();
    } catch (error) {
      console.warn('Image optimization failed, using original', error);
      return buffer;
    }
  }
}
