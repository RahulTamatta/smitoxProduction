// ===================================
// PRODUCT CARD COMPONENT (Mobile)
// ===================================

import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency, getStatusColor } from '../../utils';

const ProductCard = ({ product, isSelected, onToggleSelection }) => {
  const statusColor = getStatusColor(product.isActive === '1' ? 'active' : 'inactive');

  return (
    <div className="card mb-base admin-product-card">
      <div className="card-body p-base">
        <div className="d-flex align-center gap-base mb-base">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelection(product._id)}
            className="form-check-input"
          />
          <img
            src={product.photos || '/placeholder.jpg'}
            alt={product.name}
            className="rounded"
            style={{
              width: '64px',
              height: '64px',
              objectFit: 'cover'
            }}
          />
          <div className="flex-1">
            {product.custom_order && (
              <div className="text-xs text-muted mb-xs">#{product.custom_order}</div>
            )}
            <h4 className="heading-5 mb-xs product-title">{product.name}</h4>
            <p className="text-small text-secondary mb-0 product-category">
              {product.category?.name} - {product.subcategory?.name}
            </p>
          </div>
        </div>

        <div className="d-flex justify-between align-center mb-base">
          <div>
            <div className="text-small product-info">
              <strong>Price:</strong> {formatCurrency(product.perPiecePrice)}
            </div>
            <div className="text-small product-info">
              <strong>Stock:</strong> {product.stock} units
            </div>
          </div>
          <span
            className="badge status-badge"
            style={{
              backgroundColor: statusColor,
              color: 'white'
            }}
          >
            {product.isActive === '1' ? 'Active' : 'Inactive'}
          </span>
        </div>

        <div className="d-flex gap-sm">
          <Link
            to={`/dashboard/admin/product/${product.slug}`}
            className="btn btn-primary btn-sm flex-1 text-center"
          >
            <i className="fas fa-edit mr-xs"></i>
            Edit
          </Link>
          <Link
            to={`/product/${product.slug}`}
            target="_blank"
            className="btn btn-secondary btn-sm flex-1 text-center"
          >
            <i className="fas fa-eye mr-xs"></i>
            View
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
