import React from 'react';

export default function RdfXmlImportExport({
  t,
  importRDFXML,
  clearRdfxmlImport,
  rdfxmlImportTriples,
  rdfxmlImportErrors,
  rdfxmlImportShowErrors,
  setRdfxmlImportShowErrors,
  addImportedTriplesToMain
}) {
  return (
    <div style={{marginBottom: '1em', background: '#f8f8ff', padding: '1em', borderRadius: 6, border: '1px solid #ccc'}}>
      <label htmlFor="rdfxml-import" style={{fontWeight:'bold',marginRight:8}}>{t('importRdfXml', 'Import RDF/XML')}:</label>
      <input id="rdfxml-import" type="file" accept=".rdf,.xml,application/rdf+xml" onChange={importRDFXML} />
      <button onClick={clearRdfxmlImport} style={{marginLeft:8}} disabled={!rdfxmlImportTriples && rdfxmlImportErrors.length === 0}>{t('clear', 'Clear')}</button>
      {rdfxmlImportErrors.length > 0 && (
        <div style={{color:'red',marginTop:8}}>
          <b>{t('importErrors', 'Import Errors')}:</b>
          <button onClick={() => setRdfxmlImportShowErrors(v => !v)} style={{marginLeft:8}}>{rdfxmlImportShowErrors ? t('hideDetails', 'Hide Details') : t('showDetails', 'Show Details')}</button>
          {rdfxmlImportShowErrors && (
            <ul style={{margin:0,paddingLeft:18}}>
              {rdfxmlImportErrors.map((err,i) => <li key={i}>{err.message}<br/>{err.context && err.context.error ? <span style={{fontSize:'0.9em',color:'#a00'}}>{err.context.error}</span> : null}</li>)}
            </ul>
          )}
        </div>
      )}
      {rdfxmlImportTriples && (
        <div style={{marginTop:8}}>
          <b>{t('importedTriples', 'Imported Triples')}:</b>
          <pre style={{background:'#eee',padding:'0.5em',borderRadius:4,maxHeight:200,overflow:'auto'}}>
            {typeof rdfxmlImportTriples === 'string' ? rdfxmlImportTriples : JSON.stringify(rdfxmlImportTriples, null, 2)}
          </pre>
          <button onClick={addImportedTriplesToMain} style={{marginTop:8}}>{t('addToMainView', 'Add Imported Triples to Main View')}</button>
        </div>
      )}
    </div>
  );
}
