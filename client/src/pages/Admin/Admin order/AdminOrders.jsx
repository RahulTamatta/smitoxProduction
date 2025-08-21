import { message } from "antd";
import moment from "moment";
import React, { useEffect, useMemo, useState } from "react";
import { getApplicableBulkProduct, getPricePerUnit, calculateProductPrice as pricingCalculateProductPrice } from "../../../utils/pricing";
import {
  Alert,
  Button,
  Col,
  Form,
  Modal,
  Nav,
  Row,
  Spinner,
  Table
} from "react-bootstrap";
import { useAuth } from "../../../context/authContext";
import { useSearch } from "../../../context/search";
import AdminLayout from "../../../features/admin/components/layout/AdminLayout";
import OrderModal from "./components/orderModal";
import SearchModal from "./components/searchModal";
import "./AdminOrders.css";
// New modular imports
import { useOrders } from "../../../entities/order/hooks/useOrders";
import { useOrderMutations } from "../../../entities/order/hooks/useOrderMutations";
import OrdersToolbar from "../../../features/order-filters/ui/OrdersToolbar";
import OrdersTable from "../../../entities/order/ui/OrdersTable";
import PaginationLite from "../../../shared/ui/PaginationLite";
import { getInvoiceUrl } from "../../../entities/order/api/order.api";

const AdminOrders = () => {
  const [status] = useState([
    "Pending",
    "Confirmed",
    "Accepted",
    "Cancelled",
    "Rejected",
    "Dispatched",
    "Delivered",
    "Returned",
  ]);
  const [auth] = useAuth();
  const [show, setShow] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderType, setOrderType] = useState("all-orders");
  const [error, setError] = useState(null);

  const [values, setValues] = useSearch();
const [addProductError, setAddProductError] = useState("");

  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingInfo, setTrackingInfo] = useState({ company: "", id: "" });

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Sorting and filtering states
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [paymentFilter, setPaymentFilter] = useState("all");

  // Data via React Query
  const { data, isLoading: loading, error: rqError } = useOrders({
    status: orderType,
    page: currentPage,
    limit: itemsPerPage,
    search: searchTerm,
    sortBy,
    sortOrder,
    paymentFilter,
  });
  const orders = data?.orders || [];
  const totalOrders = data?.total || 0;
  useEffect(() => {
    if (rqError) {
      setError("Error fetching orders. Please try again.");
    } else {
      setError(null);
    }
  }, [rqError]);

  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const totalPages = Math.ceil(totalOrders / itemsPerPage);

  // React Query handles fetching on dependency changes

  const { setStatus, saveOrder, addProduct, removeProduct, addTracking } = useOrderMutations();
  const handleStatusChange = async (orderId, value) => {
    try {
      await setStatus.mutateAsync({ orderId, status: value });
      message.success("Order status updated successfully");
    } catch (error) {
      console.log(error);
      message.error("Error updating order status");
    }
  };

  const handleShow = (order) => {
    setSelectedOrder(order);
    setShow(true);
  };

  const handleClose = () => {
    setShow(false);
    setValues({ ...values, keyword: "", results: [] });
  };

  const handleInputChange = (field, value) => {
    setSelectedOrder((prevOrder) => ({
      ...prevOrder,
      [field]:
        field === "status" || field === "payment" ? value : Number(value),
    }));
  };

  const handleProductChange = (index, field, value) => {
    setSelectedOrder((prevOrder) => {
      if (!prevOrder?.products) return prevOrder;
      const updatedProducts = [...prevOrder.products];
      const currentProduct = updatedProducts[index];
      
      if (field === 'quantity') {
        // Only update quantity - do NOT overwrite stored price
        // Snap quantity to multiples of unitSet to mirror ProductDetails behavior
        const productData = (currentProduct && typeof currentProduct.product === 'object') ? currentProduct.product : currentProduct;
        const uSet = Number(productData.unitSet || productData.unitset || 1) || 1;
        const inputQty = Number(value) || 0;
        const snappedQty = uSet > 1 ? Math.max(0, Math.round(inputQty / uSet) * uSet) : Math.max(0, inputQty);
        updatedProducts[index] = {
          ...currentProduct,
          quantity: snappedQty,
          // Keep stored price as-is - let normalized pricing handle display
        };
        console.log(`Quantity updated for product at index ${index}:`, {
          quantity: snappedQty,
          storedPrice: currentProduct.price,
          normalizedUnitPrice: getOrderPricePerUnit(updatedProducts[index])
        });
      } else {
        // Non-quantity field updates
        updatedProducts[index] = {
          ...currentProduct,
          [field]: Number(value),
        };
      }
      
      return { ...prevOrder, products: updatedProducts };
    });
  };

  const getPriceForProduct = (product, quantity) => getPricePerUnit(product, quantity);

  // Normalizes stored order item price into a per-unit price (same logic as OrderModal)
  const getOrderPricePerUnit = (orderItem) => {
    const storedPrice = parseFloat(orderItem?.price) || 0;
    const productData = (orderItem && typeof orderItem.product === 'object') ? orderItem.product : {};
    const unitSetFromProduct = Number(productData.unitSet || productData.unitset || 1) || 1;

    // 1) If order item includes bulkProductDetails, prefer that
    const bulk = orderItem?.bulkProductDetails;
    if (bulk && bulk.selling_price_set != null) {
      const setPrice = parseFloat(bulk.selling_price_set) || 0;
      if (Math.abs(storedPrice - setPrice) < 0.001) {
        return setPrice / unitSetFromProduct;
      }
      if (setPrice > 0 && storedPrice === 0) {
        return setPrice / unitSetFromProduct;
      }
    }

    // 2) If product has perPiecePrice, check if storedPrice is actually setPrice
    const perPieceCandidate = parseFloat(productData.perPiecePrice ?? productData.price ?? 0) || 0;
    if (unitSetFromProduct > 1 && perPieceCandidate > 0) {
      if (Math.abs(storedPrice - perPieceCandidate * unitSetFromProduct) < 0.01) {
        return storedPrice / unitSetFromProduct;
      }
    }

    // 3) Heuristic: if storedPrice seems like a set price, divide by unitSet
    if (unitSetFromProduct > 1 && storedPrice > 0 && perPieceCandidate > 0 && storedPrice / unitSetFromProduct <= storedPrice) {
      const divided = storedPrice / unitSetFromProduct;
      if (divided <= storedPrice && divided >= perPieceCandidate * 0.5) {
        return divided;
      }
    }

    // Default: assume storedPrice is already per-unit
    return storedPrice;
  };

  const calculateTotals = () => {
    if (!selectedOrder || !selectedOrder.products)
      return { subtotal: 0, gst: 0, total: 0 };

    const items = selectedOrder.products || [];
    let subtotal = 0;
    let gst = 0;

    for (const item of items) {
      const p = item.product || {};
      const q = Number(item.quantity) || 0;

      // prefer current bulk price
      let unitPrice = getOrderPricePerUnit(item);
      const bulk = getApplicableBulkProduct(p, q);
      if (bulk && bulk.selling_price_set != null) {
        const uSet = Number(p.unitSet || p.unitset || 1) || 1;
        unitPrice = (parseFloat(bulk.selling_price_set) || 0) / uSet;
      }

      const net = unitPrice * q;
      const tax = net * ((Number(p.gst) || 0) / 100);
      subtotal += net;
      gst += tax;
    }

    const deliveryCharges = Number(selectedOrder.deliveryCharges || 0);
    const codCharges = Number(selectedOrder.codCharges || 0);
    const discount = Number(selectedOrder.discount || 0);
    const total = subtotal + gst + deliveryCharges + codCharges - discount;

    return { subtotal, gst, deliveryCharges, codCharges, discount, total };
  };

  const handleAddClick = () => {
    setShowSearchModal(true);
  };

  const handleCloseSearchModal = () => {
    setShowSearchModal(false);
    // Removed setSearchKeyword and setSearchResults as they are not defined

  };

  // Using centralized pricing utils for bulk qualification

  // Calculate total price based on quantity using centralized pricing utils
  const calculateProductPrice = (product, quantity) => pricingCalculateProductPrice(product, quantity);

  const handleAddToOrder = async (product) => {
    try {
      if (product.isActive === "0" || product.stock <= 0) {
        let errorMessage = "Cannot add product: ";
        if (product.isActive === "0") errorMessage += "Product is inactive";
        if (product.stock <= 0) errorMessage += "Product is out of stock";
        message.error(errorMessage);
        return;
      }

      // Calculate proper pricing using unit-based approach
      const unitSet = product.unitSet || 1;
      const initialQuantity = unitSet; // Start with 1 set worth of units

      // Calculate pricing with bulk consideration (quantity in units)
      const pricingResult = calculateProductPrice(product, initialQuantity);

      console.log("Adding product with pricing:", {
        productName: product.name,
        quantity: initialQuantity,
        unitSet: unitSet,
        unitPrice: pricingResult.unitPrice,
        totalPrice: pricingResult.totalPrice,
        bulkApplied: pricingResult.bulkApplied?.minimum || "None",
      });

      // Use React Query mutation
      const res = await addProduct.mutateAsync({
        orderId: selectedOrder._id,
        data: {
          productId: product._id,
          quantity: initialQuantity, // units
          price: pricingResult.unitPrice, // price per unit
          bulkProductDetails: pricingResult.bulkApplied,
        },
      });

      if (res?.success && res.order) {
        setSelectedOrder(res.order);
      }

      message.success(
        `Product added successfully with ${pricingResult.bulkApplied ? "bulk" : "regular"} pricing`
      );
      handleCloseSearchModal();
    } catch (error) {
      console.error("Add to order error:", error);
      setAddProductError(error?.message || "Error adding product to order");
    }
  };

  const handleUpdateOrder = async () => {
    try {
      const { _id, status, codCharges, deliveryCharges, discount, amount, products } = selectedOrder;
      const payload = {
        status,
        codCharges: Number(codCharges) || 0,
        deliveryCharges: Number(deliveryCharges) || 0,
        discount: Number(discount) || 0,
        amount: Number(amount) || 0,
        products: products.map((p) => ({
          _id: p._id,
          quantity: Number(p.quantity) || 0,
          price: Number(p.price) || 0,
        })),
      };

      const res = await saveOrder.mutateAsync({ orderId: _id, payload });
      if (res?.success) {
        if (res.order) setSelectedOrder(res.order);
        setShow(false);
        message.success("Order updated successfully");
      } else {
        message.error(res?.message || "Failed to update order");
      }
    } catch (error) {
      console.log("Error details:", error);
      message.error("Error updating order");
    }
  };

  const calculateTotalsad = (order) => {
    if (!order || !order.products) return { subtotal: 0, gst: 0, total: 0 };

    const subtotal = order.products.reduce(
      (acc, product) => acc + Number(product.price) * Number(product.quantity),
      0
    );

    const gst = order.products.reduce((acc, product) => {
      const productData = typeof product.product === 'object' ? product.product : {};
      return (
        acc +
        (Number(product.price) *
          Number(product.quantity) *
          (Number(productData.gst) || 0)) /
          100
      );
    }, 0);

    const total =
      subtotal +
      gst +
      Number(order.deliveryCharges || 0) +
      Number(order.codCharges || 0) -
      Number(order.discount || 0);

    return { subtotal, gst, total };
  };

  const handleDeleteProduct = async (index) => {
    if (index >= 0 && index < selectedOrder.products.length) {
      try {
        const productToRemove = selectedOrder.products[index];
        const updatedProducts = selectedOrder.products.filter(
          (_, i) => i !== index
        );
        const updatedOrder = { ...selectedOrder, products: updatedProducts };
        setSelectedOrder(updatedOrder);

        // Use the product ObjectId for deletion
        const productId =
          typeof productToRemove.product === "object"
            ? productToRemove.product._id
            : productToRemove.product;

        const res = await removeProduct.mutateAsync({
          orderId: selectedOrder._id,
          productId,
        });

        if (res?.success) {
          message.success("Product removed from order successfully");
        } else {
          message.error(res?.message || "Failed to remove product from order");
        }
      } catch (error) {
        console.log(error);
        message.error("Error removing product from order");
      }
    } else {
      message.error("Product index is out of range");
    }
  };

  const handleDelivered = async () => {
    try {
      await setStatus.mutateAsync({ orderId: selectedOrder._id, status: "Delivered" });
      setShow(false);
      message.success("Order status updated to Delivered");
    } catch (error) {
      console.log(error);
      message.error("Error updating order status to Delivered");
    }
  };

  const handleReturned = async () => {
    try {
      await setStatus.mutateAsync({ orderId: selectedOrder._id, status: "Returned" });
      setShow(false);
      message.success("Order status updated to Returned");
    } catch (error) {
      console.log(error);
      message.error("Error updating order status to Returned");
    }
  };

  const handleDownloadPDF = () => {
    try {
      window.open(getInvoiceUrl(selectedOrder._id), '_blank');
    } catch (error) {
      console.log(error);
      message.error("Error opening order invoice");
    }
  };

  const handleTrackingModalShow = (order) => {
    setSelectedOrder(order);
    setShowTrackingModal(true);
  };

  const handleTrackingModalClose = () => {
    setShowTrackingModal(false);
    setTrackingInfo({ company: "", id: "" });
  };

  const handleTrackingInfoChange = (e) => {
    setTrackingInfo({ ...trackingInfo, [e.target.name]: e.target.value });
  };

  const handleAddTracking = async () => {
    try {
      await addTracking.mutateAsync({ orderId: selectedOrder._id, info: trackingInfo });
      message.success("Tracking information added successfully");
      handleTrackingModalClose();
    } catch (error) {
      console.log(error);
      message.error("Error adding tracking information");
    }
  };

  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setSortOrder("desc");
    }
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  return (
    <AdminLayout title={"All Orders Data"}>
      <div className="row dashboard">
        <div className="col-md-12">
          <Nav variant="pills" className="mb-3">
            <Nav.Item>
              <Nav.Link
                active={orderType === "all-orders"}
                onClick={() => setOrderType("all-orders")}
                style={{
                  backgroundColor: orderType === "all-orders" ? "blue" : "red",
                  color: orderType === "all-orders" ? "white" : "red",
                }}
              >
                All orders
              </Nav.Link>
            </Nav.Item>
            {status.map((s, index) => (
              <Nav.Item key={index}>
                <Nav.Link
                  active={orderType === s}
                  onClick={() => setOrderType(s)}
                  style={{
                    backgroundColor: orderType === s ? "blue" : "red",
                    color: orderType === s ? "white" : "red",
                  }}
                >
                  {s} orders
                </Nav.Link>
              </Nav.Item>
            ))}
          </Nav>

          <OrdersToolbar
            searchTerm={searchTerm}
            onSearch={handleSearch}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
            paymentFilter={paymentFilter}
            onPaymentFilterChange={(v) => setPaymentFilter(v)}
          />

          {loading ? (
            <Spinner animation="border" role="status">
              <span className="sr-only">Loading...</span>
            </Spinner>
          ) : error ? (
            <Alert variant="danger">{error}</Alert>
          ) : (
            <>
              <OrdersTable
                orders={orders}
                page={currentPage}
                perPage={itemsPerPage}
                total={totalOrders}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={handleSortChange}
                onView={handleShow}
                onAddTracking={handleTrackingModalShow}
                calcRowTotals={calculateTotalsad}
              />

              <PaginationLite
                current={currentPage}
                perPage={itemsPerPage}
                total={totalOrders}
                disabled={loading}
                onChange={(p) => handlePageChange(p)}
              />
            </>
          )}
        </div>
      </div>

      {selectedOrder && (
        <OrderModal 
          show={show}
          handleClose={handleClose}
          selectedOrder={selectedOrder}
          status={status}
          handleInputChange={handleInputChange}
          handleProductChange={handleProductChange}
          calculateTotals={calculateTotals}
          handleDeleteProduct={handleDeleteProduct}
          handleAddClick={handleAddClick}
          handleDownloadPDF={handleDownloadPDF}
          handleStatusChange={handleStatusChange}
          handleUpdateOrder={handleUpdateOrder}
          handleDelivered={handleDelivered}
          handleReturned={handleReturned}
          getOrders={() => {}}
          orderType={orderType}
          onOrderUpdate={(updatedOrder) => setSelectedOrder(updatedOrder)}
          handleAddToOrder={(product) => handleAddToOrder(product).catch(error => {
            setAddProductError(error.message);
          })}
        />
      )}

      <Modal show={showTrackingModal} onHide={handleTrackingModalClose}>
        <Modal.Header closeButton>
          <Modal.Title>Add Tracking Information</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Tracking Company</Form.Label>
              <Form.Control
                type="text"
                name="company"
                value={trackingInfo.company}
                onChange={handleTrackingInfoChange}
                placeholder="Enter tracking company name"
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Tracking ID</Form.Label>
              <Form.Control
                type="text"
                name="id"
                value={trackingInfo.id}
                onChange={handleTrackingInfoChange}
                placeholder="Enter tracking ID"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleTrackingModalClose}>
            Close
          </Button>
          <Button variant="primary" onClick={handleAddTracking}>
            Add Tracking
          </Button>
        </Modal.Footer>
      </Modal>

      <SearchModal
        show={showSearchModal}
        handleClose={handleCloseSearchModal}
        handleAddToOrder={handleAddToOrder}
      />
    </AdminLayout>
  );
};

export default AdminOrders;
