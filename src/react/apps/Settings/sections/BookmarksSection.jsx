import React from 'react';

export default function BookmarksSection({ handleExportBookmarks, handleImportBookmarks, handleClearBookmarks, t }) {
  return (
    <div className="mb-3">
      <label className="form-label">{t('bookmarks', 'Bookmarks')}:</label>
      <div>
        <button className="btn btn-outline-primary btn-sm me-2" onClick={handleExportBookmarks}>{t('exportBookmarks', 'Export')}</button>
        <label className="btn btn-outline-secondary btn-sm me-2">
          {t('importBookmarks', 'Import')}
          <input type="file" accept="application/json" style={{ display: 'none' }} onChange={handleImportBookmarks} />
        </label>
        <button className="btn btn-outline-danger btn-sm" onClick={handleClearBookmarks}>{t('clearBookmarks', 'Clear')}</button>
      </div>
    </div>
  );
}
