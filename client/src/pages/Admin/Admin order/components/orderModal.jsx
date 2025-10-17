import React, { useState, useEffect } from "react";
import { Modal, Button } from "react-bootstrap";
import axios from "axios";
import OrderHeader from "./OrderDetails/OrderHeader";
import ProductTable from "./OrderDetails/ProductTable";
import StatusButtons from "./OrderDetails/StatusButtons";
import ActionButtons from "./OrderDetails/ActionButtons";
import ErrorModal from "./OrderDetails/ErrorModal";
import { generateInvoicePDF } from "./InvoiceGenerator";
import { shareOrderToWhatsApp } from "./WhatsAppShare";
import SearchModal from "./searchModal";
import "./OrderModal.css";

const OrderModal = ({
  show,
  handleClose,
  selectedOrder,
  status,
  handleInputChange,
  handleProductChange,
  handleQuantityChangeWithUnitSet,
  calculateTotals,
  handleDeleteProduct,
  handleAddClick,
  handleDownloadPDF,
  handleStatusChange,
  handleUpdateOrder,
  handleDelivered,
  handleReturned,
  getOrders,
  orderType,
  onOrderUpdate,
  handleAddToOrder,
}) => {
  const orderId = selectedOrder?._id;
  const products = selectedOrder?.products || [];
  const [localOrder, setLocalOrder] = useState(selectedOrder);
  const [addProductError, setAddProductError] = useState(null);
  const [showSearchModal, setShowSearchModal] = useState(false);

  // Update local state when selectedOrder changes
  useEffect(() => {
    setLocalOrder(selectedOrder);
  }, [selectedOrder]);

  // Refresh data when modal is shown and fetch complete product details
  useEffect(() => {
    if (show && orderId) {
      refreshOrderData();
      fetchCompleteProductDetails();
    }
  }, [show, orderId]);

  // Fetch complete product details including unitSet and bulkProducts
  const fetchCompleteProductDetails = async () => {
    if (!selectedOrder?.products) return;

    try {
      console.log('Fetching complete product details for order:', orderId);
      
      const updatedProducts = await Promise.all(
        selectedOrder.products.map(async (orderProduct) => {
          try {
            console.log(`Fetching product details for: ${orderProduct.product._id}`);
            const response = await axios.get(`/api/v1/product/get-product/${orderProduct.product._id}`);
            
            if (response.data.success) {
              console.log(`Product ${orderProduct.product._id} fetched:`, response.data.product);
              return {
                ...orderProduct,
                product: {
                  ...orderProduct.product,
                  ...response.data.product, // Merge complete product data including unitSet and bulkProducts
                }
              };
            }
            return orderProduct;
          } catch (error) {
            console.error(`Error fetching product ${orderProduct.product._id}:`, error);
            return orderProduct;
          }
        })
      );

      console.log('Updated products with complete details:', updatedProducts);

      // Update the selected order with complete product details
      setLocalOrder(prev => ({
        ...prev,
        products: updatedProducts
      }));

      // Also update the parent's selectedOrder
      if (onOrderUpdate) {
        onOrderUpdate({
          ...selectedOrder,
          products: updatedProducts
        });
      }

    } catch (error) {
      console.error("Error fetching complete product details:", error);
    }
  };

  const convertToWords = (num) => {
    const a = [
      "",
      "One ",
      "Two ",
      "Three ",
      "Four ",
      "Five ",
      "Six ",
      "Seven ",
      "Eight ",
      "Nine ",
      "Ten ",
      "Eleven ",
      "Twelve ",
      "Thirteen ",
      "Fourteen ",
      "Fifteen ",
      "Sixteen ",
      "Seventeen ",
      "Eighteen ",
      "Nineteen ",
    ];
    const b = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];

    if ((num = num.toString()).length > 9) return "Overflow";
    let n = ("000000000" + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return;
    let str = "";
    str += n[1] != 0 ? (a[Number(n[1])] || b[n[1][0]] + " " + a[n[1][1]]) + "Crore " : "";
    str += n[2] != 0 ? (a[Number(n[2])] || b[n[2][0]] + " " + a[n[2][1]]) + "Lakh " : "";
    str += n[3] != 0 ? (a[Number(n[3])] || b[n[3][0]] + " " + a[n[3][1]]) + "Thousand " : "";
    str += n[4] != 0 ? (a[Number(n[4])] || b[n[4][0]] + " " + a[n[4][1]]) + "Hundred " : "";
    str += n[5] != 0 ? ((str != "") ? "and " : "") + (a[Number(n[5])] || b[n[5][0]] + " " + a[n[5][1]]) + "only" : "";
    return str;
  };
  const generatePDF = () => {
    generateInvoicePDF(selectedOrder, calculateTotals, convertToWords);
  };


  const shareToWhatsApp = () => {
    shareOrderToWhatsApp(selectedOrder, calculateTotals);
  };

  const refreshOrderData = async () => {
    try {
      const response = await axios.get(`/api/v1/auth/order/${orderId}`);
      if (response.data.success) {
        onOrderUpdate(response.data.order);
        setLocalOrder(response.data.order);
      }
    } catch (error) {
      console.error("Error refreshing order data:", error);
    }
  };


  const handleOrderUpdate = async () => {
    await handleUpdateOrder();
    await refreshOrderData();
    await getOrders(orderType);
  };

  const handleAddClickInternal = () => {
    setShowSearchModal(true);
  };

  const handleCloseSearchModal = () => {
    setShowSearchModal(false);
  };

  return (
    <>
      <ErrorModal
        show={!!addProductError}
        error={addProductError}
        onClose={() => setAddProductError(null)}
      />
      
      <Modal 
        show={show} 
        onHide={handleClose} 
        size="xl"
        className="order-modal"
        dialogClassName="modal-90w"
      >

      <Modal.Header closeButton>
        <Modal.Title>Edit Order</Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-0">
        {selectedOrder ? (
          <div className="scrollable-content p-3">
            <div className="order-header">
              <OrderHeader selectedOrder={selectedOrder} />
            </div>
            <div className="order-details">
              <h3 className="mb-3">Order Details:</h3>
              <div className="table-responsive">
                <ProductTable
                  products={products}
                  handleProductChange={handleProductChange}
                  handleQuantityChangeWithUnitSet={handleQuantityChangeWithUnitSet}
                  handleDeleteProduct={handleDeleteProduct}
                  handleAddClick={handleAddClickInternal}
                  calculateTotals={calculateTotals}
                  selectedOrder={selectedOrder}
                  handleInputChange={handleInputChange}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3">
            <p>No order selected</p>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer className="d-flex flex-column flex-md-row justify-content-between align-items-stretch align-items-md-center">
        <div className="status-buttons mb-2 mb-md-0">
          <StatusButtons
            selectedOrder={selectedOrder}
            handleStatusChange={handleStatusChange}
            handleDelivered={handleDelivered}
            handleReturned={handleReturned}
          />
        </div>
        <div className="action-buttons">
          <ActionButtons
            handleClose={handleClose}
            handleUpdateOrder={handleUpdateOrder}
            generatePDF={generatePDF}
            shareToWhatsApp={shareToWhatsApp}
          />
        </div>
      </Modal.Footer>

      </Modal>

      <SearchModal
        show={showSearchModal}
        handleClose={handleCloseSearchModal}
        handleAddToOrder={handleAddToOrder}
      />
    </>
  );
};

export default OrderModal;