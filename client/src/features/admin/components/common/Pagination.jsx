// ===================================
// PAGINATION COMPONENT
// ===================================

import React from 'react';
import { generatePaginationArray } from '../../utils';

const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  startItem,
  endItem,
  onPageChange,
  isMobile
}) => {
  const paginationPages = generatePaginationArray(currentPage, totalPages, 5);

  return (
    <div className={`d-flex ${isMobile ? 'flex-column gap-base' : 'justify-between align-center'}`}>
      {/* Items info */}
      <div className={`text-secondary ${isMobile ? 'text-center' : ''}`}>
        Showing {startItem} to {endItem} of {totalItems} items
      </div>

      {/* Pagination controls */}
      <div className="d-flex gap-xs flex-wrap justify-center">
        {/* Previous button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="btn btn-sm"
          style={{
            backgroundColor: 'white',
            border: '1px solid var(--color-gray-300)',
            opacity: currentPage === 1 ? 0.5 : 1,
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
          }}
        >
          <i className="fas fa-chevron-left"></i>
          {!isMobile && <span className="ml-xs">Previous</span>}
        </button>

        {/* Page numbers */}
        {paginationPages.map((page, index) => {
          if (page === '...') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="btn btn-sm"
                style={{ 
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: 'var(--text-muted)',
                  cursor: 'default'
                }}
              >
                ...
              </span>
            );
          }

          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              disabled={page === currentPage}
              className="btn btn-sm"
              style={{
                backgroundColor: page === currentPage ? 'var(--color-primary)' : 'white',
                color: page === currentPage ? 'white' : 'var(--text-primary)',
                border: '1px solid var(--color-gray-300)',
                minWidth: '32px',
                cursor: page === currentPage ? 'default' : 'pointer'
              }}
            >
              {page}
            </button>
          );
        })}

        {/* Next button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="btn btn-sm"
          style={{
            backgroundColor: 'white',
            border: '1px solid var(--color-gray-300)',
            opacity: currentPage === totalPages ? 0.5 : 1,
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
          }}
        >
          {!isMobile && <span className="mr-xs">Next</span>}
          <i className="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>
  );
};

export default Pagination;
