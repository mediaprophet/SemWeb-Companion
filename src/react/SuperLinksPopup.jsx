import React, { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Table from 'react-bootstrap/Table';

/**
 * SuperLinksPopup - Modal dialog for displaying SuperLinks results and actions.
 * Props:
 *   show: boolean - whether the modal is visible
 *   onClose: function - called to close the modal
 *   links: array - SuperLinks result data
 *   onHighlight: function - called to highlight a term in the page
 */
export default function SuperLinksPopup({ show, onClose, links = [], onHighlight, onAsk }) {
  const [filters, setFilters] = useState({ word: '', association: '', source: '', type: '' });
  const [sort, setSort] = useState({ col: null, dir: 'asc' });

  // Filtering
  let filteredLinks = links.filter(row => {
    return (!filters.word || (row.word || '').toLowerCase().includes(filters.word.toLowerCase())) &&
           (!filters.association || (row.association || '').toLowerCase().includes(filters.association.toLowerCase())) &&
           (!filters.source || (row.source || '').toLowerCase().includes(filters.source.toLowerCase())) &&
           (!filters.type || (row.type || '').toLowerCase().includes(filters.type.toLowerCase()));
  });

  // Sorting
  if (sort.col) {
    filteredLinks = [...filteredLinks].sort((a, b) => {
      const valA = (a[sort.col] || '').toLowerCase();
      const valB = (b[sort.col] || '').toLowerCase();
      if (valA < valB) return sort.dir === 'asc' ? -1 : 1;
      if (valA > valB) return sort.dir === 'asc' ? 1 : -1;
      return 0;
    });
  }

  const handleFilterChange = (col, value) => setFilters(f => ({ ...f, [col]: value }));
  const handleSort = col => {
    setSort(s => s.col === col ? { col, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: 'asc' });
  };
  const clearFilters = () => setFilters({ word: '', association: '', source: '', type: '' });

  return (
    <Modal show={show} onHide={onClose} size="lg" aria-labelledby="superlinks-modal-title" centered>
      <Modal.Header closeButton>
        <Modal.Title id="superlinks-modal-title">SuperLinks Results</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-2 d-flex align-items-center">
          <span className="me-2">Filter:</span>
          <input
            type="text"
            className="form-control form-control-sm me-2"
            placeholder="Word"
            value={filters.word}
            onChange={e => handleFilterChange('word', e.target.value)}
            style={{ maxWidth: 120 }}
            aria-label="Filter by word"
          />
          <input
            type="text"
            className="form-control form-control-sm me-2"
            placeholder="Association"
            value={filters.association}
            onChange={e => handleFilterChange('association', e.target.value)}
            style={{ maxWidth: 120 }}
            aria-label="Filter by association"
          />
          <input
            type="text"
            className="form-control form-control-sm me-2"
            placeholder="Source"
            value={filters.source}
            onChange={e => handleFilterChange('source', e.target.value)}
            style={{ maxWidth: 120 }}
            aria-label="Filter by source"
          />
          <input
            type="text"
            className="form-control form-control-sm me-2"
            placeholder="Type"
            value={filters.type}
            onChange={e => handleFilterChange('type', e.target.value)}
            style={{ maxWidth: 120 }}
            aria-label="Filter by type"
          />
          <button className="btn btn-outline-secondary btn-sm" onClick={clearFilters} type="button">Clear</button>
        </div>
        <Table striped bordered hover size="sm">
          <thead>
            <tr>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('word')}>
                Word {sort.col === 'word' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('association')}>
                Association {sort.col === 'association' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('source')}>
                Source {sort.col === 'source' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('type')}>
                Type {sort.col === 'type' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th>ChatGPT</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLinks.length === 0 ? (
              <tr><td colSpan={6} className="text-center">No results</td></tr>
            ) : (
              filteredLinks.map((row, idx) => (
                <tr key={idx}>
                  <td>
                    {row.wordHref ? (
                      <a href={row.wordHref} target="_blank" rel="noopener noreferrer">{row.word}</a>
                    ) : row.word}
                  </td>
                  <td>
                    {row.associationHref ? (
                      <a href={row.associationHref} target="_blank" rel="noopener noreferrer">{row.association}</a>
                    ) : row.association}
                  </td>
                  <td>
                    {row.sourceHref ? (
                      <a href={row.sourceHref} target="_blank" rel="noopener noreferrer">{row.source}</a>
                    ) : row.source}
                  </td>
                  <td>
                    {row.typeHref ? (
                      <a href={row.typeHref} target="_blank" rel="noopener noreferrer">{row.type}</a>
                    ) : row.type}
                  </td>
                  <td>
                    <button className="btn btn-sm btn-outline-success" onClick={() => onAsk ? onAsk(row.word) : alert('ChatGPT integration coming soon!')}>
                      Ask
                    </button>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary me-2" onClick={() => onHighlight(row.word)}>
                      Highlight
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </Modal.Body>
      <Modal.Footer>
        <button className="btn btn-secondary" onClick={onClose}>Close</button>
      </Modal.Footer>
    </Modal>
  );
}
