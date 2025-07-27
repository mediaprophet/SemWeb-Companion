

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import AboutDialog from './AboutDialog.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';
import SettingsTab from './SettingsTab.jsx';
import SparqlTab from './SparqlTab.jsx';
import SuperLinksTab from './SuperLinksTab.jsx';
import SuperLinksDemo from './SuperLinksDemo.jsx';
import DataView from './DataView.jsx';
import Tabs from './Tabs.jsx';
import './osds-animations.css';

export default function App() {
  const { t, i18n } = useTranslation();
  const [tab, setTab] = useState('settings');
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
  const tabList = [
    { key: 'settings', label: t('settings', 'Settings') },
    { key: 'sparql', label: t('sparql', 'SPARQL') },
    { key: 'superlinks', label: t('superLinks', 'SuperLinks') },
    { key: 'superlinksdemo', label: t('superLinksDemo', 'SuperLinks Demo') },
    { key: 'about', label: t('about', 'About') },
    { key: 'dataview', label: t('dataView', 'DataView') }
  ];
  return (
    <SolidAuthProvider>
      <ErrorBoundary>
        <div>
          <div className="d-flex align-items-center justify-content-between mb-2">
            <h2>{t('structuredDataSniffer', 'Structured Data Sniffer (React UI)')}</h2>
            <div>
              <label htmlFor="lang-switcher" className="me-2 fw-normal">{t('language', 'Language')}:</label>
              <select id="lang-switcher" className="form-select form-select-sm d-inline-block" style={{ width: 130 }} value={i18n.language} onChange={handleLangChange}>
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.label}</option>
                ))}
              </select>
            </div>
          </div>
          <SolidLoginPanel />
          <Tabs tabs={tabList} activeKey={tab} onSelect={setTab} />
          <div>
            {tab === 'settings' && <SettingsTab />}
            {tab === 'sparql' && <SparqlTab />}
            {tab === 'superlinks' && <SuperLinksTab />}
            {tab === 'superlinksdemo' && <SuperLinksDemo />}
            {tab === 'about' && <AboutDialog show={true} onClose={() => setTab('settings')} />}
            {tab === 'dataview' && <DataView />}
          </div>
        </div>
      </ErrorBoundary>
    </SolidAuthProvider>
  );
}
