
import React, { useState, useEffect } from "react";
import { getSyncItem, setSyncItem } from "./storageSync.js";
import LabeledInput from "./LabeledInput.jsx";
import AlertMessage from "./AlertMessage.jsx";
import { useSolidAuth } from "./solid/SolidAuthProvider.jsx";
import { useTranslation } from 'react-i18next';

// Key for local/sync storage
const LOCAL_KEY = "semweb_bookmarks";

function parseBookmarksTurtle(turtle) {
  // Very basic parser for MVP: expects lines like: [] a <SemBookmark> ; <url> "..." ; <label> "..." ; ...
  const regex = /\[\]\s+a\s+<[^>]+SemBookmark>\s*;([^.]*)\./g;
  const bookmarks = [];
  let match;
  while ((match = regex.exec(turtle))) {
    const fields = {};
    const pairs = match[1].split(";").map(s => s.trim()).filter(Boolean);
    for (const pair of pairs) {
      const [pred, obj] = pair.split(/\s+/, 2);
      if (pred && obj) {
        if (obj.startsWith('"')) fields[pred] = obj.replace(/^"|"$/g, "");
        else if (obj.startsWith('<')) fields[pred] = obj.replace(/[<>]/g, "");
        else fields[pred] = obj;
      }
    }
    bookmarks.push(fields);
  }
  return bookmarks;
}

function toTurtle(bookmarks) {
  // MVP: only url and label
  return bookmarks.map(b => `[] a <https://w3id.org/sembookmarks#SemBookmark> ; <https://schema.org/url> "${b.url}" ; <https://schema.org/name> "${b.label}" .`).join("\n");
}

export default function SemanticBookmarksSidebar() {
  const { t } = useTranslation();
  const { isLoggedIn, webId, putResource } = useSolidAuth();
  const [bookmarks, setBookmarks] = useState([]);
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Multi-facet and search state
  const [activeSearchTerms, setActiveSearchTerms] = useState([]); // array of strings
  const [searchInput, setSearchInput] = useState("");
  const [activeTags, setActiveTags] = useState([]); // array of tags
  const [activeDates, setActiveDates] = useState([]); // array of dates
  const [activeRatings, setActiveRatings] = useState([]); // array of ratings
  const [expandedDomains, setExpandedDomains] = useState({});

  // Helper: extract all unique tags, dates, ratings
  const allTags = Array.from(new Set(bookmarks.flatMap(b => (b.tags || [])))).filter(Boolean);
  const allDates = Array.from(new Set(bookmarks.map(b => b.dateCreated && b.dateCreated.slice(0,10)).filter(Boolean)));
  const allRatings = Array.from(new Set(bookmarks.map(b => b.ratingValue).filter(Boolean)));

  // Multi-facet and multi-term filter

  // Multi-facet and search state

  // Helper: extract all unique tags, dates, ratings

  // Multi-facet and multi-term filter
  const filteredBookmarks = bookmarks.filter(b => {
    // All search terms must match label, url, or tags
    if (activeSearchTerms.length > 0) {
      for (const term of activeSearchTerms) {
        const t = term.toLowerCase();
        if (!((b.label || b.name || "").toLowerCase().includes(t) || (b.url || "").toLowerCase().includes(t) || (b.tags && b.tags.join(",").toLowerCase().includes(t)))) return false;
      }
    }
    // All selected tags must be present
    if (activeTags.length > 0) {
      if (!b.tags || !activeTags.every(tag => b.tags.includes(tag))) return false;
    }
    // All selected dates must match
    if (activeDates.length > 0) {
      if (!b.dateCreated || !activeDates.every(date => b.dateCreated.startsWith(date))) return false;
    }
    // All selected ratings must match
    if (activeRatings.length > 0) {
      if (!activeRatings.every(r => String(b.ratingValue) === String(r))) return false;
    }
    return true;
  });

  // Group bookmarks by domain
  const bookmarksByDomain = filteredBookmarks.reduce((acc, b) => {
    try {
      const u = new URL(b.url);
      const domain = u.hostname;
      if (!acc[domain]) acc[domain] = [];
      acc[domain].push(b);
    } catch {
      if (!acc["other"]) acc["other"] = [];
      acc["other"].push(b);
    }
    return acc;
  }, {});

  const toggleDomain = domain => setExpandedDomains(ed => ({ ...ed, [domain]: !ed[domain] }));

  // Load from sync storage (cross-browser)
  useEffect(() => {
    getSyncItem(LOCAL_KEY, []).then(bms => {
      if (Array.isArray(bms)) setBookmarks(bms);
    });
  }, []);

  // Save to sync storage (cross-browser)
  useEffect(() => {
    setSyncItem(LOCAL_KEY, bookmarks);
  }, [bookmarks]);

  // Load from Solid pod (merge with local)
  useEffect(() => {
    if (!isLoggedIn || !webId) return;
    setLoading(true);
    setError(null);
    const podBase = webId.replace(/\/profile\/card(#me)?$/, "");
    const solidUrl = podBase + SOLID_BOOKMARKS_PATH;
    fetch(solidUrl, { headers: { Accept: "text/turtle" } })
      .then(res => res.ok ? res.text() : Promise.reject(res.statusText))
      .then(turtle => {
        const solidBookmarks = parseBookmarksTurtle(turtle);
        // Merge, dedup by url
        const merged = [...bookmarks, ...solidBookmarks].reduce((acc, b) => {
          if (!acc.find(x => x.url === b["<https://schema.org/url>"])) acc.push({ url: b["<https://schema.org/url>"], label: b["<https://schema.org/name>"] });
          return acc;
        }, []);
        setBookmarks(merged);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line
  }, [isLoggedIn, webId]);

  const addBookmark = async () => {
    if (!url.trim() || !label.trim()) return;
    const newB = { url, label };
    setBookmarks(bms => [...bms, newB]);
    setUrl(""); setLabel("");
    // Save to Solid pod if logged in
    if (isLoggedIn && webId) {
      setLoading(true);
      setError(null);
      const podBase = webId.replace(/\/profile\/card(#me)?$/, "");
      const solidUrl = podBase + SOLID_BOOKMARKS_PATH;
      const turtle = toTurtle([...bookmarks, newB]);
      try {
        await putResource(solidUrl, turtle, "text/turtle");
      } catch (e) {
        setError("Could not save to Solid pod: " + e);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div style={{ border: "1px solid #ccc", borderRadius: 6, padding: 8, marginBottom: 12, background: "#f9f9f9", minWidth: 260 }}>
      <div className="fw-bold mb-2">{t('semanticBookmarks', 'Semantic Bookmarks')}</div>
      {/* Multi-term search and multi-facet selectors */}
      <div className="d-flex gap-1 mb-2" style={{ fontSize: 13, flexWrap: 'wrap' }}>
        <input
          className="form-control form-control-sm"
          style={{ maxWidth: 120 }}
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && searchInput.trim()) {
              setActiveSearchTerms(terms => [...terms, searchInput.trim()]);
              setSearchInput("");
            }
          }}
          placeholder={t('search', 'Search...')}
        />
        <select className="form-select form-select-sm" value="" onChange={e => { if (e.target.value) setActiveTags(tags => [...tags, e.target.value]); }} style={{ maxWidth: 90 }}>
          <option value="">{t('addTag', 'Add tag')}</option>
          {allTags.filter(tag => !activeTags.includes(tag)).map(tag => <option key={tag} value={tag}>{tag}</option>)}
        </select>
        <select className="form-select form-select-sm" value="" onChange={e => { if (e.target.value) setActiveDates(dates => [...dates, e.target.value]); }} style={{ maxWidth: 110 }}>
          <option value="">{t('addDate', 'Add date')}</option>
          {allDates.filter(date => !activeDates.includes(date)).map(date => <option key={date} value={date}>{date}</option>)}
        </select>
        <select className="form-select form-select-sm" value="" onChange={e => { if (e.target.value) setActiveRatings(ratings => [...ratings, e.target.value]); }} style={{ maxWidth: 80 }}>
          <option value="">{t('addRating', 'Add rating')}</option>
          {allRatings.filter(r => !activeRatings.includes(r)).map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        {(activeSearchTerms.length > 0 || activeTags.length > 0 || activeDates.length > 0 || activeRatings.length > 0) && (
          <button className="btn btn-link btn-sm" style={{padding:0}} onClick={() => { setActiveSearchTerms([]); setActiveTags([]); setActiveDates([]); setActiveRatings([]); }}>{t('clear', 'Clear')}</button>
        )}
      </div>
      {/* Show active filters as chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
        {activeSearchTerms.map((term, i) => (
          <span key={i} className="badge bg-primary" style={{ cursor: 'pointer' }} title={t('remove', 'Remove')} onClick={() => setActiveSearchTerms(terms => terms.filter((_,j) => j !== i))}>{term} ×</span>
        ))}
        {activeTags.map((tag, i) => (
          <span key={i} className="badge bg-success" style={{ cursor: 'pointer' }} title={t('remove', 'Remove')} onClick={() => setActiveTags(tags => tags.filter((_,j) => j !== i))}>{tag} ×</span>
        ))}
        {activeDates.map((date, i) => (
          <span key={i} className="badge bg-info" style={{ cursor: 'pointer' }} title={t('remove', 'Remove')} onClick={() => setActiveDates(dates => dates.filter((_,j) => j !== i))}>{date} ×</span>
        ))}
        {activeRatings.map((r, i) => (
          <span key={i} className="badge bg-warning text-dark" style={{ cursor: 'pointer' }} title={t('remove', 'Remove')} onClick={() => setActiveRatings(ratings => ratings.filter((_,j) => j !== i))}>{r} ×</span>
        ))}
      </div>
      {loading && <div className="text-muted">{t('loading', 'Loading...')}</div>}
      {error && (
        <AlertMessage variant="danger" message={<><strong>{t('error', 'Error:')}</strong> {error}</>}>
          <button className="btn btn-link btn-sm ms-2" onClick={() => window.location.reload()}>{t('retry', 'Retry')}</button>
        </AlertMessage>
      )}
      {/* Treeview panel */}
      <div style={{ maxHeight: 180, overflowY: "auto", fontSize: 13, background: "#fff", border: "1px solid #eee", borderRadius: 4, marginBottom: 6, padding: 4 }}>
        {Object.keys(bookmarksByDomain).length === 0 && <div className="text-muted">{t('noBookmarksYet', 'No bookmarks yet.')}</div>}
        {Object.entries(bookmarksByDomain).map(([domain, bms]) => (
          <div key={domain}>
            <div style={{ cursor: 'pointer', fontWeight: 500, color: '#2a4', display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => toggleDomain(domain)}>
              <span>{expandedDomains[domain] ? '▼' : '▶'}</span>
              <span>{domain}</span>
              <span style={{ color: '#888', fontWeight: 400, fontSize: 12 }}>({bms.length})</span>
            </div>
            {expandedDomains[domain] && (
              <div style={{ marginLeft: 16, marginTop: 2 }}>
                {bms.map((b, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <img
                      src={b.image || b.favicon || '/favicon.ico'}
                      alt="favicon"
                      style={{ width: 18, height: 18, borderRadius: 3, objectFit: 'contain', background: '#eee', marginRight: 4 }}
                      onError={e => { e.target.onerror = null; e.target.src = '/favicon.ico'; }}
                    />
                    <a href={b.url} target="_blank" rel="noopener noreferrer">{b.label || b.name || b.url}</a>
                    {b.tags && b.tags.length > 0 && <span className="ms-1 text-muted" style={{fontSize:11}}>[{b.tags.join(', ')}]</span>}
                    {b.ratingValue && <span className="ms-1 text-warning" style={{fontSize:11}}>★{b.ratingValue}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="d-flex gap-1 mb-1">
        <LabeledInput
          label={null}
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder={t('label', 'Label')}
          id="bookmark-label"
          disabled={loading}
          className="flex-grow-1"
          inputProps={{ style: { flex: 2 } }}
        />
        <LabeledInput
          label={null}
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder={t('url', 'URL')}
          id="bookmark-url"
          disabled={loading}
          className="flex-grow-1"
          inputProps={{ style: { flex: 3 } }}
        />
        <button className="btn btn-success btn-sm" type="button" onClick={addBookmark} disabled={loading || !url.trim() || !label.trim()}>
          {t('add', 'Add')}
        </button>
      </div>
    </div>
  );
}
