import React from 'react';
import { withTranslation } from 'react-i18next';
import AlertMessage from './AlertMessage.jsx';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    if (this.props.onError) this.props.onError(error, errorInfo);
    // Optionally log to external service here
    // console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const { t } = this.props;
      return (
        <AlertMessage variant="danger" className="m-4" message={<h4>{t('somethingWentWrong', 'Something went wrong.')}</h4>}>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{this.state.error && this.state.error.toString()}</pre>
          {this.state.errorInfo && (
            <details style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>
              {this.state.errorInfo.componentStack}
            </details>
          )}
          <button className="btn btn-secondary mt-2" onClick={() => window.location.reload()}>{t('reload', 'Reload')}</button>
        </AlertMessage>
      );
    }
  return this.props.children;
  }
}

export default withTranslation()(ErrorBoundary);
