// Defensive fallback: define url as empty string if not already defined
// This prevents ReferenceError if any legacy or injected code tries to use 'url'
if (typeof url === 'undefined') {
  var url = '';
}

import React, { useState } from 'react';



export default function CorsProxySection({ corsProxyList, setCorsProxyList, corsProxyUrl, setCorsProxyUrl }) {
  // Final safeguard: filter out any objects and log a warning if found
  const filteredList = Array.isArray(corsProxyList)
    ? corsProxyList.filter(p => {
        if (typeof p === 'string') return true;
        if (p && typeof p.url === 'string') {
          console.warn('[CorsProxySection] Filtering out object with url property:', p);
          return false;
        }
        console.warn('[CorsProxySection] Filtering out invalid proxy entry:', p);
        return false;
      })
    : [];
  const [newProxy, setNewProxy] = useState('');

  function handleAddProxy() {
    if (newProxy && !filteredList.includes(newProxy)) {
      setCorsProxyList([...filteredList, newProxy]);
      setCorsProxyUrl(newProxy);
      setNewProxy('');
    }
  }

  function handleRemoveProxy(proxyUrl) {
    const updated = filteredList.filter(u => u !== proxyUrl);
    setCorsProxyList(updated);
    if (corsProxyUrl === proxyUrl) setCorsProxyUrl(updated[0] || '');
  }


  // --- TEMPORARY: Comment out problematic proxy list rendering ---
  // and set the value to a safe default (https://corsproxy.io/?{url})
  return (
    <div className="mb-3">
      <label className="form-label">Select Proxy:</label>
      {/*
      <select className="form-select form-select-sm mb-2" style={{ maxWidth: 400 }} value={corsProxyUrl} onChange={e => setCorsProxyUrl(e.target.value)}>
        {filteredList.map((proxy, i) => (
          <option key={i} value={proxy}>{proxy}</option>
        ))}
      </select>
      */}
      <input
        className="form-control form-control-sm mb-2"
        style={{ maxWidth: 400 }}
        value={"https://corsproxy.io/?{url}"}
        readOnly
      />
      {/* Disabled add/remove UI for now */}
      {/*
      <div className="input-group mb-2" style={{ maxWidth: 400 }}>
        <input type="text" className="form-control form-control-sm" placeholder="Add new proxy URL (use {url} or append to end)" value={newProxy} onChange={e => setNewProxy(e.target.value)} />
        <button className="btn btn-outline-secondary btn-sm" type="button" onClick={handleAddProxy}>Add Proxy</button>
      </div>
      <div className="form-text">Examples: https://corsproxy.io/?{{url}} or https://api.allorigins.win/raw?url={{url}}</div>
      <div className="mt-2">
        {filteredList.length > 1 && filteredList.map((proxy, i) => (
          <button key={i} className="btn btn-outline-danger btn-sm me-2 mb-1" onClick={() => handleRemoveProxy(proxy)} disabled={corsProxyUrl === proxy && filteredList.length === 1}>
            Remove {proxy}
          </button>
        ))}
      </div>
      */}
      <div className="form-text mt-2 text-warning">
        <b>Note:</b> CORS proxy is <b>not</b> used for localhost URLs (e.g., LM Studio, Ollama, etc.).
      </div>
    </div>
  );
}
