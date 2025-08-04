import React from 'react';
import { Modal, Button } from 'react-bootstrap'; // Import Modal and Button from react-bootstrap
import { AiFillWarning } from 'react-icons/ai';

const StockPopup = ({ 
  show, 
  onHide, 
  product, 
  requestedQuantity 
}) => {
  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      backdrop="static"
      className="stock-warning-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title className="text-danger">
          <AiFillWarning className="me-2" /> 
          Stock Limit Reached
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="text-center mb-3">
          {product?.photos && (
            <img 
              src={product.photos} 
              alt={product?.name || 'Product'} 
              style={{ 
                width: '100px', 
                height: '100px', 
                objectFit: 'contain',
                margin: '0 auto 15px' 
              }} 
            />
          )}
          <h5>{product?.name || 'This product'}</h5>
          <p className="text-danger">
            Sorry, you cannot add more of this item to your cart.
          </p>
          <div className="stock-details p-3 bg-light rounded mb-3">
            <p className="mb-1"><strong>Available Stock:</strong> {product?.stock || 0} units</p>
       </div>
          <p>
            Please adjust the quantity or contact us for bulk orders.
          </p>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={onHide}>
          OK, I Understand
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default StockPopup;