import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

/**
 * Global ErrorBoundary Component
 * Catches any uncaught React rendering exceptions and displays a graceful fallback
 * instead of unmounting the application into a blank white page.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="page-container"
          style={{
            minHeight: '85vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem 1rem'
          }}
        >
          <div
            className="detail-card"
            style={{
              maxWidth: '520px',
              width: '100%',
              textAlign: 'center',
              padding: '2.5rem 2rem',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: '50%',
                background: 'var(--danger-light, #fef2f2)',
                color: 'var(--danger, #ef4444)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem'
              }}
            >
              <AlertTriangle size={30} />
            </div>

            <h2
              style={{
                fontSize: '1.45rem',
                fontWeight: 800,
                marginBottom: '0.5rem',
                color: 'var(--text-main)'
              }}
            >
              Something went wrong
            </h2>

            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: '0.925rem',
                marginBottom: '1.25rem',
                lineHeight: 1.55
              }}
            >
              The application encountered an unexpected display issue while loading this view.
              Your account, submitted ratings, and credentials remain safe.
            </p>

            {this.state.error && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 8,
                  padding: '1rem',
                  textAlign: 'left',
                  fontSize: '0.825rem',
                  color: '#991b1b',
                  fontFamily: 'monospace',
                  marginBottom: '1.5rem',
                  overflowX: 'auto',
                  wordBreak: 'break-word'
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: '0.35rem' }}>
                  {this.state.error.name}: {this.state.error.message}
                </div>
                {this.state.error.stack && (
                  <pre style={{ fontSize: '0.725rem', color: '#7f1d1d', margin: 0, whiteSpace: 'pre-wrap' }}>
                    {this.state.error.stack.split('\n').slice(0, 5).join('\n')}
                  </pre>
                )}
              </div>
            )}

            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}
            >
              <button
                type="button"
                onClick={this.handleReload}
                className="btn btn-primary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
              >
                <RefreshCw size={14} /> Refresh Page
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="btn btn-secondary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
              >
                <Home size={14} /> Return to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
