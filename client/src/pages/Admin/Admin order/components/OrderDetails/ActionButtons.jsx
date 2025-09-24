import React from "react";
import { Button } from "react-bootstrap";

const ActionButtons = ({
  handleClose,
  handleUpdateOrder,
  generatePDF,
  shareToWhatsApp,
}) => {
  return (
    <div className="d-flex gap-2">
      <Button variant="secondary" onClick={handleClose}>
        Close
      </Button>
      <Button variant="primary" onClick={handleUpdateOrder}>
        Update Order
      </Button>
      <Button variant="primary" onClick={generatePDF}>
        Download PDF
      </Button>
      <Button
        variant="success"
        onClick={shareToWhatsApp}
        style={{ backgroundColor: "#25D366", borderColor: "#25D366" }}
      >
        Share to WhatsApp
      </Button>
    </div>
  );
};

export default ActionButtons;
