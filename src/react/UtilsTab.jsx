
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as dataUtils from './utils/dataUtils';
import parsePOSH from './utils/parsePOSH';
import { useSettings } from './SettingsContext.jsx';

export default function UtilsTab() {
  const { t } = useTranslation();
  const { get, set } = useSettings();
  // Example usage of utilities
  const sampleTriples = [
    { s: 'http://example.org/a', p: 'http://example.org/b', o: 'http://example.org/c' },
    { s: 'http://example.org/a', p: 'http://example.org/b', o: 'Literal value' }
  ];
  const graph = dataUtils.triplesToGraph(sampleTriples);

  const [sparqlResult, setSparqlResult] = useState(null);
  const [sparqlLoading, setSparqlLoading] = useState(false);

  // For line numbers in textarea
  const sparqlQuery = get('ext.osds.super_links.query') || '';
  const sparqlLines = sparqlQuery.split('\n');

  // Run SPARQL query handler
  async function handleRunSparql() {
    setSparqlLoading(true);
    setSparqlResult(null);
    try {
      const endpoint = get('ext.osds.super_links.endpoint') || get('ext.osds.sparql.url') || '';
      let query = get('ext.osds.super_links.query') || '';
      if (!endpoint || !query) throw new Error('Endpoint or query not set.');
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Accept': 'application/sparql-results+json, application/json',
          'Content-Type': 'application/sparql-query',
        },
        body: query,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data = await res.json();
      setSparqlResult(data);
    } catch (e) {
      setSparqlResult({ error: e.message });
    } finally {
      setSparqlLoading(false);
    }
  }

  return (
    <>
      <div className="utils-tab p-4">
        <h4>{t('utils', 'Utilities')}</h4>

              {/* SuperLinks Query Settings UI moved from SuperLinksTab */}
              <section className="mb-4">
                <h5>{t('superLinksQuerySettings', 'SuperLinks Query Settings')}</h5>
                {/* ...existing settings code... */}
                <div className="mb-3 row">
                  <div className="col-12 fw-bold">{t('sparqlQuery', 'SPARQL Query:')}</div>
                  <div className="col-12" style={{ position: 'relative', display: 'flex', alignItems: 'stretch' }}>
                    {/* Line numbers */}
                    <div style={{
                      background: '#f8f9fa',
                      color: '#888',
                      textAlign: 'right',
                      padding: '8px 6px',
                      borderRadius: '4px 0 0 4px',
                      userSelect: 'none',
                      fontFamily: 'monospace',
                      fontSize: 13,
                      minWidth: 32,
                      border: '1px solid #ced4da',
                      borderRight: 'none',
                      height: 220,
                      overflow: 'hidden',
                      lineHeight: '1.5',
                    }}>
                      {sparqlLines.map((_, i) => (
                        <div key={i}>{i + 1}</div>
                      ))}
                    </div>
                    {/* Textarea */}
                    <textarea
                      className="form-control"
                      style={{
                        width: '100%',
                        height: 220,
                        whiteSpace: 'pre',
                        borderRadius: '0 4px 4px 0',
                        borderLeft: 'none',
                        fontFamily: 'monospace',
                        fontSize: 13,
                        resize: 'vertical',
                      }}
                      value={sparqlQuery}
                      onChange={e => set('ext.osds.super_links.query', e.target.value)}
                      aria-label={t('sparqlEndpoint') + ' Query'}
                      aria-required="false"
                    />
                  </div>
                  <div className="col-12 mt-2">
                    <button className="btn btn-primary btn-sm me-2" onClick={handleRunSparql} disabled={sparqlLoading} type="button">
                      {sparqlLoading ? t('running', 'Running...') : t('run', 'Run')}
                    </button>
                  </div>
                  <div className="col-12 mt-2">
                    {sparqlResult && (
                      <pre className="bg-light p-2 mt-2" style={{ maxHeight: 300, overflow: 'auto' }}>{typeof sparqlResult === 'object' ? JSON.stringify(sparqlResult, null, 2) : String(sparqlResult)}</pre>
                    )}
                  </div>
                </div>
              </section>
              <section className="mb-4">
                <h5>{t('dataNormalization', 'Data Normalization')}</h5>
                <pre style={{ background: '#f8f9fa', padding: 12, borderRadius: 4 }}>
                  {JSON.stringify(graph, null, 2)}
                </pre>
              </section>
              <section className="mb-4">
                <h5>{t('isIRI', 'IRI Check')}</h5>
                <div>
                  <code>http://example.org/a</code>: {String(dataUtils.isIRI('http://example.org/a'))}<br />
                  <code>not-an-iri</code>: {String(dataUtils.isIRI('not-an-iri'))}
                </div>
              </section>
              <section className="mb-4">
                <h5>{t('parsePOSH', 'Parse POSH')}</h5>
                <div>
                  <em>{t('parsePOSHDesc', 'Run parsePOSH on the current document in the browser console.')}</em>
                </div>
                      </section>
                    </div>
                  </>
                );
        }
