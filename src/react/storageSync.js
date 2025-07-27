// Cross-browser storage sync utility for bookmarks/annotations
// Tries browser.storage.sync, then chrome.storage.sync, then localStorage

export async function getSyncItem(key, fallback = null) {
  if (typeof browser !== 'undefined' && browser.storage && browser.storage.sync) {
    try {
      const result = await browser.storage.sync.get(key);
      return result[key] !== undefined ? result[key] : fallback;
    } catch {}
  }
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
    return new Promise(resolve => {
      chrome.storage.sync.get([key], result => {
        resolve(result[key] !== undefined ? result[key] : fallback);
      });
    });
  }
  // Fallback to localStorage
  try {
    const val = localStorage.getItem(key);
    return val !== null ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}

export async function setSyncItem(key, value) {
  if (typeof browser !== 'undefined' && browser.storage && browser.storage.sync) {
    try {
      await browser.storage.sync.set({ [key]: value });
      return;
    } catch {}
  }
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
    chrome.storage.sync.set({ [key]: value });
    return;
  }
  // Fallback to localStorage
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}
