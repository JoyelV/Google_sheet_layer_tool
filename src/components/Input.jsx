import React from 'react';
import './Input.css'

const Input = ({ type = 'text', label, value, onChange, error, disabled, ...props }) => (
  <div className={`input-group ${error ? 'has-error' : ''}`}>
    <label htmlFor={props.id}>{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      disabled={disabled}
      aria-invalid={!!error}
      aria-describedby={error ? `${props.id}-error` : undefined}
      {...props}
    />
    {error && <span id={`${props.id}-error`} className="error-message">{error}</span>}
  </div>
);

export default Input;