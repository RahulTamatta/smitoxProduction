import React from 'react';

/**
 * Reusable component for pagination controls
 *
 * @param {Object} props
 * @param {number} props.currentPage - Current page number
 * @param {number} props.totalPages - Total number of pages
 * @param {number} props.totalItems - Total number of items
 * @param {number} props.itemsPerPage - Items per page
 * @param {number} props.currentCount - Current number of items shown
 * @param {boolean} props.isLoading - Whether data is currently loading
 * @param {Function} props.onLoadMore - Function to call when "Load More" is clicked
 * @param {boolean} props.hasMore - Whether there are more items to load
 */
const PaginationControls = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  currentCount,
  isLoading,
  onLoadMore,
  hasMore,
  isMobile = false
}) => {
  return (
    <div className="text-center mt-4 mb-5">
      {/* Pagination indicator */}
      {currentCount > 0 && (
        <div className="mb-3">
          <span className="text-muted">
            Page {currentPage} of {totalPages} • Showing {currentCount} of {totalItems} products
          </span>
        </div>
      )}
      
      {hasMore && currentCount < totalItems && (
        <button
          className="btn btn-primary"
          onClick={onLoadMore}
          disabled={isLoading}
          style={{
            backgroundColor: '#e53935',
            border: 'none',
            padding: isMobile ? '8px 16px' : '12px 24px',
            fontSize: isMobile ? '14px' : '16px',
            borderRadius: '25px',
            width: isMobile ? '80%' : 'auto',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
        >
          {isLoading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2"></span>
              Loading...
            </>
          ) : (
            'Show More Products'
          )}
        </button>
      )}
      
      {!hasMore && currentCount > 0 && (
        <p className="text-muted">No more products to show</p>
      )}
    </div>
  );
};

export default PaginationControls;
