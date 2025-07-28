// src/config.js
// Centralized configuration for all URLs and endpoints

export const NAMESPACES = {
  xhv: "http://www.w3.org/1999/xhtml/vocab#",
  rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
  rdfs: "http://www.w3.org/2000/01/rdf-schema#",
  owl: "http://www.w3.org/2002/07/owl#",
  xsd: "http://www.w3.org/2001/XMLSchema#",
  skos: "http://www.w3.org/2004/02/skos/core#",
  dct: "http://purl.org/dc/terms/"
};

export const SERVICE_URLS = {
  github: "https://github.com/mediaprophet/semweb-companion",
  solidOpenlink: "https://solid.openlinksw.com",
  bootstrapCdn: "https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css",
  corsProxies: [
    "https://corsproxy.io/?",
    "https://api.allorigins.win/raw?url="
  ],
  defaultSparql: "https://linkeddata.uriburner.com/sparql/?query={query}&format=text%2Fx-html%2Btr",
  solidCommunity: "https://solidcommunity.net"
};

// Add more as needed for other endpoints or external resources
