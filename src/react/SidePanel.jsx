
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import Tabs from './Tabs.jsx';
import GunChat from './GunChat.jsx';
import { useSolidAuth } from './solid/SolidAuthProvider.jsx';

import LoginModal from './LoginModal.jsx';

import DataView from './DataView.jsx';
import SemanticBookmarksSidebar from './SemanticBookmarksSidebar.jsx';
import SolidChatSidebar from './SolidChatSidebar.jsx';
import AnnotationsSidebar from './AnnotationsSidebar.jsx';


function SidePanel() {
  const { t } = useTranslation();
  const [tab, setTab] = useState('structured');
  const [showLogin, setShowLogin] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const { isLoggedIn, webId } = useSolidAuth();

  useEffect(() => {
    if (!localStorage.getItem('sidepanel_help_dismissed')) {
      setShowHelp(true);
    }
  }, []);

  const dismissHelp = () => {
    setShowHelp(false);
    localStorage.setItem('sidepanel_help_dismissed', '1');
  };

  // Browser identity login using chrome.identity API
  const handleBrowserLogin = () => {
    if (chrome && chrome.identity && chrome.identity.getProfileUserInfo) {
      chrome.identity.getProfileUserInfo((info) => {
        if (info && info.email) {
          alert('Logged in as: ' + info.email);
        } else {
          alert('Could not retrieve browser identity.');
        }
        setShowLogin(false);
      });
    } else {
      alert('Browser identity API not available.');
      setShowLogin(false);
    }
  };

  return (
    <div style={{ width: '100%', minWidth: 0, maxWidth: '100vw' }}>
      {/* Tabs navigation with logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px 0 16px' }}>
        <img src="../images/icon48.png" alt="Extension Icon" style={{ verticalAlign: 'middle', marginRight: 8, width: 32, height: 32 }} />
        <span style={{ fontSize: '1.15em', fontWeight: 'bold', verticalAlign: 'middle', flex: 1 }}>SemWeb Companion</span>
      </div>
      <Tabs
        tabs={[
          { key: 'structured', label: t('structuredData', 'Structured Data') },
          { key: 'directory', label: t('directory', 'Directory') },
          { key: 'chat', label: t('chat', 'Chat') },
          { key: 'annotations', label: t('annotations', 'Annotations') },
          { key: 'addressbook', label: t('addressBook', 'Address Book') }
        ]}
        activeKey={tab}
        onSelect={setTab}
        className="mb-2"
      />
      {showHelp && (
        <div style={{background:'#e9f5ff', border:'1px solid #b6e0fe', borderRadius:6, padding:'10px 14px', margin:'8px 12px', position:'relative', fontSize:'0.98em'}}>
          <b>Welcome!</b> This side panel lets you view structured data, bookmarks, contacts, annotations, and chat with AI or Solid agents.<br/>
          Use the navigation buttons above to explore features.<br/>
          <button onClick={dismissHelp} style={{position:'absolute', top:4, right:8, border:'none', background:'none', fontWeight:'bold', fontSize:'1.1em', cursor:'pointer'}} title="Dismiss">×</button>
        </div>
      )}
      <div>
        {tab === 'structured' && <DataView />}
        {tab === 'directory' && <SemanticBookmarksSidebar />}
        {tab === 'chat' && (isLoggedIn ? <SolidChatSidebar /> : <GunChat userId={webId || 'anon'} />)}
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
