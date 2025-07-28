// Debug: Global error and promise rejection handlers
window.addEventListener('error', function(event) {
  console.error('[Global Error]', event.message, 'at', event.filename + ':' + event.lineno + ':' + event.colno, event.error);
});
window.addEventListener('unhandledrejection', function(event) {
  console.error('[Unhandled Promise Rejection]', event.reason);
});
console.log('[DEBUG] popup.js loaded at', new Date().toISOString());
// Global error handler for debugging
window.addEventListener('error', function(event) {
  console.error('[Global Error]', event.message, 'at', event.filename + ':' + event.lineno + ':' + event.colno, event.error);
});
window.addEventListener('unhandledrejection', function(event) {
  console.error('[Unhandled Promise Rejection]', event.reason);
});
console.log('[DEBUG] popup.js loaded at', new Date().toISOString());
// popup.js

document.addEventListener('DOMContentLoaded', () => {
  // Open side panel
  document.getElementById('open-sidepanel').addEventListener('click', () => {
    if (chrome && chrome.sidePanel && chrome.sidePanel.open) {
      chrome.sidePanel.open({ windowId: chrome.windows.WINDOW_ID_CURRENT });
    } else {
      // Fallback: open sidebar.html in a new tab
      chrome.tabs.create({ url: chrome.runtime.getURL('sidebar.html') });
    }
  });

  // Open options/settings
  document.getElementById('open-settings').addEventListener('click', () => {
    if (chrome && chrome.runtime && chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      // Fallback: open index.html in a new tab
      chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
    }
  });
});
