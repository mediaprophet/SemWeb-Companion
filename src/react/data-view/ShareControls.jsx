import React from 'react';

export default function ShareControls({ onShare, t }) {
  return (
    <div className="osds-share-controls" style={{margin:'1em 0',display:'flex',gap:'1em',alignItems:'center'}}>
      <button className="btn btn-primary" onClick={onShare}>
        {t('share', 'Share')}
      </button>
      {/* Add more share options here if needed */}
    </div>
  );
}
