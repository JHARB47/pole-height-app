// @ts-nocheck
import React, { Component } from "react";
import PropTypes from "prop-types";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  // AI: Reset error state when resetKey prop changes (e.g., when switching workflow steps)
  componentDidUpdate(prevProps) {
    if (
      this.state.hasError &&
      this.props.resetKey !== undefined &&
      prevProps.resetKey !== this.props.resetKey
    ) {
      this.setState({ hasError: false, error: null });
    }
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  // AI: Manual reset method for fallback component
  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // AI: Support custom fallback component via props
      const { fallback: FallbackComponent } = this.props;
      if (FallbackComponent) {
        return (
          <FallbackComponent
            error={this.state.error}
            resetErrorBoundary={this.resetErrorBoundary}
          />
        );
      }
      // Default fallback UI with Clear App Data option
      return (
        <div style={{ padding: 16 }}>
          <h1>Something went wrong.</h1>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              color: "#b91c1c",
              background: "#fef2f2",
              padding: 8,
              borderRadius: 4,
            }}
          >
            {String(this.state.error)}
          </pre>
          <div style={{ marginTop: 16 }}>
            <button
              onClick={this.resetErrorBoundary}
              style={{ marginRight: 8 }}
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{ marginRight: 8 }}
            >
              Reload Page
            </button>
            <button
              style={{
                background: "#f87171",
                color: "white",
                border: "none",
                padding: "6px 12px",
                borderRadius: 4,
              }}
              onClick={() => {
                try {
                  localStorage.clear();
                  sessionStorage.clear();
                } catch {
                  /* empty */
                }
                window.location.reload();
              }}
            >
              Clear App Data
            </button>
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: "#6b7280" }}>
            If this error persists, click <b>Clear App Data</b> to reset all
            saved data and reload the app.
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.elementType,
  resetKey: PropTypes.any,
};

export default ErrorBoundary;
