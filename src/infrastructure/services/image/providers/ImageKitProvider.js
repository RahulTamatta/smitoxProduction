import { DomainError } from '../../../../core/errors/CustomError.js';

export default class ImageKitProvider {
  constructor(imagekit) {
    this.imagekit = imagekit;
  }

  async upload(buffer, metadata) {
    if (!this.imagekit) throw new DomainError('ImageKit provider not initialized');

    try {
      const { fileName = `upload_${Date.now()}.webp`, folder = 'uploads' } = metadata || {};
      const result = await this.imagekit.upload({
        file: Buffer.isBuffer(buffer) ? buffer.toString('base64') : buffer,
        fileName,
        folder,
        useUniqueFileName: true
      });
      return { id: result.fileId, url: result.url, bytes: buffer.length };
    } catch (error) {
      throw new DomainError('ImageKit upload failed', { originalError: error?.message });
    }
  }

  generateUrl(imageId, options = {}) {
    // Defer to imagekit URL builder if needed in future
    return { id: imageId, options };
  }
}
