import React from 'react';
import OrderModal from '../components/OrderModal';
import SearchModal from '../components/SearchModal';
import OrdersTable from '../components/OrdersTable';
import OrdersFilters from '../components/OrdersFilters';
import { Button } from 'react-bootstrap';

const OrdersView = ({
  orders,
  totalOrders,
  loading,
  error,
  currentPage,
  itemsPerPage,
  searchTerm,
  sortBy,
  sortOrder,
  paymentFilter,
  selectedOrder,
  showOrderModal,
  showSearchModal,
  handleShowOrder,
  handleCloseOrder,
  handleSearchChange,
  handleSortChange,
  handlePaymentFilterChange,
  handlePageChange,
  handleTrackingAdd,
  handleAddToOrder,
  calculateOrderTotals
}) => {
  const totalPages = Math.ceil(totalOrders / itemsPerPage);

  return (
    <div className='orders-view'>
      <OrdersFilters
        searchTerm={searchTerm}
        sortBy={sortBy}
        sortOrder={sortOrder}
        paymentFilter={paymentFilter}
        onSearchChange={handleSearchChange}
        onSortChange={handleSortChange}
        onPaymentFilterChange={handlePaymentFilterChange}
      />

      <OrdersTable
        orders={orders}
        loading={loading}
        error={error}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onOrderSelect={handleShowOrder}
        onTrackingAdd={handleTrackingAdd}
        onSortChange={handleSortChange}
        calculateOrderTotals={calculateOrderTotals}
      />

      {selectedOrder && (
        <OrderModal
          show={showOrderModal}
          handleClose={handleCloseOrder}
          selectedOrder={selectedOrder}
          onOrderUpdate={handleShowOrder}
          calculateTotals={calculateOrderTotals}
          handleAddToOrder={handleAddToOrder}
        />
      )}

      <SearchModal
        show={showSearchModal}
        handleClose={handleCloseOrder}
        handleAddToOrder={handleAddToOrder}
      />

      <div className="d-flex justify-content-between align-items-center mt-4">
        <div className="d-flex gap-2">
          <Button
            onClick={() => handlePageChange(currentPage - 1)}
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
                  onClick={() => handlePageChange(pageNumber)}
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
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || loading}
            variant="secondary"
          >
            Next
          </Button>
        </div>
        <span className="text-muted">
          Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
          {Math.min(currentPage * itemsPerPage, totalOrders)} of{" "}
          {totalOrders} orders
        </span>
      </div>
    </div>
  );
};

export default OrdersView;

