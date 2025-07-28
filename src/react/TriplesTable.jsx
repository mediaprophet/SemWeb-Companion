import React from 'react';

export default function TriplesTable({ table, columns, t, isDark, onEdit, onDelete, onDialog, FilterInput }) {
  return (
    <div className="osds-table-section" style={{ margin: '1.5em 0' }}>
      <div className="osds-table-wrapper" style={{ overflowX: 'auto' }}>
        <table className={`osds-table table table-striped table-bordered${isDark ? ' table-dark' : ''}`} style={{ minWidth: 600 }}>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id} style={{ verticalAlign: 'middle' }}>
                    {header.isPlaceholder ? null : (
                      <>
                        {header.column.columnDef.header}
                        <div>{header.column.getCanFilter() ? <FilterInput column={header.column} /> : null}</div>
                      </>
                    )}
                  </th>
                ))}
                <th>{t('actions', 'Actions')}</th>
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id}>{cell.renderCell()}</td>
                ))}
                <td>
                  <button className="btn btn-sm btn-outline-primary me-1" onClick={() => onEdit(row.index)}>{t('edit', 'Edit')}</button>
                  <button className="btn btn-sm btn-outline-danger me-1" onClick={() => onDelete(row.index)}>{t('delete', 'Delete')}</button>
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => onDialog(row.index)}>{t('details', 'Details')}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
