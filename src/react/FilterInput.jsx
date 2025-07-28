import React from 'react';

export default function FilterInput({ column, t }) {
  const columnFilterValue = column.getFilterValue() || '';
  return (
    <input
      value={columnFilterValue}
      onChange={e => column.setFilterValue(e.target.value)}
      placeholder={t ? t('filter', 'Filter...') : 'Filter...'}
      style={{ width: '100%' }}
    />
  );
}
