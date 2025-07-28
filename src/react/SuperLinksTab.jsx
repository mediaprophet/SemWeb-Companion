


import React, { useState } from 'react';
import SolidChatSidebar from './SolidChatSidebar.jsx';
import SemanticBookmarksSidebar from './SemanticBookmarksSidebar.jsx';
import AnnotationsSidebar from './AnnotationsSidebar.jsx';
import { useSolidAuth } from './solid/SolidAuthProvider.jsx';
import ConfirmModal from './ConfirmModal.jsx';
import SuperLinksPopup from './SuperLinksPopup.jsx';
import SuperLinksHighlighter from './SuperLinksHighlighter.jsx';
import { useSettings } from './SettingsContext.jsx';
import { useTranslation } from 'react-i18next';
import AlertMessage from './AlertMessage.jsx';


function SuperLinksTab() {
  const { get, set } = useSettings();
  const { isLoggedIn, webId, solidLogin, solidLogout, putResource, fetchProfile, profile } = useSolidAuth();
  const [showConfirm, setShowConfirm] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [highlightTerm, setHighlightTerm] = useState(null);
  const [highlightEnabled, setHighlightEnabled] = useState(false);
  const { t } = useTranslation();

  // Helper to replace tokens in query
  const replaceTokens = (query) => {
    let url = window.location.href;
    let lang = navigator.language || 'en';
    return query.replaceAll('{url}', url).replaceAll('{lang}', lang);
  };

  const handleRunQuery = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const endpoint = get('ext.osds.super_links.endpoint') || get('ext.osds.sparql.url') || '';
      let query = get('ext.osds.super_links.query') || '';
      query = replaceTokens(query);
      if (!endpoint || !query) throw new Error('Endpoint or query not set.');
      // Use authenticated fetch if logged in, else fallback
      const fetcher = isLoggedIn ? window.solidAuthFetch || fetchProfile : fetch;
      const res = await (isLoggedIn ? fetchProfile : fetch)(endpoint, {
        method: 'POST',
        headers: {
          'Accept': 'application/sparql-results+json, application/json',
          'Content-Type': 'application/sparql-query',
        },
        body: query,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRevertDefaults = () => setShowConfirm(true);
  const doRevertDefaults = () => {
    set('ext.osds.super_links.timeout', get('def_super_links_timeout') || 30000000);
    set('ext.osds.super_links.sponge', 'describe-ssl');
    set('ext.osds.super_links.sponge_mode', 'xxx');
    set('ext.osds.super_links.viewer', 'html-fb');
    set('ext.osds.super_links.highlight', 'first');
    set('ext.osds.super_links.retries', get('def_super_links_retries') || 3);
    set('ext.osds.super_links.retries_timeout', get('def_super_links_retries_timeout') || 2);
    set('ext.osds.super_links.query', get('def_super_links_query') || '');
    setShowConfirm(false);
    setResult(null);
    setError(null);
  };

  // Convert SPARQL result to SuperLinks rows (full mapping for legacy parity)
  const getSuperLinksRows = () => {
    if (!result || !result.head || !result.results) return [];
    // Map legacy fields: extractLabel, providerLabel, entityTypeLabel, associationLabel, extract, provider, entityType, association
    return result.results.bindings.map(row => ({
      word: row.extractLabel?.value || row.extract?.value || '',
      wordHref: row.extract?.value || '',
      association: row.associationLabel?.value || row.association?.value || '',
      associationHref: row.association?.value || '',
      source: row.providerLabel?.value || row.provider?.value || '',
      sourceHref: row.provider?.value || '',
      type: row.entityTypeLabel?.value || row.entityType?.value || '',
      typeHref: row.entityType?.value || '',
    }));
  };

  const handleShowPopup = () => setShowPopup(true);
  const handleClosePopup = () => setShowPopup(false);
  const handleHighlight = (term) => {
    setHighlightTerm(term);
    setHighlightEnabled(false);
    setTimeout(() => setHighlightEnabled(true), 10);
  };

  // Save SuperLinks result to Solid pod
  const handleSaveToPod = async () => {
    if (!isLoggedIn) {
      alert('You must be logged in to save to your Solid pod.');
      return;
    }
    if (!result) {
      alert('No SuperLinks result to save.');
      return;
    }
    // Save as JSON file in pod storage
    const fileName = `superlinks-${Date.now()}.json`;
    const fileContent = JSON.stringify(result, null, 2);
    const podUrl = (webId && webId.startsWith('http')) ? webId.replace(/\/profile\/card(#me)?$/, '/') : '';
    const targetUrl = podUrl ? podUrl + fileName : fileName;
    const ok = await putResource(targetUrl, fileContent, 'application/json');
    if (ok) {
      alert('Saved to Solid pod: ' + targetUrl);
    } else {
      alert('Failed to save to Solid pod.');
    }
  };

  return (
    <div className="super-links-tab p-4" role="region" aria-labelledby="superlinks-heading">
      {/* Show login state for Solid pod endpoints */}
      {get('ext.osds.super_links.endpoint')?.includes('solid') && !isLoggedIn && (
        <div className="alert alert-warning mb-2">{t('solidLoginRequired', 'Solid login required for this endpoint.')}</div>
      )}
      <h4 id="superlinks-heading">{t('superLinks', 'SuperLinks')}</h4>
      {/* Sidebar enhancements: Addressbook, Semantic Bookmarks, Annotations */}
      <div className="mb-3 d-flex gap-2 flex-column align-items-stretch" style={{ maxWidth: 320 }}>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-info btn-sm" type="button" disabled title={t('comingSoon', 'Coming soon')}>{t('addressbook', 'Addressbook')}</button>
        </div>
        <SemanticBookmarksSidebar />
        <AnnotationsSidebar />
        {/* Solid Chat appears only if logged in */}
        {isLoggedIn && <SolidChatSidebar />}
      </div>
      <form aria-label={t('superLinks') + ' ' + t('settings')} autoComplete="off">
        {/* Show login/logout buttons if endpoint is a Solid pod */}
        {get('ext.osds.super_links.endpoint')?.includes('solid') && (
          <div className="mb-2">
            {isLoggedIn ? (
              <>
                <span className="me-2">{t('loggedInAs', 'Logged in as')} <a href={webId} target="_blank" rel="noopener noreferrer">{webId}</a></span>
                <button className="btn btn-outline-secondary btn-sm" onClick={solidLogout} type="button">{t('logout', 'Logout')}</button>
              </>
            ) : (
              <button className="btn btn-outline-primary btn-sm" onClick={() => solidLogin('https://solidcommunity.net')} type="button">{t('loginWithSolid', 'Login with Solid')}</button>
            )}
          </div>
        )}
        <div className="mb-3 row">
          <div className="col-12">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={handleRevertDefaults}
              aria-label={t('revertToDefaults')}
            >
              {t('revertToDefaults')}
            </button>
            <ConfirmModal
              show={showConfirm}
              onClose={() => setShowConfirm(false)}
              onConfirm={doRevertDefaults}
              title={t('warning')}
              message={t('currentSettingDiscarded')}
              confirmText={t('ok')}
              cancelText={t('cancel')}
              confirmVariant="danger"
            />
          </div>
        </div>
        <div className="mb-3 row">
          <div className="col-12">
            <ul className="list-unstyled small">
              <li>&#x25cf; <span className="text-error">{'{url}'}</span> {t('urlTokenReplaced', 'token will be replaced with the URI of the current page')}</li>
              <li>&#x25cf; <span className="text-error">{'{lang}'}</span> {t('langTokenReplaced', "token will be replaced with the browser's active UserLang (or ")}
                <span className="text-error">en</span>{t('ifUnsetOrNotDetected', ' if unset or not detected')}</li>
            </ul>
          </div>
        </div>
        <div className="mb-3 row">
          <div className="col-12">
            <button
              type="button"
              className="btn btn-primary btn-sm me-2"
              onClick={handleRunQuery}
              disabled={loading}
            >
              {loading ? t('running', 'Running...') : t('runSuperLinkQuery', 'Run SuperLink Query')}
            </button>
          </div>
        </div>
        <div className="mb-3 row">
          <div className="col-12">
            {error && (
              <AlertMessage variant="danger" message={<><strong>{t('error', 'Error:')}</strong> {error}</>}>
                <button className="btn btn-link btn-sm ms-2" onClick={() => window.location.reload()}>{t('retry', 'Retry')}</button>
              </AlertMessage>
            )}
            {result && result.head && result.results && (
              <>
                <button className="btn btn-outline-primary btn-sm mb-2 me-2" onClick={handleShowPopup} type="button">
                  {t('showSuperLinksPopup', 'Show SuperLinks Popup')}
                </button>
                <button className="btn btn-outline-success btn-sm mb-2" onClick={handleSaveToPod} type="button" disabled={!isLoggedIn} title={!isLoggedIn ? t('loginToSaveToPod', 'Login to save to pod') : ''}>
                  {t('saveToSolidPod', 'Save to Solid Pod')}
                </button>
                <SuperLinksPopup
                  show={showPopup}
                  onClose={handleClosePopup}
                  links={getSuperLinksRows()}
                  onHighlight={handleHighlight}
                  onAsk={(word) => alert(t('chatgptIntegrationComingSoon', { word }, `ChatGPT integration coming soon for: ${word}`))}
                />
                <SuperLinksHighlighter term={highlightTerm} enabled={highlightEnabled} />
              </>
            )}
            {result && !result.head && (
              <pre className="bg-light p-2 mt-2" style={{ maxHeight: 300, overflow: 'auto' }}>{JSON.stringify(result, null, 2)}</pre>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

export default SuperLinksTab;
