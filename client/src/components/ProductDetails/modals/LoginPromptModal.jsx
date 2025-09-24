import React from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPromptModal = ({
  showLoginPrompt,
  setShowLoginPrompt,
  isMobile
}) => {
  const navigate = useNavigate();

  const buttonStyle = {
    padding: isMobile ? "8px 16px" : "10px 20px",
    fontSize: isMobile ? "14px" : "16px",
    cursor: "pointer",
    border: "none",
    borderRadius: "20px",
    transition: "background-color 0.3s",
  };

  if (!showLoginPrompt) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'white',
      padding: isMobile ? '15px' : '20px',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      zIndex: 1000,
      maxWidth: '90%',
      width: isMobile ? '90%' : '300px',
      textAlign: 'center'
    }}>
      <h3 style={{ fontSize: isMobile ? '18px' : '20px' }}>Please Login</h3>
      <p style={{ fontSize: isMobile ? '14px' : '16px' }}>
        You need to login to add items to cart
      </p>
      <div style={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        gap: '10px',
        justifyContent: 'center'
      }}>
        <button 
          onClick={() => navigate('/login')}
          style={{
            ...buttonStyle,
            backgroundColor: '#007bff',
            color: 'white',
            padding: isMobile ? '10px' : '10px 20px',
            margin: isMobile ? '5px 0' : '10px',
            width: isMobile ? '100%' : 'auto'
          }}
        >
          Go to Login
        </button>
        <button 
          onClick={() => setShowLoginPrompt(false)}
          style={{
            ...buttonStyle,
            backgroundColor: '#6c757d',
            color: 'white',
            padding: isMobile ? '10px' : '10px 20px',
            width: isMobile ? '100%' : 'auto'
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default LoginPromptModal;
