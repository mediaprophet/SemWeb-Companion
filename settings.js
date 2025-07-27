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
