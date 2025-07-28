// src/react/utils/harmonizeStructuredData.js
// Harmonizes various structured data types into a single JSON-LD @graph array

export function harmonizeStructuredData({ jsonld = [], openGraph = [], twitterMeta = [], url }) {
  // Start with all JSON-LD blocks as-is
  let graph = Array.isArray(jsonld) ? [...jsonld] : [jsonld];

  // Convert OpenGraph to JSON-LD (very basic mapping)
  if (openGraph && openGraph.length) {
    const ogObj = {};
    openGraph.forEach(({ property, content }) => {
      ogObj[property] = content;
    });
    graph.push({ '@type': 'OpenGraph', ...ogObj });
  }

  // Convert Twitter meta to JSON-LD (very basic mapping)
  if (twitterMeta && twitterMeta.length) {
    const twObj = {};
    twitterMeta.forEach(({ name, content }) => {
      twObj[name] = content;
    });
    graph.push({ '@type': 'TwitterCard', ...twObj });
  }

  // Always include the page URL
  if (url) {
    graph.push({ '@type': 'WebPage', url });
  }

  // Return as a JSON-LD @graph
  return {
    '@context': 'https://schema.org',
    '@graph': graph
  };
}
