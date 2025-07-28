import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import AppLayout from './AppLayout.jsx';
import UtilsTab from './UtilsTab.jsx';
import AboutDialog from './AboutDialog.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';
import SettingsTab from './SettingsTab.jsx';
import SparqlTab from './SparqlTab.jsx';
import SuperLinksTab from './SuperLinksTab.jsx';
import SuperLinksDemo from './SuperLinksDemo.jsx';
import DataView from './data-view/DataView.jsx';
import SemanticBookmarksSidebar from './SemanticBookmarksSidebar.jsx';
import SolidAuthProvider from './solid/SolidAuthProvider.jsx';
import SolidLoginStatus from './login/SolidLoginStatus.jsx';
import Directory from './directory/Directory.jsx';
import AiAgentPanel from './AiAgentPanel.jsx';

export default function App() {
  const { t, i18n } = useTranslation();
  const [tab, setTab] = useState('bookmarks');
  const languages = [
    { code: 'en', label: 'English' },
    { code: 'en-GB', label: 'English (UK)' },
    { code: 'en-AU', label: 'English (Australia)' },
    { code: 'fr', label: 'Français' },
    { code: 'nl', label: 'Nederlands' },
    { code: 'it', label: 'Italiano' },
    { code: 'es', label: 'Español' },
    { code: 'de', label: 'Deutsch' },
    { code: 'hi', label: 'हिन्दी' },
    { code: 'no', label: 'Norsk' },
    { code: 'ar', label: 'العربية' },
    { code: 'pt', label: 'Português' },
    { code: 'zh', label: '中文' },
    { code: 'ja', label: '日本語' },
    { code: 'el', label: 'Ελληνικά' },
    { code: 'id', label: 'Bahasa Indonesia' },
    { code: 'he', label: 'עברית' },
    { code: 'ko', label: '한국어' },
    { code: 'fa', label: 'فارسی' },
    { code: 'la', label: 'Latina' }
  ];
  const handleLangChange = (e) => {
    i18n.changeLanguage(e.target.value);
  };
  return (
    <SolidAuthProvider>
      <ErrorBoundary>
        <AppLayout activeKey={tab} onNav={setTab}>
          <div className="d-flex align-items-center justify-content-end mb-3">
            <label htmlFor="lang-switcher" className="me-2 fw-normal">{t('language', 'Language')}:</label>
            <select id="lang-switcher" className="form-select form-select-sm d-inline-block" style={{ width: 130 }} value={i18n.language} onChange={handleLangChange}>
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.label}</option>
              ))}
            </select>
          </div>
          {/* Remove SolidOidcLogin, add login state notification */}
          <SolidLoginStatus />
          <Directory />
          <AiAgentPanel />
          {tab === 'bookmarks' && <Directory />}
          {tab === 'structured' && <DataView />}
          {tab === 'chat' && <SuperLinksTab />}
          {tab === 'utils' && <UtilsTab />}
          {tab === 'annotations' && <SuperLinksDemo />}
          {tab === 'settings' && <SettingsTab />}
          {tab === 'about' && <AboutDialog show={true} onClose={() => setTab('settings')} />}
        </AppLayout>
      </ErrorBoundary>
    </SolidAuthProvider>
  );
}
