import React from 'react';
import PropTypes from 'prop-types';

/**
 * Labeled input field for consistent forms
 * @param {string} label - label text
 * @param {string} value - input value
 * @param {function} onChange - change handler
 * @param {string} placeholder - placeholder text
 * @param {string} id - input id
 * @param {boolean} disabled - disabled state
 * @param {string} className - extra class
 * @param {object} inputProps - extra props for <input>
 */
export default function LabeledInput({ label, value, onChange, placeholder, id, disabled, className = '', inputProps = {} }) {
  return (
    <div className={`form-group ${className}`.trim()} style={{ marginBottom: 0 }}>
      {label && <label htmlFor={id} className="form-label" style={{ fontSize: 13 }}>{label}</label>}
      <input
        id={id}
        className="form-control form-control-sm"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        {...inputProps}
      />
    </div>
  );
}

LabeledInput.propTypes = {
  label: PropTypes.node,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  id: PropTypes.string,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  inputProps: PropTypes.object
};
