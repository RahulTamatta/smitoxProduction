import React, { useState, useEffect } from 'react';
import './ConnectionErrorPopup.css'; // You'll need to create this CSS file

let showPopupFunction = null;
let hidePopupFunction = null;

/**
 * Connection Error Popup Component
 * Displays when network issues are detected
 */
const ConnectionErrorPopup = () => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [retryFunction, setRetryFunction] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Initialize global show/hide functions
  useEffect(() => {
    showPopupFunction = (msg, retryFn) => {
      setMessage(msg || 'Connection issues detected. Please check your network.');
      if (retryFn) setRetryFunction(() => retryFn);
      setVisible(true);
    };

    hidePopupFunction = () => {
      setVisible(false);
      setTimeout(() => {
        setMessage('');
        setRetryFunction(null);
      }, 300); // Wait for transition to complete
    };

    // Check network status
    const handleOnline = () => {
      setIsOffline(false);
      // Auto-hide the popup after a delay when we're back online
      setTimeout(() => {
        if (visible && navigator.onLine) {
          hidePopupFunction();
        }
      }, 2000);
    };

    const handleOffline = () => {
      setIsOffline(true);
      showPopupFunction('You appear to be offline. Please check your connection.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      showPopupFunction = null;
      hidePopupFunction = null;
    };
  }, [visible]);

  const handleRetry = () => {
    if (retryFunction) {
      retryFunction();
    } else {
      // Default retry behavior - reload current resource
      window.location.reload();
    }
    hidePopupFunction();
  };

  return (
    <div className={`connection-error-popup ${visible ? 'visible' : ''}`}>
      <div className="connection-error-content">
        <div className="connection-error-icon">
          {isOffline ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19.4 12C19.2 12 19 12 18.8 12.2L16 14.4V12.8C16 12.4 15.6 12 15.2 12H8.8C8.4 12 8 12.4 8 12.8V19.2C8 19.6 8.4 20 8.8 20H15.2C15.6 20 16 19.6 16 19.2V17.6L18.8 19.8C19 20 19.2 20 19.4 20C19.8 20 20 19.8 20 19.4V12.6C20 12.2 19.8 12 19.4 12Z" fill="currentColor"/>
              <path d="M4.93 4.93C4.38 5.48 4.38 6.37 4.93 6.92C6.92 8.91 8 11.64 8 14.5C8 15.5 8.45 16.38 9.17 16.95C10.06 17.63 11.28 17.63 12.17 16.95C12.89 16.38 13.34 15.5 13.34 14.5C13.34 12.84 13.79 11.23 14.64 9.83C15.85 7.9 13.59 5.64 11.66 6.85C10.57 7.54 9.62 8.49 8.93 9.59" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 12H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 16L12 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
        <div className="connection-error-message">{message}</div>
        <div className="connection-error-actions">
          {isOffline ? (
            <button onClick={() => hidePopupFunction()} className="connection-error-dismiss">
              Dismiss
            </button>
          ) : (
            <>
              <button onClick={() => hidePopupFunction()} className="connection-error-dismiss">
                Dismiss
              </button>
              <button onClick={handleRetry} className="connection-error-retry">
                Retry
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Function to be called from other components to show the popup
export const showConnectionErrorPopup = (message, retryFunction) => {
  if (showPopupFunction) {
    showPopupFunction(message, retryFunction);
  } else {
    // Fallback if component isn't mounted
    console.error('Connection error:', message);
    alert(`Network Issue: ${message || 'Please check your connection'}`);
  }
};

// Function to hide the popup programmatically
export const hideConnectionErrorPopup = () => {
  if (hidePopupFunction) {
    hidePopupFunction();
  }
};

export default ConnectionErrorPopup;
