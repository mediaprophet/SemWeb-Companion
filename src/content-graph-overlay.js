// content-graph-overlay.js
// Injects a React-based graph overlay into the current page when requested by the extension

let overlayRoot = null;

function removeOverlay() {
  if (overlayRoot) {
    overlayRoot.remove();
    overlayRoot = null;
  }
}

function injectOverlay(graphData) {
  removeOverlay();
  overlayRoot = document.createElement('div');
  overlayRoot.id = 'osds-graph-overlay-root';
  document.body.appendChild(overlayRoot);

  // Use React to render the overlay
  window.React = window.React || require('react');
  window.ReactDOM = window.ReactDOM || require('react-dom');
  const GraphOverlay = require('./react/GraphOverlay.js').default;

  window.ReactDOM.render(
    window.React.createElement(GraphOverlay, { onClose: removeOverlay, data: graphData }),
    overlayRoot
  );
}

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'SHOW_GRAPH_OVERLAY') {
    injectOverlay(msg.data || {});
    sendResponse({ success: true });
    return true;
  }
  if (msg && msg.type === 'HIDE_GRAPH_OVERLAY') {
    removeOverlay();
    sendResponse({ success: true });
    return true;
  }
});
