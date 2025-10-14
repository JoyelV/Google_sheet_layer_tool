import React, { useEffect } from 'react';
import './Toast.css';

const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className={`toast ${type}`} role="alert" aria-live="assertive">
      {message}
      <button onClick={onClose} aria-label="Close toast">
        ×
      </button>
    </div>
  );
};

export default Toast;