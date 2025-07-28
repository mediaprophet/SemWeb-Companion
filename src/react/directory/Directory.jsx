import React, { useEffect, useState } from "react";
import { useSolidAuth } from "../solid/SolidAuthProvider";
import { useTranslation } from 'react-i18next';
import SemanticBookmarksSidebar from '../SemanticBookmarksSidebar.jsx';
import { Tabs, Tab } from 'react-bootstrap';

export default function Directory({ setBreadcrumbSub }) {
  const { t } = useTranslation();
  const { isLoggedIn, webId } = useSolidAuth();
  const [solidContacts, setSolidContacts] = useState([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState('all');

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
        setSolidContacts([{ name: webId, webId }]);
      } catch {
        setSolidContacts([]);
      }
    }
    fetchSolidContacts();
  }, [isLoggedIn, webId]);

  // Example: set sublocation to 'All' on mount
  React.useEffect(() => {
    if (setBreadcrumbSub) setBreadcrumbSub(tab === 'all' ? 'All' : tab === 'bookmarks' ? 'Semantic Bookmarks' : 'Contacts');
  }, [setBreadcrumbSub, tab]);

  return (
    <div style={{ padding: 16 }}>
      <h3>{t('directory', 'Directory')}</h3>
      <Tabs activeKey={tab} onSelect={setTab} className="mb-3">
        <Tab eventKey="all" title={t('all', 'All')}>
          <div>
            <SemanticBookmarksSidebar />
            <h5 className="mt-4">{t('contacts', 'Contacts')}</h5>
            <input
              type="text"
              placeholder={t('search', 'Search contacts...')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ marginBottom: 12, width: 300 }}
            />
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {solidContacts.length === 0 && <li>{t('noContacts', 'No contacts found.')}</li>}
              {solidContacts.filter(c => !search || (c.name && c.name.toLowerCase().includes(search.toLowerCase()))).map((c, i) => (
                <li key={i} style={{ marginBottom: 8 }}>
                  <b>{c.name || c.webId || c.url}</b>
                  {c.url && <span style={{ marginLeft: 8, color: '#888' }}>{c.url}</span>}
                  <span style={{ marginLeft: 8, fontSize: '0.9em', color: '#aaa' }}>({t('contact', 'contact')})</span>
                </li>
              ))}
            </ul>
          </div>
        </Tab>
        <Tab eventKey="bookmarks" title={t('semanticBookmarks', 'Semantic Bookmarks')}>
          <SemanticBookmarksSidebar />
        </Tab>
        <Tab eventKey="contacts" title={t('contacts', 'Contacts')}>
          <input
            type="text"
            placeholder={t('search', 'Search contacts...')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ marginBottom: 12, width: 300 }}
          />
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {solidContacts.length === 0 && <li>{t('noContacts', 'No contacts found.')}</li>}
            {solidContacts.filter(c => !search || (c.name && c.name.toLowerCase().includes(search.toLowerCase()))).map((c, i) => (
              <li key={i} style={{ marginBottom: 8 }}>
                <b>{c.name || c.webId || c.url}</b>
                {c.url && <span style={{ marginLeft: 8, color: '#888' }}>{c.url}</span>}
                <span style={{ marginLeft: 8, fontSize: '0.9em', color: '#aaa' }}>({t('contact', 'contact')})</span>
              </li>
            ))}
          </ul>
        </Tab>
      </Tabs>
    </div>
  );
}
