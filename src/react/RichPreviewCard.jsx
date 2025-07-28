import React from 'react';

export default function RichPreviewCard({ data }) {
  if (!data) return null;
  // Simple pretty-print for JSON-LD, Open Graph, Twitter Card, etc.
  return (
    <div className="card" style={{ margin: '1.5em 0', background: '#f8f9fa', border: '1px solid #e0e0e0' }}>
      <div className="card-body">
        <pre style={{ margin: 0, fontSize: '1em', background: 'none', border: 'none' }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
}
