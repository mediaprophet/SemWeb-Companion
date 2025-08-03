// src/react/GraphOverlay.js
// Injected into the page as a floating overlay for graph visualization
import React, { useEffect } from 'react';
import GraphView from './GraphView.jsx';

export default function GraphOverlay({ onClose, data }) {
  useEffect(() => {
    // Prevent background scroll
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.45)', zIndex: 999999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff', borderRadius: 10, boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
        padding: 24, minWidth: 340, maxWidth: 700, maxHeight: '90vh', overflow: 'auto', position: 'relative',
      }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 10, right: 10, background: '#eee', border: 'none', borderRadius: '50%', width: 32, height: 32, fontSize: 20, cursor: 'pointer', zIndex: 10001 }}
          title="Close"
        >×</button>
        <GraphView data={data} />
      </div>
    </div>
  );
}
