// Debug: Global error and promise rejection handlers
self.addEventListener('error', function(event) {
  console.error('[Service Worker Error]', event.message, 'at', event.filename + ':' + event.lineno + ':' + event.colno, event.error);
});
self.addEventListener('unhandledrejection', function(event) {
  console.error('[Service Worker Unhandled Promise Rejection]', event.reason);
});
console.log('[DEBUG] background.js loaded at', new Date().toISOString());
// background.js (service worker for Chrome extension)

chrome.runtime.onInstalled.addListener(() => {
  console.log('Structured Data Sniffer extension installed.');
});

// Add more background logic as needed
