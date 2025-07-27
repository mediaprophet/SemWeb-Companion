import React, { useState, useEffect } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { useTranslation } from 'react-i18next';

export default function UsersModal({ show, onClose, users, setUsers }) {
  const { t } = useTranslation();
  const [text, setText] = useState(users && Array.isArray(users) ? users.join('\n') : '');

  useEffect(() => {
    setText(users && Array.isArray(users) ? users.join('\n') : '');
  }, [show, users]);

  const handleSave = () => {
    const list = text
      .split(/\r?\n/)
      .map(u => u.trim())
      .filter(u => u.length > 0);
    setUsers(list);
    onClose();
  };

  return (
    <Modal
      show={show}
      onHide={onClose}
      size="lg"
      backdrop="static"
      centered
      aria-modal="true"
      role="dialog"
      aria-labelledby="users-modal-title"
      aria-describedby="users-modal-desc"
    >
      <Modal.Header closeButton>
        <Modal.Title id="users-modal-title">{t('preferredUsers', 'Preferred Users')}</Modal.Title>
      </Modal.Header>
      <Modal.Body id="users-modal-desc">
        <form aria-label={t('preferredUsersList', 'Preferred Users List')}>
          <div className="mb-3">
            <label htmlFor="user-list" className="form-label">{t('userListOnePerLine', 'User List (one per line):')}</label>
            <textarea
              id="user-list"
              className="form-control"
              rows={6}
              value={text}
              onChange={e => setText(e.target.value)}
              aria-label={t('userList', 'User List')}
              aria-required="false"
            />
          </div>
        </form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} aria-label={t('cancel', 'Cancel')}>
          {t('cancel', 'Cancel')}
        </Button>
        <Button variant="primary" onClick={handleSave} aria-label={t('save', 'Save')}>
          {t('save', 'Save')}
        </Button>
      </Modal.Footer>

    </Modal>
  );
}
