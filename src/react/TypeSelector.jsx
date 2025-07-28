import React from 'react';

export default function TypeSelector({ detectedTypes, selectedType, setSelectedType, t }) {
  if (!detectedTypes || detectedTypes.length === 0) return null;
  return (
    <div className="mb-3" style={{ maxWidth: 600 }}>
      <label htmlFor="type-select" className="form-label" style={{ fontWeight: 'bold' }}>
        {t('dataType', 'Data Type')}:
      </label>
      <select
        id="type-select"
        className="form-select"
        value={selectedType || ''}
        onChange={e => setSelectedType(e.target.value)}
        style={{ maxWidth: 300, display: 'inline-block', marginLeft: 8 }}
      >
        {detectedTypes.map(type => (
          <option key={type.key} value={type.key}>
            {type.label || type.key}
          </option>
        ))}
      </select>
    </div>
  );
}
