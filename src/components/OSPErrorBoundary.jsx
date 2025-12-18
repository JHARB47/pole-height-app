import React from "react";
import PropTypes from "prop-types";

class OSPErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log to console in development
    if (import.meta?.env?.DEV) {
      console.error("OSP Engineering App Error:", error, errorInfo);
    }

    // Track error for analytics in production
    try {
      if (
        typeof window !== "undefined" &&
        "gtag" in window &&
        typeof window.gtag === "function"
      ) {
        window.gtag("event", "exception", {
          description: String(error),
          fatal: false,
        });
      }
    } catch {
      // Ignore analytics errors
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-50 flex items-center justify-center p-6 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-center max-w-md">
            <div className="mb-4">
              <div className="text-red-600 text-4xl mb-2">⚠️</div>
              <h3 className="text-lg font-semibold text-red-800 mb-2">
                Engineering Calculation Error
              </h3>
              <p className="text-sm text-red-600 mb-4">
                A technical error occurred in the{" "}
                {this.props.section || "calculation"} module. This may be due to
                invalid input data or a calculation edge case.
              </p>

              {import.meta?.env?.DEV && this.state.error && (
                <details className="text-left bg-red-100 p-3 rounded text-xs mb-4">
                  <summary className="font-medium cursor-pointer">
                    Technical Details
                  </summary>
                  <pre className="mt-2 overflow-auto">
                    {String(this.state.error || "Error details unavailable")}
                  </pre>
                </details>
              )}
            </div>

            <div className="space-y-2">
              <button
                onClick={this.handleRetry}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium"
              >
                Retry Calculation
              </button>
              <div className="text-xs text-red-500">
                If the error persists, check input values and try refreshing the
                page.
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

OSPErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  section: PropTypes.string,
};

export default OSPErrorBoundary;
