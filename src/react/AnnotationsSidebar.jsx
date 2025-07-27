import React, { useState, useEffect, useRef } from "react";
import { getSyncItem, setSyncItem } from "./storageSync.js";
import { useTranslation } from 'react-i18next';
import MarkdownIt from "markdown-it";
import { useSolidAuth } from "./solid/SolidAuthProvider.jsx";

const LOCAL_KEY = "osds_annotations";
const SOLID_ANNOTATIONS_PATH = "/public/annotations/annotations.ttl";
const RDF_EDITOR_URL = "https://linkeddata.uriburner.com/rdf-editor/#/editor?data={data}&view=statements";
const md = new MarkdownIt();

function parseAnnotationsTurtle(turtle) {
  // Now supports tags and type
  const regex = /\[\]\s+a\s+<[^>]+Annotation>\s*;([^.]*)\./g;
  const annotations = [];
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
    annotations.push(fields);
  }
  return annotations;
}

function toTurtle(annotations) {
  // Now supports tags and type
  return annotations.map(a => `[] a <http://www.w3.org/ns/oa#Annotation> ; <http://www.w3.org/ns/oa#hasTarget> "${a.target}" ; <http://www.w3.org/ns/oa#hasBody> "${a.body}"${a.tags ? ` ; <http://www.w3.org/ns/oa#hasTag> "${a.tags}"` : ''}${a.type ? ` ; <http://www.w3.org/ns/oa#hasType> "${a.type}"` : ''} .`).join("\n");
}

export default function AnnotationsSidebar() {
  const { t } = useTranslation();
  const { isLoggedIn, webId, putResource } = useSolidAuth();
  const [annotations, setAnnotations] = useState([]);
  const [target, setTarget] = useState(window.location.href);
  const [selection, setSelection] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editIdx, setEditIdx] = useState(null);
  const [editTarget, setEditTarget] = useState("");
  const [editBody, setEditBody] = useState("");
  const [tags, setTags] = useState("");
  const [type, setType] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editType, setEditType] = useState("");
  const [filter, setFilter] = useState("");
  const [importExport, setImportExport] = useState(false);
  const fileInputRef = useRef();

  // Highlight annotated selections in the page
  useEffect(() => {
    // Remove previous highlights
    document.querySelectorAll('.osds-annotation-highlight').forEach(el => {
      el.classList.remove('osds-annotation-highlight');
    });
    // Highlight all annotated selections (if present in page)
    annotations.forEach(a => {
      if (a.target && a.target.length < 200 && a.target !== window.location.href) {
        const sel = a.target;
        if (sel) {
          highlightTextInPage(sel);
        }
      }
    });
    return () => {
      document.querySelectorAll('.osds-annotation-highlight').forEach(el => {
        el.classList.remove('osds-annotation-highlight');
      });
    };
  }, [annotations]);

  // Listen for selection changes in the active page
  // Highlight helper
  function highlightTextInPage(text) {
    if (!text) return;
    // Only highlight visible text nodes
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.nodeValue && node.nodeValue.includes(text)) {
        const idx = node.nodeValue.indexOf(text);
        if (idx !== -1) {
          const span = document.createElement('span');
          span.textContent = text;
          span.className = 'osds-annotation-highlight';
          span.style.background = '#ffe066';
          span.style.borderRadius = '2px';
          span.style.cursor = 'pointer';
          span.title = 'Annotated';
          const after = node.splitText(idx);
          after.nodeValue = after.nodeValue.substring(text.length);
          node.parentNode.insertBefore(span, after);
          break;
        }
      }
    }
  }
  useEffect(() => {
    const handleSelection = () => {
      const sel = window.getSelection && window.getSelection().toString();
      setSelection(sel || "");
    };
    document.addEventListener("selectionchange", handleSelection);
    return () => document.removeEventListener("selectionchange", handleSelection);
  }, []);

  // Load from sync storage (cross-browser)
  useEffect(() => {
    getSyncItem(LOCAL_KEY, []).then(anns => {
      if (Array.isArray(anns)) setAnnotations(anns);
    });
  }, []);

  // Save to sync storage (cross-browser)
  useEffect(() => {
    setSyncItem(LOCAL_KEY, annotations);
  }, [annotations]);

  // Load from Solid pod (merge with local)
  useEffect(() => {
    if (!isLoggedIn || !webId) return;
    setLoading(true);
    setError(null);
    const podBase = webId.replace(/\/profile\/card(#me)?$/, "");
    const solidUrl = podBase + SOLID_ANNOTATIONS_PATH;
    fetch(solidUrl, { headers: { Accept: "text/turtle" } })
      .then(res => res.ok ? res.text() : Promise.reject(res.statusText))
      .then(turtle => {
        const solidAnnotations = parseAnnotationsTurtle(turtle);
        // Merge, dedup by target+body
        const merged = [...annotations, ...solidAnnotations].reduce((acc, a) => {
          if (!acc.find(x => x.target === a["<http://www.w3.org/ns/oa#hasTarget>"] && x.body === a["<http://www.w3.org/ns/oa#hasBody>"])) acc.push({ target: a["<http://www.w3.org/ns/oa#hasTarget>"], body: a["<http://www.w3.org/ns/oa#hasBody>"] });
          return acc;
        }, []);
        setAnnotations(merged);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line
  }, [isLoggedIn, webId]);

  const saveToSolid = async (anns) => {
    if (isLoggedIn && webId) {
      setLoading(true);
      setError(null);
      const podBase = webId.replace(/\/profile\/card(#me)?$/, "");
      const solidUrl = podBase + SOLID_ANNOTATIONS_PATH;
      const turtle = toTurtle(anns);
      try {
        await putResource(solidUrl, turtle, "text/turtle");
      } catch (e) {
        setError("Could not save to Solid pod: " + e);
      } finally {
        setLoading(false);
      }
    }
  };

  const addAnnotation = async () => {
    if (!target.trim() || !body.trim()) return;
    const newA = { target, body, tags, type };
    const newList = [...annotations, newA];
    setAnnotations(newList);
    setBody("");
    setTags("");
    setType("");
    await saveToSolid(newList);
  };

  const useSelectionAsTarget = () => {
    if (selection) setTarget(selection);
  };

  const startEdit = (idx) => {
    setEditIdx(idx);
    setEditTarget(annotations[idx].target);
    setEditBody(annotations[idx].body);
    setEditTags(annotations[idx].tags || "");
    setEditType(annotations[idx].type || "");
  };

  const cancelEdit = () => {
    setEditIdx(null);
    setEditTarget("");
    setEditBody("");
  };

  const saveEdit = async () => {
    if (editIdx === null || !editTarget.trim() || !editBody.trim()) return;
    const newList = annotations.map((a, i) => i === editIdx ? { target: editTarget, body: editBody, tags: editTags, type: editType } : a);
    setAnnotations(newList);
    cancelEdit();
    await saveToSolid(newList);
  };

  const deleteAnnotation = async (idx) => {
    const newList = annotations.filter((_, i) => i !== idx);
    setAnnotations(newList);
    cancelEdit();
    await saveToSolid(newList);
  };

  const openExternalEditor = () => {
    // Export all annotations as Turtle and open in RDF editor
    const turtle = toTurtle(annotations);
    const url = RDF_EDITOR_URL.replace("{data}", encodeURIComponent(turtle));
    window.open(url, "_blank");
  };

  // Filtering and search
  const filteredAnnotations = annotations.filter(a => {
    if (!filter.trim()) return true;
    const f = filter.toLowerCase();
    return (
      (a.target && a.target.toLowerCase().includes(f)) ||
      (a.body && a.body.toLowerCase().includes(f)) ||
      (a.tags && a.tags.toLowerCase().includes(f)) ||
      (a.type && a.type.toLowerCase().includes(f))
    );
  });

  // Import/export handlers
  const exportAnnotations = () => {
    const data = JSON.stringify(annotations, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'annotations.json';
    a.click();
    URL.revokeObjectURL(url);
  };
  const importAnnotations = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const imported = JSON.parse(evt.target.result);
        if (Array.isArray(imported)) {
          setAnnotations(imported);
          saveToSolid(imported);
        }
      } catch {}
    };
    reader.readAsText(file);
  };

  // Quick navigation to annotation in page
  const scrollToAnnotation = (a) => {
    if (!a.target || a.target.length > 200 || a.target === window.location.href) return;
    // Find the first highlight span for this annotation
    const spans = Array.from(document.querySelectorAll('.osds-annotation-highlight'));
    for (const span of spans) {
      if (span.textContent === a.target) {
        span.scrollIntoView({ behavior: 'smooth', block: 'center' });
        span.style.outline = '2px solid #007bff';
        setTimeout(() => { span.style.outline = ''; }, 1200);
        break;
      }
    }
  };

  return (
    <div style={{ border: "1px solid #ccc", borderRadius: 6, padding: 8, marginBottom: 12, background: "#f9f9f9", minWidth: 260 }}>
  <div className="fw-bold mb-2">{t('annotations', 'Annotations')} <span className="badge bg-secondary">{annotations.length}</span></div>
      <div className="mb-2 d-flex gap-2 flex-wrap">
        <button className="btn btn-outline-primary btn-sm" type="button" onClick={openExternalEditor}>
          {t('openInRdfEditor', 'Open in RDF Editor')}
        </button>
        <button className="btn btn-outline-secondary btn-sm" type="button" onClick={exportAnnotations}>
          {t('export', 'Export')}
        </button>
        <button className="btn btn-outline-secondary btn-sm" type="button" onClick={() => fileInputRef.current && fileInputRef.current.click()}>
          {t('import', 'Import')}
        </button>
        <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="application/json" onChange={importAnnotations} />
      </div>
      <div className="mb-2">
        <input
          className="form-control form-control-sm"
          placeholder={t('filterSearchAnnotations', 'Filter/search annotations...')}
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
      </div>
      {loading && <div className="text-muted">{t('loading', 'Loading...')}</div>}
      {error && (
        <div className="alert alert-danger py-2" role="alert">
          <strong>{t('error', 'Error')}:</strong> {error}
          <button className="btn btn-link btn-sm ms-2" onClick={() => window.location.reload()}>{t('retry', 'Retry')}</button>
        </div>
      )}
      <div style={{ maxHeight: 120, overflowY: "auto", fontSize: 13, background: "#fff", border: "1px solid #eee", borderRadius: 4, marginBottom: 6, padding: 4 }}>
  {filteredAnnotations.length === 0 && <div className="text-muted">{t('noAnnotationsFound', 'No annotations found.')}</div>}
        {filteredAnnotations.map((a, i) => (
          <div key={i} style={{ marginBottom: 2, display: 'flex', alignItems: 'center' }}>
            {editIdx === i ? (
              <>
                <input
                  className="form-control form-control-sm me-1"
                  style={{ flex: 2, minWidth: 0 }}
                  value={editBody}
                  onChange={e => setEditBody(e.target.value)}
                  placeholder={t('annotationText', 'Annotation text')}
                  disabled={loading}
                />
                <input
                  className="form-control form-control-sm me-1"
                  style={{ flex: 3, minWidth: 0 }}
                  value={editTarget}
                  onChange={e => setEditTarget(e.target.value)}
                  placeholder={t('targetUrlOrSelection', 'Target URL or selection')}
                  disabled={loading}
                />
                <input
                  className="form-control form-control-sm me-1"
                  style={{ flex: 1, minWidth: 0 }}
                  value={editTags}
                  onChange={e => setEditTags(e.target.value)}
                  placeholder={t('tagsComma', 'Tags (comma)')}
                  disabled={loading}
                />
                <input
                  className="form-control form-control-sm me-1"
                  style={{ flex: 1, minWidth: 0 }}
                  value={editType}
                  onChange={e => setEditType(e.target.value)}
                  placeholder={t('type', 'Type')}
                  disabled={loading}
                />
                <button className="btn btn-success btn-sm me-1" type="button" onClick={saveEdit} disabled={loading || !editBody.trim() || !editTarget.trim()}>
                  {t('save', 'Save')}
                </button>
                <button className="btn btn-secondary btn-sm me-1" type="button" onClick={cancelEdit} disabled={loading}>
                  {t('cancel', 'Cancel')}
                </button>
              </>
            ) : (
              <>
                <span style={{ color: '#007bff', flex: 3, minWidth: 0, wordBreak: 'break-all', cursor: a.target && a.target.length < 200 && a.target !== window.location.href ? 'pointer' : 'default' }}
                  onClick={() => scrollToAnnotation(a)}
                  title={t('jumpToAnnotation', 'Jump to annotation in page')}
                >{a.target}</span>
                <span style={{ flex: 2, minWidth: 0, wordBreak: 'break-all', marginLeft: 4 }}>
                  <span dangerouslySetInnerHTML={{ __html: md.render(a.body || "") }} />
                </span>
                {a.tags && <span className="badge bg-info text-dark ms-1">{a.tags}</span>}
                {a.type && <span className="badge bg-warning text-dark ms-1">{a.type}</span>}
                <button className="btn btn-outline-secondary btn-sm ms-1" type="button" onClick={() => startEdit(i)} disabled={loading} title={t('editAnnotation', 'Edit annotation')}>
                  {t('edit', 'Edit')}
                </button>
                <button className="btn btn-outline-danger btn-sm ms-1" type="button" onClick={() => deleteAnnotation(i)} disabled={loading} title={t('deleteAnnotation', 'Delete annotation')}>
                  {t('delete', 'Delete')}
                </button>
              </>
            )}
          </div>
        ))}
      </div>
      <div className="d-flex gap-1 mb-1 align-items-center">
        <input
          className="form-control form-control-sm"
          style={{ flex: 2 }}
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder={t('annotationTextMarkdown', 'Annotation text (markdown supported)')}
          disabled={loading}
        />
        <input
          className="form-control form-control-sm"
          style={{ flex: 3 }}
          value={target}
          onChange={e => setTarget(e.target.value)}
          placeholder={t('targetUrlOrSelection', 'Target (URL or selection)')}
          disabled={loading}
        />
        <input
          className="form-control form-control-sm"
          style={{ flex: 1 }}
          value={tags}
          onChange={e => setTags(e.target.value)}
          placeholder={t('tagsComma', 'Tags (comma)')}
          disabled={loading}
        />
        <input
          className="form-control form-control-sm"
          style={{ flex: 1 }}
          value={type}
          onChange={e => setType(e.target.value)}
          placeholder={t('type', 'Type')}
          disabled={loading}
        />
        <button className="btn btn-outline-info btn-sm" type="button" onClick={useSelectionAsTarget} disabled={!selection} title={selection ? t('useSelectedText', 'Use selected text:') + ' ' + selection : t('selectTextOnPage', 'Select text on the page')}>
          {t('useSelection', 'Use Selection')}
        </button>
        <button className="btn btn-success btn-sm" type="button" onClick={addAnnotation} disabled={loading || !body.trim() || !target.trim()}>
          {t('add', 'Add')}
        </button>
      </div>
      {selection && (
  <div className="small text-muted mb-1">{t('selected', 'Selected')}: <span style={{ fontStyle: 'italic' }}>{selection.length > 80 ? selection.slice(0, 80) + '…' : selection}</span></div>
      )}
    </div>
  );
}
