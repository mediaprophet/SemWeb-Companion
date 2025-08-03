import PerfStats from './PerfStats.jsx';
import ShareControls from './ShareControls.jsx';
import RawDataView from './RawDataView.jsx';
import TriplesTable from './TriplesTable.jsx';
import TypeSelector from './TypeSelector.jsx';
import TripleDialog from './TripleDialog.jsx';
import FilterInput from './FilterInput.jsx';
import BulkFileManager from './BulkFileManager.jsx';
import { triplesToGraph, DATA_TYPES, isIRI, normalizeTriples } from '../utils/dataUtils.js';
import React, { useEffect, useState, useMemo } from 'react';
import RdfXmlImportExport from './RdfXmlImportExport.jsx';
import UrlInput from '../UrlInput.jsx';
import { FaRegCopy, FaTwitter, FaRegBookmark } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../SettingsContext.jsx';
import { useReactTable, getCoreRowModel, getFilteredRowModel } from '@tanstack/react-table';
import RichPreviewCard from './RichPreviewCard.jsx';
import { serializeRDFXML } from '../../utils/parsers';
import { parseRDFXML } from '../../utils/parsers';
import parsePOSH from '../utils/parsePOSH.js';


export default function DataView() {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const [triples, setTriples] = useState([]);
  const [filteredTriples, setFilteredTriples] = useState([]);
  const [selectedType, setSelectedType] = useState(DATA_TYPES[0]);
  const [showingRawData, setShowingRawData] = useState(false);
  const [showingTripleDialog, setShowingTripleDialog] = useState(false);
  const [tripleToEdit, setTripleToEdit] = useState(null);
  const [filterText, setFilterText] = useState('');
  const [importExportVisible, setImportExportVisible] = useState(false);
  const [url, setUrl] = useState('');
  const [rdfFormat, setRdfFormat] = useState('application/rdf+xml');
  const [copySuccess, setCopySuccess] = useState('');
  const [twitterShareUrl, setTwitterShareUrl] = useState('');
  const [bookmarkUrl, setBookmarkUrl] = useState('');

  // --- URL fetch and parse state ---
  const [fetchUrl, setFetchUrl] = useState("");
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [fetchedHtml, setFetchedHtml] = useState("");

  // --- Metadata extraction state ---
  const [jsonldBlocks, setJsonldBlocks] = useState([]);
  const [openGraph, setOpenGraph] = useState([]);
  const [twitterMeta, setTwitterMeta] = useState([]);
  const [microdata, setMicrodata] = useState([]);
  const [rdfa, setRdfa] = useState([]);
  const [posh, setPosh] = useState([]);
  const [turtleTriples, setTurtleTriples] = useState([]);
  const [turtleUrl, setTurtleUrl] = useState("");

  // --- Structured data from current tab ---
  useEffect(() => {
    // Only run in Chrome extension context
    if (!window.chrome || !chrome.runtime || !chrome.runtime.sendMessage) return;
    // Request structured data from content script in current tab
    chrome.tabs && chrome.tabs.query && chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_STRUCTURED_DATA' });
      }
    });
    // Listen for response
    const handleMessage = (msg, sender, sendResponse) => {
      if (msg && msg.type === 'STRUCTURED_DATA' && msg.data) {
        setJsonldBlocks(msg.data.jsonld || []);
        setOpenGraph(msg.data.openGraph || []);
        setTwitterMeta(msg.data.twitterMeta || []);
        // Add more as needed
      }
    };
    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  // Add isDark detection
  const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  const columns = useMemo(
    () => [
      {
        accessorKey: 'subject',
        header: t('Subject'),
      },
      {
        accessorKey: 'predicate',
        header: t('Predicate'),
      },
      {
        accessorKey: 'object',
        header: t('Object'),
      },
    ],
    [t]
  );

  const table = useReactTable({
    data: filteredTriples,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  // Load initial data (example: fetch from localStorage or API)
  useEffect(() => {
    // Example: load triples from localStorage (or replace with API call)
    const stored = localStorage.getItem('triples');
    if (stored) {
      try {
        setTriples(JSON.parse(stored));
      } catch {}
    }
  }, []);

  const handleTypeChange = (type) => {
    setSelectedType(type);
    // Filter triples based on selected type
    setFilteredTriples(triples.filter(triple => triple.type === type));
  };

  const handleFilterChange = (text) => {
    setFilterText(text);
    // Filter triples by subject, predicate, or object
    setFilteredTriples(triples.filter(triple =>
      triple.subject.includes(text) ||
      triple.predicate.includes(text) ||
      triple.object.includes(text)
    ));
  };

  const handleImportExportToggle = () => {
    setImportExportVisible(!importExportVisible);
  };

  const handleUrlChange = (newUrl) => {
    setUrl(newUrl);
  };

  const handleRdfFormatChange = (format) => {
    setRdfFormat(format);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopySuccess(t('URL copied to clipboard!'));
  };

  const handleShareTwitter = () => {
    window.open(twitterShareUrl, '_blank');
  };

  const handleBookmark = () => {
    // Save current triples as bookmarks in localStorage
    localStorage.setItem('bookmarkedTriples', JSON.stringify(triples));
    setBookmarkUrl(window.location.href);
    setCopySuccess('Triples bookmarked!');
  };

  const handleRowClick = (row) => {
    setTripleToEdit(row.original);
    setShowingTripleDialog(true);
  };

  // Add handleEdit, handleDelete, openDialog stubs to fix ReferenceError
  const handleEdit = (rowIdx) => {
    setTripleToEdit(triples[rowIdx]);
    setShowingTripleDialog(true);
  };
  const handleDelete = (rowIdx) => {
    // Remove triple at rowIdx
    setTriples(triples => {
      const updated = triples.filter((_, idx) => idx !== rowIdx);
      localStorage.setItem('triples', JSON.stringify(updated));
      return updated;
    });
  };
  const openDialog = (rowIdx) => {
    setTripleToEdit(triples[rowIdx]);
    setShowingTripleDialog(true);
  };

  // Handler for fetching and parsing a URL
  const handleFetchUrl = async (e) => {
    e.preventDefault();
    if (!fetchUrl.trim()) return;
    setFetchLoading(true);
    setFetchError(null);
    setFetchedHtml("");
    try {
      let url = fetchUrl.trim();
      // Always use CORS proxy on localhost (React dev)
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        url = 'https://corsproxy.io/?' + encodeURIComponent(url);
      }
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const html = await resp.text();
      setFetchedHtml(html);
      // Extract triples from HTML (very basic example)
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const triples = [];
      // Example: extract <meta property="og:..." content="..."> as triples
      Array.from(doc.querySelectorAll('meta[property^="og:"]')).forEach(el => {
        triples.push({
          subject: url,
          predicate: el.getAttribute('property'),
          object: el.getAttribute('content'),
          type: 'opengraph'
        });
      });
      setTriples(triples);
      setFilteredTriples(triples);
    } catch (err) {
      setFetchError(err.message);
    } finally {
      setFetchLoading(false);
    }
  };

  // Extract metadata from fetched HTML
  useEffect(() => {
    if (!fetchedHtml) return;
    const doc = new DOMParser().parseFromString(fetchedHtml, 'text/html');
    // --- JSON-LD ---
    const jsonld = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'))
      .map(el => {
        try { return JSON.parse(el.textContent); } catch { return null; }
      })
      .filter(Boolean);
    setJsonldBlocks(jsonld);
    // --- OpenGraph ---
    const og = Array.from(doc.querySelectorAll('meta[property^="og:"]'))
      .map(el => ({ property: el.getAttribute('property'), content: el.getAttribute('content') }));
    setOpenGraph(og);
    // --- Twitter ---
    const tw = Array.from(doc.querySelectorAll('meta[name^="twitter:"]'))
      .map(el => ({ name: el.getAttribute('name'), content: el.getAttribute('content') }));
    setTwitterMeta(tw);
    // --- Microdata ---
    try {
      const items = [];
      const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT);
      while (walker.nextNode()) {
        const el = walker.currentNode;
        if (el.hasAttribute && el.hasAttribute('itemscope')) {
          const item = {};
          item['@type'] = el.getAttribute('itemtype') || 'Thing';
          item['properties'] = {};
          Array.from(el.querySelectorAll('[itemprop]')).forEach(propEl => {
            const prop = propEl.getAttribute('itemprop');
            item['properties'][prop] = propEl.content || propEl.textContent;
          });
          items.push(item);
        }
      }
      setMicrodata(items);
    } catch { setMicrodata([]); }

    // --- RDFa (very basic) ---
    try {
      const rdfa = [];
      Array.from(doc.querySelectorAll('[typeof]')).forEach(el => {
        const type = el.getAttribute('typeof');
        const about = el.getAttribute('about') || null;
        const props = {};
        Array.from(el.querySelectorAll('[property]')).forEach(propEl => {
          const prop = propEl.getAttribute('property');
          props[prop] = propEl.content || propEl.textContent;
        });
        rdfa.push({ type, about, properties: props });
      });
      setRdfa(rdfa);
    } catch { setRdfa([]); }

    // --- POSH ---
    try {
      const poshResult = parsePOSH(doc, fetchUrl || url || window.location.href);
      setPosh(poshResult.triples || []);
    } catch { setPosh([]); }

    // --- Turtle/N3 via <link rel="alternate" type="text/turtle"> ---
    const turtleLink = doc.querySelector('link[rel="alternate"][type="text/turtle"]');
    if (turtleLink && turtleLink.href) {
      setTurtleUrl(turtleLink.href);
      (async () => {
        try {
          let url = turtleLink.href;
          if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            url = 'https://corsproxy.io/?' + encodeURIComponent(url);
          }
          const resp = await fetch(url);
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
          const turtleText = await resp.text();
          const lines = turtleText.split(/\r?\n/).filter(Boolean);
          // Use normalizeTriples to parse
          const triples = normalizeTriples('turtle', lines);
          setTurtleTriples(triples);
        } catch (e) {
          setTurtleTriples([]);
        }
      })();
    } else {
      setTurtleUrl("");
      setTurtleTriples([]);
    }
  }, [fetchedHtml]);

  return (
    <div>
      <h1>{t('Data View')}</h1>
      <TypeSelector selectedType={selectedType} onTypeChange={handleTypeChange} />
      <FilterInput value={filterText} onChange={handleFilterChange} t={t} />
      <ShareControls
        t={t}
        onCopyUrl={handleCopyUrl}
        onShareTwitter={handleShareTwitter}
        onBookmark={handleBookmark}
        copySuccess={copySuccess}
      />
      <PerfStats
        perfStats={{}}
        collapsed={{ perf: false }}
        toggle={() => {}}
        t={t}
      />
      <button onClick={handleImportExportToggle}>
        {importExportVisible ? t('Hide Import/Export') : t('Show Import/Export')}
      </button>
      {importExportVisible && (
        <RdfXmlImportExport
          url={url}
          rdfFormat={rdfFormat}
          onUrlChange={handleUrlChange}
          onRdfFormatChange={handleRdfFormatChange}
        />
      )}
      <RawDataView
        raw={{}}
        collapsed={{ code: false }}
        toggle={() => {}}
        t={t}
        codeCopyMsg={''}
        handleCopyCode={() => {}}
      />
      <TriplesTable
        table={table}
        columns={columns}
        t={t}
        isDark={isDark}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onDialog={openDialog}
        FilterInput={(props) => <FilterInput {...props} t={t} />}
      />
      {showingTripleDialog && (
        <TripleDialog
          open={showingTripleDialog}
          onClose={() => setShowingTripleDialog(false)}
          triple={tripleToEdit}
          onSave={(newTriple) => {
            setTriples(triples => {
              // If editing, replace the triple, else add new
              if (tripleToEdit) {
                const idx = triples.findIndex(t => t === tripleToEdit);
                if (idx !== -1) {
                  const updated = [...triples];
                  updated[idx] = newTriple;
                  localStorage.setItem('triples', JSON.stringify(updated));
                  setFilteredTriples(updated.filter(triple => triple.type === selectedType));
                  return updated;
                }
              }
              const updated = [...triples, newTriple];
              localStorage.setItem('triples', JSON.stringify(updated));
              setFilteredTriples(updated.filter(triple => triple.type === selectedType));
              return updated;
            });
            setShowingTripleDialog(false);
          }}
        />
      )}
      <RichPreviewCard data={{}} t={t} />
      <UrlInput
        fetchUrl={fetchUrl}
        setFetchUrl={setFetchUrl}
        fetchLoading={fetchLoading}
        fetchError={fetchError}
        onParse={handleFetchUrl}
        t={t}
      />
      {/* Display extracted metadata */}
      {/* Schema.org JSON-LD blocks */}
      {jsonldBlocks.filter(b => {
        const ctx = b && b['@context'];
        if (!ctx) return false;
        if (typeof ctx === 'string') return ctx.includes('schema.org');
        if (Array.isArray(ctx)) return ctx.some(c => typeof c === 'string' && c.includes('schema.org'));
        if (typeof ctx === 'object' && ctx['@vocab']) return String(ctx['@vocab']).includes('schema.org');
        return false;
      }).length > 0 && (
        <div style={{margin:'1em 0'}}>
          <h5>Schema.org</h5>
          {jsonldBlocks.filter(b => {
            const ctx = b && b['@context'];
            if (!ctx) return false;
            if (typeof ctx === 'string') return ctx.includes('schema.org');
            if (Array.isArray(ctx)) return ctx.some(c => typeof c === 'string' && c.includes('schema.org'));
            if (typeof ctx === 'object' && ctx['@vocab']) return String(ctx['@vocab']).includes('schema.org');
            return false;
          }).map((block, i) => (
            <pre key={i} style={{background:'#222',color:'#fff',padding:'0.7em',borderRadius:'6px',marginBottom:'0.5em'}}>{JSON.stringify(block, null, 2)}</pre>
          ))}
        </div>
      )}
      {/* Other JSON-LD blocks */}
      {jsonldBlocks.filter(b => {
        const ctx = b && b['@context'];
        if (!ctx) return true;
        if (typeof ctx === 'string') return !ctx.includes('schema.org');
        if (Array.isArray(ctx)) return !ctx.some(c => typeof c === 'string' && c.includes('schema.org'));
        if (typeof ctx === 'object' && ctx['@vocab']) return !String(ctx['@vocab']).includes('schema.org');
        return true;
      }).length > 0 && (
        <div style={{margin:'1em 0'}}>
          <h5>JSON-LD</h5>
          {jsonldBlocks.filter(b => {
            const ctx = b && b['@context'];
            if (!ctx) return true;
            if (typeof ctx === 'string') return !ctx.includes('schema.org');
            if (Array.isArray(ctx)) return !ctx.some(c => typeof c === 'string' && c.includes('schema.org'));
            if (typeof ctx === 'object' && ctx['@vocab']) return !String(ctx['@vocab']).includes('schema.org');
            return true;
          }).map((block, i) => (
            <pre key={i} style={{background:'#222',color:'#fff',padding:'0.7em',borderRadius:'6px',marginBottom:'0.5em'}}>{JSON.stringify(block, null, 2)}</pre>
          ))}
        </div>
      )}
      {openGraph.length > 0 && (
        <div style={{margin:'1em 0'}}>
          <h5>OpenGraph</h5>
          <pre style={{background:'#222',color:'#fff',padding:'0.7em',borderRadius:'6px'}}>{JSON.stringify(openGraph, null, 2)}</pre>
        </div>
      )}
      {twitterMeta.length > 0 && (
        <div style={{margin:'1em 0'}}>
          <h5>Twitter Cards</h5>
          <pre style={{background:'#222',color:'#fff',padding:'0.7em',borderRadius:'6px'}}>{JSON.stringify(twitterMeta, null, 2)}</pre>
        </div>
      )}
      {microdata.length > 0 && (
        <div style={{margin:'1em 0'}}>
          <h5>Microdata</h5>
          <pre style={{background:'#222',color:'#fff',padding:'0.7em',borderRadius:'6px'}}>{JSON.stringify(microdata, null, 2)}</pre>
        </div>
      )}
      {rdfa.length > 0 && (
        <div style={{margin:'1em 0'}}>
          <h5>RDFa</h5>
          <pre style={{background:'#222',color:'#fff',padding:'0.7em',borderRadius:'6px'}}>{JSON.stringify(rdfa, null, 2)}</pre>
        </div>
      )}
      {posh.length > 0 && (
        <div style={{margin:'1em 0'}}>
          <h5>POSH (Plain Old Semantic HTML)</h5>
          <pre style={{background:'#222',color:'#fff',padding:'0.7em',borderRadius:'6px'}}>{JSON.stringify(posh, null, 2)}</pre>
        </div>
      )}
      {turtleTriples.length > 0 && (
        <div style={{margin:'1em 0'}}>
          <h5>Turtle/N3 ({turtleUrl})</h5>
          <pre style={{background:'#222',color:'#fff',padding:'0.7em',borderRadius:'6px'}}>{JSON.stringify(turtleTriples, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
