// fallbackFetch: fallback loader for structured data types if content script messaging fails
async function fallbackFetch(typeKey) {
  // You can expand this with real fetches or local samples if needed
  // For now, return an empty object or a stub for known types
  switch (typeKey) {
    case 'jsonld':
      return {};
    case 'openGraph':
      return {};
    case 'twitter':
      return {};
    default:
      return {};
  }
}
import PerfStats from './data-view/PerfStats.jsx';
import ShareControls from './data-view/ShareControls.jsx';
import RawDataView from './RawDataView.jsx';
import TriplesTable from './TriplesTable.jsx';
import TypeSelector from './TypeSelector.jsx';
import TripleDialog from './TripleDialog.jsx';
import FilterInput from './data-view/FilterInput.jsx';
import BulkFileManager from './BulkFileManager.jsx';
import { triplesToGraph, DATA_TYPES, isIRI, normalizeTriples } from './utils/dataUtils.js';

// Utility: fetch and preview IRI content
async function fetchIRIContent(url) {
  try {
    const resp = await fetch(url, { headers: { Accept: 'application/ld+json, application/json, text/turtle, text/plain;q=0.8, */*;q=0.5' } });
    const contentType = resp.headers.get('content-type') || '';
    const text = await resp.text();
    return { contentType, text };
  } catch (e) {
    return { error: e.message };
  }
}

// --- Import/Export handlers (clean, correct block) ---
function exportJSONLD(obj, type) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = type === 'context' ? 'context.json' : type === 'frame' ? 'frame.json' : 'data.jsonld';
  document.body.appendChild(a);
  a.click();
  setTimeout(function() {
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  }, 100);
} // <-- Add this closing brace
// End of file

function importJSONLDFactory(setJsonldCompacted, setJsonldContext) {
  return function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(evt) {
      try {
        const data = JSON.parse(evt.target.result);
        if (data['@context'] || Array.isArray(data) || data['@graph']) {
          setJsonldCompacted(data);
          if (data['@context']) setJsonldContext(JSON.stringify(data['@context'], null, 2));
        } else {
          setJsonldContext(JSON.stringify(data, null, 2));
          setJsonldCompacted({ '@context': data });
        }
      } catch (err) {
        alert('Invalid JSON: ' + err);
      }
    };
    reader.readAsText(file);
  };
}

function importFrameFactory(setJsonldFramed, setJsonldFrame) {
  return function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(evt) {
      try {
        const data = JSON.parse(evt.target.result);
        setJsonldFramed(data);
        setJsonldFrame(JSON.stringify(data, null, 2));
      } catch (err) {
        alert('Invalid JSON: ' + err);
      }
    };
    reader.readAsText(file);
  };
}
import React, { useEffect, useState, useMemo } from 'react';
import Tabs from './Tabs.jsx';
import RdfXmlImportExport from './data-view/RdfXmlImportExport.jsx';
import UrlInput from './UrlInput.jsx';
import { FaRegCopy, FaTwitter, FaRegBookmark } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useSettings } from './SettingsContext.jsx';
import { useReactTable, getCoreRowModel, getFilteredRowModel } from '@tanstack/react-table';
import RichPreviewCard from './data-view/RichPreviewCard.jsx';
import { serializeRDFXML } from '../utils/parsers';
import { parseRDFXML } from '../utils/parsers';

// ...existing code...
export default function DataView() {
  // --- Settings accessor must be first ---
  const { get: getSetting } = useSettings ? useSettings() : { get: () => undefined };
  // --- URL fetch and parse state ---
  const [fetchUrl, setFetchUrl] = useState("");
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [tab, setTab] = useState('url');

  // Handler for fetching and parsing a URL
  const handleFetchUrl = async (e) => {
    e.preventDefault();
    if (!fetchUrl.trim()) return;
    setFetchLoading(true);
    setFetchError(null);
    try {
      let url = fetchUrl.trim();
      // Always use CORS proxy on localhost (React dev)
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        url = 'https://corsproxy.io/?' + encodeURIComponent(url);
      }
      const { contentType, text, error } = await fetchIRIContent(url);
      if (error) throw new Error(error);
      // Try to auto-detect type
      let type = null, data = null;
      if (/json(ld)?/i.test(contentType) || fetchUrl.endsWith('.jsonld')) {
        type = 'jsonld';
        data = JSON.parse(text);
      } else if (/csv/i.test(contentType) || fetchUrl.endsWith('.csv')) {
        type = 'csv';
        data = text;
      } else if (/turtle|n3/i.test(contentType) || fetchUrl.endsWith('.ttl')) {
        type = 'turtle';
        data = text.split(/\r?\n/).filter(Boolean);
      } else if (/rdf\+xml/i.test(contentType) || fetchUrl.endsWith('.rdf')) {
        type = 'rdfxml';
        data = text.split(/\r?\n/).filter(Boolean);
      } else {
        // fallback: try JSON
        try { data = JSON.parse(text); type = 'jsonld'; } catch { type = null; }
      }
      if (!type) throw new Error('Could not detect data type from URL');
      // Set as only detected type
      setDetectedTypes([{ key: type, label: type.toUpperCase(), data }]);
      setSelectedType(type);
      setRaw(data);
    } catch (err) {
      setFetchError(err.message);
    } finally {
      setFetchLoading(false);
    }
  };
  const { t } = useTranslation();
  // State for RDF/XML import results
  const [rdfxmlImportTriples, setRdfxmlImportTriples] = useState(null);
  const [rdfxmlImportErrors, setRdfxmlImportErrors] = useState([]);
  const [rdfxmlImportShowErrors, setRdfxmlImportShowErrors] = useState(false);
  // --- Bulk Extraction State/Handlers ---
  const [bulkFiles, setBulkFiles] = useState([]); // [{name, type, triples, error, raw}]
  const [bulkActiveIdx, setBulkActiveIdx] = useState(null);
  const [bulkDragOver, setBulkDragOver] = useState(false);
  const [bulkPreviewOpen, setBulkPreviewOpen] = useState(true);
  const handleBulkFiles = async files => {
    setBulkFiles([]);
    setBulkActiveIdx(null);
    const arr = Array.from(files);
    const results = await Promise.all(arr.map(async file => {
      try {
        const text = await file.text();
        let type = null, data = null, triples = [], error = null;
        if (/\.json(ld)?$/i.test(file.name)) {
          type = 'jsonld';
          data = JSON.parse(text);
        } else if (/\.csv$/i.test(file.name)) {
          type = 'csv';
          data = text;
        } else if (/\.ttl$/i.test(file.name)) {
          type = 'turtle';
          data = text.split(/\r?\n/).filter(Boolean);
        } else if (/\.rdf$/i.test(file.name)) {
          type = 'rdfxml';
          data = text.split(/\r?\n/).filter(Boolean);
        } else if (/\.posh$/i.test(file.name)) {
          type = 'posh';
          data = text;
        } else if (/\.txt$/i.test(file.name)) {
          if (text.includes('@prefix') || text.match(/\s[a-z]+:/i)) {
            type = 'turtle';
            data = text.split(/\r?\n/).filter(Boolean);
          } else if (text.includes(',')) {
            type = 'csv';
            data = text;
          }
        }
        if (!type) throw new Error('Unknown file type');
        triples = normalizeTriples(type, data, csvMapping, metaMapping);
        return { name: file.name, type, triples, error: null, raw: data };
      } catch (e) {
        return { name: file.name, type: null, triples: [], error: e.message, raw: null };
      }
    }));
    setBulkFiles(results);
    setBulkActiveIdx(results.length > 0 ? 0 : null);
  };
  const handleDrop = e => {
    e.preventDefault();
    setBulkDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleBulkFiles(e.dataTransfer.files);
    }
  };
  const handleDragOver = e => { e.preventDefault(); setBulkDragOver(true); };
  const handleDragLeave = e => { setBulkDragOver(false); };
  const handleFileInput = e => {
    if (e.target.files && e.target.files.length > 0) {
      handleBulkFiles(e.target.files);
    }
  };
  const exportBulkFile = (fmt, file) => {
    if (!file || !file.triples) return;
    if (fmt === 'csv') {
      const csv = file.triples.map(t => t.map(x => '"'+String(x).replace(/"/g,'""')+'"').join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      downloadBlob(blob, file.name.replace(/\.[^.]+$/, '') + '-triples.csv');
    } else if (fmt === 'json') {
      const blob = new Blob([JSON.stringify(file.triples, null, 2)], { type: 'application/json' });
      downloadBlob(blob, file.name.replace(/\.[^.]+$/, '') + '-triples.json');
    } else if (fmt === 'ttl') {
      const turtle = file.triples.map(([s,p,o]) => `${escapeTurtle(s)} ${escapeTurtle(p)} ${escapeTurtle(o)} .`).join('\n');
      const blob = new Blob([turtle], { type: 'text/turtle' });
      downloadBlob(blob, file.name.replace(/\.[^.]+$/, '') + '-triples.ttl');
    }
  };
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }
  // JSON-LD advanced state
  const [jsonldExpanded, setJsonldExpanded] = useState(null);
  const [jsonldCompacted, setJsonldCompacted] = useState(null);
  const [jsonldFramed, setJsonldFramed] = useState(null);
  const [jsonldFrame, setJsonldFrame] = useState('');
  const [jsonldValidation, setJsonldValidation] = useState(null);
  const COMMON_FRAMES = [
    { label: 'Default (empty)', value: '' },
    { label: 'Person', value: '{"@context":"https://schema.org/", "@type":"Person"}' },
    { label: 'Organization', value: '{"@context":"https://schema.org/", "@type":"Organization"}' },
    { label: 'CreativeWork', value: '{"@context":"https://schema.org/", "@type":"CreativeWork"}' },
    { label: 'Event', value: '{"@context":"https://schema.org/", "@type":"Event"}' },
    { label: 'Article', value: '{"@context":"https://schema.org/", "@type":"Article"}' },
    { label: 'Product', value: '{"@context":"https://schema.org/", "@type":"Product"}' },
    { label: 'Place', value: '{"@context":"https://schema.org/", "@type":"Place"}' },
    { label: 'Custom', value: 'custom' }
  ];
  const [jsonldContext, setJsonldContext] = useState('');
  const [showContextEditor, setShowContextEditor] = useState(false);
  // Multi-type detection: store all detected types and their data
  const [detectedTypes, setDetectedTypes] = useState([]); // [{key, label, data}]
  const [selectedType, setSelectedType] = useState(null);
  const [raw, setRaw] = useState(null);
  const [graph, setGraph] = useState({ nodes: [], edges: [] });
  const [view, setView] = useState('graph');
  // Collapsible sections
  const [collapsed, setCollapsed] = useState({ graph: false, table: false, raw: false, sparql: false, code: false });
  const [showLocalSparql, setShowLocalSparql] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogTriple, setDialogTriple] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- Performance stats state ---
  const [perfStats, setPerfStats] = useState({}); // { [type]: { fetchMs, parseMs, normalizeMs, totalMs } }

  // Multi-type detection effect with timing
  useEffect(() => {
    setLoading(true);
    setError(null);
    const foundTypes = [];
    let pending = DATA_TYPES.length;
    const stats = {};
    const finish = () => {
      pending--;
      if (pending === 0) {
        setDetectedTypes(foundTypes);
        setPerfStats(stats);
        // Default to first detected type
        if (foundTypes.length > 0) {
          setSelectedType(foundTypes[0].key);
          setRaw(foundTypes[0].data);
        } else {
          setSelectedType(null);
          setRaw(null);
        }
        setLoading(false);
      }
    };
    DATA_TYPES.forEach(type => {
      const t0 = performance.now();
      const handleData = (data) => {
        const t1 = performance.now();
        let triples = null, t2 = null;
        try {
          triples = normalizeTriples(type.key, data, csvMapping, metaMapping);
          t2 = performance.now();
        } catch { t2 = performance.now(); }
        if (data && !(Array.isArray(data) && data.length === 0) && !(typeof data === 'object' && Object.keys(data).length === 0)) {
          foundTypes.push({ key: type.key, label: type.label, data });
        }
        stats[type.key] = {
          fetchMs: t1 - t0,
          normalizeMs: t2 - t1,
          totalMs: t2 - t0
        };
        finish();
      };
      const handleError = () => { stats[type.key] = { fetchMs: 0, normalizeMs: 0, totalMs: 0 }; finish(); };
      try {
        if (type.key === 'posh') {
          handleData(document);
        } else if (typeof window !== 'undefined' && window.chrome && chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage(type.msg, (response) => {
            let data = response && response[type.key];
            if (Array.isArray(data)) data = data[0];
            if (data) {
              handleData(data);
            } else {
              fallbackFetch(type.key).then(sample => handleData(sample)).catch(handleError);
            }
          });
        } else {
          fallbackFetch(type.key).then(sample => handleData(sample)).catch(handleError);
        }
      } catch {
        handleError();
      }
    });
  }, []);


  // --- react-table setup ---
  // getSetting already declared at top; do not redeclare

  // When selectedType changes, update raw and graph
  // Get mappings from settings
  const csvMapping = useMemo(() => {
    try {
      return JSON.parse(getSetting('ext.osds.mapping.csv') || '{}');
    } catch {
      return {};
    }
  }, [getSetting('ext.osds.mapping.csv')]);

  const metaMapping = useMemo(() => {
    try {
      return JSON.parse(getSetting('ext.osds.mapping.meta') || '{}');
    } catch {
      return {};
    }
  }, [getSetting('ext.osds.mapping.meta')]);

  useEffect(() => {
    if (!selectedType || !raw) return;
    const triples = normalizeTriples(selectedType, raw, csvMapping, metaMapping);
    setGraph(prev => {
      const newGraph = triplesToGraph(triples);
      if (JSON.stringify(prev) !== JSON.stringify(newGraph)) return newGraph;
      return prev;
    });
  }, [selectedType, raw, csvMapping, metaMapping]);

  // Separate effect for JSON-LD advanced state
  useEffect(() => {
    let isMounted = true;
    if (selectedType === 'jsonld' && raw) {
      // Only reset jsonldFramed if not already null
      if (jsonldFramed !== null) setJsonldFramed(null);
      (async () => {
        try {
          const expanded = await jsonld.expand(raw);
          if (isMounted) setJsonldExpanded(prev => JSON.stringify(prev) !== JSON.stringify(expanded) ? expanded : prev);
        } catch (e) { if (isMounted) setJsonldExpanded(null); }
        try {
          const compacted = await jsonld.compact(raw, raw['@context'] || {});
          if (isMounted) setJsonldCompacted(prev => JSON.stringify(prev) !== JSON.stringify(compacted) ? compacted : prev);
        } catch (e) { if (isMounted) setJsonldCompacted(null); }
        try {
          await jsonld.expand(raw);
          if (isMounted) setJsonldValidation({ valid: true, warnings: [] });
        } catch (e) {
          if (isMounted) setJsonldValidation({ valid: false, error: e.message });
        }
      })();
    }
    return () => { isMounted = false; };
  }, [selectedType, raw]);

  const triples = useMemo(() => normalizeTriples(selectedType, raw, csvMapping, metaMapping), [selectedType, raw, csvMapping, metaMapping]);
  useEffect(() => { setTableData(triples); }, [triples]);
  const typeMeta = DATA_TYPES.find(t => t.key === selectedType);

  // --- JSON-LD Compaction with interactive context ---
  const handleCompact = async () => {
    if (raw && selectedType === 'jsonld') {
      try {
        let ctx = jsonldContext;
        if (!ctx) ctx = raw['@context'] || {};
        else ctx = JSON.parse(ctx);
        const compacted = await jsonld.compact(raw, ctx);
        setJsonldCompacted(compacted);
      } catch (e) {
        setJsonldCompacted({ error: e.message });
      }
    }
  };
  const handleFrame = async () => {
    if (raw && selectedType === 'jsonld' && jsonldFrame) {
      try {
        const frameObj = JSON.parse(jsonldFrame);
        const framed = await jsonld.frame(raw, frameObj);
        setJsonldFramed(framed);
      } catch (e) {
        setJsonldFramed({ error: e.message });
      }
    }
  };

  // --- Raw API/Code View helpers ---
  const [codeCopyMsg, setCodeCopyMsg] = useState('');
  const handleCopyCode = async (type) => {
    let text = '';
    if (type === 'json') text = JSON.stringify(raw, null, 2);
    else if (type === 'triples') text = triples.map(t => t.join('\t')).join('\n');
    else if (type === 'turtle') text = triples.map(([s,p,o]) => `${escapeTurtle(s)} ${escapeTurtle(p)} ${escapeTurtle(o)} .`).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCodeCopyMsg('Copied!');
      setTimeout(() => setCodeCopyMsg(''), 1200);
    } catch {
      setCodeCopyMsg('Copy failed');
      setTimeout(() => setCodeCopyMsg(''), 1200);
    }
  };
  // Copy/export helpers
  const copyTriples = () => {
    try {
      navigator.clipboard.writeText(triples.map(t => t.join('\t')).join('\n'));
    } catch {}
  };
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(raw, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${selectedType}-data.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  };
  const exportCSV = () => {
    const csv = triples.map(t => t.map(x => '"'+String(x).replace(/"/g,'""')+'"').join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${selectedType}-triples.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  };

  // Turtle export
  function escapeTurtle(str) {
    if (/^https?:/.test(str)) return `<${str}>`;
    if (/^_:.+/.test(str)) return str; // blank node
    if (/^\".*\"$/.test(str)) return str; // already quoted
    // Literal
    return '"' + String(str).replace(/"/g, '\\"') + '"';
  }
  const exportTurtle = () => {
    const turtle = triples.map(([s,p,o]) => `${escapeTurtle(s)} ${escapeTurtle(p)} ${escapeTurtle(o)} .`).join('\n');
    const blob = new Blob([turtle], { type: 'text/turtle' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${selectedType}-triples.ttl`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  };

  // Modern RDF/XML export using serializeRDFXML
  const exportRDFXML = async () => {
    const tripleObjs = triples.map(([s, p, o]) => ({ s, p, o }));
    const { rdfxml, errors } = await serializeRDFXML(tripleObjs, window.location.href);
    if (errors && errors.length > 0) {
      alert('RDF/XML export error: ' + errors.map(e => e.message).join('\n'));
      return;
    }
    const blob = new Blob([rdfxml], { type: 'application/rdf+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${selectedType}-triples.rdf`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  };

  // RDF/XML import handler with advanced error handling
  const importRDFXML = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async function(evt) {
      const text = evt.target.result;
      const { triples, errors } = await parseRDFXML(text, window.location.href);
      setRdfxmlImportTriples(triples);
      setRdfxmlImportErrors(errors || []);
      setRdfxmlImportShowErrors(errors && errors.length > 0);
    };
    reader.readAsText(file);
  };

  const clearRdfxmlImport = () => {
    setRdfxmlImportTriples(null);
    setRdfxmlImportErrors([]);
    setRdfxmlImportShowErrors(false);
  };

  // Merge imported triples into main view
  const addImportedTriplesToMain = () => {
    if (!rdfxmlImportTriples) return;
    let newTriples = triples;
    if (typeof rdfxmlImportTriples === 'string') {
      // If string, try to parse as N-Triples
      newTriples = [...triples, ...rdfxmlImportTriples.split(/\n+/).map(line => {
        const m = line.match(/^(\S+)\s+(\S+)\s+(.+?)\s*\.?$/);
        return m ? [m[1], m[2], m[3]] : null;
      }).filter(Boolean)];
    } else if (Array.isArray(rdfxmlImportTriples)) {
      newTriples = [...triples, ...rdfxmlImportTriples];
    }
    setTableData(newTriples);
    clearRdfxmlImport();
  };
  // Dark mode detection
  const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  // Collapsible section toggle
  const toggle = key => setCollapsed(c => ({ ...c, [key]: !c[key] }));

  // --- react-table setup ---
  // getSetting already declared at top; do not redeclare
  const [iriPreview, setIriPreview] = useState(null); // { iri, loading, contentType, text, error, triedProxy }
  const handleIriClick = async (iri, useProxy = false) => {
    setIriPreview({ iri, loading: true, triedProxy: useProxy });
    let url = iri;
    let proxyEnabled = false;
    let proxyUrl = '';
    if (getSetting) {
      proxyEnabled = getSetting('ext.osds.corsproxy.enabled') === '1';
      proxyUrl = getSetting('ext.osds.corsproxy.url') || 'https://corsproxy.io/?';
    }
    if (useProxy || (proxyEnabled && !useProxy)) {
      if (proxyUrl.includes('{url}')) url = proxyUrl.replace('{url}', encodeURIComponent(iri));
      else url = proxyUrl + encodeURIComponent(iri);
    }
    const result = await fetchIRIContent(url);
    setIriPreview({ iri, ...result, loading: false, triedProxy: useProxy });
  };
  const closeIriPreview = () => setIriPreview(null);

  // Graph node/edge click handler
  const onGraphNodeClick = (event, node) => {
    if (isIRI(node.id)) handleIriClick(node.id);
  };
  const onGraphEdgeClick = (event, edge) => {
    if (isIRI(edge.source)) handleIriClick(edge.source);
    else if (isIRI(edge.target)) handleIriClick(edge.target);
  };


  // --- TanStack Table setup ---
  const columns = useMemo(() => [
    {
      header: t('subject', 'Subject'),
      accessorKey: '0',
      cell: info => isIRI(info.getValue())
        ? <a href="#" onClick={e => { e.preventDefault(); handleIriClick(info.getValue()); }} style={{ color: '#0074d9', textDecoration: 'underline' }}>{info.getValue()}</a>
        : info.getValue(),
      filterFn: 'includesString',
    },
    {
      header: t('predicate', 'Predicate'),
      accessorKey: '1',
      cell: info => isIRI(info.getValue())
        ? <a href="#" onClick={e => { e.preventDefault(); handleIriClick(info.getValue()); }} style={{ color: '#0074d9', textDecoration: 'underline' }}>{info.getValue()}</a>
        : info.getValue(),
      filterFn: 'includesString',
    },
    {
      header: t('object', 'Object'),
      accessorKey: '2',
      cell: info => isIRI(info.getValue())
        ? <a href="#" onClick={e => { e.preventDefault(); handleIriClick(info.getValue()); }} style={{ color: '#0074d9', textDecoration: 'underline' }}>{info.getValue()}</a>
        : info.getValue(),
      filterFn: 'includesString',
    },
  ], [t]);

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {},
  });

  // --- Drag and drop handlers ---
  const onDragEnd = result => {
    if (!result.destination) return;
    const reordered = Array.from(tableData);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setTableData(reordered);
  };

  // --- TripleDialog state/handlers ---
  const [editTriple, setEditTriple] = useState(["", "", ""]);
  const [editIndex, setEditIndex] = useState(null);
  const openDialog = (triple, idx) => {
    setDialogTriple(triple);
    setEditTriple([...triple]);
    setEditIndex(idx);
    setShowDialog(true);
  };
  const closeDialog = () => {
    setShowDialog(false);
    setDialogTriple(null);
    setEditIndex(null);
  };
  const handleEditChange = (i, value) => {
    setEditTriple(t => t.map((v, idx) => idx === i ? value : v));
  };
  const handleSave = () => {
    if (editIndex !== null) {
      setTableData(data => data.map((row, idx) => idx === editIndex ? [...editTriple] : row));
    }
    closeDialog();
  };
  const handleDelete = () => {
    if (editIndex !== null) {
      setTableData(data => data.filter((_, idx) => idx !== editIndex));
    }
    closeDialog();
  };

  // --- Table rendering with TanStack Table ---
  // ...existing code...

  // Helper: file type icon
  function getFileIcon(type) {
    switch(type) {
      case 'jsonld': return '🟦';
      case 'csv': return '🟨';
      case 'turtle': return '🟩';
      case 'rdfxml': return '🟪';
      case 'posh': return '🟧';
      default: return '📄';
    }
  }
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }

  // --- UI rendering ---
  // --- Rich Preview: show for JSON-LD, Open Graph, or Twitter Card ---
  let previewData = null;
  if (selectedType && raw && typeof raw === 'object') {
    // Try JSON-LD, Open Graph, Twitter Card
    if (selectedType === 'jsonld' || selectedType === 'json') previewData = raw;
    // If microdata, try to find Open Graph/Twitter Card in properties
    if (selectedType === 'microdata' && raw && raw.items && Array.isArray(raw.items)) {
      for (const item of raw.items) {
        if (item.properties) {
          const og = Object.fromEntries(Object.entries(item.properties).filter(([k]) => k.startsWith('og:')));
          const tw = Object.fromEntries(Object.entries(item.properties).filter(([k]) => k.startsWith('twitter:')));
          if (Object.keys(og).length > 0) previewData = og;
          else if (Object.keys(tw).length > 0) previewData = tw;
        }
      }
    }
  }

  // --- Social Sharing & Bookmarking ---
  const [shareToast, setShareToast] = useState('');
  const handleShareCopy = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      setShareToast(t('linkCopied', 'Link copied!'));
      setTimeout(() => setShareToast(''), 1800);
    } catch {
      setShareToast(t('copyFailed', 'Copy failed'));
      setTimeout(() => setShareToast(''), 1800);
    }
  };
  const handleShareTwitter = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(t('checkThisStructuredData', 'Check out this structured data!'));
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`,'_blank','noopener');
    setShareToast(t('sharedToTwitter', 'Opened Twitter share'));
    setTimeout(() => setShareToast(''), 1800);
  };
  const handleBookmark = async () => {
    // Build Semantic Bookmark object (JSON-LD)
    const now = new Date().toISOString();
    // Try to get favicon
    let favicon = '';
    try {
      const link = document.querySelector("link[rel~='icon']") || document.querySelector("link[rel='shortcut icon']");
      if (link && link.href) {
        favicon = link.href;
      } else {
        // Default to /favicon.ico
        favicon = window.location.origin + '/favicon.ico';
      }
    } catch {}
    const bookmark = {
      "@context": "http://schema.org",
      "@type": "Bookmark",
      url: window.location.href,
      name: document.title || window.location.href,
      dateCreated: now,
      creator: {
        "@type": "Person",
        name: (window.osdsUser && window.osdsUser.name) || "Anonymous"
      },
      image: favicon
      // Optionally add: description, keywords, ratingValue, etc.
    };
    // Save to chrome.storage.local (or fallback to localStorage)
    function onSuccess() {
      setShareToast(t('bookmarked', 'Bookmarked!'));
      setTimeout(() => setShareToast(''), 1800);
    }
    try {
      if (window.chrome && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get({ semanticBookmarks: [] }, result => {
          const bookmarks = Array.isArray(result.semanticBookmarks) ? result.semanticBookmarks : [];
          bookmarks.push(bookmark);
          chrome.storage.local.set({ semanticBookmarks: bookmarks }, onSuccess);
        });
      } else {
        // Fallback: localStorage
        const raw = localStorage.getItem('semanticBookmarks');
        const bookmarks = raw ? JSON.parse(raw) : [];
        bookmarks.push(bookmark);
        localStorage.setItem('semanticBookmarks', JSON.stringify(bookmarks));
        onSuccess();
      }
    } catch (e) {
      setShareToast(t('bookmarkFailed', 'Bookmark failed'));
      setTimeout(() => setShareToast(''), 1800);
    }
  };

  return (
    <div className="osds-dataview" role="main" aria-label="Structured Data View">
      <Tabs
        tabs={[{ key: 'url', label: t('urlParser', 'URL Parser') }, { key: 'data', label: t('dataView', 'Data View') }]}
        activeKey={tab}
        onSelect={setTab}
      />
      {tab === 'url' && (
        <div className="p-3">
          <UrlInput
            fetchUrl={fetchUrl}
            setFetchUrl={setFetchUrl}
            fetchLoading={fetchLoading}
            fetchError={fetchError}
            onParse={handleFetchUrl}
            t={t}
          />
        </div>
      )}
      {tab === 'data' && (
        <>
          <BulkFileManager
            bulkFiles={bulkFiles}
            bulkActiveIdx={bulkActiveIdx}
            bulkDragOver={bulkDragOver}
            bulkPreviewOpen={bulkPreviewOpen}
            handleBulkFiles={handleBulkFiles}
            handleDrop={handleDrop}
            handleDragOver={handleDragOver}
            handleDragLeave={handleDragLeave}
            handleFileInput={handleFileInput}
            setBulkActiveIdx={setBulkActiveIdx}
            setBulkPreviewOpen={setBulkPreviewOpen}
            exportBulkFile={exportBulkFile}
            t={t}
          />
          <TypeSelector
            detectedTypes={detectedTypes}
            selectedType={selectedType}
            setSelectedType={setSelectedType}
            t={t}
          />
          <TriplesTable
            table={table}
            columns={columns}
            t={t}
            isDark={isDark}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onDialog={openDialog}
            FilterInput={FilterInput}
          />
          <ShareControls
            t={t}
            handleShareCopy={handleShareCopy}
            handleShareTwitter={handleShareTwitter}
            handleBookmark={handleBookmark}
            shareToast={shareToast}
          />
          <RichPreviewCard data={previewData} />
          <RdfXmlImportExport
            t={t}
            importRDFXML={importRDFXML}
            clearRdfxmlImport={clearRdfxmlImport}
            rdfxmlImportTriples={rdfxmlImportTriples}
            rdfxmlImportErrors={rdfxmlImportErrors}
            rdfxmlImportShowErrors={rdfxmlImportShowErrors}
            setRdfxmlImportShowErrors={setRdfxmlImportShowErrors}
            addImportedTriplesToMain={addImportedTriplesToMain}
          />
          <PerfStats
            perfStats={perfStats}
            collapsed={collapsed}
            toggle={toggle}
            t={t}
          />
          <RawDataView
            raw={raw}
            collapsed={collapsed}
            toggle={toggle}
            t={t}
            codeCopyMsg={codeCopyMsg}
            handleCopyCode={handleCopyCode}
          />
          <TripleDialog
            show={showDialog}
            triple={dialogTriple}
            editTriple={editTriple}
            onEditChange={handleEditChange}
            onSave={handleSave}
            onDelete={handleDelete}
            onClose={closeDialog}
            t={t}
          />
        </>
      )}
    </div>
  );
}
