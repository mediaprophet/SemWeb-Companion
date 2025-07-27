import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as $rdf from 'rdflib';

export default function LocalSparqlTab({ triples }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('SELECT * WHERE { ?s ?p ?o } LIMIT 20');
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);


  // Convert triples to rdflib.js Store
  function triplesToStore(triples) {
    const store = $rdf.graph();
    triples.forEach(([s, p, o]) => {
      store.add($rdf.sym(s), $rdf.sym(p), $rdf.literal(o));
    });
    return store;
  }

  const handleRunQuery = async () => {
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const store = triplesToStore(triples);
      const queryService = $rdf.SPARQLToQuery(query, false, store);
      const resultsArr = [];
      store.query(queryService, result => {
        resultsArr.push(result);
      }, undefined, () => {
        setResults(resultsArr);
        setLoading(false);
      });
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  return (
    <div className="local-sparql-tab p-3">
      <h5>{t('sparqlQueryLocalTriples', 'SPARQL Query (Local Triples)')}</h5>
      <textarea className="form-control mb-2" style={{ width: '100%', height: 120 }} value={query} onChange={e => setQuery(e.target.value)} />
      <button className="btn btn-primary btn-sm mb-2" onClick={handleRunQuery} disabled={loading}>{loading ? t('running', 'Running...') : t('runQuery', 'Run Query')}</button>
      {error && <div className="alert alert-danger py-2">{error}</div>}
      {results && results.length > 0 && (
        <div className="table-responsive mt-2">
          <table className="table table-bordered table-sm">
            <thead>
              <tr>{Object.keys(results[0]).map(v => <th key={v}>{v}</th>)}</tr>
            </thead>
            <tbody>
              {results.map((row, i) => (
                <tr key={i}>{Object.keys(row).map(v => <td key={v}>{row[v].value}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {results && results.length === 0 && <div className="alert alert-info py-2">{t('noResults', 'No results.')}</div>}
    </div>
  );
}
