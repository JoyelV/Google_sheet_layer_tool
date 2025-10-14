import React from 'react';
import './Button.css'

const Button = ({ children, onClick, disabled, loading, variant = 'primary', ...props }) => (
  <button
    className={`btn ${variant} ${loading ? 'loading' : ''}`}
    onClick={onClick}
    disabled={disabled || loading}
    {...props}
  >
    {loading ? 'Loading...' : children}
  </button>
);

export default Button;