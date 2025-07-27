// Debug: Global error and promise rejection handlers
window.addEventListener('error', function(event) {
  console.error('[Global Error]', event.message, 'at', event.filename + ':' + event.lineno + ':' + event.colno, event.error);
});
window.addEventListener('unhandledrejection', function(event) {
  console.error('[Unhandled Promise Rejection]', event.reason);
});
console.log('[DEBUG] settings.js loaded at', new Date().toISOString());
// Minimal legacy Settings class for fallback in SettingsContext
export class Settings {
  getValue(key) {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return undefined;
  }
  setValue(key, value) {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  }
}
