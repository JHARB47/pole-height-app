import React from "react";

/**
 * Enhanced Error Boundary with Storage Recovery
 * Catches React errors and provides automatic recovery options
 */
class ErrorBoundaryWithRecovery extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      recovering: false,
      recoveryAttempted: false,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary] Caught error:", error);
    console.error("[ErrorBoundary] Error info:", errorInfo);

    this.setState({ errorInfo });

    // Check if it's a destructuring error (our specific issue)
    const isDestructuringError =
      error.message?.includes("destructured") ||
      error.message?.includes("Cannot read properties of undefined") ||
      error.message?.includes("Cannot read property") ||
      error.message?.includes("undefined is not an object");

    if (isDestructuringError && !this.state.recoveryAttempted) {
      console.log(
        "[ErrorBoundary] Detected destructuring error, attempting auto-recovery...",
      );
      this.attemptAutoRecovery();
    }
  }

  attemptAutoRecovery = () => {
    this.setState({ recovering: true, recoveryAttempted: true });

    setTimeout(() => {
      try {
        // Clear the problematic storage
        console.log("[ErrorBoundary] Clearing localStorage...");
        localStorage.removeItem("pole-height-store");

        // Clear any related keys
        Object.keys(localStorage).forEach((key) => {
          if (key.includes("pole-height") || key.includes("zustand")) {
            try {
              localStorage.removeItem(key);
            } catch (e) {
              console.error("[ErrorBoundary] Failed to remove key:", key, e);
            }
          }
        });

        console.log("[ErrorBoundary] Storage cleared, reloading...");

        // Reload the page after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (e) {
        console.error("[ErrorBoundary] Auto-recovery failed:", e);
        this.setState({ recovering: false });
      }
    }, 500);
  };

  handleManualRecovery = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    } catch (e) {
      console.error("[ErrorBoundary] Manual recovery failed:", e);
      alert(
        "Failed to clear storage. Please clear your browser cache manually.",
      );
    }
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      recovering: false,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.state.recovering) {
        return (
          <div
            style={{
              minHeight: "100vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              padding: "20px",
            }}
          >
            <div
              style={{
                background: "white",
                borderRadius: "12px",
                padding: "40px",
                maxWidth: "500px",
                textAlign: "center",
                boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              }}
            >
              <div style={{ fontSize: "48px", marginBottom: "20px" }}>🔧</div>
              <h1
                style={{
                  fontSize: "24px",
                  color: "#1f2937",
                  marginBottom: "16px",
                }}
              >
                Recovering Application...
              </h1>
              <p style={{ color: "#6b7280", marginBottom: "20px" }}>
                Clearing corrupt data and restarting...
              </p>
              <div
                style={{
                  width: "100%",
                  height: "4px",
                  background: "#e5e7eb",
                  borderRadius: "2px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    background: "linear-gradient(90deg, #667eea, #764ba2)",
                    animation: "slide 1.5s ease-in-out infinite",
                  }}
                ></div>
              </div>
              <style>{`
                @keyframes slide {
                  0% { transform: translateX(-100%); }
                  100% { transform: translateX(100%); }
                }
              `}</style>
            </div>
          </div>
        );
      }

      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "40px",
              maxWidth: "600px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "20px" }}>⚠️</div>
            <h1
              style={{
                fontSize: "28px",
                color: "#dc2626",
                marginBottom: "16px",
              }}
            >
              Application Error
            </h1>

            <div
              style={{
                background: "#fee2e2",
                border: "1px solid #fca5a5",
                borderRadius: "8px",
                padding: "16px",
                marginBottom: "24px",
              }}
            >
              <p
                style={{
                  color: "#991b1b",
                  fontSize: "14px",
                  fontFamily: "monospace",
                  marginBottom: "8px",
                }}
              >
                <strong>Error:</strong>{" "}
                {this.state.error?.message || "Unknown error"}
              </p>
              {this.state.error?.message?.includes("destructured") && (
                <p
                  style={{
                    color: "#7c2d12",
                    fontSize: "13px",
                    marginTop: "8px",
                  }}
                >
                  This error is typically caused by corrupt browser storage
                  data.
                </p>
              )}
            </div>

            <h2
              style={{
                fontSize: "18px",
                color: "#1f2937",
                marginBottom: "12px",
              }}
            >
              Recovery Options:
            </h2>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <button
                onClick={this.attemptAutoRecovery}
                style={{
                  background: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  padding: "14px 20px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = "#059669")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.background = "#10b981")
                }
              >
                🔄 Clear Storage & Reload (Recommended)
              </button>

              <button
                onClick={this.handleReset}
                style={{
                  background: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  padding: "14px 20px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = "#2563eb")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.background = "#3b82f6")
                }
              >
                🔁 Try Again
              </button>

              <button
                onClick={this.handleManualRecovery}
                style={{
                  background: "#6b7280",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  padding: "14px 20px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = "#4b5563")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.background = "#6b7280")
                }
              >
                🗑️ Clear All Browser Data & Reload
              </button>
            </div>

            <details style={{ marginTop: "24px" }}>
              <summary
                style={{
                  cursor: "pointer",
                  color: "#6b7280",
                  fontSize: "14px",
                  padding: "8px",
                }}
              >
                Show technical details
              </summary>
              <pre
                style={{
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  padding: "12px",
                  fontSize: "12px",
                  overflow: "auto",
                  maxHeight: "200px",
                  marginTop: "8px",
                  color: "#374151",
                }}
              >
                {this.state.error?.stack || "No stack trace available"}
              </pre>
            </details>

            <div
              style={{
                marginTop: "24px",
                padding: "16px",
                background: "#f0f9ff",
                borderRadius: "8px",
                fontSize: "14px",
                color: "#0c4a6e",
              }}
            >
              <strong>💡 Tip:</strong> If this error persists, try opening the
              app in an incognito/private window to test with fresh storage.
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundaryWithRecovery;
