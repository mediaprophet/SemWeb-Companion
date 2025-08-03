import React from "react";
import { createRoot } from "react-dom/client";

// Default settings for the extension
const defaultSettings = {
  solidEnabled: true,
  browserIdentityEnabled: true,
  gunChatEnabled: true,
  bookmarksEnabled: true,
  overlaysEnabled: true,
  notificationsEnabled: false,
  theme: "auto",
  social: {
    mastodon: true,
    bluesky: false,
    twitter: false,
  },
  experimental: {
    aiAgents: false,
    videoChat: true,
  },
};

// Utility to get extension version from manifest
function useExtensionVersion() {
  const [version, setVersion] = React.useState("");
  React.useEffect(() => {
    if (chrome && chrome.runtime && chrome.runtime.getManifest) {
      setVersion(chrome.runtime.getManifest().version || "");
    }
  }, []);
  return version;
}

function SettingsApp() {
  // Simple hash-based navigation
  const [section, setSection] = React.useState(() => window.location.hash.replace('#','') || 'main');
  const [settings, setSettings] = React.useState(() => ({ ...defaultSettings }));
  const [status, setStatus] = React.useState("");
  const version = useExtensionVersion();

  // Load settings from chrome.storage on mount
  React.useEffect(() => {
    if (chrome && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.get("settings", (result) => {
        if (result && result.settings) {
          setSettings({ ...defaultSettings, ...result.settings });
        }
      });
    }
  }, []);

  // Save settings to chrome.storage
  const saveSettings = () => {
    if (chrome && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.set({ settings }, () => {
        setStatus("Settings saved!");
        setTimeout(() => setStatus(""), 2000);
      });
    }
  };

  // Reset settings to default
  const resetSettings = () => {
    setSettings({ ...defaultSettings });
    setStatus("Settings reset to default (not yet saved)");
    setTimeout(() => setStatus(""), 2000);
  };

  // Handler for toggles and options
  const handleToggle = (key, subkey) => {
    setSettings(prev => {
      if (subkey) {
        return { ...prev, [key]: { ...prev[key], [subkey]: !prev[key][subkey] } };
      }
      return { ...prev, [key]: !prev[key] };
    });
  };
  const handleSelect = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Tooltip helper
  const tooltip = (text) => <span title={text} style={{ cursor: 'help', color: '#888', marginLeft: 4 }}>ⓘ</span>;

  return (
    <div className="container-fluid" style={{ padding: 0, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="row flex-grow-1" style={{ minHeight: '100vh' }}>
        {/* Main content */}
        <div className="col-md-8" style={{ padding: 32 }}>
          <h2>Extension Settings</h2>
          <nav style={{ marginBottom: 24 }}>
            <button className={section==='main' ? 'btn btn-primary me-2' : 'btn btn-outline-primary me-2'} onClick={()=>window.location.hash='main'}>General</button>
            <button className={section==='options' ? 'btn btn-primary me-2' : 'btn btn-outline-primary me-2'} onClick={()=>window.location.hash='options'}>Options</button>
            <button className={section==='advanced' ? 'btn btn-primary' : 'btn btn-outline-primary'} onClick={()=>window.location.hash='advanced'}>Advanced</button>
          </nav>
          {status && <div className="alert alert-success" style={{ maxWidth: 400 }}>{status}</div>}
          {section === 'main' && (
            <div>
              <h4>General Settings</h4>
              <div className="form-check form-switch mb-2">
                <input className="form-check-input" type="checkbox" id="solidEnabled" checked={settings.solidEnabled} onChange={()=>handleToggle('solidEnabled')} />
                <label className="form-check-label" htmlFor="solidEnabled">Enable Solid (WebID/OIDC) Login {tooltip('Use decentralized identity for login and data storage.')}</label>
              </div>
              <div className="form-check form-switch mb-2">
                <input className="form-check-input" type="checkbox" id="browserIdentityEnabled" checked={settings.browserIdentityEnabled} onChange={()=>handleToggle('browserIdentityEnabled')} />
                <label className="form-check-label" htmlFor="browserIdentityEnabled">Enable Browser Identity Login {tooltip('Use Chrome/Browser identity for login.')}</label>
              </div>
              <div className="form-check form-switch mb-2">
                <input className="form-check-input" type="checkbox" id="bookmarksEnabled" checked={settings.bookmarksEnabled} onChange={()=>handleToggle('bookmarksEnabled')} />
                <label className="form-check-label" htmlFor="bookmarksEnabled">Enable Semantic Bookmarks {tooltip('Save and manage bookmarks with structured data.')}</label>
              </div>
              <div className="form-check form-switch mb-2">
                <input className="form-check-input" type="checkbox" id="overlaysEnabled" checked={settings.overlaysEnabled} onChange={()=>handleToggle('overlaysEnabled')} />
                <label className="form-check-label" htmlFor="overlaysEnabled">Enable Graph Overlays {tooltip('Show overlays for structured data on web pages.')}</label>
              </div>
              <div className="form-check form-switch mb-2">
                <input className="form-check-input" type="checkbox" id="notificationsEnabled" checked={settings.notificationsEnabled} onChange={()=>handleToggle('notificationsEnabled')} />
                <label className="form-check-label" htmlFor="notificationsEnabled">Enable Notifications {tooltip('Show browser notifications for extension events.')}</label>
              </div>
              <div className="mb-3">
                <label htmlFor="themeSelect" className="form-label">Theme {tooltip('Choose light, dark, or auto mode.')}</label>
                <select className="form-select" id="themeSelect" value={settings.theme} onChange={e=>handleSelect('theme', e.target.value)}>
                  <option value="auto">Auto</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
              <div className="d-flex gap-2 mt-4">
                <button className="btn btn-success" onClick={saveSettings}>Save Settings</button>
                <button className="btn btn-secondary" onClick={resetSettings}>Reset to Default</button>
              </div>
            </div>
          )}
          {section === 'options' && (
            <div>
              <h4>Options</h4>
              <div className="form-check form-switch mb-2">
                <input className="form-check-input" type="checkbox" id="gunChatEnabled" checked={settings.gunChatEnabled} onChange={()=>handleToggle('gunChatEnabled')} />
                <label className="form-check-label" htmlFor="gunChatEnabled">Enable Gun/Eco Global Chat {tooltip('Decentralized chat for all users.')}</label>
              </div>
              <div className="form-check form-switch mb-2">
                <input className="form-check-input" type="checkbox" id="videoChat" checked={settings.experimental.videoChat} onChange={()=>handleToggle('experimental','videoChat')} />
                <label className="form-check-label" htmlFor="videoChat">Enable Video Chat (Experimental) {tooltip('Video chat room for current tab.')}</label>
              </div>
              <div className="form-check form-switch mb-2">
                <input className="form-check-input" type="checkbox" id="aiAgents" checked={settings.experimental.aiAgents} onChange={()=>handleToggle('experimental','aiAgents')} />
                <label className="form-check-label" htmlFor="aiAgents">Enable AI Agents (Experimental) {tooltip('Enable AI-powered features and agents.')}</label>
              </div>
              <div className="d-flex gap-2 mt-4">
                <button className="btn btn-success" onClick={saveSettings}>Save Settings</button>
                <button className="btn btn-secondary" onClick={resetSettings}>Reset to Default</button>
              </div>
            </div>
          )}
          {section === 'advanced' && (
            <div>
              <h4>Advanced & Social Integrations</h4>
              <div className="form-check form-switch mb-2">
                <input className="form-check-input" type="checkbox" id="mastodon" checked={settings.social.mastodon} onChange={()=>handleToggle('social','mastodon')} />
                <label className="form-check-label" htmlFor="mastodon">Enable Mastodon Sharing {tooltip('Share bookmarks or data to Mastodon.')}</label>
              </div>
              <div className="form-check form-switch mb-2">
                <input className="form-check-input" type="checkbox" id="bluesky" checked={settings.social.bluesky} onChange={()=>handleToggle('social','bluesky')} />
                <label className="form-check-label" htmlFor="bluesky">Enable Bluesky Sharing {tooltip('Share bookmarks or data to Bluesky.')}</label>
              </div>
              <div className="form-check form-switch mb-2">
                <input className="form-check-input" type="checkbox" id="twitter" checked={settings.social.twitter} onChange={()=>handleToggle('social','twitter')} />
                <label className="form-check-label" htmlFor="twitter">Enable X (Twitter) Sharing {tooltip('Share bookmarks or data to X (Twitter).')}</label>
              </div>
              <div className="d-flex gap-2 mt-4">
                <button className="btn btn-success" onClick={saveSettings}>Save Settings</button>
                <button className="btn btn-secondary" onClick={resetSettings}>Reset to Default</button>
              </div>
            </div>
          )}
        </div>
        {/* Right-hand accordion menu with interactive settings */}
        <div className="col-md-4 bg-light" style={{ borderLeft: '1px solid #eee', padding: 0, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <div className="accordion flex-grow-1" id="settingsAccordion" style={{ marginTop: 32 }}>
            <div className="accordion-item">
              <h2 className="accordion-header" id="appsHeading">
                <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#appsCollapse" aria-expanded="true" aria-controls="appsCollapse">
                  Apps
                </button>
              </h2>
              <div id="appsCollapse" className="accordion-collapse collapse show" aria-labelledby="appsHeading" data-bs-parent="#settingsAccordion">
                <div className="accordion-body">
                  <div className="form-check form-switch mb-2">
                    <input className="form-check-input" type="checkbox" id="solidEnabled2" checked={settings.solidEnabled} onChange={()=>handleToggle('solidEnabled')} />
                    <label className="form-check-label" htmlFor="solidEnabled2">Solid (WebID/OIDC)</label>
                  </div>
                  <div className="form-check form-switch mb-2">
                    <input className="form-check-input" type="checkbox" id="browserIdentityEnabled2" checked={settings.browserIdentityEnabled} onChange={()=>handleToggle('browserIdentityEnabled')} />
                    <label className="form-check-label" htmlFor="browserIdentityEnabled2">Browser Identity</label>
                  </div>
                  <div className="form-check form-switch mb-2">
                    <input className="form-check-input" type="checkbox" id="gunChatEnabled2" checked={settings.gunChatEnabled} onChange={()=>handleToggle('gunChatEnabled')} />
                    <label className="form-check-label" htmlFor="gunChatEnabled2">Gun/Eco Chat</label>
                  </div>
                  <div className="form-check form-switch mb-2">
                    <input className="form-check-input" type="checkbox" id="bookmarksEnabled2" checked={settings.bookmarksEnabled} onChange={()=>handleToggle('bookmarksEnabled')} />
                    <label className="form-check-label" htmlFor="bookmarksEnabled2">Semantic Bookmarks</label>
                  </div>
                  <div className="form-check form-switch mb-2">
                    <input className="form-check-input" type="checkbox" id="overlaysEnabled2" checked={settings.overlaysEnabled} onChange={()=>handleToggle('overlaysEnabled')} />
                    <label className="form-check-label" htmlFor="overlaysEnabled2">Graph Overlays</label>
                  </div>
                </div>
              </div>
            </div>
            <div className="accordion-item">
              <h2 className="accordion-header" id="socialHeading">
                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#socialCollapse" aria-expanded="false" aria-controls="socialCollapse">
                  Social
                </button>
              </h2>
              <div id="socialCollapse" className="accordion-collapse collapse" aria-labelledby="socialHeading" data-bs-parent="#settingsAccordion">
                <div className="accordion-body">
                  <div className="form-check form-switch mb-2">
                    <input className="form-check-input" type="checkbox" id="mastodon2" checked={settings.social.mastodon} onChange={()=>handleToggle('social','mastodon')} />
                    <label className="form-check-label" htmlFor="mastodon2">Mastodon</label>
                  </div>
                  <div className="form-check form-switch mb-2">
                    <input className="form-check-input" type="checkbox" id="bluesky2" checked={settings.social.bluesky} onChange={()=>handleToggle('social','bluesky')} />
                    <label className="form-check-label" htmlFor="bluesky2">Bluesky</label>
                  </div>
                  <div className="form-check form-switch mb-2">
                    <input className="form-check-input" type="checkbox" id="twitter2" checked={settings.social.twitter} onChange={()=>handleToggle('social','twitter')} />
                    <label className="form-check-label" htmlFor="twitter2">X (Twitter)</label>
                  </div>
                </div>
              </div>
            </div>
            <div className="accordion-item">
              <h2 className="accordion-header" id="settingsHeading">
                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#settingsCollapse" aria-expanded="false" aria-controls="settingsCollapse">
                  All Settings
                </button>
              </h2>
              <div id="settingsCollapse" className="accordion-collapse collapse" aria-labelledby="settingsHeading" data-bs-parent="#settingsAccordion">
                <div className="accordion-body">
                  <ul>
                    <li><a href="#main">General</a></li>
                    <li><a href="#options">Options</a></li>
                    <li><a href="#advanced">Advanced & Social</a></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          {/* Footer with version and support */}
          <footer className="text-center mt-auto mb-2" style={{ fontSize: '0.95em', color: '#888' }}>
            <div>Structured Data Sniffer v{version}</div>
            <div><a href="https://github.com/mediaprophet/SemWeb-Companion" target="_blank" rel="noopener noreferrer">Project Home & Support</a></div>
          </footer>
        </div>
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById("settings-root"));
root.render(<SettingsApp />);
