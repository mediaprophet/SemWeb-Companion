import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DataFactory, Store, Parser } from 'n3';
import { Engine } from 'sparql-engine';

export default function LocalSparqlTab({ triples }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('SELECT * WHERE { ?s ?p ?o } LIMIT 20');
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Convert triples to N3 Store
  function triplesToStore(triples) {
    const store = new Store();
    triples.forEach(([s, p, o]) => {
      store.addQuad(DataFactory.namedNode(s), DataFactory.namedNode(p), DataFactory.literal(o));
    });
    return store;
  }

  const handleRunQuery = async () => {
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const store = triplesToStore(triples);
      const engine = new Engine(store);
      const resultStream = await engine.execute(query);
      const rows = [];
      resultStream.on('data', row => rows.push(row));
      resultStream.on('end', () => setResults(rows));
      resultStream.on('error', err => setError(err.message));
    } catch (e) {
      setError(e.message);
    } finally {
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
