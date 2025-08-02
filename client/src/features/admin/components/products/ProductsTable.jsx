// ===================================
// PRODUCTS TABLE COMPONENT (Desktop)
// ===================================

import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency, getStatusColor, truncateText } from '../../utils';

const ProductsTable = ({
  products,
  selectedProducts,
  onToggleSelection,
  onToggleSelectAll,
  isAllSelected
}) => {
  const headers = [
    '', 'Serial', 'Photo', 'Name', 'Category', 'Subcategory', 
    'Price', 'Stock', 'Status', 'Actions'
  ];

  return (
    <div className="table-responsive">
      <table className="table table-hover">
        <thead className="table-light">
          <tr>
            {headers.map((header, index) => (
              <th key={header} className="px-3 py-2" style={{ minWidth: index === 3 ? '200px' : 'auto' }}>
                {header === '' ? (
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={onToggleSelectAll}
                    className="form-check-input"
                  />
                ) : (
                  <span className="text-small font-semibold text-uppercase">
                    {header}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const statusColor = getStatusColor(product.isActive === '1' ? 'active' : 'inactive');
            
            return (
              <tr key={product._id} className="align-middle">
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(product._id)}
                    onChange={() => onToggleSelection(product._id)}
                    className="form-check-input"
                  />
                </td>
                
                <td className="px-3 py-2">
                  <span className="text-small text-muted">
                    {product.custom_order || '#' + product._id.slice(-6)}
                  </span>
                </td>
                
                <td className="px-3 py-2">
                  <img
                    src={product.photos || '/placeholder.jpg'}
                    alt={product.name}
                    className="rounded"
                    style={{
                      width: '48px',
                      height: '48px',
                      objectFit: 'cover'
                    }}
                  />
                </td>
                
                <td className="px-3 py-2">
                  <div>
                    <h6 className="mb-1 font-semibold">
                      {truncateText(product.name, 50)}
                    </h6>
                    {product.brand && (
                      <small className="text-muted">
                        {product.brand.name}
                      </small>
                    )}
                  </div>
                </td>
                
                <td className="px-3 py-2">
                  <span className="text-small">
                    {product.category?.name || 'N/A'}
                  </span>
                </td>
                
                <td className="px-3 py-2">
                  <span className="text-small">
                    {product.subcategory?.name || 'N/A'}
                  </span>
                </td>
                
                <td className="px-3 py-2">
                  <div>
                    <strong className="text-primary">
                      {formatCurrency(product.perPiecePrice)}
                    </strong>
                    {product.mrp && product.mrp > product.perPiecePrice && (
                      <div className="text-small text-muted text-line-through">
                        {formatCurrency(product.mrp)}
                      </div>
                    )}
                  </div>
                </td>
                
                <td className="px-3 py-2">
                  <span className={`text-small ${product.stock <= 10 ? 'text-warning' : product.stock === 0 ? 'text-error' : 'text-secondary'}`}>
                    {product.stock} units
                  </span>
                </td>
                
                <td className="px-3 py-2">
                  <span
                    className="badge text-small"
                    style={{
                      backgroundColor: statusColor,
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  >
                    {product.isActive === '1' ? 'Active' : 'Inactive'}
                  </span>
                </td>
                
                <td className="px-3 py-2">
                  <div className="d-flex gap-xs">
                    <Link
                      to={`/dashboard/admin/product/${product.slug}`}
                      className="btn btn-sm btn-primary"
                      title="Edit Product"
                    >
                      <i className="fas fa-edit"></i>
                    </Link>
                    <Link
                      to={`/product/${product.slug}`}
                      target="_blank"
                      className="btn btn-sm btn-secondary"
                      title="View Product"
                    >
                      <i className="fas fa-eye"></i>
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ProductsTable;
