
import React, { useState } from "react";
import { useSolidAuth } from "./solid/SolidAuthProvider";
import { useTranslation } from 'react-i18next';


const SA_CSP_PROVIDERS = [
  { id: 'community', label: 'Solid Community', url: 'https://solidcommunity.net' },
  { id: 'inrupt', label: 'Inrupt Pod Spaces', url: 'https://inrupt.net' },
  { id: 'opl_oidc', label: 'OpenLink WebID-OIDC', url: 'https://solid.openlinksw.com' },
  { id: 'opl_v5', label: 'OpenLink Solid Server ver:5.x', url: 'https://solid.openlinksw.com/5.x' },
  { id: 'opl_v5_6', label: 'OpenLink Solid Server ver:5.6', url: 'https://solid.openlinksw.com/5.6' },
  { id: 'opl_comm', label: 'OpenLink Solid Community', url: 'https://solidcommunity.openlinksw.com' },
  { id: 'opl_ds', label: 'OpenLink Data Spaces (QA server)', url: 'https://qa.dataspace.openlinksw.com' },
  { id: 'opl_uriburner', label: 'OpenLink URIBurner Service', url: 'https://uriburner.com' },
  { id: 'opl_myopl', label: 'OpenLink SA-CSP', url: 'https://id.myopenlink.net' },
  { id: 'opl_id', label: 'ID MyOpenLink.NET', url: 'https://id.myopenlink.net' }
];

export default function SolidLoginPanel() {
  const { t } = useTranslation();
  const {
    webId,
    isLoggedIn,
    solidLogin,
    solidLogout,
    profile,
    fetchProfile
  } = useSolidAuth();

  const [showCustom, setShowCustom] = useState(false);
  const [customUrl, setCustomUrl] = useState("");
  const [profileText, setProfileText] = useState("");

  function handleLogin(url) {
    if (url) solidLogin(url);
  }

  function handleCustomLogin() {
    if (customUrl) handleLogin(customUrl);
  }

  const handleFetchProfile = async () => {
    if (webId) {
      const text = await fetchProfile(webId);
      setProfileText(text);
    }
  };

  return (
    <div style={{ border: "1px solid #ccc", padding: 16, marginBottom: 16 }}>
      <h4>{t('solidOidcLogin', 'Solid OIDC Login')}</h4>
      {isLoggedIn ? (
        <>
          <div>
            <strong>{t('webId', 'WebID')}:</strong> <a href={webId} target="_blank" rel="noopener noreferrer">{webId}</a>
          </div>
          <button className="btn btn-secondary" onClick={solidLogout}>{t('logout', 'Logout')}</button>
          <button className="btn btn-info ms-2" onClick={handleFetchProfile}>{t('fetchProfile', 'Fetch Profile')}</button>
          {profileText && (
            <pre style={{ marginTop: 8, maxHeight: 200, overflow: "auto" }}>{profileText}</pre>
          )}
        </>
      ) : (
        <div>
          <h5>{t('chooseLogin', 'Choose where you log in (SA-CSP)')}</h5>
          {showCustom ? (
            <form className="custom-sacsp mb-2" onSubmit={e => { e.preventDefault(); handleCustomLogin(); }}>
              <input type="url" className="form-control form-control-sm mb-1" placeholder="https://my-sacsp.provider" value={customUrl} onChange={e => setCustomUrl(e.target.value)} />
              <div className="d-flex gap-2">
                <button type="button" className="btn btn-primary btn-sm" onClick={handleCustomLogin}>Log In</button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowCustom(false)}>Cancel</button>
              </div>
            </form>
          ) : null}
          <div className="sacsp-list d-flex flex-wrap gap-2 mb-2">
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setShowCustom(true)}>
              {t('loginWithCustom', 'Login with custom SA-CSP ...')}
            </button>
            {SA_CSP_PROVIDERS.map(sacsp => (
              <button key={sacsp.id} type="button" className="btn btn-outline-secondary btn-sm" onClick={() => handleLogin(sacsp.url)}>
                {sacsp.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
