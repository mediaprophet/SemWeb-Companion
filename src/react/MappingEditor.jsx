import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import DataTable from './DataTable.jsx';

export default function MappingEditor({ value, onChange, type }) {
  const { t } = useTranslation();
  // value: { [source]: target }
  const [editing, setEditing] = useState('');
  const [editValue, setEditValue] = useState('');

  const handleAdd = () => {
    if (editing && editValue) {
      onChange({ ...value, [editing]: editValue });
      setEditing('');
      setEditValue('');
    }
  };
  const handleRemove = key => {
    const v = { ...value };
    delete v[key];
    onChange(v);
  };

  const columns = [
    { key: 'source', label: t('source', 'Source') },
    { key: 'target', label: t('target', 'Target') },
    { key: 'actions', label: '' }
  ];
  const data = Object.entries(value).map(([k, v]) => ({ source: k, target: v, actions: (
    <button className="btn btn-sm btn-danger" onClick={() => handleRemove(k)}>{t('remove', 'Remove')}</button>
  ) }));
  // Add row for new mapping
  data.push({
    source: <input className="form-control form-control-sm" value={editing} onChange={e => setEditing(e.target.value)} placeholder={t('sourceName', 'Source name')} />,
    target: <input className="form-control form-control-sm" value={editValue} onChange={e => setEditValue(e.target.value)} placeholder={t('targetIriOrLabel', 'Target IRI/label')} />,
    actions: <button className="btn btn-sm btn-primary" onClick={handleAdd}>{t('add', 'Add')}</button>
  });
  return (
    <div className="mapping-editor">
      <h6>{t('customMappings', 'Custom')} {type === 'csv' ? t('csvColumn', 'CSV Column') : t('metaTag', 'Meta Tag')} {t('mappings', 'Mappings')}</h6>
      <DataTable columns={columns} data={data} />
      <div className="form-text">{t('mapHelp', 'Map')} {type === 'csv' ? t('csvColumnHeaders', 'CSV column headers') : t('metaTagNames', 'meta tag names')} {t('toPropertyIrisOrLabels', 'to property IRIs or labels. These will be used during parsing.')}</div>
    </div>
  );
}
