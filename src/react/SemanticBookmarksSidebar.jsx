import React, { useState, useEffect } from "react";
import { getSyncItem, setSyncItem } from "./storageSync.js";
import LabeledInput from "./LabeledInput.jsx";
import AlertMessage from "./AlertMessage.jsx";
import { useSolidAuth } from "./solid/SolidAuthProvider.jsx";
import { useTranslation } from 'react-i18next';

// Minimal MVP: Semantic Bookmarks (browser local + Solid pod)
const LOCAL_KEY = "osds_semantic_bookmarks";
const SOLID_BOOKMARKS_PATH = "/public/sembookmarks/bookmarks.ttl";

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
      {loading && <div className="text-muted">{t('loading', 'Loading...')}</div>}
      {error && (
        <AlertMessage variant="danger" message={<><strong>{t('error', 'Error:')}</strong> {error}</>}>
          <button className="btn btn-link btn-sm ms-2" onClick={() => window.location.reload()}>{t('retry', 'Retry')}</button>
        </AlertMessage>
      )}
      <div style={{ maxHeight: 120, overflowY: "auto", fontSize: 13, background: "#fff", border: "1px solid #eee", borderRadius: 4, marginBottom: 6, padding: 4 }}>
        {bookmarks.length === 0 && <div className="text-muted">{t('noBookmarksYet', 'No bookmarks yet.')}</div>}
        {bookmarks.map((b, i) => (
          <div key={i} style={{ marginBottom: 2 }}>
            <a href={b.url} target="_blank" rel="noopener noreferrer">{b.label || b.url}</a>
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
