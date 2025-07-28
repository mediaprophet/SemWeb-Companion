import React from 'react';

export default function RawDataView({ raw, collapsed, toggle, t, codeCopyMsg, handleCopyCode }) {
  return (
    <div className="osds-section" role="region" aria-labelledby="code-heading">
      <div
        className="osds-section-header"
        id="code-heading"
        tabIndex={0}
        role="button"
        aria-expanded={!collapsed.code}
        aria-controls="code-section-body"
        onClick={() => toggle('code')}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle('code'); } }}
        style={{cursor:'pointer',display:'flex',alignItems:'center'}}
      >
        <span style={{fontWeight:'bold',fontSize:'1.1em'}}>{t('rawApiCodeView', 'Raw API / Code View')}</span>
        <span style={{marginLeft:'auto'}}>{collapsed.code ? '▶' : '▼'}</span>
      </div>
      {!collapsed.code && (
        <div className="osds-section-body" id="code-section-body" style={{background:'#222',color:'#eee',padding:'1em',borderRadius:'6px',marginTop:'0.5em'}}>
          <div style={{marginBottom:'0.5em',display:'flex',gap:'0.5em'}}>
            <button className="osds-animated-btn" onClick={() => handleCopyCode('json')} aria-label={t('copyAsJson', 'Copy as JSON')}>{t('copyAsJson', 'Copy as JSON')}</button>
            <button className="osds-animated-btn" onClick={() => handleCopyCode('triples')} aria-label={t('copyAsTriples', 'Copy as Triples')}>{t('copyAsTriples', 'Copy as Triples')}</button>
            <button className="osds-animated-btn" onClick={() => handleCopyCode('turtle')} aria-label={t('copyAsTurtle', 'Copy as Turtle')}>{t('copyAsTurtle', 'Copy as Turtle')}</button>
            {codeCopyMsg && <div className="osds-toast" aria-live="polite">{codeCopyMsg}</div>}
          </div>
          <pre style={{maxHeight:'320px',overflow:'auto',background:'#181818',color:'#fff',padding:'1em',borderRadius:'4px',fontSize:'0.95em'}} aria-label="Raw JSON code block">
            {JSON.stringify(raw, null, 2)}
          </pre>
          <div style={{marginTop:'1em',fontSize:'0.95em',color:'#aaa'}}>
            <b>{t('forLlmsAdvanced', 'For LLMs/Advanced')}:</b> {t('llmInstructions', 'Use the above JSON as input, or request triples (tab-separated) or Turtle serialization.')} <br/>
            <b>{t('programmaticAccess', 'Programmatic access')}:</b> {t('programmaticInstructions', 'Use')} <code>window.osdsData</code> {t('programmaticInstructions2', 'in the console for the current structured data object.')}
          </div>
        </div>
      )}
    </div>
  );
}
