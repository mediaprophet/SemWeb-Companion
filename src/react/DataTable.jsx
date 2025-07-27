import React from 'react';
import PropTypes from 'prop-types';

/**
 * Generic table component for displaying tabular data with optional actions.
 * @param {Array} columns - [{ key, label, render? }]
 * @param {Array} data - array of row objects
 * @param {string} className - optional extra class
 */
export default function DataTable({ columns, data, className = '' }) {
  return (
    <table className={`table table-bordered table-sm mb-2 ${className}`}>
      <thead>
        <tr>
          {columns.map(col => (
            <th key={col.key}>{col.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr><td colSpan={columns.length} className="text-center text-muted">(No data)</td></tr>
        ) : (
          data.map((row, i) => (
            <tr key={i}>
              {columns.map(col => (
                <td key={col.key}>
                  {col.render ? col.render(row, i) : row[col.key]}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

DataTable.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.node.isRequired,
    render: PropTypes.func
  })).isRequired,
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  className: PropTypes.string
};
