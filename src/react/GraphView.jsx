
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Table from 'react-bootstrap/Table';

// Utility: Convert JSON-LD to nodes/edges for React Flow
function jsonldToGraph(data) {
  const nodes = [];
  const edges = [];
  const nodeMap = {};
  let x = 100, y = 100, dx = 220;

  function addNode(id, label) {
    if (!nodeMap[id]) {
      nodeMap[id] = true;
      nodes.push({ id, position: { x, y }, data: { label } });
      x += dx;
    }
  }

  // Root node
  if (data['@id']) {
    addNode(data['@id'], data.name || data['@id']);
    if (data.knows && data.knows['@id']) {
      addNode(data.knows['@id'], data.knows.name || data.knows['@id']);
      edges.push({ id: 'e1', source: data['@id'], target: data.knows['@id'], label: 'knows' });
    }
  }
  return { nodes, edges };
}


import ReactFlow, { Background, Controls } from 'reactflow';

export default function GraphView() {
  const { t } = useTranslation();
  const [graph, setGraph] = useState({ nodes: [], edges: [] });
  const [raw, setRaw] = useState(null);
  const [view, setView] = useState('graph'); // 'graph' | 'table' | 'raw'


  useEffect(() => {
    // Try to get live JSON-LD from the current tab (if running as extension)
    const getLiveJsonLd = () => {
      if (window.chrome && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ type: 'GET_JSONLD' }, (response) => {
          if (response && response.jsonld && response.jsonld.length > 0) {
            // Use the first JSON-LD block for now
            setRaw(response.jsonld[0]);
            setGraph(jsonldToGraph(response.jsonld[0]));
          } else {
            // Fallback to sample data
            fetch('./sampleData.jsonld')
              .then(res => res.json())
              .then(data => {
                setRaw(data);
                setGraph(jsonldToGraph(data));
              });
          }
        });
      } else {
        // Not running as extension, fallback to sample data
        fetch('./sampleData.jsonld')
          .then(res => res.json())
          .then(data => {
            setRaw(data);
            setGraph(jsonldToGraph(data));
          });
      }
    };
    getLiveJsonLd();
  }, []);

  return (
    <div>
      <div className="mb-2">
        <button className={`btn btn-sm me-2 ${view === 'graph' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setView('graph')}>{t('graph', 'Graph')}</button>
        <button className={`btn btn-sm me-2 ${view === 'table' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setView('table')}>{t('table', 'Table')}</button>
        <button className={`btn btn-sm ${view === 'raw' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setView('raw')}>{t('raw', 'Raw')}</button>
      </div>
      {view === 'graph' && (
        <div style={{ width: '100%', height: 400 }}>
          <ReactFlow nodes={graph.nodes} edges={graph.edges} fitView>
            <Background />
            <Controls />
          </ReactFlow>
        </div>
      )}
      {view === 'table' && raw && (
        <div style={{ maxWidth: 600 }}>
          <Table striped bordered size="sm">
            <thead>
              <tr><th>{t('subject', 'Subject')}</th><th>{t('predicate', 'Predicate')}</th><th>{t('object', 'Object')}</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>{raw['@id']}</td>
                <td>{t('name', 'name')}</td>
                <td>{raw.name}</td>
              </tr>
              {raw.knows && (
                <tr>
                  <td>{raw['@id']}</td>
                  <td>{t('knows', 'knows')}</td>
                  <td>{raw.knows['@id']}</td>
                </tr>
              )}
              {raw.knows && (
                <tr>
                  <td>{raw.knows['@id']}</td>
                  <td>{t('name', 'name')}</td>
                  <td>{raw.knows.name}</td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      )}
      {view === 'raw' && raw && (
        <pre style={{ maxHeight: 400, overflow: 'auto', background: '#f8f9fa', padding: 12, borderRadius: 4 }}>{JSON.stringify(raw, null, 2)}</pre>
      )}
    </div>
  );
}
