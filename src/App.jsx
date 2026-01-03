import React, { useEffect } from "react";
import { WorkflowApp } from "./components/workflow";
import { ErrorMonitoringPanel } from "./components/ErrorMonitoringPanel.jsx";
import { useErrorMonitoringShortcut } from "./hooks/useErrorMonitoringShortcut.js";
import { initializeErrorMonitoring } from "./utils/setupErrorMonitoring.js";
import "./styles/design-tokens.css";
import "./styles/globals.css";

/**
 * App - Root application component.
 *
 * The application now uses the redesigned WorkflowApp with:
 * - AppShell layout (header + sidebar + main content)
 * - Step-based navigation
 * - Persistent Help modal with first-run onboarding
 * - Design tokens for consistent theming
 * - Comprehensive error monitoring and recovery
 *
 * The legacy ProposedLineCalculator is still available at:
 * import LazyProposedLineCalculator from "./components/LazyProposedLineCalculator"
 */
export default function App() {
  const { showPanel, setShowPanel } = useErrorMonitoringShortcut();

  // Initialize error monitoring on mount
  useEffect(() => {
    initializeErrorMonitoring();
  }, []);

  return (
    <>
      <WorkflowApp />
      {showPanel && (
        <ErrorMonitoringPanel onClose={() => setShowPanel(false)} />
      )}
    </>
  );
}
