// POSH (Plain Old Semantic HTML) parser for Structured Data Sniffer (modern, no jQuery)
// Extracts semantic metadata from HTML head/meta/link/title/img and outputs triples or normalized JSON
// Usage: import parsePOSH from './parsePOSH';

const PREFIXES = {
  xhv: "http://www.w3.org/1999/xhtml/vocab#",
  rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
  rdfs: "http://www.w3.org/2000/01/rdf-schema#",
  owl: "http://www.w3.org/2002/07/owl#",
  xsd: "http://www.w3.org/2001/XMLSchema#",
  skos: "http://www.w3.org/2004/02/skos/core#",
  dct: "http://purl.org/dc/terms/",
  dcterms: "http://purl.org/dc/terms/",
  foaf: "http://xmlns.com/foaf/0.1/",
  schema: "https://schema.org/",
  dbpedia: "http://dbpedia.org/resource/",
  dbp: "http://dbpedia.org/property/",
  dbo: "http://dbpedia.org/ontology/",
  wikidata: "http://www.wikidata.org/entity/",
  wd: "http://www.wikidata.org/entity/",
  wdt: "http://www.wikidata.org/prop/direct/",
  prov: "http://www.w3.org/ns/prov#",
  geo: "http://www.opengis.net/ont/geosparql#",
  geonames: "http://www.geonames.org/ontology#",
  void: "http://rdfs.org/ns/void#",
  cc: "http://creativecommons.org/ns#",
  org: "http://www.w3.org/ns/org#",
  gr: "http://purl.org/goodrelations/v1#",
  bibo: "http://purl.org/ontology/bibo/",
  vcard: "http://www.w3.org/2006/vcard/ns#",
  doap: "http://usefulinc.com/ns/doap#",
  event: "http://purl.org/NET/c4dm/event.owl#",
  fabio: "http://purl.org/spar/fabio/",
  frbr: "http://purl.org/vocab/frbr/core#",
  oa: "http://www.w3.org/ns/oa#",
  sdo: "https://schema.org/",
  skosxl: "http://www.w3.org/2008/05/skos-xl#",
  bio: "http://purl.org/vocab/bio/0.1/",
  sioc: "http://rdfs.org/sioc/ns#",
  doac: "http://ramonantonio.net/doac/0.1/",
  gn: "http://www.geonames.org/ontology#",
  qb: "http://purl.org/linked-data/cube#",
  vann: "http://purl.org/vocab/vann/",
  voaf: "http://purl.org/vocommons/voaf#",
  wgs84_pos: "http://www.w3.org/2003/01/geo/wgs84_pos#",
  wdrs: "http://www.w3.org/2007/05/powder-s#",
  opltw: "http://www.openlinksw.com/schemas/twitter#",
  schema: "https://schema.org/",
  schemavideo: "https://schema.org/VideoObject#",
  formats: "http://www.w3.org/ns/formats/",
  geo: "http://www.w3.org/2003/01/geo/wgs84_pos#",
  foaf: "http://xmlns.com/foaf/0.1/",
  dc: "http://purl.org/dc/elements/1.1/",
  dct: "http://purl.org/dc/terms/",
  sioc: "http://rdfs.org/sioc/ns#",
  sioca: "http://rdfs.org/sioc/access#",
  siocact: "http://rdfs.org/sioc/actions#",
  siocarg: "http://rdfs.org/sioc/argument#",
  siocquot: "http://rdfs.org/sioc/quotes#",
  siocserv: "http://rdfs.org/sioc/services#",
  siocswan: "http://rdfs.org/sioc/swan#",
  sioctypes: "http://rdfs.org/sioc/types#",
  siocwikitalk: "http://rdfs.org/sioc/wikitalk#",
  cc: "http://creativecommons.org/ns#",
  vc: "http://www.w3.org/2006/vcard/ns#",
  as: "https://www.w3.org/ns/activitystreams#",
  ical: "http://www.w3.org/2002/12/cal/ical#",
  mee: "http://www.w3.org/ns/pim/meeting#",
  mo: "http://purl.org/ontology/mo/",
  rlog: "http://persistence.uni-leipzig.org/nlp2rdf/ontologies/rlog#",
  time: "http://www.w3.org/2006/time#",
  tzont: "http://www.w3.org/2006/timezone#",
  wf: "http://www.w3.org/2005/01/wf/flow#",
  wgs84_pos: "http://www.w3.org/2003/01/geo/wgs84_pos#",
  elements: "http://purl.org/dc/elements/1.1/",
  terms: "http://purl.org/dc/terms/",
};

// Map meta/link names to RDF predicates (extended)
const META_MAP = {
  'twitter:url': { p: 'schema:mainEntityOfPage', o: 'iri:content' },
  'og:url': { p: 'schema:mainEntityOfPage', o: 'iri:content' },
  'twitter:title': [
    { p: 'schema:title', o: 'val:content' },
    { p: 'schema:name', o: 'val:content' }
  ],
  'og:title': [
    { p: 'schema:title', o: 'val:content' },
    { p: 'schema:name', o: 'val:content' }
  ],
  'twitter:description': { p: 'schema:description', o: 'val:content' },
  'og:description': { p: 'schema:description', o: 'val:content' },
  'twitter:image': { p: 'schema:image', o: 'iri:content' },
  'og:image': { p: 'schema:image', o: 'iri:content' },
  'twitter:site': [
    { p: 'schema:url', o: 'iri:content' },
    { p: 'schema:author', o: 'cmd:content', cmd: fixTwitterCreator }
  ],
  'twitter:site:id': { p: 'opltw:id', o: 'val:content' },
  'twitter:creator': { p: 'schema:author', o: 'cmd:content', cmd: fixTwitterCreator },
  'twitter:creator:id': { p: 'schema:author', o: 'cmd:content', cmd: fixTwitterCreator },
  'twitter:player': { p: 'schemavideo:embedUrl', o: 'iri:content' },
  'twitter:player:stream': { p: 'schemavideo:embedUrl', o: 'iri:content' },
  'twitter:player:stream:': { p: 'formats:media_type', o: 'val:content' },
  // Dublin Core
  'dc:title': { p: 'dc:title', o: 'val:content' },
  'dc:creator': { p: 'dc:creator', o: 'val:content' },
  'dc:description': { p: 'dc:description', o: 'val:content' },
  'dc:publisher': { p: 'dc:publisher', o: 'val:content' },
  'dc:date': { p: 'dc:date', o: 'val:content' },
  'dc:type': { p: 'dc:type', o: 'val:content' },
  'dc:format': { p: 'dc:format', o: 'val:content' },
  'dc:identifier': { p: 'dc:identifier', o: 'val:content' },
  'dc:language': { p: 'dc:language', o: 'val:content' },
  'dc:subject': { p: 'dc:subject', o: 'val:content' },
  // FOAF
  'foaf:name': { p: 'foaf:name', o: 'val:content' },
  'foaf:homepage': { p: 'foaf:homepage', o: 'iri:content' },
  'foaf:img': { p: 'foaf:img', o: 'iri:content' },
  'foaf:depiction': { p: 'foaf:depiction', o: 'iri:content' },
  // More Open Graph
  'og:type': { p: 'og:type', o: 'val:content' },
  'og:site_name': { p: 'og:site_name', o: 'val:content' },
  'og:locale': { p: 'og:locale', o: 'val:content' },
  'og:audio': { p: 'og:audio', o: 'iri:content' },
  'og:video': { p: 'og:video', o: 'iri:content' },
  'og:determiner': { p: 'og:determiner', o: 'val:content' },
  'og:updated_time': { p: 'og:updated_time', o: 'val:content' },
  // SIOC
  'sioc:about': { p: 'sioc:about', o: 'iri:content' },
  'sioc:has_creator': { p: 'sioc:has_creator', o: 'val:content' },
  'sioc:content': { p: 'sioc:content', o: 'val:content' },
  // WDRS
  'wdrs:describedby': { p: 'wdrs:describedby', o: 'iri:content' },
};

function fixTwitterCreator(content) {
  if (!content) return '';
  const p = content.indexOf('@');
  if (p !== -1) return `https://twitter.com/${content.substring(p + 1)}#this`;
  return content;
}

function fixUrlEncode(uri) {
  try {
    const u = new URL(uri);
    const params = new URLSearchParams();
    for (const [key, val] of u.searchParams) {
      params.append(key, encodeURIComponent(val));
    }
    u.search = '?' + params.toString();
    return u.toString();
  } catch (e) {
    return uri;
  }
}

function parsePOSH(doc, baseURI) {
  // doc: Document or root element
  // baseURI: string
  const triples = [];
  const links = {};
  const baseUrl = new URL(baseURI);
  const baseOrigin = baseUrl.origin;
  let basePATH = baseURI;
  baseUrl.search = '';
  baseUrl.hash = '';
  if (baseURI.lastIndexOf('.') !== -1) {
    const path = baseUrl.pathname;
    if (path[path.length - 1] !== '/') baseUrl.pathname += '/';
  }
  basePATH = baseUrl.href;

  // Helper to normalize href/src
  function fix_href(n) {
    if (!n) return n;
    if (n.startsWith('http://') || n.startsWith('https://') || n.startsWith('mailto:')) return n;
    if (n.startsWith('#')) {
      const u = new URL(baseURI);
      u.hash = n;
      return u.toString();
    }
    if (n.startsWith('/')) return baseOrigin + n;
    return basePATH + n;
  }

  // Parse <title>
  const title = doc.querySelector('head > title');
  if (title) {
    triples.push({ s: '#this', p: 'title', o: title.textContent, literal: true });
  }

  // Parse <link> and <meta>
  doc.querySelectorAll('head > link, head > meta[name], head > meta[property]').forEach(el => {
    if (el.tagName === 'LINK') {
      const rel = el.getAttribute('rel');
      const rev = el.getAttribute('rev');
      let href = el.getAttribute('href');
      const type = el.getAttribute('type');
      if (href && rel && type && rel === 'alternate') {
        links[href] = type;
      }
      if (rel && href) {
        href = fix_href(href);
        const title = el.getAttribute('title');
        triples.push({ s: '#this', p: rel, o: href });
        triples.push({ s: href + '#this', p: 'rdf:type', o: 'schema:CreativeWork' });
        if (title) triples.push({ s: href + '#this', p: 'schema:name', o: title });
        if (type) triples.push({ s: href + '#this', p: 'schema:fileFormat', o: type });
      } else if (rev && href) {
        href = fix_href(href);
        triples.push({ s: href, p: rev, o: '#this' });
      }
    } else if (el.tagName === 'META') {
      const name = el.getAttribute('name') || el.getAttribute('property');
      const content = el.getAttribute('content');
      if (name && content) {
        const map = META_MAP[name];
        if (map) {
          const mappings = Array.isArray(map) ? map : [map];
          mappings.forEach(m => {
            let value = content;
            if (m.o === 'iri:content') value = fixUrlEncode(content);
            else if (m.o === 'cmd:content' && typeof m.cmd === 'function') value = m.cmd(content);
            // else 'val:content' or default
            triples.push({ s: '#this', p: m.p, o: value });
          });
        } else {
          triples.push({ s: '#this', p: name, o: content });
        }
      }
    }
  });

  // Facebook Vision images
  const facebookVision = 'Image may contain: ';
  doc.querySelectorAll(`img[alt^='${facebookVision}']`).forEach(el => {
    const src = el.getAttribute('src');
    const alt = el.getAttribute('alt');
    triples.push({ s: src + '#this', p: 'rdf:type', o: 'schema:ImageObject' });
    triples.push({ s: src + '#this', p: 'schema:mainEntityOfPage', o: src });
    triples.push({ s: src + '#this', p: 'schema:name', o: ' ' + src, literal: true });
    triples.push({ s: src + '#this', p: 'schema:description', o: alt.substring(facebookVision.length) });
    triples.push({ s: src + '#this', p: 'schema:url', o: src });
  });

  return { triples, links, prefixes: PREFIXES };
}

export default parsePOSH;
