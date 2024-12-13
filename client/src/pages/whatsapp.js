import React from 'react';

const WhatsAppButton = () => {
  const phoneNumber = '+918850832942'; // Replace with your WhatsApp number
  const defaultMessage = 'Hi, I\'m interested in your Online Streaming Mobile App!'; // Your default message
  
  const encodedMessage = encodeURIComponent(defaultMessage);
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

  const buttonStyle = {
    position: 'fixed',
    width: '60px',
    height: '60px',
    bottom: '20px',
    right: '20px',
    backgroundColor: '#25d366',
    color: '#FFF',
    borderRadius: '50%',
    textAlign: 'center',
    fontSize: '30px',
    boxShadow: '2px 2px 3px #999',
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
  };

  const imageStyle = {
    width: '35px',
    height: '35px',
  };

  return (
    <a
      href={whatsappUrl}
      style={buttonStyle}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp about our Online Streaming Mobile App"
    >
      <img
        src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
        alt="WhatsApp"
        style={imageStyle}
      />
    </a>
  );
};

export default WhatsAppButton;