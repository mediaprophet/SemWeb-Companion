import React from 'react';

export default function BulkFileManager({
  bulkFiles,
  bulkActiveIdx,
  bulkDragOver,
  bulkPreviewOpen,
  handleBulkFiles,
  handleDrop,
  handleDragOver,
  handleDragLeave,
  handleFileInput,
  setBulkActiveIdx,
  setBulkPreviewOpen,
  exportBulkFile,
  t
}) {
  return (
    <div className="bulk-file-manager">
      <div
        className={`bulk-dropzone${bulkDragOver ? ' drag-over' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{ border: '2px dashed #aaa', padding: '1em', marginBottom: '1em', background: bulkDragOver ? '#f0f8ff' : 'transparent' }}
      >
        <input type="file" multiple style={{ display: 'none' }} id="bulk-file-input" onChange={handleFileInput} />
        <label htmlFor="bulk-file-input" style={{ cursor: 'pointer' }}>
          {t ? t('dropOrSelectFiles', 'Drop files here or click to select') : 'Drop files here or click to select'}
        </label>
      </div>
      {bulkFiles.length > 0 && (
        <div className="bulk-files-list">
          <div style={{ marginBottom: '0.5em' }}>
            <button className="btn btn-sm btn-secondary" onClick={() => setBulkPreviewOpen(!bulkPreviewOpen)}>
              {bulkPreviewOpen ? (t ? t('hidePreview', 'Hide Preview') : 'Hide Preview') : (t ? t('showPreview', 'Show Preview') : 'Show Preview')}
            </button>
          </div>
          {bulkPreviewOpen && (
            <ul className="list-group">
              {bulkFiles.map((file, idx) => (
                <li key={file.name} className={`list-group-item${bulkActiveIdx === idx ? ' active' : ''}`} onClick={() => setBulkActiveIdx(idx)} style={{ cursor: 'pointer' }}>
                  <span>{file.name}</span>
                  {file.error && <span style={{ color: 'red', marginLeft: 8 }}>{file.error}</span>}
                  <div style={{ float: 'right' }}>
                    <button className="btn btn-sm btn-outline-primary" onClick={e => { e.stopPropagation(); exportBulkFile('json', file); }}>JSON</button>{' '}
                    <button className="btn btn-sm btn-outline-success" onClick={e => { e.stopPropagation(); exportBulkFile('csv', file); }}>CSV</button>{' '}
                    <button className="btn btn-sm btn-outline-info" onClick={e => { e.stopPropagation(); exportBulkFile('ttl', file); }}>Turtle</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
