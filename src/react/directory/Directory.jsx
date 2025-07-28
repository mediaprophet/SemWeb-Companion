import React, { useEffect, useState } from "react";
import { useSolidAuth } from "../solid/SolidAuthProvider";
import { useTranslation } from 'react-i18next';

export default function Directory() {
  const { t } = useTranslation();
  const { isLoggedIn, webId } = useSolidAuth();
  const [solidContacts, setSolidContacts] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [search, setSearch] = useState("");

  // Fetch semantic bookmarks from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('semanticBookmarks');
      setBookmarks(raw ? JSON.parse(raw) : []);
    } catch {
      setBookmarks([]);
    }
  }, []);

  // Fetch contacts from Solid Pod (very basic, expects vCard or FOAF)
  useEffect(() => {
    async function fetchSolidContacts() {
      if (!isLoggedIn || !webId) return setSolidContacts([]);
      try {
        // Example: fetch the profile document (could be vCard, FOAF, or custom)
        const res = await fetch(webId, { headers: { Accept: 'text/turtle,application/ld+json' } });
        if (!res.ok) return setSolidContacts([]);
        const text = await res.text();
        // TODO: Parse vCard/FOAF for contacts (stubbed for now)
        // You can use rdflib.js or a simple regex for demo
        setSolidContacts([{ name: webId, webId }]);
      } catch {
        setSolidContacts([]);
      }
    }
    fetchSolidContacts();
  }, [isLoggedIn, webId]);

  // Combine and filter
  const allContacts = [
    ...solidContacts.map(c => ({ ...c, source: 'solid' })),
    ...bookmarks.map(b => ({ ...b, source: 'bookmark' }))
  ].filter(c => !search || (c.name && c.name.toLowerCase().includes(search.toLowerCase())));

  return (
    <div style={{ padding: 16 }}>
      <h3>{t('directory', 'Directory')}</h3>
      <input
        type="text"
        placeholder={t('search', 'Search contacts...')}
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: 12, width: 300 }}
      />
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {allContacts.length === 0 && <li>{t('noContacts', 'No contacts found.')}</li>}
        {allContacts.map((c, i) => (
          <li key={i} style={{ marginBottom: 8 }}>
            <b>{c.name || c.webId || c.url}</b>
            {c.url && <span style={{ marginLeft: 8, color: '#888' }}>{c.url}</span>}
            <span style={{ marginLeft: 8, fontSize: '0.9em', color: '#aaa' }}>({c.source})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
