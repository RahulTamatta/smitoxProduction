import React from "react";
import { Button } from "react-bootstrap";

const StatusButtons = ({
  selectedOrder,
  handleStatusChange,
  handleDelivered,
  handleReturned,
}) => {
  if (!selectedOrder) return null;

  const renderStatusButtons = () => {
    switch (selectedOrder.status) {
      case "Pending":
        return (
          <div>
            <Button
              variant="success"
              onClick={() => handleStatusChange(selectedOrder._id, "Confirmed")}
              className="me-2"
            >
              Confirm
            </Button>
            <Button
              variant="danger"
              onClick={() => handleStatusChange(selectedOrder._id, "Cancelled")}
              className="me-2"
            >
              Cancel
            </Button>
            <Button
              variant="warning"
              onClick={() => handleStatusChange(selectedOrder._id, "Rejected")}
            >
              Reject
            </Button>
          </div>
        );

      case "Confirmed":
        return (
          <div>
            <Button
              variant="success"
              onClick={() => handleStatusChange(selectedOrder._id, "Accepted")}
            >
              Accept
            </Button>
          </div>
        );

      case "Dispatched":
        return (
          <div>
            <Button
              variant="success"
              onClick={() => handleStatusChange(selectedOrder._id, "Delivered")}
              className="me-2"
            >
              Delivered
            </Button>
            <Button
              variant="danger"
              onClick={() => handleStatusChange(selectedOrder._id, "Returned")}
            >
              RTO
            </Button>
          </div>
        );

      case "Cancelled":
      case "Rejected":
        return (
          <div>
            <Button
              variant="primary"
              onClick={() => handleStatusChange(selectedOrder._id, "Pending")}
            >
              Set to Pending
            </Button>
          </div>
        );

      case "Accepted":
        return (
          <div>
            <Button
              variant="primary"
              onClick={() => handleStatusChange(selectedOrder._id, "Dispatched")}
              className="me-2"
            >
              Dispatched
            </Button>
            <Button
              variant="primary"
              onClick={() => handleStatusChange(selectedOrder._id, "Rejected")}
            >
              Reject
            </Button>
          </div>
        );

      case "Delivered":
      case "Returned":
        return (
          <div>
            <Button variant="success" onClick={handleDelivered} className="me-2">
              Delivered
            </Button>
            <Button variant="danger" onClick={handleReturned}>
              Returned
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return <div className="mb-3">{renderStatusButtons()}</div>;
};

export default StatusButtons;
