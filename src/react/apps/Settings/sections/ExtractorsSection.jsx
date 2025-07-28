
import React from 'react';
import { useTranslation } from 'react-i18next';

export default function ExtractorsSection({ extractors, enabledExtractors, setEnabledExtractors }) {
  const { t } = useTranslation();

  const extractorState = (key) => !!enabledExtractors[key];
  function handleToggleExtractor(key) {
    setEnabledExtractors(prev => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="mb-3">
      <label className="form-label">{t('extractors', 'Data Extractors')}:</label>
      <div>
        {extractors.map(ex => (
          <label key={ex.key} className="form-check form-check-inline">
            <input
              className="form-check-input"
              type="checkbox"
              checked={extractorState(ex.key)}
              onChange={() => handleToggleExtractor(ex.key)}
            />
            {ex.label}
          </label>
        ))}
      </div>
    </div>
  );
}
