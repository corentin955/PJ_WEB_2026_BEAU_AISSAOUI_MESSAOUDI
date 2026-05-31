import React from 'react';
import '../styles/AdminDashboard.css';

export default function ConfirmModal({ title, message, confirmLabel = 'Confirmer', cancelLabel = 'Annuler', onConfirm, onCancel }) {
  return (
    <div className="confirm-modal-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={e => e.stopPropagation()}>
        <div className="confirm-modal-title">{title}</div>
        <div className="confirm-modal-message">{message}</div>
        <div className="confirm-modal-actions">
          <button className="admin-btn admin-btn-warn" onClick={onCancel}>{cancelLabel}</button>
          <button className="admin-btn admin-btn-danger" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
