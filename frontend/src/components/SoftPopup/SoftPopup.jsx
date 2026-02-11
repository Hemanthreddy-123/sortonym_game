import React, { useEffect } from 'react';
import './SoftPopup.css';

const SoftPopup = ({ 
  isOpen, 
  onClose, 
  title = 'Notification', 
  message, 
  type = 'info', 
  autoClose = false,
  autoCloseDelay = 3000 
}) => {
  useEffect(() => {
    if (autoClose && isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);
      
      return () => clearTimeout(timer);
    }
  }, [autoClose, isOpen, onClose, autoCloseDelay]);

  if (!isOpen) return null;

  return (
    <div className="soft-popup-overlay">
      <div className={`soft-popup soft-popup--${type}`}>
        <div className="soft-popup__header">
          <div className="soft-popup__icon">
            {type === 'error' && '⚠️'}
            {type === 'success' && '✅'}
            {type === 'info' && 'ℹ️'}
            {type === 'warning' && '⚡'}
          </div>
          <h3 className="soft-popup__title">{title}</h3>
        </div>
        
        <div className="soft-popup__content">
          <p className="soft-popup__message">{message}</p>
        </div>
        
        <div className="soft-popup__actions">
          <button 
            className="soft-popup__button soft-popup__button--primary"
            onClick={onClose}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default SoftPopup;
