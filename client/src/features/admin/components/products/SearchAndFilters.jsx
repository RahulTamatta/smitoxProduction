// ===================================
// SEARCH AND FILTERS COMPONENT
// ===================================

import React from 'react';
import { debounce } from '../../utils';

const SearchAndFilters = ({
  searchTerm,
  filter,
  onSearch,
  onFilterChange,
  selectedCount,
  onBulkAction,
  bulkActionLoading,
  isMobile
}) => {
  const filters = ['all', 'active', 'inactive', 'outOfStock'];
  const bulkActions = ['activate', 'deactivate', 'delete'];

  // Debounced search
  const debouncedSearch = debounce((value) => {
    onSearch(value);
  }, 300);

  const handleSearchChange = (e) => {
    debouncedSearch(e.target.value);
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'activate':
        return 'var(--text-success)';
      case 'deactivate':
        return 'var(--text-warning)';
      case 'delete':
        return 'var(--text-error)';
      default:
        return 'var(--text-secondary)';
    }
  };

  return (
    <div className="card mb-lg">
      <div className="card-body p-base">
        {/* Filter Tabs */}
        <div className="d-flex flex-wrap gap-xs mb-base">
          {filters.map((tab) => (
            <button
              key={tab}
              onClick={() => onFilterChange(tab)}
              className={`btn btn-sm ${filter === tab ? 'btn-primary' : 'btn-outline-primary'}`}
              style={{
                minWidth: isMobile ? 'auto' : '80px',
                fontSize: isMobile ? '0.75rem' : '0.875rem'
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1).replace(/([A-Z])/g, ' $1')}
            </button>
          ))}
        </div>

        {/* Search and Bulk Actions Row */}
        <div className={`d-flex ${isMobile ? 'flex-column gap-base' : 'justify-between align-center gap-lg'}`}>
          {/* Search Input */}
          <div className={`d-flex align-center ${isMobile ? 'w-full' : ''}`} style={{ maxWidth: isMobile ? '100%' : '300px' }}>
            <div className="position-relative w-full">
              <input
                type="text"
                placeholder="Search products..."
                defaultValue={searchTerm}
                onChange={handleSearchChange}
                className="form-input pr-lg"
                style={{ paddingRight: '2.5rem' }}
              />
              <i 
                className="fas fa-search position-absolute"
                style={{
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }}
              ></i>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedCount > 0 && (
            <div className="d-flex gap-xs flex-wrap">
              <span className="text-small text-secondary d-flex align-center">
                {selectedCount} selected
              </span>
              {bulkActions.map((action) => (
                <button
                  key={action}
                  onClick={() => onBulkAction(action)}
                  disabled={bulkActionLoading}
                  className="btn btn-sm"
                  style={{
                    backgroundColor: 'white',
                    border: `1px solid ${getActionColor(action)}`,
                    color: getActionColor(action),
                    opacity: bulkActionLoading ? 0.6 : 1,
                    cursor: bulkActionLoading ? 'not-allowed' : 'pointer',
                    fontSize: isMobile ? '0.75rem' : '0.875rem'
                  }}
                >
                  {bulkActionLoading ? (
                    <i className="fas fa-spinner fa-spin mr-xs"></i>
                  ) : (
                    <i className={`fas fa-${action === 'activate' ? 'check' : action === 'deactivate' ? 'pause' : 'trash'} mr-xs`}></i>
                  )}
                  {action.charAt(0).toUpperCase() + action.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchAndFilters;
