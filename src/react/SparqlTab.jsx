import { useSolidAuth } from './solid/SolidAuthProvider.jsx';
import AlertMessage from './AlertMessage.jsx';


function SparqlTab() {
  const { get, set } = useSettings();
  const { isLoggedIn, webId, solidLogin, solidLogout, fetchProfile } = useSolidAuth();
  const [showConfirm, setShowConfirm] = useState(false);
  const [endpoint, setEndpoint] = useState(get('ext.osds.sparql.url') || '');
  const [defaultGraph, setDefaultGraph] = useState(get('ext.osds.sparql.default_graph') || '');
  const [query, setQuery] = useState(get('ext.osds.sparql.query') || '');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const handleRunQuery = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      // Use authenticated fetch if logged in, else fallback
      const fetcher = isLoggedIn ? window.solidAuthFetch || fetchProfile : fetch;
      const res = await (isLoggedIn ? fetchProfile : fetch)(endpoint, {
        method: 'POST',
        headers: {
          'Accept': 'application/sparql-results+json, application/json',
          'Content-Type': 'application/sparql-query',
        },
        body: query,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRevertDefaults = () => setShowConfirm(true);
  const doRevertDefaults = () => {
    setEndpoint(get('def_sparql_url') || 'https://linkeddata.uriburner.com/sparql/?query={query}&format=text%2Fx-html%2Btr');
    setDefaultGraph('');
    set('ext.osds.sparql.url', get('def_sparql_url') || 'https://linkeddata.uriburner.com/sparql/?query={query}&format=text%2Fx-html%2Btr');
    set('ext.osds.sparql.default_graph', '');
    set('ext.osds.sparql.cmd', get('def_sparql_cmd') || 'select');
    setQuery(get('def_sparql_qry_eav') || '');
    set('ext.osds.sparql.query', get('def_sparql_qry_eav') || '');
    setShowConfirm(false);
    setResult(null);
    setError(null);
  };

  return (
    <div className="sparql-tab p-4" role="region" aria-labelledby="sparql-heading">
      {/* Show login state for Solid pod endpoints */}
      {endpoint?.includes('solid') && !isLoggedIn && (
        <div className="alert alert-warning mb-2">Solid login required for this endpoint.</div>
      )}
      <h4 id="sparql-heading">{t('sparqlEndpoint')}</h4>
      <form aria-label={t('sparqlEndpoint') + ' ' + t('settings')} autoComplete="off">
        {/* Show login/logout buttons if endpoint is a Solid pod */}
        {endpoint?.includes('solid') && (
          <div className="mb-2">
            {isLoggedIn ? (
              <>
                <span className="me-2">Logged in as <a href={webId} target="_blank" rel="noopener noreferrer">{webId}</a></span>
                <button className="btn btn-outline-secondary btn-sm" onClick={solidLogout} type="button">Logout</button>
              </>
            ) : (
              <button className="btn btn-outline-primary btn-sm" onClick={() => solidLogin('https://solidcommunity.net')} type="button">Login with Solid</button>
            )}
          </div>
        )}
        <div className="mb-3">
          <label htmlFor="sparql-endpoint" className="form-label">{t('endpointUrl')}</label>
          <input
            id="sparql-endpoint"
            className="form-control form-control-sm"
            type="text"
            value={endpoint}
            onChange={e => setEndpoint(e.target.value)}
            placeholder="https://..."
            aria-label={t('endpointUrl')}
            aria-required="true"
          />
        </div>
        <div className="mb-3">
          <label htmlFor="sparql-default-graph" className="form-label">{t('defaultGraph')}</label>
          <input
            id="sparql-default-graph"
            className="form-control form-control-sm"
            type="text"
            value={defaultGraph}
            onChange={e => setDefaultGraph(e.target.value)}
            placeholder="https://..."
            aria-label={t('defaultGraph')}
            aria-required="false"
          />
        </div>
        <div className="mb-3">
          <label htmlFor="sparql-query" className="form-label">SPARQL Query:</label>
          <textarea
            id="sparql-query"
            className="form-control"
            style={{ width: '100%', height: 220, whiteSpace: 'nowrap' }}
            value={query}
            onChange={e => { setQuery(e.target.value); set('ext.osds.sparql.query', e.target.value); }}
            aria-label={t('sparqlEndpoint') + ' Query'}
            aria-required="false"
          />
        </div>
        <button className="btn btn-primary btn-sm me-2" type="button" onClick={handleRunQuery} aria-label={t('runQuery')} disabled={loading}>
          {loading ? t('running', 'Running...') : t('runQuery', 'Run Query')}
        </button>
        <div className="mt-2">
          {error && (
            <AlertMessage variant="danger" message={<><strong>Error:</strong> {error}</>}>
              <button className="btn btn-link btn-sm ms-2" onClick={() => window.location.reload()}>Retry</button>
            </AlertMessage>
          )}
          {result && result.head && result.results && (
            <div className="table-responsive mt-2">
              <table className="table table-bordered table-sm">
                <thead>
                  <tr>
                    {result.head.vars.map(v => <th key={v}>{v}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {result.results.bindings.map((row, i) => (
                    <tr key={i}>
                      {result.head.vars.map(v => <td key={v}>{row[v]?.value || ''}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {result && !result.head && (
            <pre className="bg-light p-2 mt-2" style={{ maxHeight: 300, overflow: 'auto' }}>{JSON.stringify(result, null, 2)}</pre>
          )}
        </div>
        <div className="mt-3">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={handleRevertDefaults}
            aria-label={t('revertToDefaults')}
          >
            {t('revertToDefaults')}
          </button>
          <ConfirmModal
            show={showConfirm}
            onClose={() => setShowConfirm(false)}
            onConfirm={doRevertDefaults}
            title={t('warning')}
            message={t('currentSettingDiscarded')}
            confirmText={t('ok')}
            cancelText={t('cancel')}
            confirmVariant="danger"
          />
        </div>
      </form>
    </div>
  );
}

export default SparqlTab;
