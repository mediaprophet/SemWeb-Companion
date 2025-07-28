import React from "react";
import { useSolidAuth } from "../solid/SolidAuthProvider";
import { useTranslation } from 'react-i18next';

export default function SolidOidcLogin({ onLogin, onLogout, onProfile, accounts = [] }) {
  const { t } = useTranslation();
  const {
    webId,
    isLoggedIn,
    solidLogin,
    solidLogout,
    profile,
    fetchProfile
  } = useSolidAuth();

  const [issuer, setIssuer] = React.useState("");
  const [profileText, setProfileText] = React.useState("");
  const [selectedAccount, setSelectedAccount] = React.useState(accounts[0] || "");

  const handleLogin = () => {
    if (issuer) solidLogin(issuer);
    if (onLogin) onLogin(issuer);
  };

  const handleFetchProfile = async () => {
    if (webId) {
      const text = await fetchProfile(webId);
      setProfileText(text);
      if (onProfile) onProfile(text);
    }
  };

  const handleAccountChange = (e) => {
    setSelectedAccount(e.target.value);
    setIssuer(e.target.value);
  };

  return (
    <div style={{ border: "1px solid #ccc", padding: 16, marginBottom: 16 }}>
      <h4>{t('solidOidcLogin', 'Solid OIDC Login')}</h4>
      {isLoggedIn ? (
        <>
          <div>
            <strong>{t('webId', 'WebID')}:</strong> <a href={webId} target="_blank" rel="noopener noreferrer">{webId}</a>
          </div>
          <button className="btn btn-secondary" onClick={() => { solidLogout(); if (onLogout) onLogout(); }}>{t('logout', 'Logout')}</button>
          <button className="btn btn-info ms-2" onClick={handleFetchProfile}>{t('fetchProfile', 'Fetch Profile')}</button>
          {profileText && (
            <pre style={{ marginTop: 8, maxHeight: 200, overflow: "auto" }}>{profileText}</pre>
          )}
        </>
      ) : (
        <>
          {accounts.length > 0 && (
            <select value={selectedAccount} onChange={handleAccountChange} style={{ width: 320, marginBottom: 8 }}>
              <option value="">{t('chooseAccount', 'Choose account...')}</option>
              {accounts.map(acc => (
                <option key={acc} value={acc}>{acc}</option>
              ))}
            </select>
          )}
          <input
            type="text"
            placeholder={t('solidOidcIssuerPlaceholder', 'Solid OIDC Issuer (e.g. https://solidcommunity.net)')}
            value={issuer}
            onChange={e => setIssuer(e.target.value)}
            style={{ width: 320 }}
          />
          <button className="btn btn-primary ms-2" onClick={handleLogin} disabled={!issuer}>
            {t('login', 'Login')}
          </button>
        </>
      )}
    </div>
  );
}
