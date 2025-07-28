// Listen for command to open side panel (keyboard shortcut)
chrome.commands && chrome.commands.onCommand.addListener((command, tab) => {
  if (command === 'open-side-panel') {
    if (chrome.sidePanel && chrome.sidePanel.open) {
      chrome.sidePanel.open({ windowId: tab.windowId });
    } else {
      chrome.tabs.create({ url: chrome.runtime.getURL('sidebar.html') });
    }
  }
});
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
  // Add context menu item for creating semantic annotation from selection
  chrome.contextMenus.create({
    id: 'create-semantic-annotation',
    title: 'Create Semantic Annotation',
    contexts: ['selection']
  });
  // Enable side panel for all tabs by default
  if (chrome.sidePanel && chrome.sidePanel.setOptions) {
    chrome.tabs.query({}, (tabs) => {
      for (const tab of tabs) {
        chrome.sidePanel.setOptions({
          tabId: tab.id,
          path: 'sidebar.html',
          enabled: true
        });
      }
    });
  }
});

// Ensure side panel is enabled for new/updated tabs
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (chrome.sidePanel && chrome.sidePanel.setOptions) {
    chrome.sidePanel.setOptions({
      tabId,
      path: 'sidebar.html',
      enabled: true
    });
  }
});


chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'open-side-panel') {
    if (chrome.sidePanel && chrome.sidePanel.open) {
      chrome.sidePanel.open({ windowId: tab.windowId });
    } else {
      chrome.tabs.create({ url: chrome.runtime.getURL('sidebar.html') });
    }
  } else if (info.menuItemId === 'create-semantic-annotation' && info.selectionText) {
    // Send message to content script to create annotation with selected text
    chrome.tabs.sendMessage(tab.id, {
      type: 'CREATE_SEMANTIC_ANNOTATION',
      selection: info.selectionText,
      pageUrl: tab.url,
      pageTitle: tab.title
    });
  }
});

// Add more background logic as needed
