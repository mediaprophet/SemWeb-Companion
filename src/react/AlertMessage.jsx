import React from 'react';
import PropTypes from 'prop-types';

/**
 * Consistent alert message component for info, warning, error, or success.
 * @param {string} variant - 'info', 'warning', 'danger', 'success'
 * @param {string|ReactNode} message - main message
 * @param {ReactNode} children - extra content
 * @param {function} onClose - optional close handler
 * @param {string} className - extra class
 */
export default function AlertMessage({ variant = 'info', message, children, onClose, className = '' }) {
  return (
    <div className={`alert alert-${variant} ${className}`.trim()} role="alert">
      <div className="d-flex align-items-center justify-content-between">
        <div>
          {message}
          {children}
        </div>
        {onClose && (
          <button type="button" className="btn-close ms-2" aria-label="Close" onClick={onClose}></button>
        )}
      </div>
    </div>
  );
}

AlertMessage.propTypes = {
  variant: PropTypes.oneOf(['info', 'warning', 'danger', 'success']),
  message: PropTypes.node.isRequired,
  children: PropTypes.node,
  onClose: PropTypes.func,
  className: PropTypes.string
};
