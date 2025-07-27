// popup.js

document.addEventListener('DOMContentLoaded', () => {
  // Update summary if available from background/content script
  const summary = document.getElementById('summary');
  // Example: request summary from background (stub)
  if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
    chrome.runtime.sendMessage({ type: 'GET_DATA_SUMMARY' }, (response) => {
      if (response && response.summary) {
        summary.textContent = response.summary;
      } else {
        summary.textContent = 'No structured data detected.';
      }
    });
  } else {
    summary.textContent = 'No structured data detected.';
  }

  // Open side panel
  document.getElementById('open-sidepanel').addEventListener('click', () => {
    if (chrome && chrome.sidePanel) {
      chrome.sidePanel.open({ windowId: chrome.windows.WINDOW_ID_CURRENT });
    } else {
      alert('Side panel API not available.');
    }
  });

  // Open options/settings
  document.getElementById('open-settings').addEventListener('click', () => {
    if (chrome && chrome.runtime && chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    }
  });

  // Export/copy action (stub)
  document.getElementById('export-data').addEventListener('click', () => {
    alert('Export/copy functionality coming soon!');
  });
});
