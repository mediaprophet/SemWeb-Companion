import React from 'react';

export default function PerfStats({ perfStats, collapsed, toggle, t }) {
  return (
    <div className="osds-section" role="region" aria-labelledby="perf-heading">
      <div
        className="osds-section-header"
        id="perf-heading"
        tabIndex={0}
        role="button"
        aria-expanded={!collapsed.perf}
        aria-controls="perf-section-body"
        onClick={() => toggle('perf')}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle('perf'); } }}
        style={{cursor:'pointer',display:'flex',alignItems:'center'}}
      >
        <span style={{fontWeight:'bold',fontSize:'1.1em'}}>{t('performanceStats', 'Performance Stats')}</span>
        <span style={{marginLeft:'auto'}}>{collapsed.perf ? '▶' : '▼'}</span>
      </div>
      {!collapsed.perf && (
        <div className="osds-section-body" id="perf-section-body" style={{background:'#222',color:'#eee',padding:'1em',borderRadius:'6px',marginTop:'0.5em'}}>
          <table style={{width:'100%',color:'#fff',background:'none',borderCollapse:'collapse',fontSize:'0.98em'}}>
            <thead>
              <tr style={{borderBottom:'1px solid #444'}}>
                <th style={{textAlign:'left',padding:'0.3em 0.7em'}}>{t('type', 'Type')}</th>
                <th style={{textAlign:'right',padding:'0.3em 0.7em'}}>{t('fetchParseMs', 'Fetch+Parse (ms)')}</th>
                <th style={{textAlign:'right',padding:'0.3em 0.7em'}}>{t('normalizeMs', 'Normalize (ms)')}</th>
                <th style={{textAlign:'right',padding:'0.3em 0.7em'}}>{t('totalMs', 'Total (ms)')}</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(perfStats).map(([key, stat]) => (
                <tr key={key} style={{borderBottom:'1px solid #333'}}>
                  <td style={{padding:'0.3em 0.7em'}}>{key}</td>
                  <td style={{textAlign:'right',padding:'0.3em 0.7em'}}>{stat.fetchMs.toFixed(1)}</td>
                  <td style={{textAlign:'right',padding:'0.3em 0.7em'}}>{stat.normalizeMs.toFixed(1)}</td>
                  <td style={{textAlign:'right',padding:'0.3em 0.7em'}}>{stat.totalMs.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{marginTop:'0.7em',fontSize:'0.95em',color:'#aaa'}}>
            <b>{t('note', 'Note')}:</b> {t('timingNote', 'Times are measured in milliseconds for each data type (fetch/parse, normalization, total). Includes network and JS parsing overhead.')}
          </div>
        </div>
      )}
    </div>
  );
}
