// Utility functions for data normalization, graph conversion, and IRI checks

// Convert triples to a graph structure for visualization
export function triplesToGraph(triples) {
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
export const DATA_TYPES = [
  { key: 'jsonld', label: 'JSON-LD' },
  { key: 'csv', label: 'CSV' },
  { key: 'turtle', label: 'Turtle/N3' },
  { key: 'rdfxml', label: 'RDF/XML' },
  { key: 'posh', label: 'POSH' },
  // Add more types as needed
];

// Check if a string is an IRI
export function isIRI(str) {
  return typeof str === 'string' && /^https?:\/\//.test(str);
}

// Triple normalization utility
// Returns array of { s, p, o, [lang], [datatype] }
export function normalizeTriples(type, data, csvMapping, metaMapping) {
  // JSON-LD
  if (type === 'jsonld' && data) {
    let arr = [];
    if (Array.isArray(data)) arr = data;
    else if (data['@graph']) arr = data['@graph'];
    else arr = [data];
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
    return [];
  }
  return [];
}
