// Interface definition for ProductRepository
// Implementations must adhere to this API.
export default class IProductRepository {
  async findWithFilters(filters, pagination) { // returns { products: Product[], total: number }
    throw new Error('Not implemented');
  }

  async create(productData) { // returns Product
    throw new Error('Not implemented');
  }

  async update(id, updates) { // returns Product
    throw new Error('Not implemented');
  }

  async delete(id) { // returns boolean
    throw new Error('Not implemented');
  }
}
