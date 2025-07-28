import React from 'react';

export default function FilterInput({ value, onChange, t }) {
  return (
    <input
      className="form-control osds-filter-input"
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={t('filter', 'Filter...')}
      style={{margin:'0.5em 0',maxWidth:'300px'}}
      aria-label={t('filter', 'Filter')}
    />
  );
}
