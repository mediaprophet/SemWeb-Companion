// Utility: Convert triples to a graph structure for visualization
function triplesToGraph(triples) {
  const nodes = [];
  const edges = [];
  const nodeSet = new Set();
  triples.forEach(({ s, p, o }, idx) => {
    if (!nodeSet.has(s)) {
      nodes.push({ id: s, label: s });
      nodeSet.add(s);
    }
    if (!nodeSet.has(o)) {
      nodes.push({ id: o, label: o });
      nodeSet.add(o);
    }
    edges.push({ id: `e${idx}`, source: s, target: o, label: p });
  });
  return { nodes, edges };
}
// Supported data types for detection and normalization
const DATA_TYPES = [
  { key: 'jsonld', label: 'JSON-LD' },
  { key: 'csv', label: 'CSV' },
  { key: 'turtle', label: 'Turtle/N3' },
  { key: 'rdfxml', label: 'RDF/XML' },
  { key: 'posh', label: 'POSH' },
  // Add more types as needed
];

// Utility: check if a string is an IRI
function isIRI(str) {
  return typeof str === 'string' && /^https?:\/\//.test(str);
}

// --- Triple normalization utility ---
// Returns array of { s, p, o, [lang], [datatype] }
function normalizeTriples(type, data, csvMapping, metaMapping) {
  // JSON-LD
  if (type === 'jsonld' && data) {
    // Try to flatten @graph or array
    let arr = [];
    if (Array.isArray(data)) arr = data;
    else if (data['@graph']) arr = data['@graph'];
    else arr = [data];
    // Extract triples
    const triples = [];
    arr.forEach(item => {
      const subj = item['@id'] || '_:b0';
      Object.entries(item).forEach(([p, v]) => {
        if (p === '@id' || p === '@type' || p === '@context') return;
        if (Array.isArray(v)) {
          v.forEach(obj => {
            if (typeof obj === 'object' && obj['@value'] !== undefined) {
              triples.push({ s: subj, p, o: obj['@value'], lang: obj['@language'], datatype: obj['@type'] });
            } else if (typeof obj === 'object' && obj['@id']) {
              triples.push({ s: subj, p, o: obj['@id'] });
            } else {
              triples.push({ s: subj, p, o: obj });
            }
          });
        } else if (typeof v === 'object' && v['@value'] !== undefined) {
          triples.push({ s: subj, p, o: v['@value'], lang: v['@language'], datatype: v['@type'] });
        } else if (typeof v === 'object' && v['@id']) {
          triples.push({ s: subj, p, o: v['@id'] });
        } else {
          triples.push({ s: subj, p, o: v });
        }
      });
    });
    return triples;
  }
  // CSV
  if (type === 'csv' && typeof data === 'string') {
    // Simple CSV to triples: each row is a subject, columns are predicates
    const lines = data.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return [];
    const headers = lines[0].split(',');
    return lines.slice(1).map((row, i) => {
      const values = row.split(',');
      return headers.map((h, j) => ({
        s: `_:row${i}`,
        p: h.trim(),
        o: values[j] ? values[j].trim() : ''
      }));
    }).flat();
  }
  // Turtle/N3
  if (type === 'turtle' && Array.isArray(data)) {
    // Each line is a triple: subj pred obj .
    return data
      .map(line => {
        const m = line.match(/^(\S+)\s+(\S+)\s+(.+)\s*\.$/);
        if (!m) return null;
        return { s: m[1], p: m[2], o: m[3].replace(/\"/g, '"') };
      })
      .filter(Boolean);
  }
  // RDF/XML (not parsed here, handled elsewhere)
  if (type === 'rdfxml' && Array.isArray(data)) {
    // Not supported in this utility; handled by parseRDFXML elsewhere
    return [];
  }
  // Fallback: return empty array
  return [];
}

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
import { useTranslation } from 'react-i18next';
import { useSettings } from './SettingsContext.jsx';
import { useReactTable, getCoreRowModel, getFilteredRowModel } from '@tanstack/react-table';
import RichPreview from './RichPreview';
import { serializeRDFXML } from '../utils/parsers';
import { parseRDFXML } from '../utils/parsers';

// ...existing code...
export default function DataView() {
  const { t } = useTranslation();
  // State for RDF/XML import results
  const [rdfxmlImportTriples, setRdfxmlImportTriples] = useState(null);
  const [rdfxmlImportErrors, setRdfxmlImportErrors] = useState([]);
  const [rdfxmlImportShowErrors, setRdfxmlImportShowErrors] = useState(false);
  // --- Bulk Extraction State ---
  const [bulkFiles, setBulkFiles] = useState([]); // [{name, type, triples, error, raw}]
  const [bulkActiveIdx, setBulkActiveIdx] = useState(null);
  const [bulkDragOver, setBulkDragOver] = useState(false);
  const [bulkPreviewOpen, setBulkPreviewOpen] = useState(true);
  // Bulk extraction handler
  const handleBulkFiles = async files => {
    setBulkFiles([]);
    setBulkActiveIdx(null);
    const arr = Array.from(files);
    const results = await Promise.all(arr.map(async file => {
      try {
        const text = await file.text();
        // Try to auto-detect type
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
          data = text; // Not a Document, but fallback
        } else if (/\.txt$/i.test(file.name)) {
          // Try to guess: CSV or Turtle
          if (text.includes('@prefix') || text.match(/\s[a-z]+:/i)) {
            type = 'turtle';
            data = text.split(/\r?\n/).filter(Boolean);
          } else if (text.includes(',')) {
            type = 'csv';
            data = text;
          }
        }
        if (!type) throw new Error('Unknown file type');
        // Parse triples
        triples = normalizeTriples(type, data, csvMapping, metaMapping);
        return { name: file.name, type, triples, error: null, raw: data };
      } catch (e) {
        return { name: file.name, type: null, triples: [], error: e.message, raw: null };
      }
    }));
    setBulkFiles(results);
    setBulkActiveIdx(results.length > 0 ? 0 : null);
  };
  // Drag-and-drop handlers
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

  // When selectedType changes, update raw and graph
  // Get mappings from settings
  // getSetting already declared above; do not redeclare
  const csvMapping = (() => { try { return JSON.parse(getSetting('ext.osds.mapping.csv') || '{}'); } catch { return {}; } })();
  const metaMapping = (() => { try { return JSON.parse(getSetting('ext.osds.mapping.meta') || '{}'); } catch { return {}; } })();

  useEffect(() => {
    if (!selectedType) return;
    const found = detectedTypes.find(t => t.key === selectedType);
    if (found) {
      setRaw(found.data);
      const triples = normalizeTriples(selectedType, found.data, csvMapping, metaMapping);
      setGraph(triplesToGraph(triples));
      // JSON-LD advanced
      if (selectedType === 'jsonld') {
        (async () => {
          try {
            setJsonldExpanded(await jsonld.expand(found.data));
          } catch (e) { setJsonldExpanded(null); }
          try {
            setJsonldCompacted(await jsonld.compact(found.data, found.data['@context'] || {}));
          } catch (e) { setJsonldCompacted(null); }
          setJsonldFramed(null);
          try {
            await jsonld.expand(found.data);
            setJsonldValidation({ valid: true, warnings: [] });
          } catch (e) {
            setJsonldValidation({ valid: false, error: e.message });
          }
        })();
      }
    }
  }, [selectedType, detectedTypes, csvMapping, metaMapping]);

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
  const { get: getSetting } = useSettings ? useSettings() : { get: () => undefined };
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

  // --- Dialog handlers ---
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
  // Filtering UI for each column
  function FilterInput({ column }) {
    const columnFilterValue = column.getFilterValue() || '';
    return (
      <input
        value={columnFilterValue}
        onChange={e => column.setFilterValue(e.target.value)}
        placeholder={t('filter', 'Filter...')}
        style={{ width: '100%' }}
      />
    );
  }

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
  function exportBulkFile(fmt, file) {
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
  const handleBookmark = () => {
    // Placeholder: implement actual bookmarking logic (e.g., save to storage)
    setShareToast(t('bookmarked', 'Bookmarked!'));
    setTimeout(() => setShareToast(''), 1800);
  };

  return (
    <div className="osds-dataview" role="main" aria-label="Structured Data View">
      {/* Social Sharing & Bookmarking */}
      <div style={{display:'flex',gap:12,margin:'1em 0',alignItems:'center'}}>
        <button className="osds-animated-btn osds-icon-anim" title={t('copyLink', 'Copy Link')} aria-label={t('copyLink', 'Copy Link')} onClick={handleShareCopy}>
          <span role="img" aria-label="Copy">🔗</span>
        </button>
        <button className="osds-animated-btn osds-icon-anim" title={t('shareOnTwitter', 'Share on Twitter')} aria-label={t('shareOnTwitter', 'Share on Twitter')} onClick={handleShareTwitter}>
          <span role="img" aria-label="Twitter">🐦</span>
        </button>
        <button className="osds-animated-btn osds-icon-anim" title={t('bookmark', 'Bookmark')} aria-label={t('bookmark', 'Bookmark')} onClick={handleBookmark}>
          <span role="img" aria-label="Bookmark">🔖</span>
        </button>
        {shareToast && <div className="osds-toast" aria-live="polite">{shareToast}</div>}
      </div>
      {/* Rich Preview Card */}
      {previewData && <div style={{margin:'1.5em 0'}}><RichPreview data={previewData} /></div>}
      {/* RDF/XML Import UI */}
      <div style={{marginBottom: '1em', background: '#f8f8ff', padding: '1em', borderRadius: 6, border: '1px solid #ccc'}}>
        <label htmlFor="rdfxml-import" style={{fontWeight:'bold',marginRight:8}}>{t('importRdfXml', 'Import RDF/XML')}:</label>
        <input id="rdfxml-import" type="file" accept=".rdf,.xml,application/rdf+xml" onChange={importRDFXML} />
        <button onClick={clearRdfxmlImport} style={{marginLeft:8}} disabled={!rdfxmlImportTriples && rdfxmlImportErrors.length === 0}>{t('clear', 'Clear')}</button>
        {rdfxmlImportErrors.length > 0 && (
          <div style={{color:'red',marginTop:8}}>
            <b>{t('importErrors', 'Import Errors')}:</b>
            <button onClick={() => setRdfxmlImportShowErrors(v => !v)} style={{marginLeft:8}}>{rdfxmlImportShowErrors ? t('hideDetails', 'Hide Details') : t('showDetails', 'Show Details')}</button>
            {rdfxmlImportShowErrors && (
              <ul style={{margin:0,paddingLeft:18}}>
                {rdfxmlImportErrors.map((err,i) => <li key={i}>{err.message}<br/>{err.context && err.context.error ? <span style={{fontSize:'0.9em',color:'#a00'}}>{err.context.error}</span> : null}</li>)}
              </ul>
            )}
          </div>
        )}
        {rdfxmlImportTriples && (
          <div style={{marginTop:8}}>
            <b>{t('importedTriples', 'Imported Triples')}:</b>
            <pre style={{background:'#eee',padding:'0.5em',borderRadius:4,maxHeight:200,overflow:'auto'}}>
              {typeof rdfxmlImportTriples === 'string' ? rdfxmlImportTriples : JSON.stringify(rdfxmlImportTriples, null, 2)}
            </pre>
            <button onClick={addImportedTriplesToMain} style={{marginTop:8}}>{t('addToMainView', 'Add Imported Triples to Main View')}</button>
          </div>
        )}
      </div>

      {/* Performance Stats Section */}
      <div className="osds-section" role="region" aria-labelledby="perf-heading">
        <div
          className="osds-section-header"
          id="perf-heading"
          tabIndex={0}
          role="button"
          aria-expanded={!collapsed.perf}
          aria-controls="perf-section-body"
          onClick={() => toggle('perf')}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle('perf'); } }}
          style={{cursor:'pointer',display:'flex',alignItems:'center'}}
        >
          <span style={{fontWeight:'bold',fontSize:'1.1em'}}>{t('performanceStats', 'Performance Stats')}</span>
          <span style={{marginLeft:'auto'}}>{collapsed.perf ? '▶' : '▼'}</span>
        </div>
        {!collapsed.perf && (
          <div className="osds-section-body" id="perf-section-body" style={{background:'#222',color:'#eee',padding:'1em',borderRadius:'6px',marginTop:'0.5em'}}>
            <table style={{width:'100%',color:'#fff',background:'none',borderCollapse:'collapse',fontSize:'0.98em'}}>
              <thead>
                <tr style={{borderBottom:'1px solid #444'}}>
                  <th style={{textAlign:'left',padding:'0.3em 0.7em'}}>{t('type', 'Type')}</th>
                  <th style={{textAlign:'right',padding:'0.3em 0.7em'}}>{t('fetchParseMs', 'Fetch+Parse (ms)')}</th>
                  <th style={{textAlign:'right',padding:'0.3em 0.7em'}}>{t('normalizeMs', 'Normalize (ms)')}</th>
                  <th style={{textAlign:'right',padding:'0.3em 0.7em'}}>{t('totalMs', 'Total (ms)')}</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(perfStats).map(([key, stat]) => (
                  <tr key={key} style={{borderBottom:'1px solid #333'}}>
                    <td style={{padding:'0.3em 0.7em'}}>{key}</td>
                    <td style={{textAlign:'right',padding:'0.3em 0.7em'}}>{stat.fetchMs.toFixed(1)}</td>
                    <td style={{textAlign:'right',padding:'0.3em 0.7em'}}>{stat.normalizeMs.toFixed(1)}</td>
                    <td style={{textAlign:'right',padding:'0.3em 0.7em'}}>{stat.totalMs.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{marginTop:'0.7em',fontSize:'0.95em',color:'#aaa'}}>
              <b>{t('note', 'Note')}:</b> {t('timingNote', 'Times are measured in milliseconds for each data type (fetch/parse, normalization, total). Includes network and JS parsing overhead.')}
            </div>
          </div>
        )}
      </div>

      {/* Raw API/Code View Section */}
      <div className="osds-section" role="region" aria-labelledby="code-heading">
        <div
          className="osds-section-header"
          id="code-heading"
          tabIndex={0}
          role="button"
          aria-expanded={!collapsed.code}
          aria-controls="code-section-body"
          onClick={() => toggle('code')}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle('code'); } }}
          style={{cursor:'pointer',display:'flex',alignItems:'center'}}
        >
          <span style={{fontWeight:'bold',fontSize:'1.1em'}}>{t('rawApiCodeView', 'Raw API / Code View')}</span>
          <span style={{marginLeft:'auto'}}>{collapsed.code ? '▶' : '▼'}</span>
        </div>
        {!collapsed.code && (
          <div className="osds-section-body" id="code-section-body" style={{background:'#222',color:'#eee',padding:'1em',borderRadius:'6px',marginTop:'0.5em'}}>
            <div style={{marginBottom:'0.5em',display:'flex',gap:'0.5em'}}>
              <button className="osds-animated-btn" onClick={() => handleCopyCode('json')} aria-label={t('copyAsJson', 'Copy as JSON')}>{t('copyAsJson', 'Copy as JSON')}</button>
              <button className="osds-animated-btn" onClick={() => handleCopyCode('triples')} aria-label={t('copyAsTriples', 'Copy as Triples')}>{t('copyAsTriples', 'Copy as Triples')}</button>
              <button className="osds-animated-btn" onClick={() => handleCopyCode('turtle')} aria-label={t('copyAsTurtle', 'Copy as Turtle')}>{t('copyAsTurtle', 'Copy as Turtle')}</button>
              {codeCopyMsg && <div className="osds-toast" aria-live="polite">{codeCopyMsg}</div>}
            </div>
            <pre style={{maxHeight:'320px',overflow:'auto',background:'#181818',color:'#fff',padding:'1em',borderRadius:'4px',fontSize:'0.95em'}} aria-label="Raw JSON code block">
{JSON.stringify(raw, null, 2)}
            </pre>
            <div style={{marginTop:'1em',fontSize:'0.95em',color:'#aaa'}}>
              <b>{t('forLlmsAdvanced', 'For LLMs/Advanced')}:</b> {t('llmInstructions', 'Use the above JSON as input, or request triples (tab-separated) or Turtle serialization.')} <br/>
              <b>{t('programmaticAccess', 'Programmatic access')}:</b> {t('programmaticInstructions', 'Use')} <code>window.osdsData</code> {t('programmaticInstructions2', 'in the console for the current structured data object.')}
            </div>
          </div>
        )}
      </div>
      {/* ...rest of existing UI... */}
    </div>
  );
}
