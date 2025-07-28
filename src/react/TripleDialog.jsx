import React from 'react';

export default function TripleDialog({
  show,
  triple,
  editTriple,
  onEditChange,
  onSave,
  onDelete,
  onClose,
  t
}) {
  if (!show) return null;
  return (
    <div className="modal show" style={{ display: 'block', background: 'rgba(0,0,0,0.3)' }} tabIndex="-1" role="dialog">
      <div className="modal-dialog" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{t ? t('editTriple', 'Edit Triple') : 'Edit Triple'}</h5>
            <button type="button" className="close" onClick={onClose} aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label>{t ? t('subject', 'Subject') : 'Subject'}</label>
              <input className="form-control" value={editTriple[0] || ''} onChange={e => onEditChange(0, e.target.value)} />
            </div>
            <div className="form-group">
              <label>{t ? t('predicate', 'Predicate') : 'Predicate'}</label>
              <input className="form-control" value={editTriple[1] || ''} onChange={e => onEditChange(1, e.target.value)} />
            </div>
            <div className="form-group">
              <label>{t ? t('object', 'Object') : 'Object'}</label>
              <input className="form-control" value={editTriple[2] || ''} onChange={e => onEditChange(2, e.target.value)} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-primary" onClick={onSave}>{t ? t('save', 'Save') : 'Save'}</button>
            <button type="button" className="btn btn-danger" onClick={onDelete}>{t ? t('delete', 'Delete') : 'Delete'}</button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>{t ? t('cancel', 'Cancel') : 'Cancel'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
