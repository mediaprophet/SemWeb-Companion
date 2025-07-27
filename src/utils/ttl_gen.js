// src/utils/ttl_gen.js
// Modern reimplementation of TTL_Gen (Turtle generator)

export class TTL_Gen {
  constructor(docURL, forQuery = false, bnodeTypes = {}, skipDocPref = false) {
    this.docURL = docURL;
    this.forQuery = forQuery;
    this.bnodeTypes = bnodeTypes;
    this.skipDocPref = skipDocPref;
  }

  // Accepts an array or object of triples, returns a Turtle string
  load(data) {
    // Add some common prefixes for richer output
    const prefixes = [
      '@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .',
      '@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .',
      '@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .',
      '@prefix : <#> .',
      ''
    ];
    let triples = [];
    if (typeof data === 'string') {
      triples = [data];
    } else if (Array.isArray(data)) {
      triples = data.map(triple => {
        if (typeof triple === 'string') return triple;
        if (triple && triple.s && triple.p && triple.o) {
          const s = triple.s.startsWith('<') || triple.s.startsWith('_:') ? triple.s : `<${triple.s}>`;
          const p = triple.p.startsWith('<') ? triple.p : `<${triple.p}>`;
          let o = triple.o;
          // Support for language tags and datatypes
          let lang = triple.lang || '';
          let dtype = triple.datatype || '';
          if (typeof o === 'string' && (o.startsWith('http://') || o.startsWith('https://'))) {
            o = `<${o}>`;
          } else if (typeof o === 'string' && !o.startsWith('<') && !o.startsWith('"') && !o.startsWith('_:')) {
            o = '"' + o.replace(/"/g, '\\"') + '"';
            if (lang) {
              o += `@${lang}`;
            } else if (dtype) {
              o += `^^<${dtype}>`;
            }
          }
          return `${s} ${p} ${o} .`;
        }
        // Fallback: JSON string
        return '# ' + JSON.stringify(triple);
      });
    } else if (data && data.s && data.p && data.o) {
      triples = [`<${data.s}> <${data.p}> <${data.o}> .`];
    } else {
      triples = ['# ' + JSON.stringify(data)];
    }
    return prefixes.concat(triples).join('\n');
  }
}
