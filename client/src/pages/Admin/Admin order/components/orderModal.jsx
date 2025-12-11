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
      <Modal show={!!addProductError} onHide={() => setAddProductError(null)}>
        <Modal.Header closeButton>
          <Modal.Title>Cannot Add Product</Modal.Title>
        </Modal.Header>
        <Modal.Body>{addProductError}</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setAddProductError(null)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal 
        show={show} 
        onHide={handleClose} 
        size="xl"
        dialogClassName="custom-modal-width"
        style={{ zIndex: 1040 }}
      >
     <style>{`
/* ---------- Modal shape & layout ---------- */
/* 1.5 : 2 ratio -> 3 / 4 (width : height) */
.custom-modal-width .modal-content {
  aspect-ratio: 3 / 4;
  width: 95%;
  max-width: 95vw;       /* 95% of screen width */
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 8px;
  background: #ffffff;
}

/* center dialog and allow modal-content to control size */
.custom-modal-width .modal-dialog { margin: 1.2rem auto; max-width: none !important; }

/* header/footer fixed, body scrolls */
.custom-modal-width .modal-header,
.custom-modal-width .modal-footer { flex: 0 0 auto; }
.custom-modal-width .modal-body { flex: 1 1 auto; overflow-y: auto; padding: 1rem 1.25rem; }

/* ---------- Typographic scale (decided per section) ---------- */
/* Modal title (top) */
.custom-modal-width .modal-title {
  font-size: 1.6rem;      /* large, prominent */
  font-weight: 600;
  letter-spacing: -0.2px;
}

/* Order header block (small meta info: address, pincode, created at) */
.custom-modal-width .order-header,
.custom-modal-width .order-header p,
.custom-modal-width .order-header .meta {
  font-size: 0.95rem;     /* readable body text */
  color: #333;
}

/* Section heading "Order Details:" */
.custom-modal-width .order-details h3 {
  font-size: 1.15rem;     /* slightly larger than body */
  font-weight: 600;
  margin-bottom: 0.75rem;
}

/* Labels and small helper text */
.custom-modal-width .label,
.custom-modal-width .small-text,
.custom-modal-width .meta-label {
  font-size: 0.88rem;
  color: #666;
}

/* Table typography */
.custom-modal-width .table thead th {
  font-size: 0.90rem;     /* table header */
  text-transform: uppercase;
  letter-spacing: 0.6px;
  font-weight: 600;
}
.custom-modal-width .table tbody td {
  font-size: 0.95rem;     /* table cell content */
  vertical-align: middle;
  color: #222;
}

/* Product title inside table — slightly bolder */
.custom-modal-width .table .product-name {
  font-size: 1.00rem;
  font-weight: 600;
  color: #111;
  line-height: 1.2;
}

/* Small numeric / helper text beside quantities */
.custom-modal-width .table .unit-text,
.custom-modal-width .table .qty-helper {
  font-size: 0.85rem;
  color: #777;
}

/* Modal footer grouping spacing */
.custom-modal-width .modal-footer {
  padding: 0.9rem 1.25rem;
  gap: 0.5rem;
  align-items: center;
}

/* ---------- Buttons: smaller visual size, full clickable area ---------- */
/* General rule for footer/action/status buttons inside this modal */
.custom-modal-width .modal-footer .btn,
.custom-modal-width .status-buttons .btn,
.custom-modal-width .action-buttons .btn {
  padding: 6px 10px;       /* visually smaller */
  font-size: 0.82rem;      /* smaller text */
  line-height: 1.1;
  border-radius: 6px;
  min-height: 36px;        /* ensures tappable height */
  min-width: 68px;         /* ensures tappable width */
  box-shadow: none;
}

/* Primary confirm button slightly larger for emphasis, but still compact */
.custom-modal-width .modal-footer .btn-confirm,
.custom-modal-width .status-buttons .btn-confirm {
  padding: 7px 12px;
  min-height: 38px;
  min-width: 78px;
  font-weight: 600;
  font-size: 0.88rem;
}

/* Icon-only / round buttons */
.custom-modal-width .btn-icon {
  width: 36px;
  height: 36px;
  padding: 0;
  min-width: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
}

/* Bottom action buttons (Update, Download PDF, Share) — keep consistent sizes */
.custom-modal-width .action-buttons .btn {
  padding: 6px 12px;
  font-size: 0.84rem;
  min-height: 36px;
  min-width: 82px;
}

/* If any button has long text (e.g., 'Download PDF'), keep it readable but compact */
.custom-modal-width .action-buttons .btn.long-text {
  min-width: 96px;
}

/* ---------- Responsive tweaks ---------- */
@media (max-width: 992px) {
  .custom-modal-width .modal-content { max-width: 92vw; }
  .custom-modal-width .modal-title { font-size: 1.45rem; }
  .custom-modal-width .order-details h3 { font-size: 1.05rem; }
  .custom-modal-width .table thead th { font-size: 0.87rem; }
}

@media (max-width: 768px) {
  /* On small screens allow taller modal (disable fixed ratio) */
  .custom-modal-width .modal-content { aspect-ratio: auto; max-height: 88vh; }
  .custom-modal-width .modal-title { font-size: 1.25rem; }
  .custom-modal-width .modal-footer .btn { min-width: 64px; font-size: 0.78rem; }
}
`}</style>

        <Modal.Header closeButton style={{ 
          borderBottom: '2px solid #dee2e6',
          padding: '1.25rem 1.5rem'
        }}>
          <Modal.Title style={{ fontSize: '1.5rem', fontWeight: '600' }}>
            Edit Order
          </Modal.Title>
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