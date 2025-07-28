import React from 'react';

export default function UrlInput({ fetchUrl, setFetchUrl, fetchLoading, fetchError, onParse, t }) {
  return (
    <form className="d-flex align-items-center gap-2 mb-3" onSubmit={onParse} style={{maxWidth: 600}}>
      <input
        type="url"
        className="form-control"
        placeholder={t('enterUrl', 'Enter a URL to parse...')}
        value={fetchUrl}
        onChange={e => setFetchUrl(e.target.value)}
        style={{ minWidth: 280 }}
        required
      />
      <button className="btn btn-primary" type="submit" disabled={fetchLoading}>
        {fetchLoading ? t('parsing', 'Parsing...') : t('parse', 'Parse')}
      </button>
      {fetchError && <span className="text-danger ms-2">{fetchError}</span>}
    </form>
  );
}
