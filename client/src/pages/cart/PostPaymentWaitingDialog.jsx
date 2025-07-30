import React, { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { FaCheckCircle, FaSpinner, FaShoppingBag, FaClock } from 'react-icons/fa';
import './PostPaymentWaitingDialog.css';

const PostPaymentWaitingDialog = ({ show, onHide }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [dots, setDots] = useState('');

  const steps = [
    {
      icon: <FaCheckCircle className="step-icon success" />,
      title: "Payment Successful!",
      description: "Your payment has been processed successfully"
    },
    {
      icon: <FaSpinner className="step-icon spinner" />,
      title: "Processing Order...",
      description: "We're preparing your order details"
    },
    {
      icon: <FaShoppingBag className="step-icon primary" />,
      title: "Order Confirmed!",
      description: "Redirecting you to your orders page"
    }
  ];

  // Handle step progression
  useEffect(() => {
    if (!show) {
      setCurrentStep(0);
      return;
    }

    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(stepInterval);
  }, [show]);

  // Handle animated dots for loading text
  useEffect(() => {
    if (!show) {
      setDots('');
      return;
    }

    const dotsInterval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) {
          return '';
        }
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(dotsInterval);
  }, [show]);

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      backdrop="static"
      keyboard={false}
      className="post-payment-dialog"
    >
      <div className="modal-content-wrapper">
        <Modal.Body className="text-center p-5">
          {/* Success Animation Background */}
          <div className="success-animation">
            <div className="success-checkmark">
              <div className="check-icon">
                <span className="icon-line line-tip"></span>
                <span className="icon-line line-long"></span>
                <div className="icon-circle"></div>
                <div className="icon-fix"></div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="dialog-content">
            {/* Current Step Display */}
            <div className="current-step">
              {steps[currentStep].icon}
              <h3 className="step-title mt-3">
                {steps[currentStep].title}
              </h3>
              <p className="step-description text-muted">
                {steps[currentStep].description}
                {currentStep === 1 && <span className="loading-dots">{dots}</span>}
              </p>
            </div>

            {/* Progress Steps */}
            <div className="progress-steps mt-4">
              {steps.map((step, index) => (
                <div 
                  key={index} 
                  className={`progress-step ${index <= currentStep ? 'completed' : ''} ${index === currentStep ? 'active' : ''}`}
                >
                  <div className="step-indicator">
                    {index < currentStep ? (
                      <FaCheckCircle className="completed-icon" />
                    ) : index === currentStep ? (
                      currentStep === 1 ? (
                        <FaSpinner className="spinner-icon" />
                      ) : (
                        step.icon
                      )
                    ) : (
                      <div className="pending-dot"></div>
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`step-connector ${index < currentStep ? 'completed' : ''}`}></div>
                  )}
                </div>
              ))}
            </div>

            {/* Loading Bar */}
            <div className="loading-bar-container mt-4">
              <div className="loading-bar">
                <div 
                  className="loading-progress" 
                  style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                ></div>
              </div>
              <p className="loading-text">
                <FaClock className="me-2" />
                Please wait while we redirect you to your orders...
              </p>
            </div>

            {/* Decorative Elements */}
            <div className="floating-elements">
              <div className="floating-circle circle-1"></div>
              <div className="floating-circle circle-2"></div>
              <div className="floating-circle circle-3"></div>
            </div>
          </div>
        </Modal.Body>
      </div>
    </Modal>
  );
};

export default PostPaymentWaitingDialog;
