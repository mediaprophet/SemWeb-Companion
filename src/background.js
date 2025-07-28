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
  console.log('SemWeb Companion extension installed.');
  // Add context menu item to open side panel
  chrome.contextMenus.create({
    id: 'open-side-panel',
  title: 'Open SemWeb Companion Side Panel',
    contexts: ['all']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'open-side-panel') {
    if (chrome.sidePanel && chrome.sidePanel.open) {
      chrome.sidePanel.open({ windowId: tab.windowId });
    } else {
      chrome.tabs.create({ url: chrome.runtime.getURL('sidebar.html') });
    }
  }
});

// Add more background logic as needed
