// src/react/utils/bookmarkUtils.js
// Utility to save a semantic bookmark (structured data + metadata) to chrome.storage

export function createSemanticBookmark({ url, title, structuredData, date = new Date() }) {
  const bookmark = {
    url,
    title,
    structuredData,
    date: date.toISOString(),
  };
  // Save to chrome.storage.local under 'semanticBookmarks'
  return new Promise((resolve, reject) => {
    chrome.storage.local.get({ semanticBookmarks: [] }, (result) => {
      const bookmarks = result.semanticBookmarks || [];
      bookmarks.push(bookmark);
      chrome.storage.local.set({ semanticBookmarks: bookmarks }, () => {
        resolve(bookmark);
      });
    });
  });
}
