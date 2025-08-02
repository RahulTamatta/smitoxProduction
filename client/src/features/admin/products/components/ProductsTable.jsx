import React from 'react';
import { Table, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import moment from 'moment';

const ProductsTable = ({
  products,
  loading,
  error,
  currentPage,
  itemsPerPage,
  sortBy,
  sortOrder,
  onProductSelect,
  onProductEdit,
  onProductDelete,
  onStatusToggle,
  onSortChange
}) => {
  if (loading) {
    return (
      <div className="text-center p-4">
        <Spinner animation="border" role="status">
          <span className="sr-only">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (products.length === 0) {
    return <Alert variant="info">No products found</Alert>;
  }

  return (
    <Table striped bordered hover responsive>
      <thead>
        <tr>
          <th style={{ fontSize: '0.8rem', padding: '8px' }}>#</th>
          <th style={{ fontSize: '0.8rem', padding: '8px' }}>Image</th>
          <th 
            style={{ 
              fontSize: '0.8rem', 
              padding: '8px', 
              cursor: 'pointer',
              userSelect: 'none',
              backgroundColor: sortBy === 'name' ? '#f8f9fa' : 'transparent',
              transition: 'background-color 0.2s ease'
            }}
            onClick={() => onSortChange('name')}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#e9ecef'}
            onMouseLeave={(e) => e.target.style.backgroundColor = sortBy === 'name' ? '#f8f9fa' : 'transparent'}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Product Name</span>
              <span style={{ fontSize: '0.7rem', color: '#6c757d', marginLeft: '4px' }}>
                {sortBy === 'name' ? (
                  sortOrder === 'asc' ? '▲' : '▼'
                ) : (
                  '⇅'
                )}
              </span>
            </div>
          </th>
          <th style={{ fontSize: '0.8rem', padding: '8px' }}>Category</th>
          <th 
            style={{ 
              fontSize: '0.8rem', 
              padding: '8px', 
              cursor: 'pointer',
              userSelect: 'none',
              backgroundColor: sortBy === 'price' ? '#f8f9fa' : 'transparent',
              transition: 'background-color 0.2s ease'
            }}
            onClick={() => onSortChange('price')}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#e9ecef'}
            onMouseLeave={(e) => e.target.style.backgroundColor = sortBy === 'price' ? '#f8f9fa' : 'transparent'}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Price</span>
              <span style={{ fontSize: '0.7rem', color: '#6c757d', marginLeft: '4px' }}>
                {sortBy === 'price' ? (
                  sortOrder === 'asc' ? '▲' : '▼'
                ) : (
                  '⇅'
                )}
              </span>
            </div>
          </th>
          <th 
            style={{ 
              fontSize: '0.8rem', 
              padding: '8px', 
              cursor: 'pointer',
              userSelect: 'none',
              backgroundColor: sortBy === 'stock' ? '#f8f9fa' : 'transparent',
              transition: 'background-color 0.2s ease'
            }}
            onClick={() => onSortChange('stock')}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#e9ecef'}
            onMouseLeave={(e) => e.target.style.backgroundColor = sortBy === 'stock' ? '#f8f9fa' : 'transparent'}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Stock</span>
              <span style={{ fontSize: '0.7rem', color: '#6c757d', marginLeft: '4px' }}>
                {sortBy === 'stock' ? (
                  sortOrder === 'asc' ? '▲' : '▼'
                ) : (
                  '⇅'
                )}
              </span>
            </div>
          </th>
          <th style={{ fontSize: '0.8rem', padding: '8px' }}>Status</th>
          <th 
            style={{ 
              fontSize: '0.8rem', 
              padding: '8px', 
              cursor: 'pointer',
              userSelect: 'none',
              backgroundColor: sortBy === 'createdAt' ? '#f8f9fa' : 'transparent',
              transition: 'background-color 0.2s ease'
            }}
            onClick={() => onSortChange('createdAt')}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#e9ecef'}
            onMouseLeave={(e) => e.target.style.backgroundColor = sortBy === 'createdAt' ? '#f8f9fa' : 'transparent'}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Created</span>
              <span style={{ fontSize: '0.7rem', color: '#6c757d', marginLeft: '4px' }}>
                {sortBy === 'createdAt' ? (
                  sortOrder === 'asc' ? '▲' : '▼'
                ) : (
                  '⇅'
                )}
              </span>
            </div>
          </th>
          <th style={{ fontSize: '0.8rem', padding: '8px' }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {products.map((product, index) => (
          <tr key={product._id}>
            <td style={{ fontSize: '0.7rem', padding: '8px' }}>
              {(currentPage - 1) * itemsPerPage + index + 1}
            </td>
            <td style={{ fontSize: '0.7rem', padding: '8px' }}>
              <img
                src={product.photos || product.multipleimages?.[0] || '/default-product.png'}
                alt={product.name}
                style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                onError={(e) => {
                  e.target.src = '/default-product.png';
                }}
              />
            </td>
            <td style={{ fontSize: '0.7rem', padding: '8px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                {product.name}
              </div>
              <div style={{ fontSize: '0.6rem', color: '#666' }}>
                SKU: {product.sku || 'N/A'}
              </div>
            </td>
            <td style={{ fontSize: '0.7rem', padding: '8px' }}>
              {product.category?.name || 'N/A'}
            </td>
            <td style={{ fontSize: '0.7rem', padding: '8px' }}>
              ₹{product.price?.toFixed(2) || '0.00'}
            </td>
            <td style={{ fontSize: '0.7rem', padding: '8px' }}>
              <span className={`badge ${product.stock <= 0 ? 'bg-danger' : product.stock < 10 ? 'bg-warning' : 'bg-success'}`}>
                {product.stock || 0}
              </span>
            </td>
            <td style={{ fontSize: '0.7rem', padding: '8px' }}>
              <Badge 
                bg={product.isActive === '1' ? 'success' : 'danger'}
                style={{ cursor: 'pointer' }}
                onClick={() => onStatusToggle(product._id, product.isActive)}
              >
                {product.isActive === '1' ? 'Active' : 'Inactive'}
              </Badge>
            </td>
            <td style={{ fontSize: '0.7rem', padding: '8px' }}>
              {moment(product.createdAt).format('DD-MM-YYYY')}
            </td>
            <td style={{ fontSize: '0.7rem', padding: '8px' }}>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                <Button
                  variant="info"
                  size="sm"
                  style={{ fontSize: '0.6rem', padding: '2px 4px' }}
                  onClick={() => onProductSelect(product)}
                >
                  View
                </Button>
                <Button
                  variant="warning"
                  size="sm"
                  style={{ fontSize: '0.6rem', padding: '2px 4px' }}
                  onClick={() => onProductEdit(product)}
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  style={{ fontSize: '0.6rem', padding: '2px 4px' }}
                  onClick={() => onProductDelete(product._id)}
                >
                  Delete
                </Button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default ProductsTable;
