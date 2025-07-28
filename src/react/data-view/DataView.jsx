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

  useEffect(() => {
    // TODO: Load initial data here or via props
  }, []);

  const handleTypeChange = (type) => {
    setSelectedType(type);
    // TODO: Filter triples based on selected type
  };

  const handleFilterChange = (text) => {
    setFilterText(text);
    // TODO: Implement filtering logic
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
    // TODO: Implement bookmark logic
  };

  const handleRowClick = (row) => {
    // TODO: Handle row click, possibly open dialog to edit triple
  };

  // Add handleEdit, handleDelete, openDialog stubs to fix ReferenceError
  const handleEdit = (rowIdx) => {
    // TODO: Implement edit logic
    setTripleToEdit(triples[rowIdx]);
    setShowingTripleDialog(true);
  };
  const handleDelete = (rowIdx) => {
    // TODO: Implement delete logic
    setTriples(triples => triples.filter((_, idx) => idx !== rowIdx));
  };
  const openDialog = (rowIdx) => {
    // TODO: Implement dialog logic
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
      // TODO: Call metadata extraction here
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
            // TODO: Handle triple save
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
      {jsonldBlocks.length > 0 && (
        <div style={{margin:'1em 0'}}>
          <h5>JSON-LD</h5>
          {jsonldBlocks.map((block, i) => (
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
