import React from 'react';
import PropTypes from 'prop-types';

/**
 * Reusable tab navigation component (Bootstrap style)
 * @param {Array} tabs - [{ key, label }]
 * @param {string} activeKey - currently selected tab key
 * @param {function} onSelect - callback(key)
 * @param {string} className - optional extra class
 */
export default function Tabs({ tabs, activeKey, onSelect, className = '' }) {
  return (
    <ul className={`nav nav-tabs mb-3 ${className}`} role="tablist">
      {tabs.map(tab => (
        <li className="nav-item" key={tab.key} role="presentation">
          <button
            className={`nav-link${activeKey === tab.key ? ' active' : ''}`}
            onClick={() => onSelect(tab.key)}
            type="button"
            role="tab"
            aria-selected={activeKey === tab.key}
            tabIndex={activeKey === tab.key ? 0 : -1}
          >
            {tab.label}
          </button>
        </li>
      ))}
    </ul>
  );
}

Tabs.propTypes = {
  tabs: PropTypes.arrayOf(PropTypes.shape({ key: PropTypes.string.isRequired, label: PropTypes.node.isRequired })).isRequired,
  activeKey: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
  className: PropTypes.string
};
