import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { useSolidAuth } from './solid/SolidAuthProvider.jsx';
import { useTranslation } from 'react-i18next';

export default function LoginModal({ show, onHide, onBrowserLogin }) {
  const { t } = useTranslation();
  const { isLoggedIn, solidLogin, solidLogout, webId } = useSolidAuth();

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>{t('login', 'Login')}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-3">
          <Button variant="primary" className="w-100 mb-2" onClick={solidLogin} disabled={isLoggedIn}>
            {isLoggedIn ? t('solidLoggedIn', 'Solid: Logged in') : t('loginWithSolid', 'Login with Solid (WebID/OIDC)')}
          </Button>
          <Button variant="secondary" className="w-100 mb-2" onClick={onBrowserLogin}>
            {t('loginWithBrowser', 'Login with Browser Identity')}
          </Button>
          <Button variant="outline-secondary" className="w-100" onClick={onHide}>
            {t('continueAsGuest', 'Continue as Guest')}
          </Button>
        </div>
        {isLoggedIn && webId && (
          <div className="alert alert-success mt-2" style={{ fontSize: 13 }}>
            <div>{t('loggedInAs', 'Logged in as')}:</div>
            <div className="text-break">{webId}</div>
            <Button variant="link" size="sm" onClick={solidLogout}>{t('logout', 'Logout')}</Button>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
}
