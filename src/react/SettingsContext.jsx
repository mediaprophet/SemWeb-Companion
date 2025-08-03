
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Settings } from '../settings.js';

const settings = new Settings();

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  // Centralized state for all settings keys used in the UI
  const [state, setState] = useState({});


  // All settings keys used in the UI and legacy settings
  const keys = [
    // UI and SuperLinks/SPARQL
    'ext.osds.uiterm.mode',
    'ext.osds.pref.user.chk',
    'ext.osds.pref.show_action',
    'ext.osds.handle_all',
    'ext.osds.handle_xml',
    'ext.osds.handle_csv',
    'ext.osds.handle_json',
    'ext.osds.pref.user.list',
    'ext.osds.pref.user',
    'ext.osds.sparql.url',
    'ext.osds.sparql.cmd',
    'ext.osds.sparql.query',
    'ext.osds.super_links.timeout',
    'ext.osds.super_links.sponge',
    'ext.osds.super_links.sponge_mode',
    'ext.osds.super_links.viewer',
    'ext.osds.super_links.highlight',
    'ext.osds.super_links.retries',
    'ext.osds.super_links.retries_timeout',
    'ext.osds.super_links.query',
    'ext.osds.super_links.endpoint',
    // Legacy chat/AI settings
    'osds.chatgpt_prompt',
    'ext.osds.chat-srv',
    'osds.chatgpt_model',
    'osds.chatgpt_openai_token',
    'osds.chatgpt_temp',
    'osds.chatgpt_max_tokens',
    'ext.osds.prompt-query',
    'ext.osds.gpt-model',
    'ext.osds.gpt-tokens',
    'ext.osds.prompt-lst',
    'ext.osds.def_prompt_inject',
    // Upload/SPARQL
    'upload_sparql_endpoint',
    'upload_sparql_timeout',
    'upload_sparql_graph',
    // Import/Export
    'ext.osds.import.url',
    'ext.osds.import.srv',
    'ext.osds.rww.edit.url',
    'ext.osds.sparql.url',
    // Misc legacy
    'ext.osds.auto_discovery',
    'ext.osds.jsonld_compact_rel',
  ];

  // Load all settings from chrome.storage.sync (or fallback) on mount
  useEffect(() => {
    const loadSettings = async () => {
      let loaded = {};
      if (typeof window !== 'undefined' && window.chrome && chrome.storage && chrome.storage.sync) {
        await new Promise(resolve => {
          chrome.storage.sync.get(keys, result => {
            loaded = { ...result };
            // Fallback to legacy Settings for missing keys
            keys.forEach(key => {
              if (loaded[key] === undefined) loaded[key] = settings.getValue(key);
            });
            setState(loaded);
            resolve();
          });
        });
      } else {
        // Fallback: just use legacy Settings
        keys.forEach(key => {
          loaded[key] = settings.getValue(key);
        });
        setState(loaded);
      }
    };
    loadSettings();
  }, []);

  // Listen for changes from other extension instances
  useEffect(() => {
    if (window.chrome && chrome.storage && chrome.storage.sync) {
      const handler = changes => {
        const updated = {};
        for (const key in changes) {
          if (keys.includes(key)) {
            updated[key] = changes[key].newValue;
          }
        }
        if (Object.keys(updated).length > 0) {
          setState(prev => ({ ...prev, ...updated }));
        }
      };
      chrome.storage.onChanged.addListener(handler);
      return () => chrome.storage.onChanged.removeListener(handler);
    }
  }, []);

  // Get a setting
  const get = useCallback(key => state[key], [state]);


  // Set a setting (updates context, legacy Settings, and chrome.storage.sync)
  const set = useCallback((key, value) => {
    setState(prev => ({ ...prev, [key]: value }));
    settings.setValue(key, value);
    if (window.chrome && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.set({ [key]: value });
    }
  }, []);

  // Default values for all settings keys
  const defaultValues = Object.fromEntries(keys.map(key => [key, settings.getDefaultValue ? settings.getDefaultValue(key) : undefined]));

  // Reset all settings to default values
  const reset = useCallback(() => {
    setState({ ...defaultValues });
    if (window.chrome && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.set({ ...defaultValues });
    }
    // Also update legacy Settings
    keys.forEach(key => settings.setValue(key, defaultValues[key]));
  }, []);

  // Expose context value
  const value = { state, get, set, reset };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
