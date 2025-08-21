import Entity from '../../core/domain/Entity.js';
import { DomainError } from '../../core/errors/CustomError.js';

export default class Product extends Entity {
  constructor(data) {
    super(data);
    this.validate(data);
    Object.assign(this, data);
  }

  validate(data) {
    if (typeof data.mrp === 'number' && data.mrp < 0) {
      throw new DomainError('MRP cannot be negative');
    }
    if (typeof data.perPiecePrice === 'number' && typeof data.mrp === 'number' && data.perPiecePrice > data.mrp) {
      throw new DomainError('Price cannot exceed MRP');
    }
    if (data.photo && typeof data.photo.size === 'number' && data.photo.size > Product.MAX_PHOTO_SIZE) {
      throw new DomainError(`Photo exceeds maximum size of ${Product.MAX_PHOTO_SIZE / 1024}KB`);
    }
  }

  static get MAX_PHOTO_SIZE() { return 500 * 1024; }
  static get OPTIMAL_QUALITY() { return 75; }
}
