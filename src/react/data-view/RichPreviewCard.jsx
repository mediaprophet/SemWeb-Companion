import React from 'react';

export default function RichPreviewCard({ data, t }) {
  return (
    <div className="osds-rich-preview-card" style={{border:'1px solid #ccc',borderRadius:'8px',padding:'1em',margin:'1em 0',background:'#fafafa'}}>
      <h4>{t('richPreview', 'Rich Preview')}</h4>
      <pre style={{whiteSpace:'pre-wrap',wordBreak:'break-all',background:'#222',color:'#fff',padding:'0.7em',borderRadius:'6px'}}>
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
