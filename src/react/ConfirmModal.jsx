
import React from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { useTranslation } from 'react-i18next';


export default function ConfirmModal({ show, onClose, onConfirm, title, message, confirmText = 'OK', cancelText = 'Cancel', confirmVariant = 'danger' }) {
  const { t } = useTranslation();
  return (
    <Modal
      show={show}
      onHide={onClose}
      backdrop="static"
      centered
      aria-modal="true"
      role="dialog"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-desc"
    >
      <Modal.Header closeButton>
        <Modal.Title id="confirm-modal-title">{title || t('warning')}</Modal.Title>
      </Modal.Header>
      <Modal.Body id="confirm-modal-desc">
        <p>{message}</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} aria-label={cancelText || t('cancel')}>
          {cancelText || t('cancel')}
        </Button>
        <Button variant={confirmVariant} onClick={onConfirm} aria-label={confirmText || t('ok')}>
          {confirmText || t('ok')}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
