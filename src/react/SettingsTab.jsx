
import React, { useState } from 'react';
import MappingEditor from './MappingEditor';
import UsersModal from './UsersModal.jsx';
import { useSettings } from './SettingsContext.jsx';
import { useTranslation } from 'react-i18next';
import i18n from './i18n';

export default function SettingsTab() {
  const { get, set } = useSettings();
  const [showUsersModal, setShowUsersModal] = useState(false);
  const { t } = useTranslation();

  // Custom mapping settings
  const csvMapping = (() => { try { return JSON.parse(get('ext.osds.mapping.csv') || '{}'); } catch { return {}; } })();
  const metaMapping = (() => { try { return JSON.parse(get('ext.osds.mapping.meta') || '{}'); } catch { return {}; } })();

  // CORS proxy settings
  const corsProxyEnabled = get('ext.osds.corsproxy.enabled') === '1';
  const corsProxyList = (() => {
    try {
      return JSON.parse(get('ext.osds.corsproxy.list') || '["https://corsproxy.io/?","https://api.allorigins.win/raw?url="]');
    } catch { return ["https://corsproxy.io/?","https://api.allorigins.win/raw?url="]; }
  })();
  const corsProxyUrl = get('ext.osds.corsproxy.url') || corsProxyList[0];
  const [newProxy, setNewProxy] = useState('');

  // Parse users list from JSON
  let users = [];
  try {
    users = JSON.parse(get('ext.osds.pref.user.list') || '[]');
  } catch (e) {}
  const selectedUser = get('ext.osds.pref.user') || (users[0] || '');

  // ...existing code...

  return (
    <div>
      {/* ...existing code... */}
      <div>
        <label className="form-label">{t('selectProxy', 'Select Proxy:')}</label>
        <select className="form-select form-select-sm mb-2" style={{ maxWidth: 400 }} value={corsProxyUrl} onChange={e => set('ext.osds.corsproxy.url', e.target.value)}>
          {corsProxyList.map((url, i) => <option key={i} value={url}>{url}</option>)}
        </select>
        <div className="input-group mb-2" style={{ maxWidth: 400 }}>
          <input type="text" className="form-control form-control-sm" placeholder={t('addNewProxyUrl', 'Add new proxy URL (use {url} or append to end)')} value={newProxy} onChange={e => setNewProxy(e.target.value)} />
          <button className="btn btn-outline-secondary btn-sm" type="button" onClick={() => {
            if (newProxy && !corsProxyList.includes(newProxy)) {
              set('ext.osds.corsproxy.list', JSON.stringify([...corsProxyList, newProxy]));
              set('ext.osds.corsproxy.url', newProxy);
              setNewProxy('');
            }
          }}>{t('addProxy', 'Add Proxy')}</button>
        </div>
        <div className="form-text">{t('proxyExamples', 'Examples: https://corsproxy.io/?{url} or https://api.allorigins.win/raw?url={url}')}</div>
      </div>
      {/* ...existing code... */}
    </div>
  );
}
