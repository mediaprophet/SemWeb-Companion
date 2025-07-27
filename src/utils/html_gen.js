// src/utils/html_gen.js
// Modern reimplementation of HTML_Gen (HTML generator for triples)

export class HTML_Gen {
  constructor(docURL, bnodeTypes = {}) {
    this.docURL = docURL;
    this.bnodeTypes = bnodeTypes;
  }

  // Accepts an array or object of triples, returns a styled HTML string
  load(data, startId = 0, bnodeTypes = {}) {
    const style = `<style>\n.table-rdf { border-collapse: collapse; width: 100%; font-family: monospace; }\n.table-rdf th, .table-rdf td { border: 1px solid #ccc; padding: 4px 8px; }\n.table-rdf th { background: #f0f0f0; }\n.table-rdf tr:nth-child(even) { background: #fafafa; }\n.table-rdf .uri { color: #1a0dab; }\n.table-rdf .literal { color: #008000; }\n.table-rdf .bnode { color: #b000b0; }\n</style>`;
    if (typeof data === 'string') return style + `<pre>${data}</pre>`;
    if (Array.isArray(data)) {
      // Render each triple as a row with basic syntax highlighting
      return style + `<table class="table-rdf"><thead><tr><th>Subject</th><th>Predicate</th><th>Object</th></tr></thead><tbody>` +
        data.map(triple => {
          if (typeof triple === 'string') return `<tr><td colspan="3"><pre>${triple}</pre></td></tr>`;
          if (triple && triple.s && triple.p && triple.o) {
            const s = triple.s.startsWith('_:') ? `<span class="bnode">${triple.s}</span>` : `<span class="uri">${triple.s}</span>`;
            const p = `<span class="uri">${triple.p}</span>`;
            let o = triple.o;
            if (typeof o === 'string' && (o.startsWith('http://') || o.startsWith('https://'))) {
              o = `<span class="uri">${o}</span>`;
            } else if (typeof o === 'string' && o.startsWith('_:')) {
              o = `<span class="bnode">${o}</span>`;
            } else {
              o = `<span class="literal">${o}</span>`;
            }
            return `<tr><td>${s}</td><td>${p}</td><td>${o}</td></tr>`;
          }
          // Fallback: JSON string
          return `<tr><td colspan="3"><pre>${JSON.stringify(triple, null, 2)}</pre></td></tr>`;
        }).join('') + `</tbody></table>`;
    }
    // Fallback: JSON string
    return style + `<pre>${JSON.stringify(data, null, 2)}</pre>`;
  }
}
