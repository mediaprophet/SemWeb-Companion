
import $rdf from './rdflib.js';
import { TTL_Gen } from './ttl_gen.js';
import { HTML_Gen } from './html_gen.js';
import { MicrodataJSON_Converter } from './microdata_json_converter.js';
import { BNodeGenerator } from './bnode_generator.js';
// Serialize triples to RDF/XML using rdflib.js
export async function serializeRDFXML(triples, baseURL) {
  try {
    // Create a new store and add triples
    const store = $rdf.graph();
    triples.forEach(t => {
      const s = $rdf.sym(t.s);
      const p = $rdf.sym(t.p);
      let o;
      if (t.datatype) {
        o = $rdf.literal(t.o, t.lang, $rdf.sym(t.datatype));
      } else if (t.lang) {
        o = $rdf.literal(t.o, t.lang);
      } else if (t.o.startsWith('http')) {
        o = $rdf.sym(t.o);
      } else {
        o = $rdf.literal(t.o);
      }
      store.add(s, p, o);
    });
    // Serialize to RDF/XML
    return { rdfxml: $rdf.serialize(undefined, store, baseURL, 'application/rdf+xml'), errors: [] };
  } catch (ex) {
    return { rdfxml: null, errors: [{ message: 'Failed to serialize to RDF/XML.', type: ex.name || 'Error', context: { error: ex.toString(), triples }, suggestion: 'Check the triples for invalid values or structure.' }] };
  }
}

// JSON parser (stub)
export async function parseJSON(textData, docURL, bnodeTypes, makeTtl = false) {
  let output = '';
  let skippedError = [];
  try {
    for (let x = 0; x < textData.length; x++) {
      output += textData[x] + '\n\n';
    }
    return { triples: output, errors: skippedError };
  } catch (ex) {
    skippedError.push(ex.toString());
    return { triples: output, errors: skippedError };
  }
}

// Microdata parser
export async function parseMicrodata(jsonData, docURL, bnodeTypes, makeTtl = false) {
  const errors = [];
  try {
    if (!jsonData || typeof jsonData !== 'object' || !jsonData.items) {
      errors.push({
        message: 'Input is not valid Microdata JSON.',
        type: 'ParseError',
        context: { jsonData },
        suggestion: 'Ensure the input is a valid Microdata JSON object with an "items" array.'
      });
      return { triples: null, errors };
    }
    const bnodeGen = new BNodeGenerator();
    const conv = new MicrodataJSON_Converter({ bnodeGen });
    let outData = conv.transform(jsonData, docURL);
    outData = outData.map(triple => {
      if (triple && triple.props) {
        for (const [p, values] of Object.entries(triple.props)) {
          triple.props[p] = values.map(val => {
            if (val && typeof val === 'object' && val.value !== undefined) {
              return {
                ...val,
                lang: val.lang || undefined,
                datatype: val.type || undefined
              };
            }
            return val;
          });
        }
      }
      return triple;
    });
    if (makeTtl) {
      return { triples: new TTL_Gen(docURL, false, bnodeTypes).load(outData), errors };
    } else {
      return { triples: new HTML_Gen(docURL, bnodeTypes).load(outData), errors };
    }
  } catch (ex) {
    errors.push({
      message: 'Failed to parse Microdata.',
      type: ex.name || 'Error',
      context: { error: ex.toString(), jsonData },
      suggestion: 'Check the Microdata input for syntax errors or unexpected structure.'
    });
    return { triples: null, errors };
  }
}

// ...existing code for other parsers...



// Turtle/N3 parser
export async function parseTurtle(textData, docURL, bnodeTypes, makeTtl = false, forQuery = false, skipDocPref = false) {
  const errors = [];
  let output = null;
  try {
    if (!textData || (Array.isArray(textData) && textData.length === 0)) {
      errors.push({
        message: 'No Turtle/N3 data provided.',
        type: 'ParseError',
        context: { textData },
        suggestion: 'Provide at least one Turtle/N3 string to parse.'
      });
      return { triples: null, errors };
    }
    let normalized = Array.isArray(textData) ? textData.flat(Infinity) : [textData];
    const bnodeGen = new BNodeGenerator();
    if (makeTtl) {
      output = new TTL_Gen(docURL, forQuery, bnodeTypes, skipDocPref).load(normalized, bnodeGen);
    } else {
      output = new HTML_Gen(docURL, bnodeTypes).load(normalized, 0, bnodeTypes, bnodeGen);
    }
    return { triples: output, errors };
  } catch (ex) {
    errors.push({
      message: 'Failed to parse Turtle/N3.',
      type: ex.name || 'Error',
      context: { error: ex.toString(), textData },
      suggestion: 'Check the Turtle/N3 input for syntax errors or unexpected structure.'
    });
    return { triples: null, errors };
  }
}



// JSON-LD parser
export async function parseJSONLD(textData, docURL, bnodeTypes, makeTtl = false) {
  const errors = [];
  let output = '';
  try {
    if (!textData || (Array.isArray(textData) && textData.length === 0)) {
      errors.push({
        message: 'No JSON-LD data provided.',
        type: 'ParseError',
        context: { textData },
        suggestion: 'Provide at least one JSON-LD string to parse.'
      });
      return { triples: null, errors };
    }
    let normalized = Array.isArray(textData) ? textData.flat(Infinity) : [textData];
    const bnodeGen = new BNodeGenerator();
    function flatten(obj, arr) {
      if (Array.isArray(obj)) {
        for (const o of obj) flatten(o, arr);
      } else if (obj && typeof obj === 'object') {
        arr.push(obj);
        for (const v of Object.values(obj)) flatten(v, arr);
      }
    }
    let flatTriples = [];
    for (const t of normalized) flatten(t, flatTriples);
    const seen = new Set();
    let triples = flatTriples.filter(triple => {
      if (triple && triple.s && triple.p && triple.o) {
        const key = `${triple.s}|${triple.p}|${triple.o}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }
      return false;
    }).map(triple => ({
      ...triple,
      lang: triple.lang || undefined,
      datatype: triple.datatype || undefined
    }));
    output = makeTtl
      ? new TTL_Gen(docURL, false, bnodeTypes).load(triples, bnodeGen)
      : new HTML_Gen(docURL, bnodeTypes).load(triples, 0, bnodeTypes, bnodeGen);
    return { triples: output, errors };
  } catch (ex) {
    errors.push({
      message: 'Failed to parse JSON-LD.',
      type: ex.name || 'Error',
      context: { error: ex.toString(), textData },
      suggestion: 'Check the JSON-LD input for syntax errors or unexpected structure.'
    });
    return { triples: null, errors };
  }
}



// RDFa parser
// RDFa parser
export async function parseRDFa(data, docURL, bnodeTypes) {
  const errors = [];
  try {
    if (!data) {
      errors.push({
        message: 'No RDFa data provided.',
        type: 'ParseError',
        context: { data },
        suggestion: 'Provide RDFa data to parse.'
      });
      return { triples: null, errors };
    }
    let normalized = Array.isArray(data) ? data.flat(Infinity) : [data];
    const bnodeGen = new BNodeGenerator();
    function flatten(obj, arr) {
      if (Array.isArray(obj)) {
        for (const o of obj) flatten(o, arr);
      } else if (obj && typeof obj === 'object') {
        arr.push(obj);
        for (const v of Object.values(obj)) flatten(v, arr);
      }
    }
    let flatTriples = [];
    for (const t of normalized) flatten(t, flatTriples);
    const seen = new Set();
    let triples = flatTriples.filter(triple => {
      if (triple && triple.s && triple.p && triple.o) {
        const key = `${triple.s}|${triple.p}|${triple.o}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }
      return false;
    }).map(triple => ({
      ...triple,
      lang: triple.lang || undefined,
      datatype: triple.datatype || undefined
    }));
    const html = new HTML_Gen(docURL, bnodeTypes).load(triples, 0, bnodeTypes, bnodeGen);
    return { triples: html, errors };
  } catch (ex) {
    errors.push({
      message: 'Failed to parse RDFa.',
      type: ex.name || 'Error',
      context: { error: ex.toString(), data },
      suggestion: 'Check the RDFa input for syntax errors or unexpected structure.'
    });
    return { triples: null, errors };
  }
}



// RDF/XML parser
export async function parseRDFXML(textData, baseURL, bnodeTypes) {
  const errors = [];
  let output = '';
  try {
    if (!textData || (Array.isArray(textData) && textData.length === 0)) {
      errors.push({
        message: 'No RDF/XML data provided.',
        type: 'ParseError',
        context: { textData },
        suggestion: 'Provide at least one RDF/XML string to parse.'
      });
      return { triples: null, errors };
    }
    let normalized = Array.isArray(textData) ? textData.flat(Infinity) : [textData];
    const bnodeGen = new BNodeGenerator();
    for (let i = 0; i < normalized.length; i++) {
      try {
        const store = $rdf.graph();
        const rdf_data = normalized[i];
        $rdf.parse(rdf_data, store, baseURL, 'application/rdf+xml');
        const ttl = $rdf.serialize(undefined, store, baseURL, 'text/turtle');
        const ret = await parseTurtle([ttl], baseURL, bnodeTypes, true);
        if (ret.errors && ret.errors.length > 0) {
          errors.push(...ret.errors);
        } else {
          output += ret.triples + '\n\n';
        }
      } catch (ex) {
        // Advanced error recovery: try to extract what we can
        let partialTriples = [];
        try {
          // Try to parse as much as possible by removing problematic lines
          const lines = normalized[i].split('\n');
          for (let j = 0; j < lines.length; j++) {
            try {
              const fragment = lines.slice(0, j).concat(lines.slice(j + 1)).join('\n');
              const store = $rdf.graph();
              $rdf.parse(fragment, store, baseURL, 'application/rdf+xml');
              const ttl = $rdf.serialize(undefined, store, baseURL, 'text/turtle');
              const ret = await parseTurtle([ttl], baseURL, bnodeTypes, true);
              if (ret.triples) partialTriples.push(ret.triples);
            } catch {}
          }
        } catch {}
        errors.push({
          message: 'Failed to parse one RDF/XML document.',
          type: ex.name || 'Error',
          context: { error: ex.toString(), rdfxml: normalized[i], partialTriples },
          suggestion: 'Check the RDF/XML input for syntax errors or unexpected structure. Partial triples may be available.'
        });
      }
    }
    return { triples: output, errors };
  } catch (ex) {
    errors.push({
      message: 'Failed to parse RDF/XML.',
      type: ex.name || 'Error',
      context: { error: ex.toString(), textData },
      suggestion: 'Check the RDF/XML input for syntax errors or unexpected structure.'
    });
    return { triples: null, errors };
  }
}


// CSV parser
export async function parseCSV(textData, baseURL, bnodeTypes) {
  const errors = [];
  let output = '';
  try {
    if (!textData || (Array.isArray(textData) && textData.length === 0)) {
      errors.push({
        message: 'No CSV data provided.',
        type: 'ParseError',
        context: { textData },
        suggestion: 'Provide at least one CSV string to parse.'
      });
      return { triples: null, errors };
    }
    let normalized = Array.isArray(textData) ? textData.flat(Infinity) : [textData];
    const bnodeGen = new BNodeGenerator();
    for (let x = 0; x < normalized.length; x++) {
      try {
        const text = normalized[x];
        if (!text || text.trim().length === 0) continue;
        const res = Papa.parse(text, { skipEmptyLines: true, dynamicTyping: true });
        if (res.errors && res.errors.length > 0) {
          errors.push({
            message: 'CSV parse error: ' + res.errors[0].message,
            type: 'ParseError',
            context: { error: res.errors[0], text },
            suggestion: 'Check the CSV input for syntax errors or unexpected structure.'
          });
          continue;
        }
        let ttl = '@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .\n' +
                  '@prefix xsd: <http://www.w3.org/2001/XMLSchema#> . \n' +
                  '@prefix : <#> . \n\n';
        const col = res.data[0];
        for (let i = 0; i < col.length; i++) {
          ttl += `:${col[i]} rdf:domain :this .\n`;
          ttl += `:${col[i]} rdf:range xsd:string .\n`;
          ttl += `:${col[i]} a <http://www.w3.org/1999/02/22-rdf-syntax-ns#Property> .\n`;
        }
        ttl += '\n';
        for (let i = 1; i < res.data.length; i++) {
          const d = res.data[i];
          let s = '[\n';
          for (let j = 0; j < d.length; j++) {
            let val = d[j] ? '' + d[j] : '';
            let qv = '"';
            let lang = undefined; // TODO: Detect language tag if present in CSV
            let datatype = 'http://www.w3.org/2001/XMLSchema#string'; // Default datatype
            if (val.indexOf && (val.indexOf("\n") !== -1 || val.indexOf("\r") !== -1)) {
              qv = "'''";
              val = val.replace(/\\/g, '\\\\').replace(/\"/g, "\\\"");
            } else {
              val = val.replace(/\\/g, '\\\\').replace(/\'/g, "''").replace(/\"/g, "\\\"");
            }
            s += `:${col[j]} ${qv}${val}${qv}`;
            if (lang) {
              s += `@${lang}`;
            } else if (datatype) {
              s += `^^<${datatype}>`;
            }
            s += ' ;\n';
          }
          ttl += s + '].\n\n';
        }
        const ret = await parseTurtle([ttl], baseURL, bnodeTypes, true);
        if (ret.errors && ret.errors.length > 0) {
          errors.push(...ret.errors);
        } else {
          output += ret.triples + '\n\n';
        }
      } catch (ex) {
        errors.push({
          message: 'Failed to parse one CSV document.',
          type: ex.name || 'Error',
          context: { error: ex.toString(), csv: normalized[x] },
          suggestion: 'Check the CSV input for syntax errors or unexpected structure.'
        });
      }
    }
    return { triples: output, errors };
  } catch (ex) {
    errors.push({
      message: 'Failed to parse CSV.',
      type: 'Error',
      context: { error: ex.toString(), textData },
      suggestion: 'Check the CSV input for syntax errors or unexpected structure.'
    });
    return { triples: null, errors };
  }
}
