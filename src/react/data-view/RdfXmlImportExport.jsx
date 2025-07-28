import React from 'react';

export default function RdfXmlImportExport({ onImport, onExport, t }) {
  return (
    <div className="osds-rdfxml-import-export" style={{margin:'1em 0',display:'flex',gap:'1em',alignItems:'center'}}>
      <button className="btn btn-secondary" onClick={onImport}>
        {t('importRdfXml', 'Import RDF/XML')}
      </button>
      <button className="btn btn-secondary" onClick={onExport}>
        {t('exportRdfXml', 'Export RDF/XML')}
      </button>
    </div>
  );
}
