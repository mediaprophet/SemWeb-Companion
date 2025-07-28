// content-script.js: Extracts structured data from the current page and sends it to the extension

function extractJSONLD() {
  return Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
    .map(el => {
      try { return JSON.parse(el.textContent); } catch { return null; }
    })
    .filter(Boolean);
}
function extractOpenGraph() {
  return Array.from(document.querySelectorAll('meta[property^="og:"]'))
    .map(el => ({ property: el.getAttribute('property'), content: el.getAttribute('content') }));
}
function extractTwitterMeta() {
  return Array.from(document.querySelectorAll('meta[name^="twitter:"]'))
    .map(el => ({ name: el.getAttribute('name'), content: el.getAttribute('content') }));
}
// Add more extractors as needed (Microdata, RDFa, etc.)


// Extract all structured data on demand
function getAllStructuredData() {
  return {
    jsonld: extractJSONLD(),
    openGraph: extractOpenGraph(),
    twitterMeta: extractTwitterMeta(),
    url: window.location.href
  };
}

// Listen for requests from popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'GET_STRUCTURED_DATA_SUMMARY') {
    const all = getAllStructuredData();
    // Return a summary: type counts
    const summary = {
      jsonld: all.jsonld.length,
      openGraph: all.openGraph.length,
      twitterMeta: all.twitterMeta.length
    };
    sendResponse(summary);
    return true;
  }
  if (msg && msg.type === 'GET_STRUCTURED_DATA_FULL') {
    const all = getAllStructuredData();
    sendResponse(all);
    return true;
  }
});

// Listen for annotation creation requests
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'CREATE_SEMANTIC_ANNOTATION' && msg.selection) {
    const annotation = {
      text: msg.selection,
      url: msg.pageUrl,
      title: msg.pageTitle,
      date: new Date().toISOString(),
      context: window.location.href
    };
    chrome.storage.local.get({ semanticAnnotations: [] }, (result) => {
      const annotations = result.semanticAnnotations || [];
      annotations.push(annotation);
      chrome.storage.local.set({ semanticAnnotations: annotations }, () => {
        sendResponse({ success: true });
      });
    });
    // Indicate async response
    return true;
  }
});
