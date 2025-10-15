import { Dialog } from "primereact/dialog";
import React from "react";

const CustomConfirmModal = ({ visible, onHide, onConfirm, message }) => {
  return (
    <Dialog
      header="Confirm Action"
      visible={visible}
      style={{ width: '350px' }}
      modal
      onHide={onHide}
      closable
    >
      <p>{message}</p>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
        <button className="btn cancel" onClick={onHide}>Cancel</button>
        <button className="btn save" onClick={onConfirm}>Yes</button>
      </div>
    </Dialog>
  );
};

export default CustomConfirmModal;
