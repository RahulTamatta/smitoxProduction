import { DomainError } from '../../../../core/errors/CustomError.js';

export default class CloudinaryProvider {
  constructor(cloudinary) {
    this.cloudinary = cloudinary;
  }

  async upload(buffer, metadata) {
    if (!this.cloudinary) throw new DomainError('Cloudinary provider not initialized');
    try {
      const res = await this.cloudinary.uploader.upload_stream({
        folder: metadata?.folder || 'uploads',
        resource_type: 'image'
      }, (error, result) => {
        if (error) throw error;
        return result;
      });
      // Note: using upload_stream requires piping; this is a placeholder for parity.
      return res;
    } catch (error) {
      throw new DomainError('Cloudinary upload failed', { originalError: error?.message });
    }
  }

  generateUrl(publicId, options = {}) {
    return this.cloudinary?.url?.(publicId, options);
  }
}
