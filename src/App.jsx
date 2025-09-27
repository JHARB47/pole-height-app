import React from 'react';
import PropTypes from 'prop-types';
import LazyProposedLineCalculator from './components/LazyProposedLineCalculator';
import JobSetup from './components/JobSetup';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('App error:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 16 }}>
          <h1 style={{ fontSize: 18, fontWeight: 600 }}>Something went wrong.</h1>
          <pre style={{ fontSize: 12, color: '#7f1d1d', whiteSpace: 'pre-wrap' }}>
            {String(this.state.error)}
          </pre>
          <button
            onClick={() => {
              try {
                localStorage.removeItem('pole-height-store');
                window.location.reload();
              } catch (e) {
                console.error('Clear failed:', e);
              }
            }}
            style={{
              marginTop: 8,
              border: '1px solid #999',
              borderRadius: 4,
              padding: '4px 8px',
              fontSize: 12,
            }}
          >
            Clear saved state
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

export default function App() {
  return (
    <ErrorBoundary>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh',
        color: 'white',
        padding: '20px'
      }}>
        <h1 style={{ fontSize: '32px', marginBottom: '20px' }}>🏗️ OSP Engineering & Permit Management</h1>
        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
          <p>System Status: ✅ Application Loading Successfully</p>
          <p>React Version: {React.version}</p>
        </div>
        <div className="safe-pt safe-pb">
          <div className="mx-auto max-w-6xl px-3 md:px-6 py-3 md:py-4 break-anywhere">
            <JobSetup />
            <div className="h-3" />
            <LazyProposedLineCalculator />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
