import React, { useState } from 'react';
import SemanticBookmarksSidebar from './SemanticBookmarksSidebar.jsx';
import SolidChatSidebar from './SolidChatSidebar.jsx';
import AnnotationsSidebar from './AnnotationsSidebar.jsx';
import DataView from './data-view/DataView.jsx';
import { useTranslation } from 'react-i18next';
import LoginModal from './LoginModal.jsx';

export default function SidePanel() {
  const { t } = useTranslation();
  const [tab, setTab] = useState('structured');
  const [showLogin, setShowLogin] = useState(false);

  // Stub for browser login (expand as needed)
  const handleBrowserLogin = () => {
    alert('Browser login not yet implemented.');
    setShowLogin(false);
  };
  return (
    <div style={{ minWidth: 320, maxWidth: 420 }}>
      <div className="d-flex gap-2 mb-2 align-items-center" style={{ borderBottom: '1px solid #ddd' }}>
        <button className={`btn btn-sm ${tab==='structured' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setTab('structured')}>
          {t('structuredData', 'Structured Data')}
        </button>
        <button className={`btn btn-sm ${tab==='directory' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setTab('directory')}>
          {t('directory', 'Directory')}
        </button>
        <button className={`btn btn-sm ${tab==='chat' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setTab('chat')}>
          {t('chat', 'Chat')}
        </button>
        <button className={`btn btn-sm ${tab==='annotations' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setTab('annotations')}>
          {t('annotations', 'Annotations')}
        </button>
        <button className={`btn btn-sm ${tab==='addressbook' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setTab('addressbook')}>
          {t('addressBook', 'Address Book')}
        </button>
        <button className="btn btn-outline-secondary btn-sm ms-auto" style={{marginLeft:'auto'}} onClick={() => setShowLogin(true)}>
          {t('login', 'Login')}
        </button>
      </div>
      <div>
  {tab === 'structured' && <DataView />}
  {tab === 'directory' && <Directory />}
  {tab === 'chat' && <SolidChatSidebar />}
  {tab === 'annotations' && <AnnotationsSidebar />}
  {tab === 'addressbook' && <AnnotationsSidebar />}
      </div>
      <LoginModal show={showLogin} onHide={() => setShowLogin(false)} onBrowserLogin={handleBrowserLogin} />
    </div>
  );
}
