
import React, { useState, useEffect } from "react";
import { useSolidAuth } from "./solid/SolidAuthProvider.jsx";
import { createSemanticBookmark } from "./utils/bookmarkUtils";
import { harmonizeStructuredData } from "./utils/harmonizeStructuredData";
import GunChat from "./GunChat.jsx";
import GunVideoChat from "./GunVideoChat.jsx";

function getChromeProfile(callback) {
  if (chrome && chrome.identity && chrome.identity.getProfileUserInfo) {
    chrome.identity.getProfileUserInfo((info) => {
      console.log("[DEBUG] Chrome profile info:", info);
      callback(info);
    });
  } else {
    console.warn("[DEBUG] chrome.identity.getProfileUserInfo not available");
    callback(null);
  }
}

export default function Popup() {
  const { isLoggedIn, webId, solidLogin, solidLogout } = useSolidAuth();
  const [chromeProfile, setChromeProfile] = useState(null);
  const [dataSummary, setDataSummary] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    getChromeProfile(setChromeProfile);
    // Request structured data summary from content script
    if (chrome && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        console.log("[DEBUG] chrome.tabs.query result:", tabs);
        if (tabs && tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { type: "GET_STRUCTURED_DATA_SUMMARY" }, (resp) => {
            if (chrome.runtime.lastError) {
              console.warn("No content script found:", chrome.runtime.lastError.message);
              setDataSummary(null);
              return;
            }
            console.log("[DEBUG] Content script response:", resp);
            setDataSummary(resp);
          });
        }
      });
    } else {
      console.warn("[DEBUG] chrome.tabs not available");
    }
  }, []);

  const [bookmarkMsg, setBookmarkMsg] = useState("");

  const handleCreateBookmark = () => {
    if (!dataSummary) {
      setBookmarkMsg("No structured data to bookmark.");
      return;
    }
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0]) {
        const tab = tabs[0];
        chrome.tabs.sendMessage(tab.id, { type: "GET_STRUCTURED_DATA_FULL" }, (resp) => {
          if (chrome.runtime.lastError) {
            console.warn("No content script found:", chrome.runtime.lastError.message);
            setBookmarkMsg("No structured data found on this page.");
            return;
          }
          // Harmonize the structured data before saving
          const harmonized = harmonizeStructuredData({
            jsonld: resp?.jsonld,
            openGraph: resp?.openGraph,
            twitterMeta: resp?.twitterMeta,
            url: tab.url
          });
          createSemanticBookmark({
            url: tab.url,
            title: tab.title,
            structuredData: harmonized,
          }).then(() => setBookmarkMsg("Semantic bookmark saved!"));
        });
      }
    });
  };

  return (
    <div style={{ minWidth: 260, maxWidth: 360, padding: 18, background: "#fff", borderRadius: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <img src="images/icon16.png" alt="Icon" width={24} height={24} />
        <span style={{ fontWeight: "bold", fontSize: "1.1em" }}>Structured Data Sniffer</span>
      </div>
      {/* Login section at the top */}
      <div style={{ marginBottom: 14 }}>
        {isLoggedIn ? (
          <>
            <span style={{ color: "green" }}>Logged in as {webId}</span>
            <button className="btn btn-sm btn-outline-danger ms-2" onClick={solidLogout}>Logout</button>
          </>
        ) : chromeProfile && chromeProfile.email ? (
          <>
            <span style={{ color: "#1976d2" }}>Browser: {chromeProfile.email}</span>
            <button className="btn btn-sm btn-outline-danger ms-2" onClick={() => setChromeProfile(null)}>Logout</button>
          </>
        ) : (
          <button className="btn btn-primary w-100" onClick={() => setShowLoginModal(true)}>
            Login / Connect Account
          </button>
        )}
      </div>
      <div style={{ marginBottom: 12 }}>
        <button
          className="btn btn-outline-info w-100 mb-2"
          onClick={() => {
            // Fetch full structured data and send to content script to show overlay
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              if (tabs && tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, { type: "GET_STRUCTURED_DATA_FULL" }, (resp) => {
                  if (chrome.runtime.lastError) {
                    console.warn("No content script found:", chrome.runtime.lastError.message);
                    return;
                  }
                  chrome.tabs.sendMessage(tabs[0].id, { type: "SHOW_GRAPH_OVERLAY", data: resp }, () => {
                    if (chrome.runtime.lastError) {
                      console.warn("No content script found:", chrome.runtime.lastError.message);
                    }
                  });
                });
              }
            });
          }}
        >
          Show Graph View
        </button>
        <button className="btn btn-primary w-100 mb-2" onClick={() => {
          if (chrome.sidePanel && chrome.sidePanel.open) {
            chrome.sidePanel.open({ windowId: chrome.windows.WINDOW_ID_CURRENT });
          } else {
            chrome.tabs.create({ url: chrome.runtime.getURL("sidebar.html") });
          }
        }}>Open Side Panel</button>
        <button className="btn btn-outline-secondary w-100 mb-2" onClick={() => {
          chrome.tabs.create({ url: chrome.runtime.getURL("settings.html") });
        }}>Settings</button>
        <button className="btn btn-outline-secondary w-100 mb-2" onClick={() => {
          // Open the background page (service worker) for debugging
          if (chrome.runtime && chrome.runtime.getURL) {
            chrome.tabs.create({ url: 'chrome://extensions/?id=' + chrome.runtime.id });
          }
        }}>Background Page</button>
      </div>
      <div style={{ marginBottom: 10 }}>
        <button className="btn btn-outline-success w-100 mb-2" onClick={handleCreateBookmark}>
          Create Semantic Bookmark
        </button>
        {bookmarkMsg && <div style={{ color: '#1976d2', fontSize: '0.97em', marginTop: 4 }}>{bookmarkMsg}</div>}
      </div>
      <div style={{ marginBottom: 10 }}>
        <b>Structured Data on this page:</b><br />
        {dataSummary ? (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {Object.entries(dataSummary).map(([type, count]) => (
              <li key={type}>{type}: {count}</li>
            ))}
          </ul>
        ) : (
          <span style={{ color: "#888" }}>Loading...</span>
        )}
      </div>
      <div style={{ marginBottom: 10 }}>
        <button className="btn btn-outline-primary w-100 mb-2" onClick={() => {
          if (chrome && chrome.tabs) {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              if (tabs && tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, { type: "COPY_STRUCTURED_DATA" }, () => {
                  if (chrome.runtime.lastError) {
                    console.warn("No content script found:", chrome.runtime.lastError.message);
                  }
                });
              }
            });
          }
        }}>Copy All Structured Data</button>
      </div>
      {/* Login Modal for account selection */}
      {showLoginModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.25)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 8, padding: 24, minWidth: 260, maxWidth: 340, boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}>
            <h5 style={{ marginBottom: 18 }}>Login / Connect Account</h5>
            <button className="btn btn-outline-primary w-100 mb-2" onClick={() => { solidLogin(); setShowLoginModal(false); }}>Login with Solid (WebID/OIDC)</button>
            <button className="btn btn-outline-secondary w-100 mb-2" onClick={() => {
              if (chrome && chrome.identity && chrome.identity.getProfileUserInfo) {
                chrome.identity.getProfileUserInfo((info) => {
                  if (info && info.email) {
                    setChromeProfile(info);
                    setShowLoginModal(false);
                  } else {
                    alert('Could not retrieve browser identity.');
                  }
                });
              } else {
                alert('Browser identity API not available.');
              }
            }}>Login with Browser Identity</button>
            <button className="btn btn-outline-success w-100 mb-2" disabled title="Coming soon">
              Login with Google (Coming soon)
            </button>
            <button className="btn btn-outline-dark w-100 mb-2" disabled title="Coming soon">
              Login with GitHub (Coming soon)
            </button>
            {/* More login options can be added here in the future */}
            <button className="btn btn-link w-100 mt-2" onClick={() => setShowLoginModal(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* GunChat integration: show if not logged into Solid */}
      <div style={{ marginBottom: 10 }}>
        <b>Global Chat (Gun/Eco):</b>
        {!isLoggedIn && (
          chromeProfile && chromeProfile.email ? (
            <>
              <GunChat userId={chromeProfile.email} />
              {/* Video chat for this tab's URL */}
              <TabVideoChat chromeProfile={chromeProfile} />
            </>
          ) : (
            <div style={{ color: '#888', fontStyle: 'italic', margin: '8px 0' }}>
              Please <b>login</b> to use chat features.
            </div>
          )
        )}
      </div>
    </div>
  );
}

// Helper component to get tab URL and render GunVideoChat
function TabVideoChat({ chromeProfile }) {
  const [tabUrl, setTabUrl] = useState(null);
  useEffect(() => {
    if (chrome && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0]) setTabUrl(tabs[0].url);
      });
    }
  }, []);
  if (!tabUrl) return null;
  return <GunVideoChat userId={chromeProfile.email} roomId={encodeURIComponent(tabUrl)} />;
}
