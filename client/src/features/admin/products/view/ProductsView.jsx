import React from 'react';
import ProductsTable from '../components/ProductsTable';
import ProductsFilters from '../components/ProductsFilters';
import { Button } from 'react-bootstrap';

const ProductsView = ({
  products,
  totalProducts,
  loading,
  error,
  currentPage,
  itemsPerPage,
  searchTerm,
  categoryFilter,
  statusFilter,
  categories,
  sortBy,
  sortOrder,
  onProductSelect,
  onProductEdit,
  onProductDelete,
  onStatusToggle,
  onSearchChange,
  onCategoryFilterChange,
  onStatusFilterChange,
  onSortChange,
  onPageChange
}) => {
  const totalPages = Math.ceil(totalProducts / itemsPerPage);

  return (
    <div className='products-view'>
      <ProductsFilters
        searchTerm={searchTerm}
        categoryFilter={categoryFilter}
        statusFilter={statusFilter}
        categories={categories}
        onSearchChange={onSearchChange}
        onCategoryFilterChange={onCategoryFilterChange}
        onStatusFilterChange={onStatusFilterChange}
      />

      <ProductsTable
        products={products}
        loading={loading}
        error={error}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onProductSelect={onProductSelect}
        onProductEdit={onProductEdit}
        onProductDelete={onProductDelete}
        onStatusToggle={onStatusToggle}
        onSortChange={onSortChange}
      />

      {/* Pagination */}
      <div className="d-flex justify-content-between align-items-center mt-4">
        <div className="d-flex gap-2">
          <Button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
            variant="secondary"
          >
            Previous
          </Button>

          {[...Array(totalPages)].map((_, index) => {
            const pageNumber = index + 1;
            if (
              pageNumber === 1 ||
              pageNumber === totalPages ||
              (pageNumber >= currentPage - 1 &&
                pageNumber <= currentPage + 1)
            ) {
              return (
                <Button
                  key={pageNumber}
                  onClick={() => onPageChange(pageNumber)}
                  variant={
                    currentPage === pageNumber ? "primary" : "light"
                  }
                  disabled={loading}
                >
                  {pageNumber}
                </Button>
              );
            }
            if (
              pageNumber === currentPage - 2 ||
              pageNumber === currentPage + 2
            ) {
              return (
                <span key={pageNumber} className="px-2">
                  ...
                </span>
              );
            }
            return null;
          })}

          <Button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || loading}
            variant="secondary"
          >
            Next
          </Button>
        </div>
        <span className="text-muted">
          Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
          {Math.min(currentPage * itemsPerPage, totalProducts)} of{" "}
          {totalProducts} products
        </span>
      </div>
    </div>
  );
};

export default ProductsView;
