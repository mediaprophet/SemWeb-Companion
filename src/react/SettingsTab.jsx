import MappingEditor from './MappingEditor';
  // Custom mapping settings
  const csvMapping = (() => { try { return JSON.parse(get('ext.osds.mapping.csv') || '{}'); } catch { return {}; } })();
  const metaMapping = (() => { try { return JSON.parse(get('ext.osds.mapping.meta') || '{}'); } catch { return {}; } })();
      <>
        <hr />
        <div className="mb-3">
          <MappingEditor type="csv" value={csvMapping} onChange={v => set('ext.osds.mapping.csv', JSON.stringify(v))} />
        </div>
        <div className="mb-3">
          <MappingEditor type="meta" value={metaMapping} onChange={v => set('ext.osds.mapping.meta', JSON.stringify(v))} />
        </div>
      </>
  // CORS proxy settings
  const corsProxyEnabled = get('ext.osds.corsproxy.enabled') === '1';
  const corsProxyList = (() => {
    try {
      return JSON.parse(get('ext.osds.corsproxy.list') || '["https://corsproxy.io/?","https://api.allorigins.win/raw?url="]');
    } catch { return ["https://corsproxy.io/?","https://api.allorigins.win/raw?url="]; }
  })();
  const corsProxyUrl = get('ext.osds.corsproxy.url') || corsProxyList[0];
  const [newProxy, setNewProxy] = useState('');
      <>
        <hr />
        <div className="mb-3 p-3 border rounded bg-light">
          <div className="d-flex align-items-center mb-2">
            <span className="h5 mb-0 me-2">{t('corsProxySettings', 'CORS Proxy Settings')}</span>
            <span className="badge bg-secondary ms-2">{corsProxyEnabled ? t('enabled', 'Enabled') : t('disabled', 'Disabled')}</span>
          </div>
          <div className="mb-2 text-muted small">
            {t('corsProxyHelp', 'If you encounter CORS/network errors when dereferencing IRIs, enable a CORS proxy. The proxy will fetch resources on your behalf and bypass browser restrictions. You can add your own proxy or use a public one.')} <br />
            <b>{t('activeProxy', 'Active proxy')}:</b> <span className="text-primary">{corsProxyEnabled ? corsProxyUrl : t('noneDisabled', 'None (disabled)')}</span>
          </div>
          <div className="form-check form-switch mb-2">
            <input className="form-check-input" type="checkbox" id="corsproxy-enabled" checked={corsProxyEnabled} onChange={e => set('ext.osds.corsproxy.enabled', e.target.checked ? '1' : '0')} />
            <label className="form-check-label" htmlFor="corsproxy-enabled">{t('enableCorsProxy', 'Enable CORS Proxy for IRI dereferencing')}</label>
          </div>
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
      </>




import React, { useState } from 'react';
import UsersModal from './UsersModal.jsx';

import { useSettings } from './SettingsContext.jsx';
import { useTranslation } from 'react-i18next';
import i18n from './i18n';





export default function SettingsTab() {
  const { get, set } = useSettings();
  const [showUsersModal, setShowUsersModal] = useState(false);
  const { t } = useTranslation();

  // Parse users list from JSON
  let users = [];
  try {
    users = JSON.parse(get('ext.osds.pref.user.list') || '[]');
  } catch (e) {}
  const selectedUser = get('ext.osds.pref.user') || (users[0] || '');

  return (
    <div className="settings-tab p-4" role="region" aria-labelledby="settings-heading">
      <div className="mb-3 d-flex justify-content-end align-items-center">
        <label htmlFor="lang-switcher" className="me-2">{t('language', 'Language')}:</label>
        <select
          id="lang-switcher"
          className="form-select form-select-sm"
          style={{ maxWidth: 120, display: 'inline-block' }}
          value={i18n.language}
          onChange={e => i18n.changeLanguage(e.target.value)}
        >
          <option value="en">English</option>
          {/* Add more languages here as you add translation files */}
        </select>
      </div>
      <h4 id="settings-heading">{t('settings')}</h4>
      {/* Placeholder for Solid/OIDC Login - implementation to be added */}
      <div className="mb-3">
        <label className="form-label"><b>Solid Login (WebID/OIDC)</b></label>
        <div className="alert alert-secondary p-2 mb-2" role="alert">
          Solid login and pod storage integration coming soon. This will allow you to authenticate with your Solid provider and store data on your pod.<br />
          (Legacy used <code>oidcWebID</code>; final implementation may differ.)
        </div>
        <button className="btn btn-outline-primary btn-sm" type="button" disabled>Login with Solid (coming soon)</button>
      </div>
      <form aria-label={t('settings')} autoComplete="off">
        <div className="mb-3">
          <label htmlFor="uiterm-mode" className="form-label">{t('uiTerminology')}</label>
          <select
            className="form-select form-select-sm"
            id="uiterm-mode"
            aria-label={t('uiTerminology')}
            style={{ maxWidth: 300, display: 'inline-block' }}
            value={get('ext.osds.uiterm.mode') || 'ui-eav'}
            onChange={e => set('ext.osds.uiterm.mode', e.target.value)}
          >
            <option value="ui-eav">{t('entityAttributeValue')}</option>
            <option value="ui-spo">{t('subjectPredicateObject')}</option>
          </select>
        </div>
        <div className="mb-3 d-flex align-items-center">
          <label htmlFor="chk_pref_user" className="form-label me-2">{t('preferredUserId')}</label>
          <input
            id="chk_pref_user"
            type="checkbox"
            className="form-check-input me-2"
            aria-checked={get('ext.osds.pref.user.chk') === '1'}
            aria-label={t('preferredUserId')}
            checked={get('ext.osds.pref.user.chk') === '1'}
            onChange={e => set('ext.osds.pref.user.chk', e.target.checked ? '1' : '0')}
          />
          <select
            className="form-select form-select-sm me-2"
            id="pref_user"
            aria-label={t('preferredUserId')}
            style={{ maxWidth: 350, display: 'inline-block' }}
            value={selectedUser}
            onChange={e => set('ext.osds.pref.user', e.target.value)}
            disabled={get('ext.osds.pref.user.chk') !== '1' || users.length === 0}
          >
            {users.length === 0 && <option value="">(none)</option>}
            {users.map((u, i) => (
              <option key={i} value={u}>{u}</option>
            ))}
          </select>
          <button
            className="btn btn-outline-secondary btn-sm"
            id="call_edit_users"
            type="button"
            aria-label={t('edit')}
            onClick={e => { e.preventDefault(); setShowUsersModal(true); }}
          >
            {t('edit')}
          </button>
        </div>
        <div className="mb-3">
          <label htmlFor="chk_show_action_for_url_with_params" className="form-label">{t('showOsdsIcon')}</label>
          <input
            id="chk_show_action_for_url_with_params"
            type="checkbox"
            className="form-check-input ms-2"
            aria-checked={get('ext.osds.pref.show_action') === '1'}
            aria-label={t('showOsdsIcon')}
            checked={get('ext.osds.pref.show_action') === '1'}
            onChange={e => set('ext.osds.pref.show_action', e.target.checked ? '1' : '0')}
          />
        </div>
        <hr />
        <div className="mb-3">
          <label htmlFor="chk_try_handle_all" className="form-label">{t('visualizeContent')}</label>
          <input
            id="chk_try_handle_all"
            type="checkbox"
            className="form-check-input ms-2"
            aria-checked={get('ext.osds.handle_all') === '1'}
            aria-label={t('visualizeContent')}
            checked={get('ext.osds.handle_all') === '1'}
            onChange={e => set('ext.osds.handle_all', e.target.checked ? '1' : '0')}
          />
        </div>
        <div className="mb-3">
          <label htmlFor="chk_try_handle_xml" className="form-label">{t('bestEffortXml')}</label>
          <input
            id="chk_try_handle_xml"
            type="checkbox"
            className="form-check-input ms-2"
            aria-checked={get('ext.osds.handle_xml') === '1'}
            aria-label={t('bestEffortXml')}
            checked={get('ext.osds.handle_xml') === '1'}
            onChange={e => set('ext.osds.handle_xml', e.target.checked ? '1' : '0')}
          />
        </div>
        <div className="mb-3">
          <label htmlFor="chk_try_handle_csv" className="form-label">{t('bestEffortCsv')}</label>
          <input
            id="chk_try_handle_csv"
            type="checkbox"
            className="form-check-input ms-2"
            aria-checked={get('ext.osds.handle_csv') === '1'}
            aria-label={t('bestEffortCsv')}
            checked={get('ext.osds.handle_csv') === '1'}
            onChange={e => set('ext.osds.handle_csv', e.target.checked ? '1' : '0')}
          />
        </div>
        <div className="mb-3">
          <label htmlFor="chk_try_handle_json" className="form-label">{t('bestEffortJson')}</label>
          <input
            id="chk_try_handle_json"
            type="checkbox"
            className="form-check-input ms-2"
            aria-checked={get('ext.osds.handle_json') === '1'}
            aria-label={t('bestEffortJson')}
            checked={get('ext.osds.handle_json') === '1'}
            onChange={e => set('ext.osds.handle_json', e.target.checked ? '1' : '0')}
          />
        </div>
      </form>
      <UsersModal
        show={showUsersModal}
        onClose={() => setShowUsersModal(false)}
        users={users}
        setUsers={u => set('ext.osds.pref.user.list', JSON.stringify(u))}
      />
    </div>
  );
}
