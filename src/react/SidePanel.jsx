import React, { useState, useEffect } from 'react';
import SemanticBookmarksSidebar from './SemanticBookmarksSidebar.jsx';
import SolidChatSidebar from './SolidChatSidebar.jsx';
import AnnotationsSidebar from './AnnotationsSidebar.jsx';
import DataView from './data-view/DataView.jsx';
import { useTranslation } from 'react-i18next';
import LoginModal from './LoginModal.jsx';

function SidePanel() {
  const { t } = useTranslation();
  const [tab, setTab] = useState('structured');
  const [showLogin, setShowLogin] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('sidepanel_help_dismissed')) {
      setShowHelp(true);
    }
  }, []);

  const dismissHelp = () => {
    setShowHelp(false);
    localStorage.setItem('sidepanel_help_dismissed', '1');
  };

  // Stub for browser login (expand as needed)
  const handleBrowserLogin = () => {
    alert('Browser login not yet implemented.');
    setShowLogin(false);
  };

  return (
    <div style={{ minWidth: 360, maxWidth: 420 }}>
      <div style={{textAlign:'center', marginTop: '8px', marginBottom: '8px'}}>
        <img src="../images/icon48.png" alt="Extension Icon" style={{verticalAlign:'middle', marginRight:8}}/>
        <span style={{fontSize:'1.2em', fontWeight:'bold', verticalAlign:'middle'}}>Extension Side Panel</span>
      </div>
      {showHelp && (
        <div style={{background:'#e9f5ff', border:'1px solid #b6e0fe', borderRadius:6, padding:'10px 14px', margin:'8px 12px', position:'relative', fontSize:'0.98em'}}>
          <b>Welcome!</b> This side panel lets you view structured data, bookmarks, contacts, annotations, and chat with AI or Solid agents.<br/>
          Use the navigation buttons above to explore features.<br/>
          <button onClick={dismissHelp} style={{position:'absolute', top:4, right:8, border:'none', background:'none', fontWeight:'bold', fontSize:'1.1em', cursor:'pointer'}} title="Dismiss">×</button>
        </div>
      )}
      <div style={{display:'flex', gap:4, margin:'12px 8px'}}>
        <button className={`btn btn-sm ${tab==='structured' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setTab('structured')} title="View structured data">
          {t('structuredData', 'Structured Data')}
        </button>
        <button className={`btn btn-sm ${tab==='directory' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setTab('directory')} title="Browse your bookmarks and contacts">
          {t('directory', 'Directory')}
        </button>
        <button className={`btn btn-sm ${tab==='chat' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setTab('chat')} title="Chat with AI or Solid agents">
          {t('chat', 'Chat')}
        </button>
        <button className={`btn btn-sm ${tab==='annotations' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setTab('annotations')} title="View and manage annotations">
          {t('annotations', 'Annotations')}
        </button>
        <button className={`btn btn-sm ${tab==='addressbook' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setTab('addressbook')} title="Access your address book">
          {t('addressBook', 'Address Book')}
        </button>
        <button className="btn btn-outline-secondary btn-sm ms-auto" style={{marginLeft:'auto'}} onClick={() => setShowLogin(true)}>
          {t('login', 'Login')}
        </button>
      </div>
      <div>
        {tab === 'structured' && <DataView />}
        {tab === 'directory' && <SemanticBookmarksSidebar />}
        {tab === 'chat' && <SolidChatSidebar />}
        {tab === 'annotations' && <AnnotationsSidebar />}
        {tab === 'addressbook' && <AnnotationsSidebar />}
      </div>
      <LoginModal show={showLogin} onHide={() => setShowLogin(false)} onBrowserLogin={handleBrowserLogin} />
      <div style={{textAlign:'center', marginTop:24, fontSize:'0.95em'}}>
        <a href="https://github.com/mediaprophet/structured-data-sniffer" target="_blank" rel="noopener noreferrer">
          Help & Feedback
        </a>
      </div>
    </div>
  );
}

export default SidePanel;
